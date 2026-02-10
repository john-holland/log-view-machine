package com.logview.causality

import java.time.Instant

/**
 * Time tree with three logical branches: forward (default), past (undo), paused.
 * Forward is a linear chain; past and redo are stacks. Writes clear the redo stack.
 */
class CausalityTree<T>(initialNode: CausalityNode<T>) {

    /** Current head of the forward branch (latest state). */
    private var forwardHead: CausalityNode<T> = initialNode

    /** Stack of nodes we undid from (undo history). */
    private val pastStack = ArrayDeque<CausalityNode<T>>()

    /** Stack of nodes we can redo to; cleared on write. */
    private val redoStack = ArrayDeque<CausalityNode<T>>()

    /** Optional paused snapshot. */
    private var pausedSnapshot: CausalityNode<T>? = null

    /** Current head (read-only). */
    fun getHead(): CausalityNode<T> = forwardHead

    /** Whether undo is possible (past stack is not empty). */
    fun canUndo(): Boolean = pastStack.isNotEmpty()

    /** Whether redo is possible (redo stack is not empty). */
    fun canRedo(): Boolean = redoStack.isNotEmpty()

    /** Whether a paused snapshot exists. */
    fun isPaused(): Boolean = pausedSnapshot != null

    /**
     * Write a new node onto the forward branch (new transition).
     * Clears the redo stack. Pushes current head onto past, then sets new head.
     */
    fun write(node: CausalityNode<T>) {
        redoStack.clear()
        pastStack.addLast(forwardHead)
        forwardHead = node
    }

    /**
     * Undo: move current head to redo stack, set head to top of past.
     */
    fun undo(): Boolean {
        if (pastStack.isEmpty()) return false
        redoStack.addLast(forwardHead)
        forwardHead = pastStack.removeLast()
        return true
    }

    /**
     * Undo until root (no events applied): repeatedly undo until past stack is empty.
     * Returns true if any undo was performed.
     */
    fun undoToRoot(): Boolean {
        var didUndo = false
        while (pastStack.isNotEmpty()) {
            undo()
            didUndo = true
        }
        return didUndo
    }

    /**
     * Redo: move current head to past, set head to top of redo.
     */
    fun redo(): Boolean {
        if (redoStack.isEmpty()) return false
        pastStack.addLast(forwardHead)
        forwardHead = redoStack.removeLast()
        return true
    }

    /** Store current head as paused snapshot. */
    fun pause() {
        pausedSnapshot = forwardHead
    }

    /** Restore head from paused snapshot; clear paused. */
    fun resume(): Boolean {
        val snap = pausedSnapshot ?: return false
        pausedSnapshot = null
        forwardHead = snap
        return true
    }

    /** Clear paused snapshot without restoring. */
    fun clearPaused() {
        pausedSnapshot = null
    }
}
