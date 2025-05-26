package com.logview.tastyfishburger;

import com.logview.core.LogViewMachine;
import com.logview.core.LogEntry;
import com.logview.core.LogFilters;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public class TastyFishBurgerAdapter {
    private final LogViewMachine machine;

    public TastyFishBurgerAdapter(LogViewMachine machine) {
        this.machine = machine;
    }

    public List<LogEntry> fetchLogs(LogFilters filters) {
        return machine.fetchLogs(filters);
    }

    public List<LogEntry> updateFilters(LogFilters newFilters) {
        return machine.updateFilters(newFilters);
    }

    public void addLog(String level, String message, Map<String, Object> metadata) {
        LogEntry entry = new LogEntry(level, message, metadata);
        machine.addLog(entry);
    }

    public void clearLogs() {
        machine.clearLogs();
    }

    public static class FishBurgerLog {
        private final String id;
        private final Instant timestamp;
        private final String level;
        private final String message;
        private final Map<String, Object> metadata;

        public FishBurgerLog(String id, Instant timestamp, String level, String message, Map<String, Object> metadata) {
            this.id = id;
            this.timestamp = timestamp;
            this.level = level;
            this.message = message;
            this.metadata = metadata;
        }

        public String getId() { return id; }
        public Instant getTimestamp() { return timestamp; }
        public String getLevel() { return level; }
        public String getMessage() { return message; }
        public Map<String, Object> getMetadata() { return metadata; }
    }

    public FishBurgerLog convertToFishBurgerLog(LogEntry entry) {
        return new FishBurgerLog(
            entry.getId(),
            entry.getTimestamp(),
            entry.getLevel(),
            entry.getMessage(),
            entry.getMetadata()
        );
    }
} 