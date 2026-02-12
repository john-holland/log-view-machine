package com.mod.index.demo

import com.logview.ssr.*
import kotlinx.coroutines.runBlocking
import java.time.Instant

/**
 * Kotlin Fish Burger Demo
 * 
 * Demonstrates the log-view-model pattern in Kotlin with:
 * - State machine management
 * - Server-side rendering
 * - Logging and tracing
 * - Component composition
 */

// Fish Burger State Machine
class FishBurgerStateMachine {
    private val machine = KotlinViewStateMachine<FishBurgerModel>(
        machineId = "fish-burger-kotlin",
        initialState = FishBurgerModel(
            currentState = "idle",
            orderId = null,
            cookingTime = 0,
            temperature = 0,
            logs = mutableListOf()
        )
    )

    init {
        setupStates()
    }

    private fun setupStates() {
        machine.withState("idle") { context ->
            context.log("Fish Burger system is idle", null)
            IdleStateComponent()
        }

        machine.withState("cooking") { context ->
            context.log("Fish Burger is cooking", mapOf(
                "cookingTime" to context.model.cookingTime,
                "temperature" to context.model.temperature
            ))
            CookingStateComponent()
        }

        machine.withState("completed") { context ->
            context.log("Fish Burger cooking completed", mapOf(
                "orderId" to context.model.orderId,
                "totalTime" to context.model.cookingTime
            ))
            CompletedStateComponent()
        }

        machine.withState("error") { context ->
            context.log("Fish Burger cooking error", mapOf(
                "error" to context.model.error
            ))
            ErrorStateComponent()
        }
    }

    suspend fun executeState(stateName: String, model: FishBurgerModel): String {
        return machine.executeState(stateName, model)
    }

    fun getLogs(): List<KotlinViewStateMachine<FishBurgerModel>.LogEntry> {
        return machine.getLogs()
    }
}

// Fish Burger Model
data class FishBurgerModel(
    val currentState: String,
    val orderId: String?,
    val cookingTime: Int,
    val temperature: Int,
    val error: String? = null,
    val logs: MutableList<String> = mutableListOf()
)

// State Components
class IdleStateComponent : BaseComponent() {
    override fun render(context: RenderContext): String {
        return div(
            className = "fish-burger-idle",
            style = mapOf(
                "padding" to "20px",
                "background" to "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "min-height" to "100vh",
                "color" to "white",
                "font-family" to "Arial, sans-serif"
            )
        ) {
            listOf(
                h1("🍔 Fish Burger System - Kotlin", "title"),
                div(className = "status") {
                    listOf(
                        h2("Current Status: Idle"),
                        p("Ready to start cooking"),
                        p("Order ID: -"),
                        p("Cooking Time: 0 seconds"),
                        p("Temperature: 0°C")
                    )
                },
                div(className = "controls") {
                    listOf(
                        button("Start Cooking", "btn btn-primary") { /* onClick */ },
                        button("Simulate Error", "btn btn-danger") { /* onClick */ }
                    )
                },
                div(className = "logs") {
                    listOf(
                        h3("System Logs"),
                        div(className = "log-entries") {
                            listOf(
                                p("System initialized"),
                                p("Fish Burger system is idle"),
                                p("Ready for orders")
                            )
                        }
                    )
                }
            )
        }.render(context)
    }
}

class CookingStateComponent : BaseComponent() {
    override fun render(context: RenderContext): String {
        val cookingTime = context.state["cookingTime"] as? Int ?: 0
        val temperature = context.state["temperature"] as? Int ?: 0

        return div(
            className = "fish-burger-cooking",
            style = mapOf(
                "padding" to "20px",
                "background" to "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                "min-height" to "100vh",
                "color" to "white",
                "font-family" to "Arial, sans-serif"
            )
        ) {
            listOf(
                h1("🍔 Fish Burger System - Kotlin", "title"),
                div(className = "status") {
                    listOf(
                        h2("Current Status: Cooking"),
                        p("Order ID: ${context.state["orderId"] ?: "generating..."}"),
                        p("Cooking Time: $cookingTime seconds"),
                        p("Temperature: $temperature°C"),
                        div(className = "progress-bar") {
                            listOf(
                                div(className = "progress-fill", style = mapOf(
                                    "width" to "${(cookingTime / 60.0 * 100).toInt()}%",
                                    "height" to "20px",
                                    "background" to "#4CAF50"
                                )) { emptyList() }
                            )
                        }
                    )
                },
                div(className = "controls") {
                    listOf(
                        button("Update Progress", "btn btn-secondary") { /* onClick */ },
                        button("Complete Cooking", "btn btn-success") { /* onClick */ },
                        button("Simulate Error", "btn btn-danger") { /* onClick */ }
                    )
                },
                div(className = "logs") {
                    listOf(
                        h3("Cooking Logs"),
                        div(className = "log-entries") {
                            listOf(
                                p("Started cooking fish burger"),
                                p("Temperature set to $temperature°C"),
                                p("Cooking time: $cookingTime seconds")
                            )
                        }
                    )
                }
            )
        }.render(context)
    }
}

