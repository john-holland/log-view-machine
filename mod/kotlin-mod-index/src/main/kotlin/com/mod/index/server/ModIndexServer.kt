package com.mod.index.server

import com.mod.index.dotcms.CorsWhitelistResponse
import com.mod.index.dotcms.DotCmsClient
import com.mod.index.dotcms.ModIdsResponse
import com.sun.net.httpserver.HttpExchange
import kotlinx.coroutines.runBlocking
import com.sun.net.httpserver.HttpServer
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonObject
import java.net.InetSocketAddress
import java.nio.charset.StandardCharsets

@Serializable
data class ModMetadata(
    val pathReplacements: Map<String, PathReplacement>? = null,
    val assetLinks: AssetLinks? = null,
    val spelunkMap: Map<String, SpelunkMapEntry>? = null
)

@Serializable
data class PathReplacement(
    val modCaveId: String? = null,
    val modTomeId: String? = null,
    val spelunk: Map<String, JsonElement>? = null
)

@Serializable
data class AssetLinks(
    val templates: String? = null,
    val styles: String? = null,
    val scripts: String? = null,
    val serverUrl: String? = null
)

@Serializable
data class SpelunkMapEntry(
    val route: String? = null,
    val modCaveId: String? = null,
    val modTomeId: String? = null,
    val spelunk: Map<String, JsonElement>? = null
)

@Serializable
data class ModConfig(
    val id: String,
    val name: String,
    val description: String,
    val version: String,
    val serverUrl: String,
    val assets: Map<String, String>,
    val entryPoints: Map<String, String>? = null,
    val modMetadata: ModMetadata? = null,
    val pactStatus: String? = null,
    val pactVerifiedAt: String? = null
)

@Serializable
data class ModsResponse(
    val mods: List<ModConfig>
)

class ModIndexServer(private val port: Int = 8082) {
    private val json = Json { ignoreUnknownKeys = true }
    private val server: HttpServer = HttpServer.create(InetSocketAddress(port), 0)

    private val dotCmsClient: DotCmsClient? = run {
        val baseUrl = System.getenv("DOTCMS_URL")?.trim()?.removeSuffix("/")
        if (!baseUrl.isNullOrEmpty()) {
            DotCmsClient(baseUrl, System.getenv("DOTCMS_API_KEY")?.trim()?.takeIf { it.isNotEmpty() })
        } else null
    }

    // Mod registry (when dotCMS is used, GET /api/mods filters by user's modIds from dotCMS)
    private val modRegistry = mapOf(
        "fish-burger-mod" to ModConfig(
            id = "fish-burger-mod",
            name = "Fish Burger Cart",
            description = "Interactive shopping cart with fish burger state machine. Demonstrates mod system replacing hardcoded features.",
            version = "1.0.0",
            serverUrl = System.getenv("FISH_BURGER_SERVER_URL") ?: "http://localhost:3004",
            assets = mapOf(
                "templates" to "/mods/fish-burger/templates/",
                "styles" to "/mods/fish-burger/styles/",
                "scripts" to "/mods/fish-burger/scripts/"
            ),
            entryPoints = mapOf(
                "cart" to "/mods/fish-burger/cart",
                "demo" to "/mods/fish-burger/demo"
            ),
            modMetadata = ModMetadata(
                pathReplacements = mapOf(
                    "/features" to PathReplacement(
                        modTomeId = "fish-burger-mod-tome",
                        spelunk = buildJsonObject {
                            put("route", "/features")
                            put("tomeId", "fish-burger-mod-tome")
                            putJsonObject("childCaves") {
                                putJsonObject("cart") {
                                    put("route", "/features/cart")
                                    put("tomeId", "fish-burger-cart-tome")
                                }
                            }
                        }
                    )
                ),
                assetLinks = AssetLinks(
                    templates = "/mods/fish-burger/templates/",
                    styles = "/mods/fish-burger/styles/",
                    scripts = "/mods/fish-burger/scripts/",
                    serverUrl = System.getenv("FISH_BURGER_SERVER_URL") ?: "http://localhost:3004"
                ),
                spelunkMap = mapOf(
                    "features-cart" to SpelunkMapEntry(
                        route = "/features/cart",
                        modTomeId = "fish-burger-cart-tome"
                    ),
                    "*" to SpelunkMapEntry(
                        modCaveId = "fish-burger-mod-cave"
                    )
                )
            )
        )
    )
    
    init {
        setupRoutes()
    }
    
