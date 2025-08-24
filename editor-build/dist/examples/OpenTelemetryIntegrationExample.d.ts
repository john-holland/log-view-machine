import { TomeConnectorProxy } from '../core/TomeConnectorProxy';
import { TomeConnectorOpenTelemetry } from '../core/TomeConnectorOpenTelemetry';
import { RobotCopy } from '../core/RobotCopy';
export declare class OpenTelemetryIntegrationExample {
    private proxy;
    private httpServer;
    private openTelemetry;
    private robotCopy;
    constructor();
    demonstrateOpenTelemetryIntegration(): Promise<void>;
    private createMockServices;
    private demonstrateDistributedTracing;
    private demonstrateMetricsCollection;
    private demonstrateStructuredLogging;
    private demonstrateTraceCorrelation;
    private showTelemetryDashboard;
    private cleanup;
    getOpenTelemetry(): TomeConnectorOpenTelemetry;
    getProxy(): TomeConnectorProxy;
    getRobotCopy(): RobotCopy;
}
export declare function runOpenTelemetryIntegrationExample(): Promise<void>;
