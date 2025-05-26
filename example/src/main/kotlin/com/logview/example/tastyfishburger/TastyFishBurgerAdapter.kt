package com.logview.example.tastyfishburger

import com.logview.core.LogViewMachine
import com.logview.core.LogEntry
import com.logview.core.LogFilters
import java.time.Instant

class TastyFishBurgerAdapter(private val machine: LogViewMachine) {
    fun fetchLogs(filters: LogFilters? = null): List<LogEntry> {
        return machine.fetchLogs(filters)
    }

    fun updateFilters(newFilters: LogFilters): List<LogEntry> {
        return machine.updateFilters(newFilters)
    }

    fun addLog(level: String, message: String, metadata: Map<String, Any>? = null) {
        machine.addLog(LogEntry(
            level = level,
            message = message,
            metadata = metadata
        ))
    }

    fun clearLogs() {
        machine.clearLogs()
    }

    data class FishBurgerLog(
        val id: String,
        val timestamp: Instant,
        val level: String,
        val message: String,
        val metadata: Map<String, Any>? = null
    )

    fun convertToFishBurgerLog(entry: LogEntry): FishBurgerLog {
        return FishBurgerLog(
            id = entry.id,
            timestamp = entry.timestamp,
            level = entry.level,
            message = entry.message,
            metadata = entry.metadata
        )
    }
} 