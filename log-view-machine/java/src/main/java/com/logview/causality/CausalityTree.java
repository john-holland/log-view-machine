package com.logview.causality;

import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Time tree with three logical branches: forward (default), past (undo), paused.
 * Forward is a linear chain; past and redo are stacks. Writes clear the redo stack.
 */
public final class CausalityTree<T> implements CausalityTreeOps<T> {

    private CausalityNode<T> forwardHead;
    private final Deque<CausalityNode<T>> pastStack = new ArrayDeque<>();
    private final Deque<CausalityNode<T>> redoStack = new ArrayDeque<>();
    private CausalityNode<T> pausedSnapshot;

    public CausalityTree(CausalityNode<T> initialNode) {
        this.forwardHead = initialNode;
    }

    /** Current head (read-only). */
    public CausalityNode<T> getHead() {
        return forwardHead;
    }

    /** Whether undo is possible (past stack is not empty). */
    public boolean canUndo() {
        return !pastStack.isEmpty();
    }

    /** Whether redo is possible (redo stack is not empty). */
    public boolean canRedo() {
        return !redoStack.isEmpty();
    }

    /** Whether a paused snapshot exists. */
    public boolean isPaused() {
        return pausedSnapshot != null;
    }

    /**
     * Write a new node onto the forward branch (new transition).
     * Clears the redo stack. Pushes current head onto past, then sets new head.
     */
    public void write(CausalityNode<T> node) {
        redoStack.clear();
        pastStack.addLast(forwardHead);
        forwardHead = node;
    }

    /**
     * Undo: move current head to redo stack, set head to top of past.
     */
    public boolean undo() {
        if (pastStack.isEmpty()) return false;
        redoStack.addLast(forwardHead);
        forwardHead = pastStack.removeLast();
        return true;
    }

    /**
     * Undo until root (no events applied): repeatedly undo until past stack is empty.
     * Returns true if any undo was performed.
     */
    public boolean undoToRoot() {
        boolean didUndo = false;
        while (!pastStack.isEmpty()) {
            undo();
            didUndo = true;
        }
        return didUndo;
    }

    /**
     * Redo: move current head to past, set head to top of redo.
     */
    public boolean redo() {
        if (redoStack.isEmpty()) return false;
        pastStack.addLast(forwardHead);
        forwardHead = redoStack.removeLast();
        return true;
    }

    /** Store current head as paused snapshot. */
    public void pause() {
        pausedSnapshot = forwardHead;
    }

    /** Restore head from paused snapshot; clear paused. */
    public boolean resume() {
        if (pausedSnapshot == null) return false;
        CausalityNode<T> snap = pausedSnapshot;
        pausedSnapshot = null;
        forwardHead = snap;
        return true;
    }

    /** Clear paused snapshot without restoring. */
    public void clearPaused() {
        pausedSnapshot = null;
    }
}
