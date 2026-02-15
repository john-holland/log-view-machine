const express = require('express');
const { graphql, buildSchema } = require('graphql');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { DataDog } = require('@datadog/datadog-api-client');
const { exec } = require('child_process');
const path = require('path');
const config = require('./config');
const axios = require('axios');

const app = express();
const port = config.server.port;
const host = config.server.host;

// GraphQL Schema
const typeDefs = `
  type StateTransition {
    from: String!
    to: String!
    timestamp: Float!
    operationName: String
    variables: JSON
  }

  type StateMachine {
    id: String!
    currentState: String!
    stateHistory: [String!]!
    viewModel: JSON
    pendingTransitions: [StateTransition!]!
    traceId: String
  }

  type Cycle {
    machineId: String!
    states: [String!]!
  }

  type Query {
    stateMachines: [StateMachine!]!
    stateMachine(id: String!): StateMachine
    cycles: [Cycle!]!
  }

  type Subscription {
    stateMachineUpdated(id: String!): StateMachine!
    cycleDetected: Cycle!
  }

  scalar JSON
`;

// In-memory storage
const stateMachines = new Map();
const cycles = new Set();

// Initialize DataDog client if enabled
let datadog;
if (config.metrics.datadog.enabled) {
    datadog = new DataDog({
        apiKey: config.metrics.datadog.apiKey,
        appKey: config.metrics.datadog.appKey,
        site: config.metrics.datadog.site
    });
}

// Bellman-Ford implementation for cycle detection
function bellmanFord(transitions) {
    const distances = new Map();
    const predecessors = new Map();
    const nodes = new Set();

    // Initialize distances and collect nodes
    transitions.forEach(({ from, to }) => {
        nodes.add(from);
        nodes.add(to);
        distances.set(from, Infinity);
        distances.set(to, Infinity);
    });

    // Set source distance to 0
    const source = Array.from(nodes)[0];
    distances.set(source, 0);

    // Relax edges repeatedly
    for (let i = 0; i < nodes.size - 1; i++) {
        transitions.forEach(({ from, to }) => {
            if (distances.get(from) + 1 < distances.get(to)) {
                distances.set(to, distances.get(from) + 1);
                predecessors.set(to, from);
            }
        });
    }

    // Check for negative cycles
    const negativeCycles = new Set();
    transitions.forEach(({ from, to }) => {
        if (distances.get(from) + 1 < distances.get(to)) {
            const cycle = new Set();
            let current = to;
            while (!cycle.has(current)) {
                cycle.add(current);
                current = predecessors.get(current);
            }
            negativeCycles.add(Array.from(cycle));
        }
    });

    return Array.from(negativeCycles);
}

// Helper function to send metrics
async function sendMetrics(metrics) {
    if (!config.metrics.enabled) return;

    if (config.metrics.service.separate) {
        try {
            await axios.post(`${config.metrics.service.url}/metrics`, metrics, {
                timeout: config.metrics.service.timeout
            });
        } catch (error) {
            console.error('Failed to send metrics to separate service:', error);
        }
    } else if (datadog) {
        try {
            await datadog.metrics.submit(metrics.map(metric => ({
                ...metric,
                tags: [
                    ...metric.tags,
                    `service:${config.metrics.datadog.service}`,
                    `env:${config.metrics.datadog.env}`
                ]
            })));
        } catch (error) {
            console.error('Failed to send metrics to DataDog:', error);
        }
    }
}

// Helper function to create trace
async function createTrace(span) {
    if (!config.tracing.enabled) return null;

    if (config.tracing.service.separate) {
        try {
            const response = await axios.post(`${config.tracing.service.url}/traces`, span, {
                timeout: config.tracing.service.timeout
            });
            return response.data;
        } catch (error) {
            console.error('Failed to send trace to separate service:', error);
            return null;
        }
    }

    // In integrated mode, return the span directly
    return span;
}

// Resolvers
const resolvers = {
    Query: {
        stateMachines: () => Array.from(stateMachines.values()),
        stateMachine: (_, { id }) => stateMachines.get(id),
        cycles: () => Array.from(cycles)
    },
    Subscription: {
        stateMachineUpdated: {
            subscribe: (_, { id }, { pubsub }) => {
                return pubsub.asyncIterator(`STATE_MACHINE_UPDATED_${id}`);
            }
        },
        cycleDetected: {
            subscribe: (_, __, { pubsub }) => {
                return pubsub.asyncIterator('CYCLE_DETECTED');
            }
        }
    }
};

// Create schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Middleware for request tracing
app.use((req, res, next) => {
    const traceId = req.headers['x-datadog-trace-id'];
    if (traceId) {
        req.traceId = traceId;
    }
    next();
});

// API endpoints
app.post('/analyze', async (req, res) => {
    const { machineId, currentState, fromState, operationName } = req.body;
    const traceId = req.traceId;

    try {
        // Create trace span
        const span = {
            name: 'state_machine_analysis',
            attributes: {
                'machine.id': machineId,
                'state.current': currentState,
                'state.from': fromState,
                'operation.name': operationName
            },
            traceId
        };

        const trace = await createTrace(span);

        // Update state machine
        const machine = stateMachines.get(machineId) || {
            id: machineId,
            currentState,
            stateHistory: [],
            viewModel: {},
            pendingTransitions: [],
            traceId: trace?.id || traceId
        };

        if (fromState) {
            machine.stateHistory.push(fromState);
            machine.pendingTransitions.push({
                from: fromState,
                to: currentState,
                timestamp: Date.now(),
                operationName,
                variables: req.body.variables
            });
        }

        stateMachines.set(machineId, machine);

        // Run Bellman-Ford algorithm
        const detectedCycles = bellmanFord(machine.pendingTransitions);
        if (detectedCycles.length > 0) {
            cycles.add({
                machineId,
                states: detectedCycles[0]
            });
        }

        // Send metrics
        await sendMetrics([{
            metric: 'state_machine.transition',
            points: [[Date.now() / 1000, 1]],
            tags: [
                `machine_id:${machineId}`,
                `from_state:${fromState}`,
                `to_state:${currentState}`,
                `operation:${operationName}`
            ]
        }]);

        res.json({ 
            success: true,
            traceId: trace?.id || traceId
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Static analysis endpoint
app.post('/static-analyze', async (req, res) => {
    const { repoUrl, branch } = req.body;
    const analysisDir = path.join(__dirname, 'analysis');

    try {
        // Clone repository
        await new Promise((resolve, reject) => {
            exec(`git clone ${repoUrl} ${analysisDir}`, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Checkout branch
        if (branch) {
            await new Promise((resolve, reject) => {
                exec(`cd ${analysisDir} && git checkout ${branch}`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }

        // Run static analysis
        const results = await analyzeStateMachines(analysisDir);

        res.json(results);
    } catch (error) {
        console.error('Static analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const server = createServer(app);
server.listen(port, host, () => {
    console.log(`State analyzer running on ${host}:${port}`);
    console.log(`Metrics service: ${config.metrics.service.separate ? 'separate' : 'integrated'}`);
    console.log(`Tracing service: ${config.tracing.service.separate ? 'separate' : 'integrated'}`);

    // Set up WebSocket server for subscriptions
    SubscriptionServer.create(
        { schema, execute, subscribe },
        { server, path: '/graphql' }
    );
});

// Helper function for static analysis
async function analyzeStateMachines(dir) {
    // Implementation for static analysis of state machines
    // This would parse the codebase and analyze state transitions
    return {
        machines: [],
        cycles: [],
        warnings: []
    };
} 