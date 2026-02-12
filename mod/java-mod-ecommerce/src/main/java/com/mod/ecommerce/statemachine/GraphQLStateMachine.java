package com.mod.ecommerce.statemachine;

import com.mod.ecommerce.graphql.*;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

public class GraphQLStateMachine<T> {
    private final String machineId;
    private final StateMachineGraphQLAdapter graphQLAdapter;
    private String currentState;
    private T viewModel;
    private final Map<String, Consumer<StateContext<T>>> stateHandlers;

    public static class StateContext<T> {
        private final GraphQLStateMachine<T> machine;
        private final T viewModel;
        private final Consumer<String> transition;
        private final Consumer<StateUpdate> sendMessage;

        public StateContext(
            GraphQLStateMachine<T> machine,
            T viewModel,
            Consumer<String> transition,
            Consumer<StateUpdate> sendMessage
        ) {
            this.machine = machine;
            this.viewModel = viewModel;
            this.transition = transition;
            this.sendMessage = sendMessage;
        }

        public GraphQLStateMachine<T> getMachine() { return machine; }
        public T getViewModel() { return viewModel; }
        public void transition(String state) { transition.accept(state); }
        public void sendMessage(StateUpdate update) { sendMessage.accept(update); }
    }

    public static class StateUpdate {
        private final String machineId;
        private final String state;
        private final Object data;
        private final GraphQLError error;

        public StateUpdate(String machineId, String state, Object data, GraphQLError error) {
            this.machineId = machineId;
            this.state = state;
            this.data = data;
            this.error = error;
        }

        public String getMachineId() { return machineId; }
        public String getState() { return state; }
        public Object getData() { return data; }
        public GraphQLError getError() { return error; }
    }

    public GraphQLStateMachine(
        String machineId,
        StateMachineGraphQLAdapter graphQLAdapter,
        T initialViewModel,
        Map<String, Consumer<StateContext<T>>> stateHandlers
    ) {
        this.machineId = machineId;
        this.graphQLAdapter = graphQLAdapter;
        this.currentState = "INITIAL";
        this.viewModel = initialViewModel;
        this.stateHandlers = stateHandlers;

        // Subscribe to GraphQL state updates
        graphQLAdapter.stateUpdates.collect(update -> {
            if (update.getMachineId().equals(machineId)) {
                handleStateUpdate(update);
            }
        });
    }

    private void handleStateUpdate(StateUpdate update) {
        Consumer<StateContext<T>> handler = stateHandlers.get(update.getState());
        if (handler != null) {
            handler.accept(new StateContext<>(
                this,
                viewModel,
                this::transition,
                this::sendMessage
            ));
        }
    }

    public CompletableFuture<GraphQLResponse<T>> query(GraphQLOperation operation) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return graphQLAdapter.query(operation);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    public CompletableFuture<GraphQLResponse<T>> mutate(GraphQLOperation operation) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return graphQLAdapter.mutate(operation);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    public void transition(String state) {
        currentState = state;
        Consumer<StateContext<T>> handler = stateHandlers.get(state);
        if (handler != null) {
            handler.accept(new StateContext<>(
                this,
                viewModel,
                this::transition,
                this::sendMessage
            ));
        }
    }

    public void sendMessage(StateUpdate update) {
        // Handle message sending
    }

    public String getCurrentState() { return currentState; }
    public T getViewModel() { return viewModel; }
} 