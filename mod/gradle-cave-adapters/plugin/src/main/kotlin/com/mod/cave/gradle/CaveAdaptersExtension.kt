package com.mod.cave.gradle

import org.gradle.api.model.ObjectFactory
import org.gradle.api.provider.Property
import javax.inject.Inject

/**
 * Extension for Cave adapters (e.g. port to clear, wait for health URL before run).
 */
abstract class CaveAdaptersExtension @Inject constructor(objects: ObjectFactory) {
    /** Port to clear before the application runs. Default: env PORT, then project property cave.port, then 8082. */
    val port: Property<Int> = objects.property(Int::class.java)

    /** Optional URL to poll until 2xx before run (e.g. http://localhost:3000/health). If empty, skip wait. */
    val waitForHealthUrl: Property<String> = objects.property(String::class.java).convention("")

    /** Timeout in ms for wait-for-health. Default 120000 (2 min). */
    val waitForHealthTimeoutMs: Property<Long> = objects.property(Long::class.java).convention(120_000L)
}
