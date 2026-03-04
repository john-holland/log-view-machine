/**
 * Pluggable reporter for MetricsSnapshot. Default can post to GA-like endpoint;
 * override reportTo to push to CloudWatch, Hystrix stream, or other backend.
 */
export function createMetricsReporter(getSnapshot, options) {
    const reportTo = options?.reportTo ?? (() => { });
    let intervalId = null;
    async function report(snapshot) {
        await Promise.resolve(reportTo(snapshot));
    }
    return {
        report(snapshot) {
            return report(snapshot);
        },
        start() {
            if (options?.intervalMs != null && options.intervalMs > 0 && intervalId == null) {
                intervalId = setInterval(() => {
                    report(getSnapshot()).catch(() => { });
                }, options.intervalMs);
            }
        },
        stop() {
            if (intervalId != null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        },
    };
}
