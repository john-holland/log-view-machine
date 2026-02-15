package com.logview.example.tastyfishburger

import com.logview.core.*
import com.logview.graphql.GraphQLServer
import com.logview.graphql.StateMachineResolver
import kotlinx.coroutines.runBlocking
import java.time.Instant

class FishBurgerServer {
    private val stateMachine = TastyFishBurgerStateMachine()
    private val adapter = TastyFishBurgerAdapter(stateMachine)
    private val resolver = StateMachineResolver()
    private val graphQLServer = GraphQLServer(resolver)

    init {
        // Register the state machine with GraphQL
        resolver.registerStateMachine(stateMachine)
        
        // Set up log subscription
        adapter.subscribeToLogs { logs: List<LogEntry> ->
            println("=== Fish Burger Logs ===")
            logs.forEach { log: LogEntry ->
                println("[${log.level}] ${log.timestamp}: ${log.message}")
                log.metadata?.forEach { entry ->
                    println("  ${entry.key}: ${entry.value}")
                }
            }
            println("========================")
        }
    }

    suspend fun startCooking(orderId: String, ingredients: List<String>) {
        println("Starting fish burger cooking for order: $orderId")
        println("Ingredients: $ingredients")
        
        stateMachine.startCooking(orderId, ingredients)
        
        // Simulate cooking process
        for (i in 1..5) {
            kotlinx.coroutines.delay(1000)
            val cookingTime = i * 20
            val temperature = 150.0 + (i * 10)
            
            stateMachine.updateCookingProgress(orderId, cookingTime, temperature)
            println("Cooking progress: $cookingTime seconds, ${temperature}°F")
        }
        
        stateMachine.completeCooking(orderId)
        println("Fish burger cooking completed for order: $orderId")
    }

    suspend fun queryStateMachine(name: String): String {
        val query = """
            query {
                stateMachine(name: "$name") {
                    name
                    currentState {
                        from {
                            name
                        }
                        to {
                            name
                        }
                    }
                    processing
                    log {
                        message {
                            id
                            data
                        }
                        resolution {
                            success
                            message
                        }
                    }
                }
            }
        """.trimIndent()
        
        val result = graphQLServer.executeQuery(query)
        return result.getData().toString()
    }

    suspend fun sendMessage(address: String, data: Map<String, Any>): String {
        val mutation = """
            mutation {
                sendMessage(address: "$address", data: $data) {
                    id
                    data
                    from {
                        name
                    }
                    to {
                        name
                    }
                }
            }
        """.trimIndent()
        
        val result = graphQLServer.executeQuery(mutation)
        return result.getData().toString()
    }

    fun getLogs(filter: LogFilter? = null): List<LogEntry> {
        return adapter.fetchLogs(filter)
    }

    fun getViewStateMachineLogs(): List<ViewStateMachine.LogEntry> {
        return adapter.getViewStateMachineLogs()
    }

    suspend fun executeState(stateName: String, data: TastyFishBurgerStateMachine.FishBurgerData) {
        adapter.executeState(stateName, data)
    }

    fun clearAllLogs() {
        adapter.clearLogs()
        adapter.clearStateMachineLogs()
    }
}

// Demo function to showcase the backend functionality
fun main() = runBlocking {
    val server = FishBurgerServer()
    
    println("=== Fish Burger Backend Demo ===")
    
    // Start cooking a fish burger
    server.startCooking("ORDER-001", listOf("fish", "lettuce", "tomato", "bun"))
    
    // Query the state machine
    println("\n=== State Machine Query ===")
    val stateQuery = server.queryStateMachine("tastyfishburger")
    println(stateQuery)
    
    // Get logs
    println("\n=== Logs ===")
    val logs = server.getLogs()
    logs.forEach { log ->
        println("[${log.level}] ${log.timestamp}: ${log.message}")
    }
    
    // Get ViewStateMachine logs
    println("\n=== ViewStateMachine Logs ===")
    val viewLogs = server.getViewStateMachineLogs()
    viewLogs.forEach { log ->
        println("[${log.level}] ${log.timestamp}: ${log.message}")
    }
    
    // Send a custom message
    println("\n=== Sending Custom Message ===")
    val messageData = mapOf(
        "orderId" to "ORDER-002",
        "action" to "custom_cooking",
        "temperature" to 180.0
    )
    val messageResult = server.sendMessage("~/kitchen/tastyfishburger/custom", messageData)
    println(messageResult)
    
    println("\n=== Demo Complete ===")
} 