package com.logview.causality;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class CausalityTreeTest {

    private static CausalityNode<Integer> node(String value, int ctx, Object event, CausalityNode<Integer> parent) {
        return new CausalityNode<>(value, ctx, event, Instant.now(), parent, null);
    }

    @Test
    void writePushesCurrentHeadToPastAndSetsNewHead() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> tree = new CausalityTree<>(root);
        assertFalse(tree.canUndo());
        assertFalse(tree.canRedo());

        tree.write(node("cooking", 1, "START", root));
        assertEquals("cooking", tree.getHead().getStateValue());
        assertEquals(1, tree.getHead().getContext());
        assertTrue(tree.canUndo());
        assertFalse(tree.canRedo());

        tree.write(node("completed", 2, "DONE", tree.getHead()));
        assertEquals("completed", tree.getHead().getStateValue());
        assertTrue(tree.canUndo());
    }

    @Test
    void undoMovesHeadToPastAndCurrentToRedo() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> tree = new CausalityTree<>(root);
        tree.write(node("cooking", 1, "START", root));
        tree.write(node("completed", 2, "DONE", tree.getHead()));

        assertTrue(tree.undo());
        assertEquals("cooking", tree.getHead().getStateValue());
        assertTrue(tree.canRedo());

        assertTrue(tree.undo());
        assertEquals("idle", tree.getHead().getStateValue());
        assertFalse(tree.canUndo());
        assertTrue(tree.canRedo());

        assertFalse(tree.undo());
    }

    @Test
    void redoMovesHeadFromRedoStack() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> tree = new CausalityTree<>(root);
        tree.write(node("cooking", 1, "START", root));
        tree.undo();
        assertEquals("idle", tree.getHead().getStateValue());

        assertTrue(tree.redo());
        assertEquals("cooking", tree.getHead().getStateValue());
        assertFalse(tree.canRedo());
    }

    @Test
    void writeAfterUndoClearsRedo() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> tree = new CausalityTree<>(root);
        tree.write(node("cooking", 1, "START", root));
        tree.write(node("completed", 2, "DONE", tree.getHead()));
        tree.undo();
        tree.undo();
        assertTrue(tree.canRedo());

        tree.write(node("cooking", 10, "RESTART", root));
        assertFalse(tree.canRedo());
        assertEquals("cooking", tree.getHead().getStateValue());
        assertEquals(10, tree.getHead().getContext());
    }

    @Test
    void pauseAndResume() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> tree = new CausalityTree<>(root);
        tree.write(node("cooking", 1, "START", root));
        assertFalse(tree.isPaused());

        tree.pause();
        assertTrue(tree.isPaused());
        tree.write(node("completed", 2, "DONE", tree.getHead()));
        assertEquals("completed", tree.getHead().getStateValue());

        assertTrue(tree.resume());
        assertEquals("cooking", tree.getHead().getStateValue());
        assertFalse(tree.isPaused());
        assertFalse(tree.resume());
    }

    @Test
    void clearPausedClearsSnapshotWithoutRestoring() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> tree = new CausalityTree<>(root);
        tree.write(node("cooking", 1, "START", root));
        tree.pause();
        tree.clearPaused();
        assertFalse(tree.isPaused());
        assertFalse(tree.resume());
    }

    @Test
    void undoToRootUndoesUntilPastIsEmptyAndHeadIsInitial() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> tree = new CausalityTree<>(root);
        tree.write(node("cooking", 1, "START", root));
        tree.write(node("completed", 2, "DONE", tree.getHead()));
        assertEquals("completed", tree.getHead().getStateValue());
        assertTrue(tree.canUndo());

        boolean didUndo = tree.undoToRoot();
        assertTrue(didUndo);
        assertEquals("idle", tree.getHead().getStateValue());
        assertFalse(tree.canUndo());
        assertTrue(tree.canRedo());
        tree.redo();
        assertEquals("cooking", tree.getHead().getStateValue());
        tree.redo();
        assertEquals("completed", tree.getHead().getStateValue());
    }

    @Test
    void undoToRootWhenAlreadyAtRootReturnsFalse() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> tree = new CausalityTree<>(root);
        assertFalse(tree.undoToRoot());
        assertEquals("idle", tree.getHead().getStateValue());
    }
}