class CompletedStateComponent : BaseComponent() {
    override fun render(context: RenderContext): String {
        return div(
            className = "fish-burger-completed",
            style = mapOf(
                "padding" to "20px",
                "background" to "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                "min-height" to "100vh",
                "color" to "white",
                "font-family" to "Arial, sans-serif"
            )
        ) {
            listOf(
                h1("🍔 Fish Burger System - Kotlin", "title"),
                div(className = "status") {
                    listOf(
                        h2("Current Status: Completed"),
                        p("Order ID: ${context.state["orderId"] ?: "unknown"}"),
                        p("Total Cooking Time: ${context.state["cookingTime"] ?: 0} seconds"),
                        p("Final Temperature: ${context.state["temperature"] ?: 0}°C"),
                        div(className = "success-message") {
                            listOf(
                                h3("✅ Fish Burger Ready!"),
                                p("Your delicious fish burger is ready to serve.")
                            )
                        }
                    )
                },
                div(className = "controls") {
                    listOf(
                        button("Start New Order", "btn btn-primary") { /* onClick */ },
                        button("Reset System", "btn btn-secondary") { /* onClick */ }
                    )
                },
                div(className = "logs") {
                    listOf(
                        h3("Completion Logs"),
                        div(className = "log-entries") {
                            listOf(
                                p("Fish burger cooking completed"),
                                p("Order fulfilled successfully"),
                                p("System ready for next order")
                            )
                        }
                    )
                }
            )
        }.render(context)
    }
}

class ErrorStateComponent : BaseComponent() {
    override fun render(context: RenderContext): String {
        return div(
            className = "fish-burger-error",
            style = mapOf(
                "padding" to "20px",
                "background" to "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                "min-height" to "100vh",
                "color" to "white",
                "font-family" to "Arial, sans-serif"
            )
        ) {
            listOf(
                h1("🍔 Fish Burger System - Kotlin", "title"),
                div(className = "status") {
                    listOf(
                        h2("Current Status: Error"),
                        p("Error: ${context.state["error"] ?: "Unknown error"}"),
                        p("Order ID: ${context.state["orderId"] ?: "unknown"}"),
                        p("Cooking Time: ${context.state["cookingTime"] ?: 0} seconds"),
                        div(className = "error-message") {
                            listOf(
                                h3("❌ Cooking Error"),
                                p("There was an error during cooking. Please try again.")
                            )
                        }
                    )
                },
                div(className = "controls") {
                    listOf(
                        button("Retry", "btn btn-primary") { /* onClick */ },
                        button("Reset", "btn btn-secondary") { /* onClick */ }
                    )
                },
                div(className = "logs") {
                    listOf(
                        h3("Error Logs"),
                        div(className = "log-entries") {
                            listOf(
                                p("Error occurred during cooking"),
                                p("Error: ${context.state["error"] ?: "Unknown"}"),
                                p("System needs attention")
                            )
                        }
                    )
                }
            )
        }.render(context)
    }
}

// Main Demo
object KotlinFishBurgerDemo {
    @JvmStatic
    fun main(args: Array<String>) = runBlocking {
        println("🚀 Starting Kotlin Fish Burger Demo")
        println("=====================================")

        val stateMachine = FishBurgerStateMachine()

        // Demo different states
        val idleModel = FishBurgerModel(
            currentState = "idle",
            orderId = null,
            cookingTime = 0,
            temperature = 0
        )

        val cookingModel = FishBurgerModel(
            currentState = "cooking",
            orderId = "ORDER-123",
            cookingTime = 45,
            temperature = 350
        )

        val completedModel = FishBurgerModel(
            currentState = "completed",
            orderId = "ORDER-123",
            cookingTime = 120,
            temperature = 400
        )

        val errorModel = FishBurgerModel(
            currentState = "error",
            orderId = "ORDER-123",
            cookingTime = 30,
            temperature = 200,
            error = "Temperature sensor malfunction"
        )

        println("\n📋 Idle State:")
        val idleHtml = stateMachine.executeState("idle", idleModel)
        println(idleHtml)

        println("\n📋 Cooking State:")
        val cookingHtml = stateMachine.executeState("cooking", cookingModel)
        println(cookingHtml)

        println("\n📋 Completed State:")
        val completedHtml = stateMachine.executeState("completed", completedModel)
        println(completedHtml)

        println("\n📋 Error State:")
        val errorHtml = stateMachine.executeState("error", errorModel)
        println(errorHtml)

        println("\n📊 Logs:")
        val logs = stateMachine.getLogs()
        logs.forEach { log ->
            println("[${log.timestamp}] ${log.level}: ${log.message}")
            log.metadata?.forEach { (key, value) ->
                println("  $key: $value")
            }
        }

        println("\n✅ Kotlin Fish Burger Demo completed!")
    }
} 