package com.mod.cave.gradle

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.plugins.ApplicationPlugin
import org.gradle.api.tasks.JavaExec
import org.gradle.api.tasks.TaskProvider

/**
 * Applies Cave startup adapters: clears the configured port before the Application plugin's run task.
 */
class CaveAdaptersPlugin : Plugin<Project> {

    override fun apply(project: Project) {
        val envPort = System.getenv("PORT")?.toIntOrNull()
        val propPort = project.findProperty("cave.port")?.toString()?.toIntOrNull()
        val defaultPort = envPort ?: propPort ?: 8082

        val extension = project.extensions.create("caveAdapters", CaveAdaptersExtension::class.java, project.objects)
        extension.port.convention(defaultPort)

        val waitForHealthTask: TaskProvider<WaitForHealthTask> = project.tasks.register("caveWaitForHealth", WaitForHealthTask::class.java)
        waitForHealthTask.configure { task ->
            task.group = "cave"
            task.description = "Waits for a health URL to return 2xx before run."
        }

        val clearPortTask: TaskProvider<ClearPortTask> = project.tasks.register("caveClearPort", ClearPortTask::class.java)
        clearPortTask.configure { task ->
            task.group = "cave"
            task.description = "Clears the port configured in caveAdapters so the application can bind."
        }

        project.plugins.withId(ApplicationPlugin.APPLICATION_PLUGIN_NAME) {
            project.tasks.named("run").configure {
                it.dependsOn(clearPortTask)
            }
            project.afterEvaluate {
                val waitUrl = extension.waitForHealthUrl.getOrElse("").trim()
                if (waitUrl.isNotEmpty()) {
                    clearPortTask.configure { it.dependsOn(waitForHealthTask) }
                }
                project.tasks.named("run", JavaExec::class.java).configure { run ->
                    run.environment("PORT", extension.port.get().toString())
                }
            }
        }
    }
}
