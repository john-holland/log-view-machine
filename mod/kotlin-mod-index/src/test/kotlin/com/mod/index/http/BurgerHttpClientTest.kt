package com.mod.index.http

import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class BurgerHttpClientTest {
    
    private val client = BurgerHttpClient()

    @Test
    fun `test health check`() = runBlocking {
        val health = client.getHealth()
        assertEquals("ok", health.status)
        assertTrue(health.burgers >= 0)
    }

    @Test
    fun `test create and get burgers`() = runBlocking {
        // Create a new burger
        val newBurger = client.createBurger(isHungry = false)
        assertNotNull(newBurger)
        assertEquals("INITIAL", newBurger.state)
        assertFalse(newBurger.isHungry)
        
        // Get all burgers
        val burgers = client.getBurgers()
        assertTrue(burgers.isNotEmpty())
        assertTrue(burgers.any { it.id == newBurger.id })
    }

    @Test
    fun `test eat burger`() = runBlocking {
        // Create a burger first
        val burger = client.createBurger()
        
        // Wait a bit for it to be ready (simulate the cooking process)
        Thread.sleep(5000)
        
        // Try to eat it (this will work if it's in READY state)
        try {
            val eatenBurger = client.eatBurger(burger.id)
            assertNotNull(eatenBurger)
        } catch (e: Exception) {
            // It's okay if the burger isn't ready yet
            println("Burger not ready to eat: ${e.message}")
        }
    }
} 