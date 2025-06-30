package com.example.graphql

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

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
    private val scope = CoroutineScope(Dispatchers.IO)

    data class StateUpdate(
        val machineId: String,
        val state: String,
        val data: Any?,
        val error: GraphQLError?
    )

    override suspend fun <T> query(operation: GraphQLOperation): GraphQLResponse<T> {
        val response = baseAdapter.query<T>(operation)
        
        response.data?.let { data ->
            scope.launch {
                _stateUpdates.emit(StateUpdate(
                    machineId = operation.operationName ?: "unknown",
                    state = "QUERY_SUCCESS",
                    data = data,
                    error = null
                ))
            }
        }
        
        response.errors?.firstOrNull()?.let { error ->
            scope.launch {
                _stateUpdates.emit(StateUpdate(
                    machineId = operation.operationName ?: "unknown",
                    state = "QUERY_ERROR",
                    data = null,
                    error = error
                ))
            }
        }
        
        return response
    }

    override suspend fun <T> mutate(operation: GraphQLOperation): GraphQLResponse<T> {
        val response = baseAdapter.mutate<T>(operation)
        
        response.data?.let { data ->
            scope.launch {
                _stateUpdates.emit(StateUpdate(
                    machineId = operation.operationName ?: "unknown",
                    state = "MUTATION_SUCCESS",
                    data = data,
                    error = null
                ))
            }
        }
        
        response.errors?.firstOrNull()?.let { error ->
            scope.launch {
                _stateUpdates.emit(StateUpdate(
                    machineId = operation.operationName ?: "unknown",
                    state = "MUTATION_ERROR",
                    data = null,
                    error = error
                ))
            }
        }
        
        return response
    }

    override fun <T> subscribe(operation: GraphQLOperation): Flow<GraphQLResponse<T>> {
        return baseAdapter.subscribe<T>(operation)
    }
} 