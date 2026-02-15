package com.logview.cave

/**
 * Kotlin port of Cave - physical device/location description; contains Tomes.
 * Config-only until initialize() is called; isInitialized reflects whether the Cave has been initialized.
 * Aligns with log-view-machine/src/core/cave/Cave.ts.
 */

/**
 * Spelunk: descent structure for a cave (nested caves, tomes, route, container, etc.).
 */
data class Spelunk(
    val childCaves: Map<String, Spelunk>? = null,
    val tomes: Map<String, Any>? = null,
    val route: String? = null,
    val container: String? = null,
    val renderKey: String? = null,
    val tomeId: String? = null,
    val docker: Map<String, Any>? = null,
    val subdomains: Map<String, Any>? = null,
    /** Optional: indicates this Cave can be replaced by a mod */
    val isModableCave: Boolean? = null,
    val extra: Map<String, Any> = emptyMap()
)

/**
 * Return type of getRenderTarget(path): route, container, tomes, and optional tomeId for the routed spelunk.
 */
data class RenderTarget(
    val route: String? = null,
    val container: String? = null,
    val tomes: Map<String, Any>? = null,
    val tomeId: String? = null
)

/**
 * Optional wan-os ROM build/registry config.
 */
data class WanOsRomRegistry(
    val enabled: Boolean? = null,
    val registryPath: String? = null
)

/**
 * Cave configuration (name + spelunk).
 */
data class CaveConfig(
    val name: String,
    val spelunk: Spelunk,
    val wanOsRomRegistry: WanOsRomRegistry? = null
)

/**
 * Cave instance interface - same API surface as TypeScript CaveInstance.
 */
interface CaveInstance {
    val name: String
    val isInitialized: Boolean
    fun getConfig(): CaveConfig
    fun getRoutedConfig(path: String): Any  // Spelunk or CaveConfig
    fun getRenderTarget(path: String): RenderTarget
    fun getRenderKey(): String
    fun observeViewKey(callback: (String) -> Unit): () -> Unit
    val childCaves: Map<String, CaveInstance>
    suspend fun initialize(): CaveInstance
}

/**
 * Cave factory: (name, caveDescent) -> CaveInstance.
 * Returns a Cave that is config-only until initialize() is called.
 */
fun Cave(name: String, caveDescent: Spelunk): CaveInstance = DefaultCave(name, caveDescent)

/**
 * createCave(name, spelunk) - alias for Cave() for API parity with TypeScript.
 */
fun createCave(name: String, spelunk: Spelunk): CaveInstance = Cave(name, spelunk)

private class DefaultCave(
    private val caveName: String,
    private val spelunk: Spelunk
) : CaveInstance {

    private val config = CaveConfig(name = caveName, spelunk = spelunk)
    private var initialized = false
    private val childCavesMap: Map<String, CaveInstance> = buildChildCaves(spelunk)
    private val viewKeyListeners = mutableListOf<(String) -> Unit>()

    override val name: String get() = caveName
    override val isInitialized: Boolean get() = initialized
    override val childCaves: Map<String, CaveInstance> get() = childCavesMap

    override fun getConfig(): CaveConfig = config.copy()

    override fun getRoutedConfig(path: String): Any {
        val trimmed = path.replace(Regex("^\\./?|/\$"), "").ifEmpty { "." }
        if (trimmed == "." || trimmed.isEmpty()) return config
        var current: Spelunk = spelunk
        for (part in trimmed.split("/").filter { it.isNotEmpty() }) {
            val next = current.childCaves?.get(part) ?: return config
            current = next
        }
        return current
    }

    override fun getRenderTarget(path: String): RenderTarget {
        val routed = getRoutedConfig(path)
        val s = when (routed) {
            is CaveConfig -> routed.spelunk
            is Spelunk -> routed
            else -> spelunk
        }
        return RenderTarget(
            route = s.route,
            container = s.container,
            tomes = s.tomes,
            tomeId = s.tomeId
        )
    }

    override fun getRenderKey(): String = spelunk.renderKey ?: caveName

    override fun observeViewKey(callback: (String) -> Unit): () -> Unit {
        callback(getRenderKey())
        viewKeyListeners.add(callback)
        return {
            viewKeyListeners.remove(callback)
        }
    }

    override suspend fun initialize(): CaveInstance {
        if (initialized) return this
        childCavesMap.values.forEach { (it as? DefaultCave)?.let { c -> c.initialize() } }
        initialized = true
        return this
    }

    companion object {
        private fun buildChildCaves(s: Spelunk): Map<String, CaveInstance> {
            val childCaves = mutableMapOf<String, CaveInstance>()
            s.childCaves?.forEach { (key, childSpelunk) ->
                childCaves[key] = Cave(key, childSpelunk)
            }
            return childCaves
        }
    }
}
