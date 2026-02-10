package com.logview.causality

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class UndoRedoIntegrationTest {

    @Test
    fun `idle to cooking to completed then undo twice redo once`() {
        val config = MachineConfig(
            initial = "idle",
            context = 0,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("START" to TransitionTarget.state("cooking"))),
                "cooking" to StateNodeConfig(on = mapOf("DONE" to TransitionTarget.state("completed"))),
                "completed" to StateNodeConfig(on = mapOf("RESET" to TransitionTarget.state("idle")))
            )
        )
        val service = interpret(createMachine(config))

        service.send("START")
        assertEquals("cooking", service.value)
        service.send("DONE")
        assertEquals("completed", service.value)

        assertTrue(service.undo())
        assertEquals("cooking", service.value)
        assertTrue(service.undo())
        assertEquals("idle", service.value)

        assertTrue(service.redo())
        assertEquals("cooking", service.value)
        assertFalse(service.canRedo())
    }

    @Test
    fun `send after undo clears redo`() {
        val config = MachineConfig(
            initial = "idle",
            context = 0,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("GO" to TransitionTarget.state("active"))),
                "active" to StateNodeConfig(on = mapOf("BACK" to TransitionTarget.state("idle")))
            )
        )
        val service = interpret(createMachine(config))

        service.send("GO")
        assertEquals("active", service.value)
        service.undo()
        assertEquals("idle", service.value)
        assertTrue(service.canRedo())

        service.send("GO")
        assertFalse(service.canRedo())
        assertEquals("active", service.value)
    }

    @Test
    fun `setState override writes node with OVERRIDE event and undoToRoot returns to initial`() {
        val config = MachineConfig(
            initial = "idle",
            context = 0,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("START" to TransitionTarget.state("cooking"))),
                "cooking" to StateNodeConfig(on = mapOf("DONE" to TransitionTarget.state("completed"))),
                "completed" to StateNodeConfig(on = mapOf("RESET" to TransitionTarget.state("idle")))
            )
        )
        val service = interpret(createMachine(config))
        assertEquals("idle", service.value)

        service.setState("completed", 99)
        val snap = service.getSnapshot()
        assertEquals("completed", snap.value)
        assertEquals(99, snap.context)
        assertEquals(OVERRIDE_EVENT, snap.event)

        service.undoToRoot()
        assertEquals("idle", service.value)
        assertEquals(0, service.context)
    }

    @Test
    fun `backward is alias for undoToRoot`() {
        val config = MachineConfig(
            initial = "idle",
            context = 0,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("GO" to TransitionTarget.state("active")))
            )
        )
        val service = interpret(createMachine(config))
        service.send("GO")
        assertEquals("active", service.value)
        assertTrue(service.backward())
        assertEquals("idle", service.value)
        assertFalse(service.backward())
    }

    @Test
    fun `TriLeaf forward mutates head and backward clears to root`() {
        val config = MachineConfig(
            initial = "idle",
            context = 0,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("START" to TransitionTarget.state("cooking"))),
                "cooking" to StateNodeConfig(on = mapOf("DONE" to TransitionTarget.state("completed")))
            )
        )
        val tri = TriLeafInterpreter.interpret(createMachine(config))
        assertTrue(tri.isAtRoot())
        assertTrue(tri.getEnabledEvents().contains("START"))
        assertTrue(tri.getEnabledEvents().contains(OVERRIDE_EVENT))

        tri.forward("START")
        assertEquals("cooking", tri.value)
        assertFalse(tri.isAtRoot())
        assertTrue(tri.canBackward())

        tri.forward("DONE")
        assertEquals("completed", tri.value)
        assertTrue(tri.backward("DONE"))
        assertEquals("idle", tri.value)
        assertTrue(tri.isAtRoot())
    }

    @Test
    fun `TriLeaf forwardOverride writes override event`() {
        val config = MachineConfig(
            initial = "idle",
            context = 0,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("START" to TransitionTarget.state("cooking")))
            )
        )
        val tri = TriLeafInterpreter.interpret(createMachine(config))
        tri.forwardOverride("completed", 42)
        assertEquals("completed", tri.value)
        assertEquals(42, tri.context)
        assertEquals(OVERRIDE_EVENT, tri.getSnapshot().event)
        assertTrue(tri.backward(OVERRIDE_EVENT))
        assertEquals("idle", tri.value)
    }
}
