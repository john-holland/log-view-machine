package com.logview.causality.visual

import com.logview.causality.MachineConfig
import com.logview.causality.StateNodeConfig
import com.logview.causality.TransitionTarget
import com.logview.causality.TriLeafInterpreter
import com.logview.causality.TriLeafVisualData

/**
 * Builds visual data from an XState-congruent MachineConfig: state tree permutation,
 * cycle detection, size/complexity metrics, and JSON for display.
 */
object VisualDataBuilder {

    data class VisualNode(
        val id: String,
        val label: String,
        val initial: Boolean = false,
        val inCycle: Boolean = false,
        val depth: Int? = null,
        val parent: String? = null
    )

    data class VisualEdge(
        val from: String,
        val to: String,
        val event: String,
        val inCycle: Boolean = false
    )

    data class VisualCycle(
        val id: String,
        val states: List<String>
    )

    data class VisualMetrics(
        val stateCount: Int,
        val transitionCount: Int,
        val distinctEventCount: Int,
        val leafStateCount: Int,
        val cyclomaticComplexity: Int,
        val cycleCount: Int,
        val maxDepth: Int,
        val maxBranchingFactor: Int,
        val isDag: Boolean
    )

    data class VisualResult(
        val nodes: List<VisualNode>,
        val edges: List<VisualEdge>,
        val cycles: List<VisualCycle>,
        val metrics: VisualMetrics,
        val triLeaf: TriLeafVisualData? = null
    ) {
        fun toJson(): String = VisualDataBuilder.toJsonString(this)
    }

    /**
     * Build full visual data from config. Optional currentTriLeaf adds triLeaf to the result.
     */
    @JvmStatic
    fun build(config: MachineConfig<*>, currentTriLeaf: TriLeafInterpreter<*>? = null): VisualResult {
        val (nodes, edges) = buildGraph(config)
        val (cycles, inCycleSet) = findCycles(config, edges)
        val nodesWithCycle = nodes.map { n -> n.copy(inCycle = n.id in inCycleSet) }
        val edgesWithCycle = edges.map { e -> e.copy(inCycle = e.from in inCycleSet || e.to in inCycleSet) }
        val metrics = computeMetrics(config, nodesWithCycle, edgesWithCycle, cycles)
        val triLeaf = currentTriLeaf?.getVisualData()
        return VisualResult(
            nodes = nodesWithCycle,
            edges = edgesWithCycle,
            cycles = cycles,
            metrics = metrics,
            triLeaf = triLeaf
        )
    }

    private fun buildGraph(config: MachineConfig<*>): Pair<List<VisualNode>, List<VisualEdge>> {
        val stateIds = (config.states.keys + config.initial).toSet()
        val nodes = stateIds.map { id ->
            VisualNode(
                id = id,
                label = id,
                initial = id == config.initial
            )
        }
        val edges = mutableListOf<VisualEdge>()
        for ((fromState, stateConfig) in config.states) {
            for ((event, target) in stateConfig.on) {
                val toState = when (target) {
                    is TransitionTarget.State -> target.target
                    is TransitionTarget.WithActions -> target.target
                }
                edges.add(VisualEdge(from = fromState, to = toState, event = event))
            }
        }
        config.on?.forEach { (event, target) ->
            for (fromState in stateIds) {
                val toState = when (target) {
                    is TransitionTarget.State -> target.target
                    is TransitionTarget.WithActions -> target.target
                }
                edges.add(VisualEdge(from = fromState, to = toState, event = event))
            }
        }
        return nodes to edges.distinct()
    }

    private fun findCycles(config: MachineConfig<*>, edges: List<VisualEdge>): Pair<List<VisualCycle>, Set<String>> {
        val allIds = edges.flatMap { listOf(it.from, it.to) }.toSet()
        val adjacency = mutableMapOf<String, MutableList<String>>()
        for (id in allIds) adjacency.getOrPut(id) { mutableListOf() }
        for (e in edges) {
            adjacency.getOrPut(e.from) { mutableListOf() }.add(e.to)
        }
        val sccs = tarjanSCC(adjacency)
        val inCycleSet = mutableSetOf<String>()
        val cycles = mutableListOf<VisualCycle>()
        for ((idx, scc) in sccs.withIndex()) {
            if (scc.size > 1) {
                inCycleSet.addAll(scc)
                cycles.add(VisualCycle(id = "cycle_$idx", states = scc.sorted()))
            } else if (scc.size == 1) {
                val single = scc.single()
                if (adjacency[single]?.contains(single) == true) {
                    inCycleSet.add(single)
                    cycles.add(VisualCycle(id = "cycle_$idx", states = listOf(single)))
                }
            }
        }
        return cycles to inCycleSet
    }

