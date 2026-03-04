export class TomeConnector {
    constructor(robotCopy) {
        this.connections = new Map();
        this.robotCopy = robotCopy;
    }
    // Connect two Tomes with bidirectional state and event flow
    connect(sourceTome, targetTome, config = {}) {
        const connectionId = `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const connection = {
            id: connectionId,
            sourceTome,
            targetTome,
            eventMapping: new Map(Object.entries(config.eventMapping || {})),
            stateMapping: new Map(Object.entries(config.stateMapping || {})),
            bidirectional: config.bidirectional ?? true,
            filters: config.filters,
            transformers: config.transformers,
        };
        this.connections.set(connectionId, connection);
        this.setupConnection(connection);
        console.log(`Connected Tomes: ${sourceTome.constructor.name} <-> ${targetTome.constructor.name}`);
        return connectionId;
    }
    setupConnection(connection) {
        const { sourceTome, targetTome, eventMapping, stateMapping, bidirectional, filters, transformers } = connection;
        // Forward events from source to target
        this.setupEventForwarding(sourceTome, targetTome, eventMapping, 'forward', filters, transformers);
        // Forward events from target to source (if bidirectional)
        if (bidirectional) {
            this.setupEventForwarding(targetTome, sourceTome, this.reverseMap(eventMapping), 'backward', filters, transformers);
        }
        // Forward state changes
        this.setupStateForwarding(sourceTome, targetTome, stateMapping, 'forward', filters, transformers);
        if (bidirectional) {
            this.setupStateForwarding(targetTome, sourceTome, this.reverseMap(stateMapping), 'backward', filters, transformers);
        }
    }
    setupEventForwarding(sourceTome, targetTome, eventMapping, direction, filters, transformers) {
        // Subscribe to source Tome's events
        sourceTome.on('event', (event) => {
            // Check if event should be filtered
            if (filters?.events && !filters.events.includes(event.type)) {
                return;
            }
            // Transform event if transformer is provided
            let transformedEvent = event;
            if (transformers?.eventTransformer) {
                transformedEvent = transformers.eventTransformer(event, direction);
            }
            // Map event type if mapping exists
            const mappedEventType = eventMapping.get(transformedEvent.type) || transformedEvent.type;
            // Forward to target Tome
            targetTome.send({
                type: mappedEventType,
                ...transformedEvent,
                _forwarded: true,
                _direction: direction,
                _source: sourceTome.constructor.name,
            });
        });
    }
    setupStateForwarding(sourceTome, targetTome, stateMapping, direction, filters, transformers) {
        // Subscribe to source Tome's state changes
        sourceTome.on('stateChange', (newState, oldState) => {
            // Check if state should be filtered
            if (filters?.states) {
                const hasRelevantState = filters.states.some(statePath => this.getStateValue(newState, statePath) !== this.getStateValue(oldState, statePath));
                if (!hasRelevantState) {
                    return;
                }
            }
            // Transform state if transformer is provided
            let transformedState = newState;
            if (transformers?.stateTransformer) {
                transformedState = transformers.stateTransformer(newState, direction);
            }
            // Map state paths and update target Tome's context
            const stateUpdates = {};
            stateMapping.forEach((targetPath, sourcePath) => {
                const sourceValue = this.getStateValue(transformedState, sourcePath);
                if (sourceValue !== undefined) {
                    stateUpdates[targetPath] = sourceValue;
                }
            });
            // Update target Tome's context
            if (Object.keys(stateUpdates).length > 0) {
                targetTome.send({
                    type: 'SYNC_STATE',
                    updates: stateUpdates,
                    _forwarded: true,
                    _direction: direction,
                    _source: sourceTome.constructor.name,
                });
            }
        });
    }
    getStateValue(state, path) {
        return path.split('.').reduce((obj, key) => obj?.[key], state);
    }
    reverseMap(map) {
        const reversed = new Map();
        map.forEach((value, key) => {
            reversed.set(value, key);
        });
        return reversed;
    }
    // Disconnect Tomes
    disconnect(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return false;
        }
        // Clean up event listeners
        // Note: In a real implementation, you'd need to store and remove specific listeners
        this.connections.delete(connectionId);
        console.log(`Disconnected Tomes: ${connection.sourceTome.constructor.name} <-> ${connection.targetTome.constructor.name}`);
        return true;
    }
    // Get all connections
    getConnections() {
        return Array.from(this.connections.values());
    }
    // Get connections for a specific Tome
    getConnectionsForTome(tome) {
        return this.getConnections().filter(conn => conn.sourceTome === tome || conn.targetTome === tome);
    }
    // Create a network of connected Tomes
    createNetwork(tomes, config = {}) {
        const connectionIds = [];
        for (let i = 0; i < tomes.length - 1; i++) {
            const connectionId = this.connect(tomes[i], tomes[i + 1], config);
            connectionIds.push(connectionId);
        }
        // Connect last Tome back to first (ring topology)
        if (tomes.length > 2) {
            const ringConnectionId = this.connect(tomes[tomes.length - 1], tomes[0], config);
            connectionIds.push(ringConnectionId);
        }
        return connectionIds;
    }
    // Create a hub-and-spoke network
    createHubNetwork(hubTome, spokeTomes, config = {}) {
        const connectionIds = [];
        spokeTomes.forEach(spokeTome => {
            const connectionId = this.connect(hubTome, spokeTome, config);
            connectionIds.push(connectionId);
        });
        return connectionIds;
    }
    // Broadcast event to all connected Tomes
    broadcastEvent(event, sourceTome) {
        const connections = this.getConnectionsForTome(sourceTome);
        connections.forEach(connection => {
            const targetTome = connection.targetTome === sourceTome ? connection.sourceTome : connection.targetTome;
            targetTome.send({
                ...event,
                _broadcasted: true,
                _source: sourceTome.constructor.name,
            });
        });
    }
    // Get network topology
    getNetworkTopology() {
        const topology = {
            nodes: new Set(),
            edges: [],
        };
        this.getConnections().forEach(connection => {
            topology.nodes.add(connection.sourceTome.constructor.name);
            topology.nodes.add(connection.targetTome.constructor.name);
            topology.edges.push({
                from: connection.sourceTome.constructor.name,
                to: connection.targetTome.constructor.name,
                bidirectional: connection.bidirectional,
                id: connection.id,
            });
        });
        return {
            nodes: Array.from(topology.nodes),
            edges: topology.edges,
        };
    }
    // Validate network for potential issues (Turing completeness risks)
    validateNetwork() {
        const warnings = [];
        const errors = [];
        const topology = this.getNetworkTopology();
        // Check for circular dependencies
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (node, parent) => {
            if (recursionStack.has(node)) {
                return true;
            }
            if (visited.has(node)) {
                return false;
            }
            visited.add(node);
            recursionStack.add(node);
            const edges = topology.edges.filter(edge => edge.from === node || (edge.bidirectional && edge.to === node));
            for (const edge of edges) {
                const nextNode = edge.from === node ? edge.to : edge.from;
                if (nextNode !== parent && hasCycle(nextNode, node)) {
                    return true;
                }
            }
            recursionStack.delete(node);
            return false;
        };
        // Check each node for cycles
        topology.nodes.forEach(node => {
            if (hasCycle(node)) {
                errors.push(`Circular dependency detected involving node: ${node}`);
            }
        });
        // Check for high fan-out (potential performance issues)
        const fanOutCounts = new Map();
        topology.edges.forEach(edge => {
            fanOutCounts.set(edge.from, (fanOutCounts.get(edge.from) || 0) + 1);
            if (edge.bidirectional) {
                fanOutCounts.set(edge.to, (fanOutCounts.get(edge.to) || 0) + 1);
            }
        });
        fanOutCounts.forEach((count, node) => {
            if (count > 10) {
                warnings.push(`High fan-out detected for node ${node}: ${count} connections`);
            }
        });
        // Check for event amplification (potential infinite loops)
        const eventCounts = new Map();
        this.getConnections().forEach(connection => {
            connection.eventMapping.forEach((targetEvent, sourceEvent) => {
                const key = `${sourceEvent}->${targetEvent}`;
                eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
            });
        });
        eventCounts.forEach((count, eventPair) => {
            if (count > 5) {
                warnings.push(`Potential event amplification detected: ${eventPair} appears ${count} times`);
            }
        });
        return { warnings, errors };
    }
}
export function createTomeConnector(robotCopy) {
    return new TomeConnector(robotCopy);
}
