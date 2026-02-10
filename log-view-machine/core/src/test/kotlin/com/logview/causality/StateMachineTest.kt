package com.logview.causality

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class StateMachineTest {

    @Test
    fun `createMachine and interpret return service with initial state`() {
        val config = MachineConfig(
            initial = "idle",
            context = 0,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("GO" to TransitionTarget.state("active"))),
                "active" to StateNodeConfig(on = mapOf("STOP" to TransitionTarget.state("idle")))
            )
        )
        val machine = createMachine(config)
        val service = interpret(machine)

        assertEquals("idle", service.getSnapshot().value)
        assertEquals(0, service.getSnapshot().context)
        assertEquals("idle", service.value)
    }

    @Test
    fun `send transitions state and updates snapshot`() {
        val config = MachineConfig(
            initial = "idle",
            context = 0,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("GO" to TransitionTarget.state("active"))),
                "active" to StateNodeConfig(on = mapOf("STOP" to TransitionTarget.state("idle")))
            )
        )
        val service = interpret(createMachine(config))

        service.send("GO")
        assertEquals("active", service.getSnapshot().value)

        service.send("STOP")
        assertEquals("idle", service.getSnapshot().value)
    }

    @Test
    fun `send with assign updates context`() {
        data class Ctx(val count: Int)
        val config = MachineConfig(
            initial = "idle",
            context = Ctx(0),
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("INC" to TransitionTarget.state("idle")))
            )
        )
        val service = interpret(createMachine(config))
        service.send("INC") { ctx, _ -> ctx.copy(count = ctx.count + 1) }
        assertEquals(1, service.getSnapshot().context.count)
    }

    @Test
    fun `unknown event does not transition`() {
        val config = MachineConfig(
            initial = "idle",
            context = Unit,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("GO" to TransitionTarget.state("active"))),
                "active" to StateNodeConfig(emptyMap())
            )
        )
        val service = interpret(createMachine(config))
        service.send("UNKNOWN")
        assertEquals("idle", service.getSnapshot().value)
    }
}
