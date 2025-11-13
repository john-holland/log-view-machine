import { createHealthMachine } from '../../editor/machines/health-machine';
import { MachineRouter } from '../../core/TomeBase';

describe('HealthMachine', () => {
    let router: MachineRouter;
    let healthMachine: any;

    beforeEach(async () => {
        router = new MachineRouter();
        healthMachine = createHealthMachine(router);
        router.register('HealthMachine', healthMachine);
        await healthMachine.start();
    });

    afterEach(() => {
        healthMachine.stop?.();
    });

    describe('Initialization', () => {
        it('should start in idle state', () => {
            const state = healthMachine.getState();
            expect(state?.value).toBe('idle');
        });

        it('should have zero initial metrics', () => {
            const state = healthMachine.getState();
            const metrics = state?.context.metrics;
            
            expect(metrics.requestCount).toBe(0);
            expect(metrics.errorCount).toBe(0);
            expect(metrics.saveCount).toBe(0);
            expect(metrics.previewCount).toBe(0);
        });

        it('should have unknown status initially', () => {
            const state = healthMachine.getState();
            expect(state?.context.status).toBe('unknown');
        });
    });

    describe('START_MONITORING event', () => {
        it('should transition to monitoring state', () => {
            healthMachine.send('START_MONITORING');
            
            const state = healthMachine.getState();
            expect(state?.value).toBe('monitoring');
        });

        it('should set start time when monitoring begins', () => {
            healthMachine.send('START_MONITORING');
            
            const state = healthMachine.getState();
            expect(state?.context.startTime).toBeDefined();
            expect(state?.context.status).toBe('healthy');
        });
    });

    describe('OPERATION_COMPLETE event', () => {
        beforeEach(() => {
            healthMachine.send('START_MONITORING');
        });

        it('should increment request count', () => {
            const initialState = healthMachine.getState();
            const initialCount = initialState?.context.metrics.requestCount;

            healthMachine.send('OPERATION_COMPLETE', { operation: 'test' });
            
            const state = healthMachine.getState();
            expect(state?.context.metrics.requestCount).toBe(initialCount + 1);
        });

        it('should record save operations', () => {
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            
            const state = healthMachine.getState();
            expect(state?.context.metrics.saveCount).toBe(1);
            expect(state?.context.metrics.lastOperation).toBe('save');
        });

        it('should record preview operations', () => {
            healthMachine.send('OPERATION_COMPLETE', { operation: 'preview' });
            
            const state = healthMachine.getState();
            expect(state?.context.metrics.previewCount).toBe(1);
            expect(state?.context.metrics.lastOperation).toBe('preview');
        });

        it('should track multiple operations', () => {
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            healthMachine.send('OPERATION_COMPLETE', { operation: 'preview' });
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            
            const state = healthMachine.getState();
            expect(state?.context.metrics.requestCount).toBe(3);
            expect(state?.context.metrics.saveCount).toBe(2);
            expect(state?.context.metrics.previewCount).toBe(1);
        });
    });

    describe('OPERATION_FAILED event', () => {
        beforeEach(() => {
            healthMachine.send('START_MONITORING');
        });

        it('should increment error count', () => {
            healthMachine.send('OPERATION_FAILED', { error: 'Test error' });
            
            const state = healthMachine.getState();
            expect(state?.context.metrics.errorCount).toBe(1);
        });

        it('should track multiple errors', () => {
            healthMachine.send('OPERATION_FAILED', { error: 'Error 1' });
            healthMachine.send('OPERATION_FAILED', { error: 'Error 2' });
            healthMachine.send('OPERATION_FAILED', { error: 'Error 3' });
            
            const state = healthMachine.getState();
            expect(state?.context.metrics.errorCount).toBe(3);
        });
    });

    describe('CHECK_HEALTH event', () => {
        beforeEach(() => {
            healthMachine.send('START_MONITORING');
        });

        it('should transition to checking state', () => {
            healthMachine.send('CHECK_HEALTH');
            
            const state = healthMachine.getState();
            expect(state?.value).toBe('checking');
        });

        it('should determine healthy status with no errors', async () => {
            // Record some successful operations
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            healthMachine.send('OPERATION_COMPLETE', { operation: 'preview' });
            
            // Check health
            healthMachine.send('CHECK_HEALTH');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state = healthMachine.getState();
            expect(state?.value).toBe('monitoring');
            expect(state?.context.status).toBe('healthy');
        });

        it('should determine degraded status with moderate error rate', async () => {
            // 2 successes, 1 error = 33% error rate (degraded threshold is 20%)
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            healthMachine.send('OPERATION_FAILED', { error: 'Test' });
            
            healthMachine.send('CHECK_HEALTH');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state = healthMachine.getState();
            expect(state?.context.status).toBe('degraded');
        });

        it('should determine unhealthy status with high error rate', async () => {
            // 1 success, 2 errors = 66% error rate (unhealthy threshold is 50%)
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            healthMachine.send('OPERATION_FAILED', { error: 'Error 1' });
            healthMachine.send('OPERATION_FAILED', { error: 'Error 2' });
            
            healthMachine.send('CHECK_HEALTH');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state = healthMachine.getState();
            expect(state?.context.status).toBe('unhealthy');
        });

        it('should calculate uptime', async () => {
            // Wait a bit to accumulate uptime
            await new Promise(resolve => setTimeout(resolve, 100));
            
            healthMachine.send('CHECK_HEALTH');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state = healthMachine.getState();
            const uptime = state?.context.metrics.uptime;
            
            expect(uptime).toBeGreaterThan(0);
        });

        it('should include error rate in metrics', async () => {
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            healthMachine.send('OPERATION_FAILED', { error: 'Test' });
            
            healthMachine.send('CHECK_HEALTH');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state = healthMachine.getState();
            const errorRate = state?.context.metrics.errorRate;
            
            expect(errorRate).toBe(50); // 1 error out of 2 requests = 50%
        });
    });

    describe('STOP_MONITORING event', () => {
        it('should return to idle state', () => {
            healthMachine.send('START_MONITORING');
            healthMachine.send('STOP_MONITORING');
            
            const state = healthMachine.getState();
            expect(state?.value).toBe('idle');
        });

        it('should clear start time', () => {
            healthMachine.send('START_MONITORING');
            expect(healthMachine.getState()?.context.startTime).toBeDefined();
            
            healthMachine.send('STOP_MONITORING');
            
            const state = healthMachine.getState();
            expect(state?.context.startTime).toBeNull();
        });
    });

    describe('Metrics persistence', () => {
        it('should maintain metrics across monitoring sessions', () => {
            // First session
            healthMachine.send('START_MONITORING');
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            healthMachine.send('STOP_MONITORING');
            
            const state1 = healthMachine.getState();
            const count1 = state1?.context.metrics.requestCount;
            
            // Second session
            healthMachine.send('START_MONITORING');
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            
            const state2 = healthMachine.getState();
            const count2 = state2?.context.metrics.requestCount;
            
            expect(count2).toBe(count1 + 1);
        });
    });

    describe('Health transitions', () => {
        beforeEach(() => {
            healthMachine.send('START_MONITORING');
        });

        it('should transition from healthy to degraded to unhealthy', async () => {
            // Start healthy
            healthMachine.send('OPERATION_COMPLETE', { operation: 'save' });
            healthMachine.send('CHECK_HEALTH');
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(healthMachine.getState()?.context.status).toBe('healthy');
            
            // Add errors to become degraded
            healthMachine.send('OPERATION_FAILED', { error: 'Error 1' });
            healthMachine.send('CHECK_HEALTH');
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(healthMachine.getState()?.context.status).toBe('degraded');
            
            // Add more errors to become unhealthy
            healthMachine.send('OPERATION_FAILED', { error: 'Error 2' });
            healthMachine.send('OPERATION_FAILED', { error: 'Error 3' });
            healthMachine.send('CHECK_HEALTH');
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(healthMachine.getState()?.context.status).toBe('unhealthy');
        });
    });
});

