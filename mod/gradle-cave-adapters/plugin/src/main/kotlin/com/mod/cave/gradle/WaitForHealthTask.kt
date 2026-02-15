package com.mod.cave.gradle

import org.gradle.api.DefaultTask
import org.gradle.api.tasks.TaskAction
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

/**
 * Waits for a health URL to return 2xx before run. Fails the build on timeout.
 */
abstract class WaitForHealthTask : DefaultTask() {

    @TaskAction
    fun waitForHealth() {
        val ext = project.extensions.findByType(CaveAdaptersExtension::class.java) ?: return
        val url = ext.waitForHealthUrl.getOrElse("").trim()
        if (url.isEmpty()) {
            logger.lifecycle("[cave-adapters] waitForHealthUrl not set, skipping.")
            return
        }
        val timeoutMs = ext.waitForHealthTimeoutMs.getOrElse(120_000L)
        val pollIntervalMs = 2_000L

        val client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .version(HttpClient.Version.HTTP_1_1)
            .build()
        val request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofSeconds(10))
            .header("Accept", "application/json")
            .GET()
            .build()

        val deadline = System.currentTimeMillis() + timeoutMs
        while (System.currentTimeMillis() < deadline) {
            try {
                val response = client.send(request, HttpResponse.BodyHandlers.discarding())
                if (response.statusCode() in 200..299) {
                    logger.lifecycle("[cave-adapters] {} returned {}, proceeding.", url, response.statusCode())
                    return
                }
                logger.lifecycle("[cave-adapters] Waiting for {}... (got {})", url, response.statusCode())
            } catch (e: Exception) {
                logger.lifecycle("[cave-adapters] Waiting for {}... ({})", url, e.message ?: e.toString())
            }
            if (System.currentTimeMillis() + pollIntervalMs >= deadline) break
            Thread.sleep(pollIntervalMs)
        }
        throw org.gradle.api.GradleException("Wait for health timed out after ${timeoutMs}ms: $url")
    }
}
