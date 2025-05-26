package com.logview.core

import java.time.Instant
import java.util.UUID
import java.security.MessageDigest
import java.util.concurrent.PriorityBlockingQueue
import kotlinx.serialization.Serializable

@Serializable
abstract class BaseStateMachine<TData : Any, TState : State> {
    abstract val name: String
    abstract val superMachine: String
    abstract val subMachines: List<BaseStateMachine<TData, TState>>
    abstract val location: String
    
    var currentState: Transition<TState>? = null
    var processing: Boolean = false
    val queue = PriorityBlockingQueue<Transition<TState>>()
    var currentModel: TData? = null
    val log = mutableListOf<Resolved<TData, TState>>()
    
    protected val csrfToken: String = "csrf:${UUID.randomUUID()}"
    protected val requestTokens = mutableMapOf<String, String>()
    
    protected fun generateRequestToken(): String {
        val token = "request:${UUID.randomUUID()}"
        requestTokens[token] = Instant.now().toString()
        return token
    }
    
    protected fun generateHash(data: TData, salt: String): String {
        val messageDigest = MessageDigest.getInstance("SHA-256")
        val dataBytes = (data.toString() + salt).toByteArray()
        val hashBytes = messageDigest.digest(dataBytes)
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
    
    suspend fun sendMessage(address: String, data: TData) {
        val (machinePath, action) = address.split("/").filter { it.isNotEmpty() }
        val requestToken = generateRequestToken()
        
        val message = Message(
            id = UUID.randomUUID().toString(),
            csrfToken = csrfToken,
            requestToken = requestToken,
            requestId = "request:${UUID.randomUUID()}",
            salt = UUID.randomUUID().toString(),
            hash = generateHash(data, csrfToken),
            data = data,
            from = currentState?.from ?: State.Initial(),
            to = currentState?.to ?: State.Processing(),
            send = Instant.now()
        )
        
        // Handle GraphQL sub-queries
        if (machinePath.contains("~")) {
            val (basePath, subQuery) = machinePath.split("~", limit = 2)
            if (subQuery.isNotEmpty()) {
                resolveSubQuery(subQuery, data)
            }
        }
        
        // Queue the transition
        currentState?.let { state ->
            queue.offer(Transition(
                from = state.from,
                to = state.to,
                send = Instant.now()
            ))
        }
        
        // Process the queue if not already processing
        if (!processing) {
            processQueue()
        }
    }
    
    private suspend fun resolveSubQuery(subQuery: String, data: TData) {
        // Implement GraphQL sub-query resolution
        // This would integrate with your GraphQL schema and resolvers
    }
    
    private suspend fun processQueue() {
        processing = true
        while (queue.isNotEmpty()) {
            val transition = queue.poll()
            if (transition != null) {
                executeTransition(transition)
            }
        }
        processing = false
    }
    
    protected abstract suspend fun executeTransition(transition: Transition<TState>)
} 