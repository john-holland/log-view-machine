package com.logview.causality

import java.time.Instant

/**
 * Interpreted state machine service (XState-congruent).
 * Uses CausalityTree for forward/past/redo; send() is write, undo/redo delegate to tree.
 */
class Interpreter<T> private constructor(
    private val machine: StateMachine<T>,
    private val tree: CausalityTree<T>
) {
    private var started = false

    fun start(): Interpreter<T> {
        if (started) return this
        started = true
        return this
    }

    fun stop(): Interpreter<T> {
        started = false
        return this
    }

    /**
     * Send an event. Resolves transition from config; if found, writes new node (clears redo).
     * Event can be String (event type) or Map with "type" key.
     */
    fun send(event: Any): Interpreter<T> {
        if (!started) return this
        val head = tree.getHead()
        val target = machine.config.resolveTransition(head.stateValue, event) ?: return this
        val nextNode = CausalityNode(
            stateValue = target,
            context = head.context,
            event = event,
            timestamp = Instant.now(),
            parent = head
        )
        tree.write(nextNode)
        return this
    }

    /** Send with context update: assign (context, event) -> newContext. */
    fun send(event: Any, assign: (T, Any) -> T): Interpreter<T> {
        if (!started) return this
        val head = tree.getHead()
        val target = machine.config.resolveTransition(head.stateValue, event) ?: return this
        val nextContext = assign(head.context, event)
        val nextNode = CausalityNode(
            stateValue = target,
            context = nextContext,
            event = event,
            timestamp = Instant.now(),
            parent = head
        )
        tree.write(nextNode)
        return this
    }

    fun getSnapshot(): StateSnapshot<T> {
        val head = tree.getHead()
        return StateSnapshot(
            value = head.stateValue,
            context = head.context,
            event = head.event,
            done = false
        )
    }

    @Suppress("UNUSED_PARAMETER")
    val value: String get() = tree.getHead().stateValue
    val context: T get() = tree.getHead().context

    fun undo(): Boolean = tree.undo()
    fun redo(): Boolean = tree.redo()
    fun canUndo(): Boolean = tree.canUndo()
    fun canRedo(): Boolean = tree.canRedo()
    /** Undo until root (no events applied). Same as tri-leaf "backward". */
    fun undoToRoot(): Boolean = tree.undoToRoot()
    /** Alias for undoToRoot (tri-leaf backward action). */
    fun backward(): Boolean = tree.undoToRoot()
    fun pause(): Unit = tree.pause()
    fun resume(): Boolean = tree.resume()
    fun isPaused(): Boolean = tree.isPaused()

    /**
     * Manual state switch: write a node with event = OVERRIDE and the given state/context.
     * Goes through the same tree so undo-to-root includes overrides; auditable as override.
     */
    fun setState(targetState: String, context: T? = null): Interpreter<T> {
        if (!started) return this
        val head = tree.getHead()
        val nextContext = context ?: head.context
        val nextNode = CausalityNode(
            stateValue = targetState,
            context = nextContext,
            event = OVERRIDE_EVENT,
            timestamp = Instant.now(),
            parent = head
        )
        tree.write(nextNode)
        return this
    }

    companion object {
        fun <T> interpret(machine: StateMachine<T>): Interpreter<T> {
            val initialNode = CausalityNode(
                stateValue = machine.initial,
                context = machine.context,
                event = null,
                timestamp = Instant.now(),
                parent = null
            )
            val tree = CausalityTree(initialNode)
            return Interpreter(machine, tree).start()
        }
    }
}

/** Convenience: interpret(machine) */
fun <T> interpret(machine: StateMachine<T>): Interpreter<T> =
    Interpreter.interpret(machine)
