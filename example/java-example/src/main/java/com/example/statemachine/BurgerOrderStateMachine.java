package com.example.statemachine;

import com.example.graphql.*;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.disposables.Disposable;

public class BurgerOrderStateMachine {
    private final GraphQLStateMachine<BurgerOrderViewModel> machine;
    private Disposable subscriptionDisposable;

    public static class BurgerOrderViewModel {
        private String orderId;
        private String status;
        private Map<String, Object> orderData;
        private Map<String, Object> kitchenStatus;
        private Map<String, Object> deliveryStatus;

        public BurgerOrderViewModel() {
            this.orderData = new HashMap<>();
            this.kitchenStatus = new HashMap<>();
            this.deliveryStatus = new HashMap<>();
        }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Map<String, Object> getOrderData() { return orderData; }
        public void setOrderData(Map<String, Object> orderData) { this.orderData = orderData; }
        public Map<String, Object> getKitchenStatus() { return kitchenStatus; }
        public void setKitchenStatus(Map<String, Object> status) { this.kitchenStatus = status; }
        public Map<String, Object> getDeliveryStatus() { return deliveryStatus; }
        public void setDeliveryStatus(Map<String, Object> status) { this.deliveryStatus = status; }
    }

    public BurgerOrderStateMachine(StateMachineGraphQLAdapter graphQLAdapter) {
        Map<String, Consumer<GraphQLStateMachine.StateContext<BurgerOrderViewModel>>> handlers = new HashMap<>();
        
        // Define state handlers
        handlers.put("INITIAL", context -> {
            GraphQLOperation operation = new GraphQLOperation() {
                @Override
                public String getQuery() {
                    return """
                        query GetOrderStatus($orderId: ID!) {
                            order(id: $orderId) {
                                id
                                status
                                items {
                                    id
                                    name
                                    quantity
                                }
                            }
                        }
                    """;
                }

                @Override
                public Map<String, Object> getVariables() {
                    return Map.of("orderId", context.getViewModel().getOrderId());
                }

                @Override
                public String getOperationName() {
                    return "GetOrderStatus";
                }
            };

            context.getMachine().query(operation)
                .thenAccept(response -> {
                    if (response.getData() != null) {
                        context.getViewModel().setOrderData((Map<String, Object>) response.getData());
                        context.getViewModel().setStatus("PROCESSING");
                        context.transition("PROCESSING");
                    } else if (response.getErrors() != null && !response.getErrors().isEmpty()) {
                        context.sendMessage(new GraphQLStateMachine.StateUpdate(
                            "burger-order",
                            "ERROR",
                            null,
                            response.getErrors().get(0)
                        ));
                        context.transition("ERROR");
                    }
                });
        });

        handlers.put("PROCESSING", context -> {
            GraphQLOperation operation = new GraphQLOperation() {
                @Override
                public String getQuery() {
                    return """
                        mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
                            updateOrder(id: $orderId, status: $status) {
                                id
                                status
                            }
                        }
                    """;
                }

                @Override
                public Map<String, Object> getVariables() {
                    return Map.of(
                        "orderId", context.getViewModel().getOrderId(),
                        "status", "PREPARING"
                    );
                }

                @Override
                public String getOperationName() {
                    return "UpdateOrderStatus";
                }
            };

            context.getMachine().mutate(operation)
                .thenAccept(response -> {
                    if (response.getData() != null) {
                        Map<String, Object> data = (Map<String, Object>) response.getData();
                        context.getViewModel().setStatus((String) data.get("status"));
                        context.transition("PREPARING");
                    }
                });
        });

        handlers.put("PREPARING", context -> {
            // Subscribe to kitchen status updates
            GraphQLOperation operation = new GraphQLOperation() {
                @Override
                public String getQuery() {
                    return """
                        subscription KitchenStatus($orderId: ID!) {
                            kitchenStatus(orderId: $orderId) {
                                status
                                estimatedTime
                                currentStep
                                nextStep
                            }
                        }
                    """;
                }

                @Override
                public Map<String, Object> getVariables() {
                    return Map.of("orderId", context.getViewModel().getOrderId());
                }

                @Override
                public String getOperationName() {
                    return "KitchenStatus";
                }
            };

            subscriptionDisposable = Observable.fromPublisher(context.getMachine().subscribe(operation))
                .subscribe(response -> {
                    if (response.getData() != null) {
                        Map<String, Object> data = (Map<String, Object>) response.getData();
                        context.getViewModel().setKitchenStatus(data);
                        
                        String status = (String) data.get("status");
                        if ("READY".equals(status)) {
                            context.transition("READY_FOR_DELIVERY");
                        }
                    }
                });
        });

        handlers.put("READY_FOR_DELIVERY", context -> {
            GraphQLOperation operation = new GraphQLOperation() {
                @Override
                public String getQuery() {
                    return """
                        mutation AssignDelivery($orderId: ID!) {
                            assignDelivery(orderId: $orderId) {
                                id
                                status
                                deliveryTime
                            }
                        }
                    """;
                }

                @Override
                public Map<String, Object> getVariables() {
                    return Map.of("orderId", context.getViewModel().getOrderId());
                }

                @Override
                public String getOperationName() {
                    return "AssignDelivery";
                }
            };

            context.getMachine().mutate(operation)
                .thenAccept(response -> {
                    if (response.getData() != null) {
                        Map<String, Object> data = (Map<String, Object>) response.getData();
                        context.getViewModel().setDeliveryStatus(data);
                        context.transition("OUT_FOR_DELIVERY");
                    }
                });
        });

        handlers.put("OUT_FOR_DELIVERY", context -> {
            GraphQLOperation operation = new GraphQLOperation() {
                @Override
                public String getQuery() {
                    return """
                        subscription DeliveryStatus($orderId: ID!) {
                            deliveryStatus(orderId: $orderId) {
                                status
                                location
                                estimatedArrival
                            }
                        }
                    """;
                }

                @Override
                public Map<String, Object> getVariables() {
                    return Map.of("orderId", context.getViewModel().getOrderId());
                }

                @Override
                public String getOperationName() {
                    return "DeliveryStatus";
                }
            };

            subscriptionDisposable = Observable.fromPublisher(context.getMachine().subscribe(operation))
                .subscribe(response -> {
                    if (response.getData() != null) {
                        Map<String, Object> data = (Map<String, Object>) response.getData();
                        context.getViewModel().setDeliveryStatus(data);
                        
                        String status = (String) data.get("status");
                        if ("DELIVERED".equals(status)) {
                            context.transition("COMPLETED");
                        }
                    }
                });
        });

        handlers.put("COMPLETED", context -> {
            GraphQLOperation operation = new GraphQLOperation() {
                @Override
                public String getQuery() {
                    return """
                        mutation CompleteOrder($orderId: ID!) {
                            completeOrder(orderId: $orderId) {
                                id
                                status
                                completionTime
                            }
                        }
                    """;
                }

                @Override
                public Map<String, Object> getVariables() {
                    return Map.of("orderId", context.getViewModel().getOrderId());
                }

                @Override
                public String getOperationName() {
                    return "CompleteOrder";
                }
            };

            context.getMachine().mutate(operation)
                .thenAccept(response -> {
                    if (response.getData() != null) {
                        Map<String, Object> data = (Map<String, Object>) response.getData();
                        context.getViewModel().setOrderData(data);
                        context.transition("FINAL");
                    }
                });
        });

        handlers.put("ERROR", context -> {
            // Handle error state
            if (subscriptionDisposable != null && !subscriptionDisposable.isDisposed()) {
                subscriptionDisposable.dispose();
            }
        });

        // Create the state machine
        this.machine = new GraphQLStateMachine<>(
            "burger-order",
            graphQLAdapter,
            new BurgerOrderViewModel(),
            handlers
        );
    }

    public void startOrder(String orderId) {
        BurgerOrderViewModel viewModel = machine.getViewModel();
        viewModel.setOrderId(orderId);
        machine.transition("INITIAL");
    }

    public String getCurrentState() {
        return machine.getCurrentState();
    }

    public BurgerOrderViewModel getViewModel() {
        return machine.getViewModel();
    }

    public void dispose() {
        if (subscriptionDisposable != null && !subscriptionDisposable.isDisposed()) {
            subscriptionDisposable.dispose();
        }
    }
} 