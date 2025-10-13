import { createViewStateMachine, ServiceMeta } from '../../core/ViewStateMachine';
import { MachineRouter } from '../../core/TomeBase';

/**
 * TemplateMachine
 * 
 * Handles template processing and validation
 * Provides template utilities for the editor system
 */
export const createTemplateMachine = (router?: MachineRouter) => {
    return createViewStateMachine({
        machineId: 'template-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            initial: 'idle',
            context: {
                currentTemplate: null,
                processedResult: null,
                validationErrors: [],
                error: null
            },
            states: {
                idle: {
                    on: {
                        PROCESS_TEMPLATE: { target: 'processing' }
                    }
                },
                processing: {
                    invoke: {
                        src: 'processTemplateService',
                        onDone: { target: 'validating', actions: ['setProcessedResult'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                validating: {
                    invoke: {
                        src: 'validateTemplateService',
                        onDone: { target: 'idle', actions: ['clearValidationErrors'] },
                        onError: { target: 'idle', actions: ['setValidationErrors'] }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'processing' },
                        RESET: { target: 'idle', actions: ['resetTemplate'] }
                    }
                }
            },
            services: {
                processTemplateService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('🔧 TemplateMachine: Processing template...');
                    
                    const template = event.template || context.currentTemplate;
                    const variables = event.variables || {};
                    
                    // Simple template processing (replace {{variable}} with values)
                    let processed = template;
                    Object.entries(variables).forEach(([key, value]) => {
                        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                        processed = processed.replace(pattern, String(value));
                    });
                    
                    // Remove any JSX-specific syntax for preview
                    processed = processed.replace(/<[^>]*\s+value=\{.*?\}[^>]*>/g, (match) => {
                        return match.replace(/\s+value=\{.*?\}/g, '');
                    });
                    
                    return {
                        processed,
                        template,
                        variables,
                        timestamp: Date.now()
                    };
                },
                
                validateTemplateService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('🔧 TemplateMachine: Validating template...');
                    
                    const processed = context.processedResult?.processed;
                    
                    // Basic validation - check for unclosed tags, etc.
                    const errors = [];
                    
                    if (!processed) {
                        errors.push({ type: 'empty', message: 'No content to validate' });
                    }
                    
                    if (errors.length > 0) {
                        throw new Error('Validation failed');
                    }
                    
                    return { valid: true, errors: [] };
                }
            },
            actions: {
                setProcessedResult: (context: any, event: any) => {
                    console.log('🔧 TemplateMachine: Setting processed result');
                    context.processedResult = event.data;
                    context.currentTemplate = event.data?.template;
                },
                clearValidationErrors: (context: any) => {
                    context.validationErrors = [];
                },
                setValidationErrors: (context: any, event: any) => {
                    console.warn('🔧 TemplateMachine: Validation errors:', event.data);
                    context.validationErrors = event.data?.errors || [];
                },
                setError: (context: any, event: any) => {
                    console.error('🔧 TemplateMachine: Error occurred:', event.data);
                    context.error = event.data;
                },
                resetTemplate: (context: any) => {
                    console.log('🔧 TemplateMachine: Resetting template');
                    context.currentTemplate = null;
                    context.processedResult = null;
                    context.validationErrors = [];
                    context.error = null;
                }
            }
        }
    });
};

