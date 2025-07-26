export class LogViewMachineImpl {
    constructor(config = {}) {
        this.logs = [];
        this.subscribers = new Set();
        this.config = {
            maxEntries: 1000,
            enableRealTime: true,
            ...config
        };
    }
    getLogs(filter) {
        let filteredLogs = [...this.logs];
        if (filter) {
            if (filter.level) {
                const levelOrder = { 'DEBUG': 0, 'INFO': 1, 'WARN': 2, 'ERROR': 3 };
                const minLevel = levelOrder[filter.level];
                filteredLogs = filteredLogs.filter(log => levelOrder[log.level] >= minLevel);
            }
            if (filter.tags && filter.tags.length > 0) {
                filteredLogs = filteredLogs.filter(log => log.tags && filter.tags.some(tag => log.tags.includes(tag)));
            }
            if (filter.startTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime);
            }
            if (filter.endTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime);
            }
            if (filter.limit) {
                filteredLogs = filteredLogs.slice(-filter.limit);
            }
        }
        return filteredLogs;
    }
    addLog(entry) {
        const newEntry = {
            ...entry,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date()
        };
        this.logs.push(newEntry);
        if (this.config.maxEntries && this.logs.length > this.config.maxEntries) {
            this.logs = this.logs.slice(-this.config.maxEntries);
        }
        if (this.config.enableRealTime) {
            this.notifySubscribers();
        }
    }
    clearLogs() {
        this.logs = [];
        this.notifySubscribers();
    }
    subscribe(callback) {
        this.subscribers.add(callback);
        callback(this.logs); // Initial call
        return () => {
            this.subscribers.delete(callback);
        };
    }
    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.logs));
    }
}
