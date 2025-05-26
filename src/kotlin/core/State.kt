package com.logview.core

import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
sealed class State(val name: String) {
    @Serializable
    data class Initial(override val name: String = "initial") : State(name)
    
    @Serializable
    data class Processing(override val name: String = "processing") : State(name)
    
    @Serializable
    data class Completed(override val name: String = "completed") : State(name)
    
    @Serializable
    data class Error(override val name: String = "error", val message: String) : State(name)
}

@Serializable
data class Transition<T : State>(
    val from: T,
    val to: T,
    val send: Instant,
    val received: Instant? = null
)

@Serializable
data class Message<TData : Any, TState : State>(
    val id: String,
    val csrfToken: String,
    val requestToken: String,
    val requestId: String,
    val salt: String,
    val hash: String,
    val data: TData,
    val from: TState,
    val to: TState,
    val send: Instant,
    val received: Instant? = null
)

@Serializable
data class StateResolution(
    val success: Boolean,
    val message: String? = null,
    val timestamp: Instant = Instant.now()
)

@Serializable
data class Resolved<TData : Any, TState : State>(
    val message: Message<TData, TState>,
    val resolution: StateResolution,
    val asynchronousMessages: List<Resolved<TData, TState>> = emptyList()
) 