package com.logview.core

/**
 * Minimal base for ViewStateMachine. Provides state type and transition shape.
 */
data class State(val value: String, val context: Any? = null)

data class Transition<T>(val from: T, val to: String, val event: Any? = null)

abstract class BaseStateMachine<TModel : Any, TState> {
    abstract fun getCurrentState(): TState?
    abstract fun getTransitions(): List<Transition<TState>>
    /** Override to handle state transition (e.g. update current state and record transition). */
    open fun transitionTo(to: String, event: Any? = null) {}
    /** Override to handle event (e.g. for interpreter integration). */
    open fun sendEvent(event: Any) {}
}

/** Simple in-memory implementation for ViewStateMachine. */
class SimpleBaseStateMachine<TModel : Any>(
    private var currentState: State = State(""),
    private val transitions: MutableList<Transition<State>> = mutableListOf()
) : BaseStateMachine<TModel, State>() {
    override fun getCurrentState(): State = currentState
    override fun getTransitions(): List<Transition<State>> = transitions.toList()

    override fun transitionTo(to: String, event: Any? = null) {
        transitions.add(Transition(currentState, to, event))
        currentState = State(to, currentState.context)
    }

    fun setState(value: String, context: Any? = null) {
        currentState = State(value, context)
    }
}
