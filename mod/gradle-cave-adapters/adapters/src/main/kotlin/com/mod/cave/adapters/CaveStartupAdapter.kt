package com.mod.cave.adapters

/**
 * Startup adapter contract. Implementations run before the server binds (e.g. clear port, env checks).
 * Default implementations can be do-nothing; concrete adapters (e.g. PortClearAdapter) perform work.
 */
fun interface CaveStartupAdapter {
    fun apply(context: CaveStartupContext)
}
