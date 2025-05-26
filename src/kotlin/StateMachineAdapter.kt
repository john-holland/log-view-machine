package com.logview.core

import java.time.Instant
import java.util.UUID
import java.security.MessageDigest

class StateMachineAdapter<TData : Any, TState : State>(
    private val machine: BaseStateMachine<TData, TState>
) {
    data class StateMachineMessage(
        val id: String = UUID.randomUUID().toString(),
        val csrfToken: String,
        val requestToken: String,
        val requestId: String,
        val salt: String,
        val hash: String,
        val data: TData,
        val timestamp: Instant = Instant.now()
    )

    fun sendMessage(address: String, data: TData): StateMachineMessage {
        val message = StateMachineMessage(
            csrfToken = machine.csrfToken,
            requestToken = generateRequestToken(),
            requestId = "request:${UUID.randomUUID()}",
            salt = UUID.randomUUID().toString(),
            hash = generateHash(data, machine.csrfToken),
            data = data
        )

        // Handle GraphQL sub-queries
        if (address.contains("~")) {
            val (basePath, subQuery) = address.split("~", limit = 2)
            if (subQuery.isNotEmpty()) {
                resolveSubQuery(subQuery, data)
            }
        }

        return message
    }

    private fun generateRequestToken(): String {
        return "request:${UUID.randomUUID()}"
    }

    private fun generateHash(data: TData, salt: String): String {
        val messageDigest = MessageDigest.getInstance("SHA-256")
        val dataBytes = (data.toString() + salt).toByteArray()
        val hashBytes = messageDigest.digest(dataBytes)
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    private fun resolveSubQuery(subQuery: String, data: TData) {
        // Implement GraphQL sub-query resolution
        // This would integrate with your GraphQL schema and resolvers
    }
} 