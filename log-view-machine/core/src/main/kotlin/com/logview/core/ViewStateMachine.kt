package com.logview.core

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import java.time.Instant

class ViewStateMachine<TModel : Any>(
    private val machineId: String,
    private val baseMachine: BaseStateMachine<TModel, State>
) {
    private val logEntries = mutableListOf<LogEntry>()
    private val stateHandlers = mutableMapOf<String, suspend (StateContext<TModel>) -> Unit>()
    private val subMachines = mutableMapOf<String, ViewStateMachine<*>>()

    data class LogEntry(
        val id: String,
        val timestamp: Instant,
        val level: String,
        val message: String,
        val metadata: Map<String, Any>? = null
    )

    data class StateContext<TModel>(
        val state: String,
        val model: TModel,
        val transitions: List<Transition<State>>,
        val log: suspend (String, Map<String, Any>?) -> Unit,
        val view: (Any) -> Any,
        val clear: () -> Unit,
        val transition: (String) -> Unit,
        val send: (Any) -> Unit,
        val on: (String, () -> Unit) -> Unit,
        val subMachine: (String, ViewStateMachineConfig<*>) -> ViewStateMachine<*>,
        val getSubMachine: (String) -> ViewStateMachine<*>?,
        val graphql: GraphQLContext
    )

    data class GraphQLContext(
        val query: suspend (String, Map<String, Any>?) -> Any,
        val mutation: suspend (String, Map<String, Any>?) -> Any,
        val subscription: suspend (String, Map<String, Any>?) -> Any
    )

    data class ViewStateMachineConfig<TModel>(
        val machineId: String,
        val xstateConfig: Any,
        val logStates: Map<String, suspend (StateContext<TModel>) -> Unit>? = null,
        val tomeConfig: Any? = null,
        val subMachines: Map<String, ViewStateMachineConfig<*>>? = null
    )

    fun withState(stateName: String, handler: suspend (StateContext<TModel>) -> Unit): ViewStateMachine<TModel> {
        stateHandlers[stateName] = handler
        return this
    }

    fun withSubMachine(machineId: String, config: ViewStateMachineConfig<*>): ViewStateMachine<TModel> {
        val subMachine = ViewStateMachine(machineId, baseMachine)
        subMachines[machineId] = subMachine
        return this
    }

    fun getSubMachine(machineId: String): ViewStateMachine<*>? {
        return subMachines[machineId]
    }

    suspend fun executeState(stateName: String, model: TModel) {
        val handler = stateHandlers[stateName] ?: return
        
        val context = createStateContext(stateName, model)
        handler(context)
    }

    private fun createStateContext(stateName: String, model: TModel): StateContext<TModel> {
        return StateContext(
            state = stateName,
            model = model,
            transitions = emptyList(), // TODO: Implement transition tracking
            log = { message, metadata ->
                val logEntry = LogEntry(
                    id = System.currentTimeMillis().toString(),
                    timestamp = Instant.now(),
                    level = "INFO",
                    message = message,
                    metadata = metadata
                )
                logEntries.add(logEntry)
            },
            view = { component ->
                // TODO: Implement view rendering
                component
            },
            clear = {
                // TODO: Implement view clearing
            },
            transition = { toState ->
                // TODO: Implement state transition
            },
            send = { event ->
                // TODO: Implement event sending
            },
            on = { eventName, handler ->
                // TODO: Implement event handling
            },
            subMachine = { machineId, config ->
                withSubMachine(machineId, config)
            },
            getSubMachine = { machineId ->
                getSubMachine(machineId)
            },
            graphql = GraphQLContext(
                query = { query, variables ->
                    // TODO: Implement GraphQL query
                    emptyMap<String, Any>()
                },
                mutation = { mutation, variables ->
                    // TODO: Implement GraphQL mutation
                    emptyMap<String, Any>()
                },
                subscription = { subscription, variables ->
                    // TODO: Implement GraphQL subscription
                    emptyMap<String, Any>()
                }
            )
        )
    }

    suspend fun log(message: String, metadata: Map<String, Any>? = null) {
        val logEntry = LogEntry(
            id = System.currentTimeMillis().toString(),
            timestamp = Instant.now(),
            level = "INFO",
            message = message,
            metadata = metadata
        )
        logEntries.add(logEntry)
    }

    fun getLogEntries(): List<LogEntry> = logEntries.toList()

    fun clearLogs() {
        logEntries.clear()
    }
} 