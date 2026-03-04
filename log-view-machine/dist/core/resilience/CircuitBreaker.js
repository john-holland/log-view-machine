/**
 * Circuit breaker: closed (normal), open (reject), half-open (probe).
 * State transitions driven by failure count / error rate from ResourceMonitor or internal counts.
 * Expose circuit state so MetricsReporter can include it in snapshots (AWS/Hystrix).
 */
export class CircuitBreaker {
    constructor(options = {}) {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
        this.lastOpenAt = 0;
        this.name = options.name ?? 'default';
        this.threshold = options.threshold ?? 5;
        this.resetMs = options.resetMs ?? 30000;
        this.monitor = options.monitor;
        this.useMonitorForThreshold = options.useMonitorForThreshold ?? false;
    }
    getState() {
        if (this.state === 'open' && Date.now() - this.lastOpenAt >= this.resetMs) {
            this.state = 'halfOpen';
            this.successCount = 0;
            this.failureCount = 0;
        }
        return this.state;
    }
    /** Record success (e.g. after a successful request). */
    recordSuccess() {
        if (this.monitor)
            this.monitor.trackCircuit(this.name, 'closed');
        if (this.state === 'halfOpen') {
            this.successCount++;
            if (this.successCount >= 1) {
                this.state = 'closed';
                this.failureCount = 0;
            }
        }
        else if (this.state === 'closed') {
            this.failureCount = Math.max(0, this.failureCount - 1);
        }
    }
    /** Record failure (e.g. after a failed request). */
    recordFailure() {
        if (this.state === 'closed') {
            let overThreshold = false;
            if (this.useMonitorForThreshold && this.monitor) {
                const snap = this.monitor.getSnapshot();
                const rate = snap.requestCount > 0 ? snap.errorCount / snap.requestCount : 0;
                overThreshold = snap.errorCount >= this.threshold || rate >= this.threshold / 10;
            }
            else {
                this.failureCount++;
                overThreshold = this.failureCount >= this.threshold;
            }
            if (overThreshold) {
                this.state = 'open';
                this.lastOpenAt = Date.now();
                if (this.monitor)
                    this.monitor.trackCircuit(this.name, 'open');
            }
        }
        else if (this.state === 'halfOpen') {
            this.state = 'open';
            this.lastOpenAt = Date.now();
            if (this.monitor)
                this.monitor.trackCircuit(this.name, 'open');
        }
    }
    /** Returns true if the request is allowed (closed or halfOpen). */
    allowRequest() {
        const s = this.getState();
        if (s === 'open')
            return false;
        if (s === 'halfOpen' && this.monitor)
            this.monitor.trackCircuit(this.name, 'halfOpen');
        return true;
    }
    /** Execute fn through the circuit; on throw or non-ok result, recordFailure; else recordSuccess. */
    async execute(fn) {
        if (!this.allowRequest()) {
            throw new Error(`CircuitBreaker ${this.name} is open`);
        }
        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        }
        catch (e) {
            this.recordFailure();
            throw e;
        }
    }
}
export function createCircuitBreaker(options) {
    return new CircuitBreaker(options);
}
