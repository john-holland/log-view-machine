import { createViewStateMachine, ServiceMeta } from '../../core/ViewStateMachine';
import { MachineRouter } from '../../core/TomeBase';

/**
 * PreviewMachine
 * 
 * Manages real-time component preview rendering
 * Coordinates with EditorMachine and TemplateMachine via routed send
 */
export const createPreviewMachine = (router?: MachineRouter) => {
    return createViewStateMachine({
        machineId: 'preview-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            initial: 'idle',
            context: {
                previewData: null,
                componentData: null,
                isRendering: false,
                error: null,
                lastRendered: null
            },
            states: {
                idle: {
                    on: {
                        RENDER_PREVIEW: { target: 'rendering' },
                        COMPONENT_SAVED: { target: 'rendering', actions: ['updateComponentData'] }
                    }
                },
                rendering: {
                    invoke: {
                        src: 'renderPreviewService',
                        onDone: { target: 'ready', actions: ['setPreviewData'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                ready: {
                    on: {
                        RENDER_PREVIEW: { target: 'rendering' },
                        UPDATE_PREVIEW: { target: 'rendering' },
                        COMPONENT_SAVED: { target: 'rendering', actions: ['updateComponentData'] },
                        CLEAR: { target: 'idle', actions: ['clearPreview'] }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'rendering' },
                        RESET: { target: 'idle', actions: ['resetPreview'] }
                    }
                }
            },
            services: {
                renderPreviewService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('👁️ PreviewMachine: Rendering preview...');
                    
                    const componentToRender = event.component || context.componentData;
                    
                    // Send to template machine for processing
                    if (meta.routedSend && componentToRender) {
                        try {
                            const response = await meta.routedSend('../TemplateMachine', 'PROCESS_TEMPLATE', {
                                template: componentToRender.content || '',
                                variables: componentToRender.metadata || {}
                            });
                            console.log('👁️ PreviewMachine: Template processed:', response);
                            
                            return {
                                rendered: response.processed || response,
                                component: componentToRender,
                                timestamp: Date.now()
                            };
                        } catch (error: any) {
                            console.warn('👁️ PreviewMachine: Template processing failed, using raw content:', error.message);
                        }
                    }
                    
                    // Fallback: return component as-is
                    return {
                        rendered: componentToRender?.content || '<div>No preview available</div>',
                        component: componentToRender,
                        timestamp: Date.now()
                    };
                }
            },
            actions: {
                updateComponentData: (context: any, event: any) => {
                    console.log('👁️ PreviewMachine: Updating component data');
                    context.componentData = event.component;
                },
                setPreviewData: (context: any, event: any) => {
                    console.log('👁️ PreviewMachine: Setting preview data');
                    context.previewData = event.data;
                    context.lastRendered = Date.now();
                },
                clearPreview: (context: any) => {
                    console.log('👁️ PreviewMachine: Clearing preview');
                    context.previewData = null;
                    context.componentData = null;
                },
                setError: (context: any, event: any) => {
                    console.error('👁️ PreviewMachine: Error occurred:', event.data);
                    context.error = event.data;
                },
                resetPreview: (context: any) => {
                    console.log('👁️ PreviewMachine: Resetting preview');
                    context.previewData = null;
                    context.componentData = null;
                    context.error = null;
                }
            }
        }
    });
};

