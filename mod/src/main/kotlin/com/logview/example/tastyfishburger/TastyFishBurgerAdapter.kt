package com.logview.example.tastyfishburger

import com.logview.core.LogViewMachine
import com.logview.core.LogEntry
import com.logview.core.LogFilter
import com.logview.core.ViewStateMachine
import java.time.Instant

class TastyFishBurgerAdapter(
    private val stateMachine: TastyFishBurgerStateMachine
) {
    private val logViewMachine = stateMachine.getLogViewMachine()
    private val viewStateMachine = stateMachine.getViewStateMachine()

    fun fetchLogs(filter: LogFilter? = null): List<LogEntry> {
        return logViewMachine.getLogs(filter)
    }

    fun updateFilters(newFilter: LogFilter): List<LogEntry> {
        return logViewMachine.getLogs(newFilter)
    }

    fun addLog(level: String, message: String, metadata: Map<String, Any>? = null) {
        logViewMachine.addLog(LogEntry(
            id = "",
            timestamp = Instant.EPOCH,
            level = level,
            message = message,
            metadata = metadata
        ))
    }

    fun clearLogs() {
        logViewMachine.clearLogs()
    }

    fun getViewStateMachineLogs(): List<ViewStateMachine.LogEntry> {
        return viewStateMachine.getLogEntries()
    }

    fun subscribeToLogs(callback: (List<LogEntry>) -> Unit): () -> Unit {
        return logViewMachine.subscribe(callback)
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

    // Enhanced methods for ViewStateMachine integration
    suspend fun executeState(stateName: String, data: TastyFishBurgerStateMachine.FishBurgerData) {
        viewStateMachine.executeState(stateName, data)
    }

    fun getStateMachineLogs(): List<ViewStateMachine.LogEntry> {
        return viewStateMachine.getLogEntries()
    }

    fun clearStateMachineLogs() {
        viewStateMachine.clearLogs()
    }
} 