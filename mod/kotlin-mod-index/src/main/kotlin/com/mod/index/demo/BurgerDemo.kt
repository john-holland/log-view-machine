package com.mod.index.demo

import com.mod.index.http.BurgerHttpClient
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.delay

class BurgerDemo {
    private val client = BurgerHttpClient()

    suspend fun runDemo() {
        println("🐟 Starting Fish Burger Demo...")
        
        // Check health
        val health = client.getHealth()
        println("✅ Backend health: ${health.status}, burgers: ${health.burgers}")
        
        // Create a new burger
        println("\n🍔 Creating a new fish burger...")
        val burger = client.createBurger(isHungry = false)
        println("✅ Created burger #${burger.id} in state: ${burger.state}")
        
        // Monitor the burger as it cooks
        println("\n⏳ Monitoring burger cooking process...")
        for (i in 1..10) {
            delay(1000)
            try {
                val currentBurgers = client.getBurgers()
                val currentBurger = currentBurgers.find { it.id == burger.id }
                currentBurger?.let {
                    println("   ${i}s: Burger #${it.id} - State: ${it.state}, Hungry: ${it.isHungry}")
                    if (it.logs.isNotEmpty()) {
                        val latestLog = it.logs.last()
                        println("      📝 ${latestLog.level}: ${latestLog.message}")
                    }
                }
            } catch (e: Exception) {
                println("   ${i}s: Error checking burger: ${e.message}")
            }
        }
        
        // Try to eat the burger
        println("\n🍽️ Attempting to eat the burger...")
        try {
            val eatenBurger = client.eatBurger(burger.id)
            println("✅ Successfully ate burger #${eatenBurger.id}")
            println("   New state: ${eatenBurger.state}")
        } catch (e: Exception) {
            println("❌ Could not eat burger: ${e.message}")
        }
        
        // Create another burger and trash it
        println("\n🗑️ Creating another burger to trash...")
        val burgerToTrash = client.createBurger()
        println("✅ Created burger #${burgerToTrash.id}")
        
        delay(2000) // Wait a bit
        
        try {
            val trashedBurger = client.trashBurger(burgerToTrash.id)
            println("🗑️ Trashed burger #${trashedBurger.id}")
            println("   New state: ${trashedBurger.state}")
        } catch (e: Exception) {
            println("❌ Could not trash burger: ${e.message}")
        }
        
        // Final status
        val finalHealth = client.getHealth()
        println("\n📊 Final status:")
        println("   Total burgers: ${finalHealth.burgers}")
        println("   Backend status: ${finalHealth.status}")
        
        println("\n🎉 Demo completed!")
    }
}

fun main() = runBlocking {
    val demo = BurgerDemo()
    demo.runDemo()
} 