package com.mod.cave.adapters

import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * Kills any process listening on the given port before the server starts.
 * Matches behavior of packages/port-cavestartup-adapter: Windows netstat/taskkill, Unix lsof/kill.
 * No-op if port is free or kill fails.
 */
class PortClearAdapter : CaveStartupAdapter {
    override fun apply(context: CaveStartupContext) {
        killProcessOnPort(context.port) { context.logger?.invoke(it) }
    }

    companion object {
        private val WINDOWS = System.getProperty("os.name", "").lowercase().contains("win")

        /**
         * Kill the process using the given port, if any. No-op if port is free or kill fails.
         */
        fun killProcessOnPort(port: Int, log: (String) -> Unit = {}) {
            val portStr = port.toString()
            try {
                if (WINDOWS) {
                    val pids = mutableSetOf<String>()
                    val proc = ProcessBuilder("netstat", "-ano")
                        .redirectErrorStream(true)
                        .start()
                    BufferedReader(InputStreamReader(proc.inputStream)).use { reader ->
                        reader.forEachLine { line ->
                            if (line.contains(":$portStr") && line.contains("LISTENING")) {
                                val parts = line.trim().split(Regex("\\s+"))
                                val pid = parts.lastOrNull()
                                if (pid != null && pid.matches(Regex("\\d+"))) pids.add(pid)
                            }
                        }
                    }
                    proc.waitFor()
                    for (pid in pids) {
                        try {
                            ProcessBuilder("taskkill", "/F", "/PID", pid)
                                .redirectErrorStream(true)
                                .start()
                                .waitFor()
                            log("Port $port: killed process $pid")
                        } catch (_: Exception) {}
                    }
                } else {
                    val lsof = ProcessBuilder("lsof", "-ti:$portStr")
                        .redirectErrorStream(true)
                        .start()
                    val out = BufferedReader(InputStreamReader(lsof.inputStream)).readText().trim()
                    lsof.waitFor()
                    val pids = if (out.isEmpty()) emptyList() else out.split(Regex("\\s+")).filter { it.isNotBlank() }
                    for (pid in pids) {
                        try {
                            ProcessBuilder("kill", "-9", pid)
                                .redirectErrorStream(true)
                                .start()
                                .waitFor()
                            log("Port $port: killed process $pid")
                        } catch (_: Exception) {}
                    }
                }
            } catch (e: Exception) {
                if (e is java.io.IOException && e.message?.contains("Cannot run program") != true) {
                    log("Port $port: could not free port (${e.message ?: e})")
                }
            }
        }
    }
}
