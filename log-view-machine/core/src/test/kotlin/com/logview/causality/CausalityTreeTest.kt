package com.logview.causality

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import java.time.Instant

class CausalityTreeTest {

    private fun node(value: String, ctx: Int = 0, event: Any? = null, parent: CausalityNode<Int>? = null) =
        CausalityNode(stateValue = value, context = ctx, event = event, parent = parent)

    @Test
    fun `write pushes current head to past and sets new head`() {
        val root = node("idle", 0)
        val tree = CausalityTree(root)
        assertFalse(tree.canUndo())
        assertFalse(tree.canRedo())

        tree.write(node("cooking", 1, "START", root))
        assertEquals("cooking", tree.getHead().stateValue)
        assertEquals(1, tree.getHead().context)
        assertTrue(tree.canUndo())
        assertFalse(tree.canRedo())

        tree.write(node("completed", 2, "DONE", tree.getHead()))
        assertEquals("completed", tree.getHead().stateValue)
        assertTrue(tree.canUndo())
    }

    @Test
    fun `undo moves head to past and current to redo`() {
        val root = node("idle", 0)
        val tree = CausalityTree(root)
        tree.write(node("cooking", 1, "START", root))
        tree.write(node("completed", 2, "DONE", tree.getHead()))

        assertTrue(tree.undo())
        assertEquals("cooking", tree.getHead().stateValue)
        assertTrue(tree.canRedo())

        assertTrue(tree.undo())
        assertEquals("idle", tree.getHead().stateValue)
        assertFalse(tree.canUndo())
        assertTrue(tree.canRedo())

        assertFalse(tree.undo())
    }

    @Test
    fun `redo moves head from redo stack`() {
        val root = node("idle", 0)
        val tree = CausalityTree(root)
        tree.write(node("cooking", 1, "START", root))
        tree.undo()
        assertEquals("idle", tree.getHead().stateValue)

        assertTrue(tree.redo())
        assertEquals("cooking", tree.getHead().stateValue)
        assertFalse(tree.canRedo())
    }

    @Test
    fun `write after undo clears redo`() {
        val root = node("idle", 0)
        val tree = CausalityTree(root)
        tree.write(node("cooking", 1, "START", root))
        tree.write(node("completed", 2, "DONE", tree.getHead()))
        tree.undo()
        tree.undo()
        assertTrue(tree.canRedo())

        tree.write(node("cooking", 10, "RESTART", root))
        assertFalse(tree.canRedo())
        assertEquals("cooking", tree.getHead().stateValue)
        assertEquals(10, tree.getHead().context)
    }

    @Test
    fun `pause and resume`() {
        val root = node("idle", 0)
        val tree = CausalityTree(root)
        tree.write(node("cooking", 1, "START", root))
        assertFalse(tree.isPaused())

        tree.pause()
        assertTrue(tree.isPaused())
        tree.write(node("completed", 2, "DONE", tree.getHead()))
        assertEquals("completed", tree.getHead().stateValue)

        assertTrue(tree.resume())
        assertEquals("cooking", tree.getHead().stateValue)
        assertFalse(tree.isPaused())
        assertFalse(tree.resume())
    }

    @Test
    fun `clearPaused clears snapshot without restoring`() {
        val root = node("idle", 0)
        val tree = CausalityTree(root)
        tree.write(node("cooking", 1, "START", root))
        tree.pause()
        tree.clearPaused()
        assertFalse(tree.isPaused())
        assertFalse(tree.resume())
    }

    @Test
    fun `undoToRoot undoes until past is empty and head is initial`() {
        val root = node("idle", 0)
        val tree = CausalityTree(root)
        tree.write(node("cooking", 1, "START", root))
        tree.write(node("completed", 2, "DONE", tree.getHead()))
        assertEquals("completed", tree.getHead().stateValue)
        assertTrue(tree.canUndo())

        val didUndo = tree.undoToRoot()
        assertTrue(didUndo)
        assertEquals("idle", tree.getHead().stateValue)
        assertFalse(tree.canUndo())
        assertTrue(tree.canRedo())
        tree.redo()
        assertEquals("cooking", tree.getHead().stateValue)
        tree.redo()
        assertEquals("completed", tree.getHead().stateValue)
    }

    @Test
    fun `undoToRoot when already at root returns false`() {
        val root = node("idle", 0)
        val tree = CausalityTree(root)
        assertFalse(tree.undoToRoot())
        assertEquals("idle", tree.getHead().stateValue)
    }
}
