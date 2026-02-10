package com.logview.causality.visual

import com.logview.causality.MachineConfig
import com.logview.causality.StateNodeConfig
import com.logview.causality.TransitionTarget
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class VisualDataBuilderTest {

    @Test
    fun `small config with self-loop yields one cycle and correct metrics`() {
        val config = MachineConfig(
            initial = "idle",
            context = Unit,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("GO" to TransitionTarget.state("active"))),
                "active" to StateNodeConfig(on = mapOf("LOOP" to TransitionTarget.state("active")))
            )
        )
        val result = VisualDataBuilder.build(config)
        assertEquals(2, result.nodes.size)
        assertEquals(2, result.edges.size)
        assertEquals(1, result.cycles.size)
        assertTrue(result.cycles[0].states.contains("active"))
        assertTrue(result.metrics.cycleCount == 1)
        assertFalse(result.metrics.isDag)
        assertTrue(result.nodes.any { it.id == "active" && it.inCycle })
        assertTrue(result.edges.any { it.from == "active" && it.to == "active" && it.inCycle })
        assertTrue(result.toJson().contains("active"))
    }

    @Test
    fun `linear chain no cycles yields empty cycles and DAG`() {
        val config = MachineConfig(
            initial = "a",
            context = Unit,
            states = mapOf(
                "a" to StateNodeConfig(on = mapOf("NEXT" to TransitionTarget.state("b"))),
                "b" to StateNodeConfig(on = mapOf("NEXT" to TransitionTarget.state("c"))),
                "c" to StateNodeConfig(on = mapOf("NEXT" to TransitionTarget.state("d"))),
                "d" to StateNodeConfig(on = emptyMap())
            )
        )
        val result = VisualDataBuilder.build(config)
        assertEquals(4, result.nodes.size)
        assertEquals(3, result.edges.size)
        assertTrue(result.cycles.isEmpty())
        assertTrue(result.metrics.isDag)
        assertEquals(3, result.metrics.maxDepth)
        assertEquals(1, result.metrics.leafStateCount)
    }

    @Test
    fun `config with root on and state-specific on includes all transitions`() {
        val config = MachineConfig(
            initial = "idle",
            context = Unit,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("START" to TransitionTarget.state("cooking"))),
                "cooking" to StateNodeConfig(on = mapOf("DONE" to TransitionTarget.state("completed")))
            ),
            on = mapOf("RESET" to TransitionTarget.state("idle"))
        )
        val result = VisualDataBuilder.build(config)
        assertTrue(result.edges.any { it.event == "RESET" })
        assertTrue(result.edges.any { it.event == "START" })
        assertTrue(result.edges.any { it.event == "DONE" })
        assertTrue(result.metrics.distinctEventCount >= 3)
    }

    @Test
    fun `JSON contains nodes edges cycles metrics`() {
        val config = MachineConfig(
            initial = "idle",
            context = Unit,
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf("GO" to TransitionTarget.state("done")))
            )
        )
        val result = VisualDataBuilder.build(config)
        val json = result.toJson()
        assertTrue(json.contains("\"nodes\""))
        assertTrue(json.contains("\"edges\""))
        assertTrue(json.contains("\"cycles\""))
        assertTrue(json.contains("\"metrics\""))
        assertTrue(json.contains("idle"))
        assertTrue(json.contains("stateCount"))
    }
}
