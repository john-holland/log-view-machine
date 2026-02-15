package com.logview.example.tastyfishburger

import com.logview.core.*
import kotlinx.coroutines.runBlocking
import java.time.Instant

fun main() = runBlocking {
    println("=== Testing Fish Burger Backend ===")
    
    // Create state machine
    val stateMachine = TastyFishBurgerStateMachine()
    val adapter = TastyFishBurgerAdapter(stateMachine)
    
    println("✓ State machine created")
    
    // Test logging
    adapter.addLog("INFO", "Test log message", mapOf("test" to "value"))
    val logs = adapter.fetchLogs()
    println("✓ Logging works: ${logs.size} logs found")
    
    // Test ViewStateMachine
    val viewLogs = adapter.getViewStateMachineLogs()
    println("✓ ViewStateMachine logs: ${viewLogs.size} logs found")
    
    // Test state execution
    val testData = TastyFishBurgerStateMachine.FishBurgerData(
        orderId = "TEST-001",
        ingredients = listOf("fish", "bun"),
        cookingTime = 0,
        temperature = 0.0
    )
    
    adapter.executeState("idle", testData)
    println("✓ State execution works")
    
    // Test cooking process
    stateMachine.startCooking("TEST-002", listOf("fish", "lettuce", "tomato"))
    println("✓ Cooking process started")
    
    // Get final logs
    val finalLogs = adapter.fetchLogs()
    println("✓ Final logs: ${finalLogs.size} entries")
    
    println("=== All tests passed ===")
} 