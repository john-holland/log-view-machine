package com.logview.example.tastyfishburger

import com.logview.core.*
import kotlinx.coroutines.runBlocking

// Simple demo function to showcase the backend
fun demoFishBurgerBackend() = runBlocking {
    println("=== Fish Burger Backend Demo ===")
    
    try {
        // Create state machine
        val stateMachine = TastyFishBurgerStateMachine()
        println("✓ State machine created successfully")
        
        // Create adapter
        val adapter = TastyFishBurgerAdapter(stateMachine)
        println("✓ Adapter created successfully")
        
        // Test basic logging
        adapter.addLog("INFO", "Demo started", mapOf("demo" to true))
        val logs = adapter.fetchLogs()
        println("✓ Logging works: ${logs.size} logs found")
        
        // Test ViewStateMachine
        val viewLogs = adapter.getViewStateMachineLogs()
        println("✓ ViewStateMachine logs: ${viewLogs.size} logs found")
        
        // Test cooking process
        stateMachine.startCooking("DEMO-001", listOf("fish", "bun", "lettuce"))
        println("✓ Cooking process started")
        
        // Simulate progress updates
        for (i in 1..3) {
            stateMachine.updateCookingProgress("DEMO-001", i * 30, 150.0 + (i * 10))
            println("✓ Progress update $i")
        }
        
        stateMachine.completeCooking("DEMO-001")
        println("✓ Cooking completed")
        
        // Get final logs
        val finalLogs = adapter.fetchLogs()
        println("✓ Final logs: ${finalLogs.size} entries")
        
        println("=== Demo completed successfully ===")
        
    } catch (e: Exception) {
        println("✗ Error during demo: ${e.message}")
        e.printStackTrace()
    }
}

// Main function for standalone execution
fun main() {
    demoFishBurgerBackend()
} 