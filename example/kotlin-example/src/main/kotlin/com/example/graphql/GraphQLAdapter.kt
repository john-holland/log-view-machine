package com.example.graphql

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

interface GraphQLOperation {
    val query: String
    val variables: Map<String, Any>?
    val operationName: String?
}

interface GraphQLResponse<T> {
    val data: T?
    val errors: List<GraphQLError>?
}

interface GraphQLError {
    val message: String
    val path: List<String>?
    val extensions: Map<String, Any>?
}

interface GraphQLAdapter {
    suspend fun <T> query(operation: GraphQLOperation): GraphQLResponse<T>
    suspend fun <T> mutate(operation: GraphQLOperation): GraphQLResponse<T>
    fun <T> subscribe(operation: GraphQLOperation): Flow<GraphQLResponse<T>>
}

class StateMachineGraphQLAdapter(
    private val baseAdapter: GraphQLAdapter
) : GraphQLAdapter {
    private val _stateUpdates = MutableSharedFlow<StateUpdate>()
    val stateUpdates = _stateUpdates.asSharedFlow()

    data class StateUpdate(
        val machineId: String,
        val state: String,
        val data: Any?,
        val error: GraphQLError?
    )

    override suspend fun <T> query(operation: GraphQLOperation): GraphQLResponse<T> {
        return baseAdapter.query(operation).also { response ->
            response.data?.let { data ->
                _stateUpdates.emit(StateUpdate(
                    machineId = operation.operationName ?: "unknown",
                    state = "QUERY_SUCCESS",
                    data = data,
                    error = null
                ))
            }
            response.errors?.firstOrNull()?.let { error ->
                _stateUpdates.emit(StateUpdate(
                    machineId = operation.operationName ?: "unknown",
                    state = "QUERY_ERROR",
                    data = null,
                    error = error
                ))
            }
        }
    }

    override suspend fun <T> mutate(operation: GraphQLOperation): GraphQLResponse<T> {
        return baseAdapter.mutate(operation).also { response ->
            response.data?.let { data ->
                _stateUpdates.emit(StateUpdate(
                    machineId = operation.operationName ?: "unknown",
                    state = "MUTATION_SUCCESS",
                    data = data,
                    error = null
                ))
            }
            response.errors?.firstOrNull()?.let { error ->
                _stateUpdates.emit(StateUpdate(
                    machineId = operation.operationName ?: "unknown",
                    state = "MUTATION_ERROR",
                    data = null,
                    error = error
                ))
            }
        }
    }

    override fun <T> subscribe(operation: GraphQLOperation): Flow<GraphQLResponse<T>> {
        return baseAdapter.subscribe(operation).also { flow ->
            // Handle subscription updates
        }
    }
} 