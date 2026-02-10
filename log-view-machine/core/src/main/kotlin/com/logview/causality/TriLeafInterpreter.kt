package com.logview.causality

import java.time.Instant

/**
 * Event-scoped facade over Interpreter: n branches (one per enabled event + override), each with tri-leaf (forward, pause, backward).
 * Root = no events applied; forward(E) mutates current head; backward(E) = undo to root.
 */
class TriLeafInterpreter<T> private constructor(
    private val interpreter: Interpreter<T>,
    private val config: MachineConfig<T>
) {

    /** Whether the current head is the root (no events applied). */
    fun isAtRoot(): Boolean = !interpreter.canUndo()

    /** Set of event keys enabled from current state (from config) plus OVERRIDE_EVENT. */
    fun getEnabledEvents(): Set<String> = config.getEnabledEvents(interpreter.value) + OVERRIDE_EVENT

    /**
     * Forward for normal event E: resolve transition, write node with event = E.
     * Returns this; no-op if no transition for E.
     */
    fun forward(event: Any): TriLeafInterpreter<T> {
        interpreter.send(event)
        return this
    }

    /**
     * Forward for override: write node with event = OVERRIDE_EVENT and given state/context (no transition resolution).
     */
    fun forwardOverride(targetState: String, context: T? = null): TriLeafInterpreter<T> {
        interpreter.setState(targetState, context)
        return this
    }

    /** Pause: store current head as paused snapshot (global pause; same for all branches). */
    fun pause(event: Any) {
        interpreter.pause()
    }

    /**
     * Backward: undo until root (no events applied). Same for every branch.
     * Returns true if any undo was performed.
     */
    fun backward(event: Any): Boolean = interpreter.undoToRoot()

    fun getSnapshot(): StateSnapshot<T> = interpreter.getSnapshot()
    val value: String get() = interpreter.value
    val context: T get() = interpreter.context

    /** True if a transition exists for the given event from current state. */
    fun canForward(event: Any): Boolean {
        if (event == OVERRIDE_EVENT) return true
        return config.resolveTransition(interpreter.value, event) != null
    }

    /** True if undo is possible (not at root). */
    fun canBackward(): Boolean = interpreter.canUndo()

    /**
     * Build visual data for the tri-leaf tree: root, enabled events, current head, per-branch action availability.
     */
    fun getVisualData(): TriLeafVisualData {
        val enabled = getEnabledEvents().toList()
        val canBack = canBackward()
        val branchAvailability = enabled.associateWith { event ->
            TriLeafVisualData.BranchActions(
                canForward = canForward(event),
                canPause = true,
                canBackward = canBack
            )
        }
        return TriLeafVisualData(
            rootStateValue = config.initial,
            enabledEventKeys = enabled,
            currentStateValue = value,
            atRoot = isAtRoot(),
            branchAvailability = branchAvailability
        )
    }

    companion object {
        /**
         * Create a TriLeafInterpreter from an existing Interpreter and its config.
         * Config is required to compute enabled events per state.
         */
        fun <T> from(interpreter: Interpreter<T>, config: MachineConfig<T>): TriLeafInterpreter<T> =
            TriLeafInterpreter(interpreter, config)

        /**
         * Create machine, interpret it, and wrap in TriLeafInterpreter.
         */
        fun <T> interpret(machine: StateMachine<T>): TriLeafInterpreter<T> {
            val interp = Interpreter.interpret(machine)
            return TriLeafInterpreter(interp, machine.config)
        }
    }
}
