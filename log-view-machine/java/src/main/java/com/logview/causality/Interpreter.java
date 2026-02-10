package com.logview.causality;

import java.time.Instant;
import java.util.function.BiFunction;

/**
 * Interpreted state machine service (XState-congruent).
 * Uses CausalityTreeOps for forward/past/redo; send() is write, undo/redo delegate to tree.
 */
public final class Interpreter<T> {

    private final StateMachine<T> machine;
    private final CausalityTreeOps<T> tree;
    private boolean started;

    private Interpreter(StateMachine<T> machine, CausalityTreeOps<T> tree) {
        this.machine = machine;
        this.tree = tree;
    }

    public Interpreter<T> start() {
        if (!started) {
            started = true;
        }
        return this;
    }

    public Interpreter<T> stop() {
        started = false;
        return this;
    }

    /**
     * Send an event. Resolves transition from config; if found, writes new node (clears redo).
     * Event can be String (event type) or Map with "type" key.
     */
    public Interpreter<T> send(Object event) {
        if (!started) return this;
        CausalityNode<T> head = tree.getHead();
        String target = machine.getConfig().resolveTransition(head.getStateValue(), event);
        if (target == null) return this;
        CausalityNode<T> nextNode = new CausalityNode<>(
            target,
            head.getContext(),
            event,
            Instant.now(),
            head,
            null
        );
        tree.write(nextNode);
        return this;
    }

    /** Send with context update: assign (context, event) -> newContext. */
    public Interpreter<T> send(Object event, BiFunction<T, Object, T> assign) {
        if (!started) return this;
        CausalityNode<T> head = tree.getHead();
        String target = machine.getConfig().resolveTransition(head.getStateValue(), event);
        if (target == null) return this;
        T nextContext = assign.apply(head.getContext(), event);
        CausalityNode<T> nextNode = new CausalityNode<>(
            target,
            nextContext,
            event,
            Instant.now(),
            head,
            null
        );
        tree.write(nextNode);
        return this;
    }

    public StateSnapshot<T> getSnapshot() {
        CausalityNode<T> head = tree.getHead();
        return new StateSnapshot<>(
            head.getStateValue(),
            head.getContext(),
            head.getEvent()
        );
    }

    public String getValue() { return tree.getHead().getStateValue(); }
    public T getContext() { return tree.getHead().getContext(); }

    public boolean undo() { return tree.undo(); }
    public boolean redo() { return tree.redo(); }
    public boolean canUndo() { return tree.canUndo(); }
    public boolean canRedo() { return tree.canRedo(); }
    /** Undo until root (no events applied). Same as tri-leaf "backward". */
    public boolean undoToRoot() { return tree.undoToRoot(); }
    /** Alias for undoToRoot (tri-leaf backward action). */
    public boolean backward() { return tree.undoToRoot(); }
    public void pause() { tree.pause(); }
    public boolean resume() { return tree.resume(); }
    public boolean isPaused() { return tree.isPaused(); }

    /**
     * Manual state switch: write a node with event = OVERRIDE and the given state; context unchanged.
     */
    public Interpreter<T> setState(String targetState) {
        return setState(targetState, null);
    }

    /**
     * Manual state switch: write a node with event = OVERRIDE and the given state/context.
     * Goes through the same tree so undo-to-root includes overrides; auditable as override.
     */
    public Interpreter<T> setState(String targetState, T context) {
        if (!started) return this;
        CausalityNode<T> head = tree.getHead();
        T nextContext = context != null ? context : head.getContext();
        CausalityNode<T> nextNode = new CausalityNode<>(
            targetState,
            nextContext,
            MachineConfig.OVERRIDE_EVENT,
            Instant.now(),
            head,
            null
        );
        tree.write(nextNode);
        return this;
    }

    /** Create an interpreter with a plain causality tree. */
    public static <T> Interpreter<T> interpret(StateMachine<T> machine) {
        CausalityNode<T> initialNode = new CausalityNode<>(
            machine.getInitial(),
            machine.getContext(),
            null,
            Instant.now(),
            null,
            null
        );
        CausalityTree<T> tree = new CausalityTree<>(initialNode);
        return new Interpreter<>(machine, tree).start();
    }

    /**
     * Create an interpreter that uses the given tree (e.g. an ObservingCausalityTree for logging/metrics).
     * The tree must already have the initial node as head.
     */
    public static <T> Interpreter<T> interpret(StateMachine<T> machine, CausalityTreeOps<T> tree) {
        return new Interpreter<>(machine, tree).start();
    }
}
