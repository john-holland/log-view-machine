package com.logview.causality

/**
 * Reserved event key for manual/override transitions (e.g. setState without sending an event).
 * Used so every transition has a "cause" (normal event or override); undo-to-root includes overrides.
 */
const val OVERRIDE_EVENT: String = "__override"

/**
 * XState-congruent machine configuration.
 * Matches TS xstateConfig shape: initial, states, context, optional id and global on.
 */
data class TransitionConfig(
    val target: String,
    val actions: List<String>? = null
)

/**
 * Event -> target state (string) or full transition config.
 * In Kotlin we use a sealed representation for on-map values.
 */
sealed class TransitionTarget {
    data class State(val target: String) : TransitionTarget()
    data class WithActions(val target: String, val actions: List<String>) : TransitionTarget()

    companion object {
        fun state(target: String): TransitionTarget = State(target)
    }
}

data class StateNodeConfig(
    val on: Map<String, TransitionTarget> = emptyMap()
)

data class MachineConfig<T>(
    val id: String? = null,
    val initial: String,
    val context: T,
    val states: Map<String, StateNodeConfig> = emptyMap(),
    val on: Map<String, TransitionTarget>? = null
) {
    /** Resolve transition for event from a state (state's on or root on). */
    fun resolveTransition(currentState: String, event: Any): String? {
        val eventKey = eventToString(event)
        val stateConfig = states[currentState]
        val transition = stateConfig?.on?.get(eventKey) ?: on?.get(eventKey) ?: return null
        return when (transition) {
            is TransitionTarget.State -> transition.target
            is TransitionTarget.WithActions -> transition.target
        }
    }

    internal fun eventToString(event: Any): String {
        return when (event) {
            is String -> event
            is Map<*, *> -> (event["type"] as? String) ?: event.toString()
            else -> event.toString()
        }
    }

    /**
     * Returns the set of event keys enabled from the given state (state-specific `on` merged with root `on`).
     * Used to define the n branches of the tri-leaf tree (one per enabled event, plus override).
     */
    fun getEnabledEvents(currentState: String): Set<String> {
        val stateConfig = states[currentState]
        val stateEvents = stateConfig?.on?.keys ?: emptySet<String>()
        val rootEvents = on?.keys ?: emptySet()
        return stateEvents + rootEvents
    }

    fun getInitialContext(): T = context
}
