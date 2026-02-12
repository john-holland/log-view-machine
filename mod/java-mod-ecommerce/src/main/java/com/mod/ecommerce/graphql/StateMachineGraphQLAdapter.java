package com.mod.ecommerce.graphql;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Stub GraphQL adapter for state machines.
 * This is a placeholder implementation - full GraphQL integration can be added later.
 */
public class StateMachineGraphQLAdapter {
    public CompletableFuture<Map<String, Object>> query(String query, Map<String, Object> variables) {
        return CompletableFuture.completedFuture(Map.of("data", Map.of()));
    }
    
    public CompletableFuture<Map<String, Object>> mutate(String mutation, Map<String, Object> variables) {
        return CompletableFuture.completedFuture(Map.of("data", Map.of()));
    }
}
