package com.logview.example.tastyfishburger

import com.logview.cave.Cave
import com.logview.cave.Spelunk
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.net.InetSocketAddress
import java.nio.charset.StandardCharsets
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpServer

/**
 * Kotlin Cave HTTP server: exposes GET /registry and per-path fish-burger routes
 * (POST /api/fish-burger/cooking, POST /api/fish-burger/orders) so the same frontend
 * that talks to the Node Cave backend can point at this Kotlin backend (RobotCopy or env toggle).
 */
class FishBurgerCaveServer(
    private val port: Int = 8082,
    private val fishBurgerServer: FishBurgerServer = FishBurgerServer()
) {
    private val json = Json { ignoreUnknownKeys = true }
    private val cave = Cave("kotlin-cave", kotlinCaveSpelunk())

    private fun kotlinCaveSpelunk(): Spelunk = Spelunk(
        childCaves = mapOf(
            "fish-burger-api" to Spelunk(
                route = "/api/fish-burger",
                tomeId = "fish-burger-tome",
                tomes = mapOf("fishBurger" to emptyMap<String, Any>())
            ),
            "fish-burger-demo" to Spelunk(route = "/fish-burger-demo")
        )
    )

    fun start() {
        val server = HttpServer.create(InetSocketAddress(port), 0)
        server.createContext("/registry") { exchange -> handleRegistry(exchange) }
        server.createContext("/api/fish-burger") { exchange -> handleFishBurger(exchange) }
        server.executor = null
        server.start()
        println("Kotlin Cave server listening on port $port")
        println("  GET  /registry")
        println("  POST /api/fish-burger/cooking")
        println("  POST /api/fish-burger/orders")
    }

    private fun handleRegistry(exchange: HttpExchange) {
        if (exchange.requestMethod != "GET") {
            send(exchange, 405, """{"error":"Method not allowed"}""")
            return
        }
        val config = cave.getConfig()
        val spelunk = config.spelunk
        val addresses = spelunk.childCaves?.entries?.joinToString(",") { (name, child) ->
            """{"name":"$name","route":${child.route?.let { "\"$it\"" } ?: "null"},"container":${child.container?.let { "\"$it\"" } ?: "null"},"tomeId":${child.tomeId?.let { "\"$it\"" } ?: "null"}}"""
        } ?: ""
        val body = """{"cave":"${config.name}","addresses":[$addresses]}"""
        sendJson(exchange, 200, body)
    }

    private fun handleFishBurger(exchange: HttpExchange) {
        if (exchange.requestMethod != "POST") {
            send(exchange, 405, """{"error":"Method not allowed"}""")
            return
        }
        val path = exchange.requestURI.path ?: ""
        val bodyStr = exchange.requestBody.bufferedReader(StandardCharsets.UTF_8).readText()
        val (event, data) = parseEventData(bodyStr)
        runBlocking {
            try {
                when {
                    path.endsWith("/cooking") -> {
                        val orderId = (data?.get("orderId") as? String) ?: "order-1"
                        val ingredients = (data?.get("ingredients") as? List<*>)?.map { it.toString() }
                            ?: listOf("fish", "bun", "lettuce")
                        fishBurgerServer.startCooking(orderId, ingredients)
                        sendJson(exchange, 200, """{"success":true,"event":"$event"}""")
                    }
                    path.endsWith("/orders") -> {
                        fishBurgerServer.startCooking(
                            (data?.get("orderId") as? String) ?: "order-1",
                            listOf("fish", "bun", "lettuce")
                        )
                        sendJson(exchange, 200, """{"success":true,"event":"$event"}""")
                    }
                    else -> send(exchange, 404, """{"error":"Not found: $path"}""")
                }
            } catch (e: Exception) {
                send(exchange, 500, """{"error":"${e.message}"}""")
            }
        }
    }

    private fun parseEventData(body: String): Pair<String, Map<String, Any>?> {
        if (body.isBlank()) return "START_COOKING" to null
        return try {
            val obj = json.parseToJsonElement(body).jsonObject
            val event = obj["event"]?.jsonPrimitive?.content ?: "START_COOKING"
            val dataObj = obj["data"]?.jsonObject
            val data: Map<String, Any>? = dataObj?.mapValues { (_, v) ->
                try {
                    v.jsonPrimitive.content
                } catch (_: Exception) {
                    v.toString()
                }
            }
            event to data
        } catch (_: Exception) {
            "START_COOKING" to null
        }
    }

    private fun sendJson(exchange: HttpExchange, code: Int, body: String) {
        exchange.responseHeaders.add("Content-Type", "application/json")
        send(exchange, code, body)
    }

    private fun send(exchange: HttpExchange, code: Int, body: String) {
        exchange.responseHeaders.add("Access-Control-Allow-Origin", "*")
        val bytes = body.toByteArray(StandardCharsets.UTF_8)
        exchange.sendResponseHeaders(code, bytes.size.toLong())
        exchange.responseBody.use { it.write(bytes) }
    }
}

fun main() {
    val port = System.getenv("PORT")?.toIntOrNull() ?: 8082
    FishBurgerCaveServer(port = port).start()
}