    private fun getModIdsForRequest(exchange: HttpExchange): List<String>? {
        val auth = exchange.requestHeaders.getFirst("Authorization") ?: return null
        if (auth.isBlank()) return null
        val client = dotCmsClient ?: return null
        return try {
            val resp = client.getService().getModsForCurrentUser(auth).execute()
            if (resp.isSuccessful) resp.body()?.modIds else null
        } catch (_: Exception) {
            null
        }
    }

    private fun setupRoutes() {
        // GET /api/mods - List mods (filter by user's modIds from dotCMS when Authorization present)
        server.createContext("/api/mods") { exchange ->
            if (exchange.requestMethod == "GET") {
                val path = exchange.requestURI.path
                if (path == "/api/mods" || path == "/api/mods/") {
                    val modIds = getModIdsForRequest(exchange)
                    val mods = if (modIds != null) {
                        modIds.mapNotNull { modRegistry[it] }
                    } else {
                        modRegistry.values.toList()
                    }
                    val response = ModsResponse(mods = mods)
                    sendJsonResponse(exchange, 200, json.encodeToString(ModsResponse.serializer(), response))
                } else {
                    sendError(exchange, 404, "Not found")
                }
            } else {
                sendError(exchange, 405, "Method not allowed")
            }
        }

        // GET /api/mods/:modId - Get specific mod metadata (enforce user's mods when auth present)
        server.createContext("/api/mods/") { exchange ->
            if (exchange.requestMethod == "GET") {
                val path = exchange.requestURI.path
                val modId = path.removePrefix("/api/mods/").trim().takeIf { it.isNotEmpty() } ?: run {
                    sendError(exchange, 404, "Mod not found")
                    return@createContext
                }
                val modIds = getModIdsForRequest(exchange)
                if (modIds != null && modId !in modIds) {
                    sendError(exchange, 404, "Mod not found")
                    return@createContext
                }
                val mod = modRegistry[modId]
                if (mod != null) {
                    sendJsonResponse(exchange, 200, json.encodeToString(ModConfig.serializer(), mod))
                } else {
                    sendError(exchange, 404, "Mod not found")
                }
            } else {
                sendError(exchange, 405, "Method not allowed")
            }
        }

        // GET /api/cors-whitelist - Allowed origins for mod external APIs (from dotCMS, fallback empty)
        server.createContext("/api/cors-whitelist") { exchange ->
            if (exchange.requestMethod == "GET") {
                val body = dotCmsClient?.let { client ->
                    try {
                        val resp = client.getService().getCorsWhitelist().execute()
                        if (resp.isSuccessful) resp.body() else CorsWhitelistResponse(allowedOrigins = emptyList())
                    } catch (_: Exception) {
                        CorsWhitelistResponse(allowedOrigins = emptyList())
                    }
                } ?: CorsWhitelistResponse(allowedOrigins = emptyList())
                val origins = body.allowedOrigins ?: emptyList()
                val arr = origins.joinToString(",") { "\"${it.replace("\\", "\\\\").replace("\"", "\\\"")}\"" }
                val jsonBody = """{"allowedOrigins":[$arr]}"""
                sendJsonResponse(exchange, 200, jsonBody)
            } else {
                sendError(exchange, 405, "Method not allowed")
            }
        }

        // Health check
        server.createContext("/health") { exchange ->
            if (exchange.requestMethod == "GET") {
                sendJsonResponse(exchange, 200, """{"status":"ok","service":"kotlin-mod-index"}""")
            } else {
                sendError(exchange, 405, "Method not allowed")
            }
        }
    }
    
    private fun sendJsonResponse(exchange: HttpExchange, statusCode: Int, jsonBody: String) {
        exchange.responseHeaders.set("Content-Type", "application/json")
        exchange.sendResponseHeaders(statusCode, jsonBody.toByteArray(StandardCharsets.UTF_8).size.toLong())
        exchange.responseBody.write(jsonBody.toByteArray(StandardCharsets.UTF_8))
        exchange.close()
    }
    
    private fun sendError(exchange: HttpExchange, statusCode: Int, message: String) {
        val errorJson = """{"error":"$message"}"""
        sendJsonResponse(exchange, statusCode, errorJson)
    }
    
    fun start() {
        server.start()
        println("🚀 Kotlin Mod Index Server started on port $port")
    }
    
    fun stop() {
        server.stop(0)
        println("🛑 Kotlin Mod Index Server stopped")
    }
}

fun main() = runBlocking {
    val port = System.getenv("PORT")?.toIntOrNull() ?: 8082
    val server = ModIndexServer(port)
    server.start()
    
    // Keep server running
    Runtime.getRuntime().addShutdownHook(Thread {
        server.stop()
    })
    
    // Wait indefinitely
    while (true) {
        Thread.sleep(1000)
    }
}
