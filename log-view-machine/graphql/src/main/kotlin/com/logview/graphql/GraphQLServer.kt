package com.logview.graphql

import com.logview.core.BaseStateMachine
import graphql.ExecutionInput
import graphql.ExecutionResult
import graphql.GraphQL
import graphql.schema.GraphQLSchema
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.CompletableFuture

class GraphQLServer(private val resolver: StateMachineResolver) {
    private val graphQL: GraphQL

    init {
        val schema = resolver.createSchema()
        graphQL = GraphQL.newGraphQL(schema).build()
    }

    fun registerStateMachine(machine: BaseStateMachine<*, *>) {
        resolver.registerStateMachine(machine)
    }

    suspend fun executeQuery(query: String, variables: Map<String, Any>? = null): ExecutionResult {
        return withContext(Dispatchers.IO) {
            val executionInput = ExecutionInput.newExecutionInput()
                .query(query)
                .variables(variables ?: emptyMap())
                .build()

            graphQL.execute(executionInput)
        }
    }

    suspend fun executeQueryAsync(query: String, variables: Map<String, Any>? = null): CompletableFuture<ExecutionResult> {
        return withContext(Dispatchers.IO) {
            val executionInput = ExecutionInput.newExecutionInput()
                .query(query)
                .variables(variables ?: emptyMap())
                .build()

            graphQL.executeAsync(executionInput)
        }
    }
} 