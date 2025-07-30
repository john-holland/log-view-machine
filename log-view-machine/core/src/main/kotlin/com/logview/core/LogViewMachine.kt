package com.logview.core

import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

interface LogViewMachine {
    fun getLogs(filter: LogFilter? = null): List<LogEntry>
    fun addLog(entry: LogEntry)
    fun clearLogs()
    fun subscribe(callback: (List<LogEntry>) -> Unit): () -> Unit
}

data class LogEntry(
    val id: String,
    val timestamp: Instant,
    val level: String,
    val message: String,
    val metadata: Map<String, Any>? = null,
    val tags: List<String>? = null
)

data class LogFilter(
    val level: String? = null,
    val tags: List<String>? = null,
    val startTime: Instant? = null,
    val endTime: Instant? = null,
    val limit: Int? = null
)

class LogViewMachineImpl(
    private val config: LogViewMachineConfig = LogViewMachineConfig()
) : LogViewMachine {
    private val logs = mutableListOf<LogEntry>()
    private val subscribers = mutableSetOf<(List<LogEntry>) -> Unit>()

    data class LogViewMachineConfig(
        val maxEntries: Int = 1000,
        val enableRealTime: Boolean = true
    )

    override fun getLogs(filter: LogFilter?): List<LogEntry> {
        var filteredLogs = logs.toList()

        if (filter != null) {
            if (filter.level != null) {
                val levelOrder = mapOf("DEBUG" to 0, "INFO" to 1, "WARN" to 2, "ERROR" to 3)
                val minLevel = levelOrder[filter.level] ?: 0
                filteredLogs = filteredLogs.filter { log ->
                    val logLevel = levelOrder[log.level] ?: 0
                    logLevel >= minLevel
                }
            }

            if (filter.tags != null && filter.tags.isNotEmpty()) {
                filteredLogs = filteredLogs.filter { log ->
                    log.tags?.any { tag -> filter.tags.contains(tag) } == true
                }
            }

            if (filter.startTime != null) {
                filteredLogs = filteredLogs.filter { log ->
                    log.timestamp >= filter.startTime
                }
            }

            if (filter.endTime != null) {
                filteredLogs = filteredLogs.filter { log ->
                    log.timestamp <= filter.endTime
                }
            }

            if (filter.limit != null) {
                filteredLogs = filteredLogs.takeLast(filter.limit)
            }
        }

        return filteredLogs
    }

    override fun addLog(entry: LogEntry) {
        val newEntry = entry.copy(
            id = if (entry.id.isEmpty()) System.currentTimeMillis().toString() else entry.id,
            timestamp = if (entry.timestamp == Instant.EPOCH) Instant.now() else entry.timestamp
        )

        logs.add(newEntry)

        // Maintain max entries limit
        if (config.maxEntries > 0 && logs.size > config.maxEntries) {
            logs.removeAt(0)
        }

        if (config.enableRealTime) {
            notifySubscribers()
        }
    }

    override fun clearLogs() {
        logs.clear()
        notifySubscribers()
    }

    override fun subscribe(callback: (List<LogEntry>) -> Unit): () -> Unit {
        subscribers.add(callback)
        callback(logs) // Initial call
        return { subscribers.remove(callback) }
    }

    private fun notifySubscribers() {
        subscribers.forEach { callback ->
            try {
                callback(logs)
            } catch (e: Exception) {
                // Log error but don't break other subscribers
                println("Error in log subscriber: ${e.message}")
            }
        }
    }
} 