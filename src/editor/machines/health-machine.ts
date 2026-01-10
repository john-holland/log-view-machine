import { createViewStateMachine, ServiceMeta } from '../../core/ViewStateMachine';
import { MachineRouter } from '../../core/TomeBase';

/**
 * HealthMachine
 * 
 * Monitors editor system health and performance metrics
 * Tracks operations and provides health status
 */
export const createHealthMachine = (router?: MachineRouter) => {
    return createViewStateMachine({
        machineId: 'health-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            initial: 'idle',
            context: {
                metrics: {
                    requestCount: 0,
                    errorCount: 0,
                    saveCount: 0,
                    previewCount: 0,
                    avgResponseTime: 0,
                    uptime: 0,
                    lastOperation: null
                },
                status: 'unknown' as 'healthy' | 'degraded' | 'unhealthy' | 'unknown',
                startTime: null,
                error: null
            },
            states: {
                idle: {
                    on: {
                        START_MONITORING: { target: 'monitoring', actions: ['startMonitoring'] }
                    }
                },
                monitoring: {
                    on: {
                        OPERATION_COMPLETE: { actions: ['recordOperation'] },
                        OPERATION_FAILED: { actions: ['recordError'] },
                        CHECK_HEALTH: { target: 'checking' },
                        STOP_MONITORING: { target: 'idle', actions: ['stopMonitoring'] }
                    }
                },
                checking: {
                    invoke: {
                        src: 'checkHealthService',
                        onDone: { target: 'monitoring', actions: ['updateStatus'] },
                        onError: { target: 'monitoring', actions: ['markUnhealthy'] }
                    }
                }
            },
            services: {
                checkHealthService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('🏥 HealthMachine: Checking health...');
                    
                    const metrics = context.metrics;
                    
                    // Determine health status based on metrics
                    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
                    
                    const totalRequests = metrics.requestCount + metrics.errorCount;
                    const errorRate = totalRequests > 0 
                        ? metrics.errorCount / totalRequests 
                        : 0;
                    
                    if (errorRate > 0.5) {
                        status = 'unhealthy';
                    } else if (errorRate > 0.2) {
                        status = 'degraded';
                    }
                    
                    // Calculate uptime
                    const uptime = context.startTime 
                        ? Date.now() - context.startTime 
                        : 0;
                    
                    return {
                        status,
                        metrics: {
                            ...metrics,
                            uptime,
                            errorRate: errorRate * 100,
                            healthCheckTime: Date.now()
                        }
                    };
                }
            },
            actions: {
                startMonitoring: (context: any) => {
                    console.log('🏥 HealthMachine: Starting monitoring');
                    context.startTime = Date.now();
                    context.status = 'healthy';
                },
                stopMonitoring: (context: any) => {
                    console.log('🏥 HealthMachine: Stopping monitoring');
                    context.startTime = null;
                },
                recordOperation: (context: any, event: any) => {
                    if (!event || !event.operation) {
                        console.warn('🏥 HealthMachine: Missing operation data, ignoring event');
                        return;
                    }

                    console.log('🏥 HealthMachine: Recording operation:', event.operation);
                    context.metrics.requestCount++;
                    context.metrics.lastOperation = event.operation;
                    
                    if (event.operation === 'save') {
                        context.metrics.saveCount++;
                    } else if (event.operation === 'preview') {
                        context.metrics.previewCount++;
                    }
                },
                recordError: (context: any, event: any) => {
                    console.error('🏥 HealthMachine: Recording error:', event.error);
                    context.metrics.errorCount++;
                },
                updateStatus: (context: any, event: any) => {
                    console.log('🏥 HealthMachine: Updating status:', event.data.status);
                    context.status = event.data.status;
                    context.metrics = event.data.metrics;
                },
                markUnhealthy: (context: any, event: any) => {
                    console.error('🏥 HealthMachine: Marking unhealthy:', event.data);
                    context.status = 'unhealthy';
                    context.error = event.data;
                }
            }
        }
    });
};

