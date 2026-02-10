package com.logview.causality

import java.time.Instant

/**
 * A single node in the 4D causality tree.
 * Holds state value, context, event, and timestamp (the four dimensions);
 * parent link for the forward chain.
 */
data class CausalityNode<T>(
    val stateValue: String,
    val context: T,
    val event: Any? = null,
    val timestamp: Instant = Instant.now(),
    val parent: CausalityNode<T>? = null,
    val id: String? = null
) {
    fun withId(id: String): CausalityNode<T> = copy(id = id)
}
