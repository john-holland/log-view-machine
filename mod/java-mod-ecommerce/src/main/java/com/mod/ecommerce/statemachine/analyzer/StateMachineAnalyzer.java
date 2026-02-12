package com.mod.ecommerce.statemachine.analyzer;

import com.mod.ecommerce.graphql.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.Tracer;

public class StateMachineAnalyzer {
    private static final Logger logger = LoggerFactory.getLogger(StateMachineAnalyzer.class);
    private final Map<String, StateMachineInfo> activeMachines = new ConcurrentHashMap<>();
    private final Tracer tracer;
    private final String backendUrl;

    public static class StateMachineInfo {
        private final String machineId;
        private final String currentState;
        private final List<String> stateHistory;
        private final Map<String, Object> viewModel;
        private final List<Transition> pendingTransitions;
        private final SpanContext traceContext;

        public StateMachineInfo(
            String machineId,
            String currentState,
            List<String> stateHistory,
            Map<String, Object> viewModel,
            List<Transition> pendingTransitions,
            SpanContext traceContext
        ) {
            this.machineId = machineId;
            this.currentState = currentState;
            this.stateHistory = stateHistory;
            this.viewModel = viewModel;
            this.pendingTransitions = pendingTransitions;
            this.traceContext = traceContext;
        }

        // Getters
        public String getMachineId() { return machineId; }
        public String getCurrentState() { return currentState; }
        public List<String> getStateHistory() { return stateHistory; }
        public Map<String, Object> getViewModel() { return viewModel; }
        public List<Transition> getPendingTransitions() { return pendingTransitions; }
        public SpanContext getTraceContext() { return traceContext; }
    }

    public static class Transition {
        private final String from;
        private final String to;
        private final long timestamp;
        private final String operationName;
        private final Map<String, Object> variables;

        public Transition(
            String from,
            String to,
            long timestamp,
            String operationName,
            Map<String, Object> variables
        ) {
            this.from = from;
            this.to = to;
            this.timestamp = timestamp;
            this.operationName = operationName;
            this.variables = variables;
        }

        // Getters
        public String getFrom() { return from; }
        public String getTo() { return to; }
        public long getTimestamp() { return timestamp; }
        public String getOperationName() { return operationName; }
        public Map<String, Object> getVariables() { return variables; }
    }

    public StateMachineAnalyzer(Tracer tracer, String backendUrl) {
        this.tracer = tracer;
        this.backendUrl = backendUrl;
    }

    public void registerMachine(String machineId, String initialState, Map<String, Object> viewModel) {
        Span span = tracer.spanBuilder("register_machine")
            .setAttribute("machine.id", machineId)
            .setAttribute("machine.initial_state", initialState)
            .startSpan();

        try {
            activeMachines.put(machineId, new StateMachineInfo(
                machineId,
                initialState,
                new ArrayList<>(),
                viewModel,
                new ArrayList<>(),
                span.getSpanContext()
            ));

            // Send to backend for static analysis
            sendToBackend(machineId, initialState, null, null);
        } finally {
            span.end();
        }
    }

    public void recordTransition(
        String machineId,
        String fromState,
        String toState,
        String operationName,
        Map<String, Object> variables
    ) {
        Span span = tracer.spanBuilder("record_transition")
            .setAttribute("machine.id", machineId)
            .setAttribute("transition.from", fromState)
            .setAttribute("transition.to", toState)
            .setAttribute("operation.name", operationName)
            .startSpan();

        try {
            StateMachineInfo info = activeMachines.get(machineId);
            if (info != null) {
                List<String> newHistory = new ArrayList<>(info.getStateHistory());
                newHistory.add(toState);

                List<Transition> newTransitions = new ArrayList<>(info.getPendingTransitions());
                newTransitions.add(new Transition(
                    fromState,
                    toState,
                    System.currentTimeMillis(),
                    operationName,
                    variables
                ));

                activeMachines.put(machineId, new StateMachineInfo(
                    machineId,
                    toState,
                    newHistory,
                    info.getViewModel(),
                    newTransitions,
                    span.getSpanContext()
                ));

                // Send to backend for static analysis
                sendToBackend(machineId, toState, fromState, operationName);
            }
        } finally {
            span.end();
        }
    }

    private void sendToBackend(
        String machineId,
        String currentState,
        String fromState,
        String operationName
    ) {
        // Implementation for sending data to backend for static analysis
        // This would use the backendUrl to send the state information
    }

    public Map<String, List<String>> detectCycles() {
        Map<String, List<String>> cycles = new HashMap<>();
        
        for (StateMachineInfo info : activeMachines.values()) {
            List<String> history = info.getStateHistory();
            Set<String> visited = new HashSet<>();
            List<String> currentPath = new ArrayList<>();
            
            for (String state : history) {
                if (visited.contains(state)) {
                    // Found a cycle
                    int startIndex = currentPath.indexOf(state);
                    List<String> cycle = currentPath.subList(startIndex, currentPath.size());
                    cycles.put(info.getMachineId(), cycle);
                    break;
                }
                visited.add(state);
                currentPath.add(state);
            }
        }
        
        return cycles;
    }

    public String generateStateTree() {
        StringBuilder tree = new StringBuilder();
        tree.append("Active State Machines:\n");
        
        for (StateMachineInfo info : activeMachines.values()) {
            tree.append(String.format("\nMachine: %s\n", info.getMachineId()));
            tree.append(String.format("Current State: %s\n", info.getCurrentState()));
            tree.append("State History:\n");
            
            for (String state : info.getStateHistory()) {
                tree.append(String.format("  -> %s\n", state));
            }
            
            tree.append("Pending Transitions:\n");
            for (Transition transition : info.getPendingTransitions()) {
                tree.append(String.format("  %s -> %s (%s)\n",
                    transition.getFrom(),
                    transition.getTo(),
                    transition.getOperationName()
                ));
            }
        }
        
        return tree.toString();
    }

    public String generateTraceUrl(String machineId) {
        StateMachineInfo info = activeMachines.get(machineId);
        if (info == null) return null;

        return String.format(
            "~/statemachine/%s/STATE:%s/service/call?query#%s",
            machineId,
            info.getCurrentState(),
            info.getTraceContext().getTraceId()
        );
    }
} 