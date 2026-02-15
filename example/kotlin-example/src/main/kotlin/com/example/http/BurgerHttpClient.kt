package com.example.http

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.net.URI
import java.time.Duration

@Serializable
data class Burger(
    val id: Int,
    val state: String,
    val isHungry: Boolean,
    val createdAt: String,
    val logs: List<LogEntry>
)

@Serializable
data class LogEntry(
    val level: String,
    val message: String,
    val timestamp: String
)

@Serializable
data class CreateBurgerRequest(
    val isHungry: Boolean = false
)

@Serializable
data class HealthResponse(
    val status: String,
    val burgers: Int
)

class BurgerHttpClient(private val baseUrl: String = "http://localhost:3001") {
    private val httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build()
    
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun getHealth(): HealthResponse = withContext(Dispatchers.IO) {
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/health"))
            .GET()
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        
        if (response.statusCode() != 200) {
            throw RuntimeException("Health check failed: ${response.statusCode()}")
        }
        
        json.decodeFromString<HealthResponse>(response.body())
    }

    suspend fun getBurgers(): List<Burger> = withContext(Dispatchers.IO) {
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/api/burgers"))
            .GET()
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        
        if (response.statusCode() != 200) {
            throw RuntimeException("Failed to get burgers: ${response.statusCode()}")
        }
        
        json.decodeFromString<List<Burger>>(response.body())
    }

    suspend fun createBurger(isHungry: Boolean = false): Burger = withContext(Dispatchers.IO) {
        val requestBody = json.encodeToString(CreateBurgerRequest.serializer(), CreateBurgerRequest(isHungry))
        
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/api/burgers"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        
        if (response.statusCode() != 200) {
            throw RuntimeException("Failed to create burger: ${response.statusCode()}")
        }
        
        json.decodeFromString<Burger>(response.body())
    }

    suspend fun eatBurger(id: Int): Burger = withContext(Dispatchers.IO) {
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/api/burgers/$id/eat"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.noBody())
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        
        if (response.statusCode() != 200) {
            throw RuntimeException("Failed to eat burger: ${response.statusCode()}")
        }
        
        json.decodeFromString<Burger>(response.body())
    }

    suspend fun trashBurger(id: Int): Burger = withContext(Dispatchers.IO) {
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/api/burgers/$id/trash"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.noBody())
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        
        if (response.statusCode() != 200) {
            throw RuntimeException("Failed to trash burger: ${response.statusCode()}")
        }
        
        json.decodeFromString<Burger>(response.body())
    }
} 