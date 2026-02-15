package com.mod.cave.adapters

/**
 * Context passed to startup adapters (e.g. port, logger).
 * Can be extended with cave/tomeConfig when growing toward Cave server context.
 */
data class CaveStartupContext(
    val port: Int,
    val logger: ((String) -> Unit)? = null
)
