package com.mod.cave.gradle

import com.mod.cave.adapters.PortClearAdapter
import org.gradle.api.DefaultTask
import org.gradle.api.tasks.TaskAction

/**
 * Clears the port configured in caveAdapters extension before the app runs.
 */
abstract class ClearPortTask : DefaultTask() {

    @TaskAction
    fun clearPort() {
        val ext = project.extensions.findByType(CaveAdaptersExtension::class.java)
            ?: return
        val port = ext.port.getOrElse(8082)
        PortClearAdapter.killProcessOnPort(port) { msg ->
            logger.lifecycle("[cave-adapters] $msg")
        }
    }
}