    private fun tarjanSCC(adjacency: Map<String, List<String>>): List<List<String>> {
        val index = mutableMapOf<String, Int>()
        val lowLink = mutableMapOf<String, Int>()
        val onStack = mutableSetOf<String>()
        val stack = ArrayDeque<String>()
        var currentIndex = 0
        val result = mutableListOf<List<String>>()

        fun strongConnect(v: String) {
            index[v] = currentIndex
            lowLink[v] = currentIndex
            currentIndex++
            stack.addLast(v)
            onStack.add(v)
            for (w in adjacency[v] ?: emptyList()) {
                if (w !in index) {
                    strongConnect(w)
                    lowLink[v] = minOf(lowLink[v]!!, lowLink[w]!!)
                } else if (w in onStack) {
                    lowLink[v] = minOf(lowLink[v]!!, index[w]!!)
                }
            }
            if (lowLink[v] == index[v]) {
                val scc = mutableListOf<String>()
                while (true) {
                    val w = stack.removeLast()
                    onStack.remove(w)
                    scc.add(w)
                    if (w == v) break
                }
                if (scc.isNotEmpty()) result.add(scc)
            }
        }

        for (node in adjacency.keys) {
            if (node !in index) strongConnect(node)
        }
        return result
    }

    private fun computeMetrics(
        config: MachineConfig<*>,
        nodes: List<VisualNode>,
        edges: List<VisualEdge>,
        cycles: List<VisualCycle>
    ): VisualMetrics {
        val stateCount = nodes.size
        val transitionCount = edges.size
        val distinctEvents = edges.map { it.event }.toSet().size
        val leafCount = nodes.count { n -> edges.none { e -> e.from == n.id } }.coerceAtLeast(1)
        val cyclomatic = (transitionCount - stateCount + 2).coerceAtLeast(0)
        val cycleCount = cycles.size
        val (maxDepth, maxBranching) = computeDepthAndBranching(config.initial, edges)
        return VisualMetrics(
            stateCount = stateCount,
            transitionCount = transitionCount,
            distinctEventCount = distinctEvents,
            leafStateCount = leafCount,
            cyclomaticComplexity = cyclomatic,
            cycleCount = cycleCount,
            maxDepth = maxDepth,
            maxBranchingFactor = maxBranching,
            isDag = cycleCount == 0
        )
    }

    private fun computeDepthAndBranching(initial: String, edges: List<VisualEdge>): Pair<Int, Int> {
        val outDegree = edges.groupBy { it.from }.mapValues { it.value.size }
        val maxBranching = (outDegree.values.maxOrNull() ?: 0).coerceAtLeast(1)
        val adjacency = edges.groupBy { it.from }.mapValues { list -> list.value.map { it.to } }
        var maxDepth = 0
        val visited = mutableSetOf<String>()
        fun dfs(node: String, depth: Int) {
            if (node in visited) return
            visited.add(node)
            maxDepth = maxOf(maxDepth, depth)
            for (next in adjacency[node] ?: emptyList()) {
                dfs(next, depth + 1)
            }
        }
        dfs(initial, 0)
        return maxDepth to maxBranching
    }

    internal fun toJsonString(r: VisualResult): String {
        val sb = StringBuilder()
        sb.append("{\"nodes\":[")
        sb.append(r.nodes.joinToString(",") { n ->
            """{"id":"${escape(n.id)}","label":"${escape(n.label)}","initial":${n.initial},"inCycle":${n.inCycle}}"""
        })
        sb.append("],\"edges\":[")
        sb.append(r.edges.joinToString(",") { e ->
            """{"from":"${escape(e.from)}","to":"${escape(e.to)}","event":"${escape(e.event)}","inCycle":${e.inCycle}}"""
        })
        sb.append("],\"cycles\":[")
        sb.append(r.cycles.joinToString(",") { c ->
            """{"id":"${escape(c.id)}","states":[""" + c.states.joinToString(",") { "\"${escape(it)}\"" } + "]}"
        })
        sb.append("],\"metrics\":{")
        val m = r.metrics
        sb.append(""""stateCount":${m.stateCount},"transitionCount":${m.transitionCount},"distinctEventCount":${m.distinctEventCount},"leafStateCount":${m.leafStateCount},"cyclomaticComplexity":${m.cyclomaticComplexity},"cycleCount":${m.cycleCount},"maxDepth":${m.maxDepth},"maxBranchingFactor":${m.maxBranchingFactor},"isDag":${m.isDag}}""")
        sb.append("}")
        if (r.triLeaf != null) {
            sb.append(",\"triLeaf\":{")
            sb.append(""""rootStateValue":"${escape(r.triLeaf.rootStateValue)}","enabledEventKeys":[""")
            sb.append(r.triLeaf.enabledEventKeys.joinToString(",") { "\"${escape(it)}\"" })
            sb.append("""],"currentStateValue":"${escape(r.triLeaf.currentStateValue)}","atRoot":${r.triLeaf.atRoot}}""")
            sb.append("}")
        }
        sb.append("}")
        return sb.toString()
    }

    private fun escape(s: String): String = s
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
}
