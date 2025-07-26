package com.logview.graphql

import com.logview.core.*
import graphql.schema.DataFetchingEnvironment
import graphql.schema.DataFetcher
import graphql.schema.GraphQLSchema
import graphql.schema.idl.RuntimeWiring
import graphql.schema.idl.SchemaGenerator
import graphql.schema.idl.SchemaParser
import graphql.schema.idl.TypeDefinitionRegistry
import kotlinx.coroutines.flow.first
import java.time.Instant
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

class StateMachineResolver {
    private val stateMachines = mutableMapOf<String, BaseStateMachine<*, *>>()

    fun registerStateMachine(machine: BaseStateMachine<*, *>) {
        stateMachines[machine.name] = machine
    }

    fun createSchema(): GraphQLSchema {
        val schemaParser = SchemaParser()
        val typeDefinitionRegistry = schemaParser.parse(
            javaClass.getResourceAsStream("/schema.graphqls")?.readBytes()?.toString(Charsets.UTF_8)
        )

        val runtimeWiring = RuntimeWiring.newRuntimeWiring()
            .type("Query") { typeWiring ->
                typeWiring
                    .dataFetcher("stateMachine") { env -> getStateMachine(env) }
                    .dataFetcher("stateMachines") { env -> getStateMachines(env) }
            }
            .type("Mutation") { typeWiring ->
                typeWiring
                    .dataFetcher("sendMessage") { env -> sendMessage(env) }
                    .dataFetcher("updateState") { env -> updateState(env) }
            }
            .type("Subscription") { typeWiring ->
                typeWiring
                    .dataFetcher("stateMachineUpdates") { env -> getStateMachineUpdates(env) }
                    .dataFetcher("messageUpdates") { env -> getMessageUpdates(env) }
            }
            .scalar(graphql.scalars.ExtendedScalars.DateTime)
            .scalar(graphql.scalars.ExtendedScalars.Json)
            .build()

        return SchemaGenerator().makeExecutableSchema(typeDefinitionRegistry, runtimeWiring)
    }

    private fun getStateMachine(env: DataFetchingEnvironment): StateMachine? {
        val name = env.getArgument<String>("name")
        return stateMachines[name]?.let { machine ->
            StateMachine(
                name = machine.name,
                superMachine = machine.superMachine,
                subMachines = machine.subMachines.map { it.name },
                location = machine.location,
                currentState = machine.currentState,
                processing = machine.processing,
                currentModel = machine.currentModel,
                log = machine.log
            )
        }
    }

    private fun getStateMachines(env: DataFetchingEnvironment): List<StateMachine> {
        return stateMachines.values.map { machine ->
            StateMachine(
                name = machine.name,
                superMachine = machine.superMachine,
                subMachines = machine.subMachines.map { it.name },
                location = machine.location,
                currentState = machine.currentState,
                processing = machine.processing,
                currentModel = machine.currentModel,
                log = machine.log
            )
        }
    }

    private suspend fun sendMessage(env: DataFetchingEnvironment): Message<*, *> {
        val address = env.getArgument<String>("address")
        val data = env.getArgument<Any>("data")
        
        // Find the appropriate state machine based on the address
        val machinePath = address.split("/").firstOrNull()
        val machine = stateMachines[machinePath] ?: throw IllegalArgumentException("No state machine found for path: $machinePath")
        
        // Send the message
        machine.sendMessage(address, data)
        
        // Return the last message from the machine's log
        return machine.log.lastOrNull()?.message 
            ?: throw IllegalStateException("No message was created")
    }

    private suspend fun updateState(env: DataFetchingEnvironment): StateMachine {
        val name = env.getArgument<String>("name")
        val stateInput = env.getArgument<Map<String, Any>>("state")
        
        val machine = stateMachines[name] ?: throw IllegalArgumentException("No state machine found: $name")
        
        // Update the state
        val newState = when (stateInput["name"] as String) {
            "initial" -> State.Initial()
            "processing" -> State.Processing()
            "completed" -> State.Completed()
            "error" -> State.Error(message = stateInput["message"] as String)
            else -> throw IllegalArgumentException("Invalid state name: ${stateInput["name"]}")
        }
        
        // Update the machine's state
        machine.currentState = Transition(
            from = machine.currentState?.from ?: State.Initial(),
            to = newState,
            send = Instant.now()
        )
        
        return StateMachine(
            name = machine.name,
            superMachine = machine.superMachine,
            subMachines = machine.subMachines.map { it.name },
            location = machine.location,
            currentState = machine.currentState,
            processing = machine.processing,
            currentModel = machine.currentModel,
            log = machine.log
        )
    }

    private suspend fun getStateMachineUpdates(env: DataFetchingEnvironment): StateMachineUpdate {
        val name = env.getArgument<String>("name")
        val machine = stateMachines[name] as? TastyFishBurgerStateMachine
            ?: throw IllegalArgumentException("No state machine found: $name")
        
        return machine.stateUpdates.first()
    }

    private suspend fun getMessageUpdates(env: DataFetchingEnvironment): MessageUpdate {
        val address = env.getArgument<String>("address")
        val machinePath = address.split("/").firstOrNull()
        val machine = stateMachines[machinePath] as? TastyFishBurgerStateMachine
            ?: throw IllegalArgumentException("No state machine found for path: $machinePath")
        
        return machine.messageUpdates.first()
    }
} 