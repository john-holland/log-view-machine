/**
 * Throttle policy: signals "over limit" from a sliding or fixed window (request count or bytes).
 * Reads from ResourceMonitor snapshot or uses an internal window. Middleware or RobotCopy can return 429 when over limit.
 */
import type { ResourceMonitor } from '../monitoring/types';
export interface ThrottleConfig {
    maxRequestsPerMinute?: number;
    maxBytesPerMinute?: number;
    windowMs?: number;
}
export interface ThrottlePolicyOptions {
    config: ThrottleConfig;
    /** Optional: read request/bytes from this monitor's snapshot; otherwise use internal counters */
    monitor?: ResourceMonitor;
}
export declare class ThrottlePolicy {
    private readonly config;
    private readonly monitor?;
    private readonly windowMs;
    private slots;
    constructor(options: ThrottlePolicyOptions);
    /** Record one request (and optional bytes). Call this when a request is about to be processed or was processed. */
    record(bytesIn?: number, bytesOut?: number): void;
    /** Returns true if over limit (should throttle / 429). */
    isOverLimit(): boolean;
}
export declare function createThrottlePolicy(options: ThrottlePolicyOptions): ThrottlePolicy;
//# sourceMappingURL=ThrottlePolicy.d.ts.map