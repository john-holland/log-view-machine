import { TomeConnectorProxy } from '../core/TomeConnectorProxy';
import { TomeConnectorHTTPServer } from '../core/TomeConnectorHTTPServer';
import { RobotCopy } from '../core/RobotCopy';
export declare class ProxyUsageExample {
    private proxy;
    private httpServer;
    private robotCopy;
    constructor();
    demonstrateProxyUsage(): Promise<void>;
    private createMockTomes;
    private demonstrateDirectProxyUsage;
    private demonstrateHTTPAPIUsage;
    private demonstrateRobotCopyIntegration;
    private showMetricsAndHealth;
    private cleanup;
    getProxy(): TomeConnectorProxy;
    getHTTPServer(): TomeConnectorHTTPServer;
    getRobotCopy(): RobotCopy;
}
export declare function runProxyUsageExample(): Promise<void>;
