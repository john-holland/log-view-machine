package com.logview.causality

/**
 * Immutable snapshot of current state (XState-congruent).
 */
data class StateSnapshot<T>(
    val value: String,
    val context: T,
    val event: Any? = null,
    val done: Boolean = false,
    val historyValue: Any? = null
) {
    val matches: (String) -> Boolean = { value == it }
}
