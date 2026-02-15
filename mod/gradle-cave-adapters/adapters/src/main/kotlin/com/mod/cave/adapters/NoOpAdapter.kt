package com.mod.cave.adapters

/**
 * Do-nothing startup adapter (sensible default).
 */
object NoOpAdapter : CaveStartupAdapter {
    override fun apply(context: CaveStartupContext) {}
}
