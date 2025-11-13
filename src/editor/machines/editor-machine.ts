import { createViewStateMachine, ServiceMeta, MachineRouter } from '../../core/ViewStateMachine';
import { MachineRouter as RouterType } from '../../core/TomeBase';
import { storageService } from '../services/storage-service';

/**
 * EditorMachine
 * 
 * Manages component editing lifecycle with CRUD operations
 * Uses invoke services for async operations and routed send for coordination
 */
export const createEditorMachine = (router?: RouterType) => {
    return createViewStateMachine({
        machineId: 'editor-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            initial: 'idle',
            context: {
                currentComponent: null,
                components: [],
                isDirty: false,
                lastSaved: null,
                error: null,
                componentId: null
            },
            states: {
                idle: {
                    on: {
                        LOAD_COMPONENT: { target: 'loading' },
                        CREATE_NEW: { target: 'editing', actions: ['createNewComponent'] },
                        LIST_COMPONENTS: { target: 'listing' }
                    }
                },
                listing: {
                    invoke: {
                        src: 'listComponentsService',
                        onDone: { target: 'idle', actions: ['setComponentList'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                loading: {
                    invoke: {
                        src: 'loadComponentService',
                        onDone: { target: 'editing', actions: ['setComponent'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                editing: {
                    on: {
                        SAVE: { target: 'saving' },
                        PREVIEW: { target: 'previewing' },
                        CANCEL: { target: 'idle', actions: ['clearComponent'] },
                        COMPONENT_CHANGE: { actions: ['markDirty'] },
                        DELETE: { target: 'deleting' }
                    }
                },
                saving: {
                    invoke: {
                        src: 'saveComponentService',
                        onDone: { target: 'editing', actions: ['markSaved'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                deleting: {
                    invoke: {
                        src: 'deleteComponentService',
                        onDone: { target: 'idle', actions: ['clearComponent'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                previewing: {
                    invoke: {
                        src: 'previewComponentService',
                        onDone: { target: 'editing' },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'editing' },
                        RESET: { target: 'idle', actions: ['resetEditor'] }
                    }
                }
            },
            services: {
                listComponentsService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('📝 EditorMachine: Listing components...');
                    
                    // Fetch from storage service
                    const components = await storageService.listComponents();
                    return { components };
                },
                
                loadComponentService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('📝 EditorMachine: Loading component:', event.componentId);
                    
                    // Load from storage service
                    const component = await storageService.getComponent(event.componentId);
                    
                    if (!component) {
                        throw new Error(`Component not found: ${event.componentId}`);
                    }
                    
                    return component;
                },
                
                saveComponentService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('📝 EditorMachine: Saving component:', context.currentComponent);
                    
                    // Save to storage service
                    const saved = await storageService.saveComponent(context.currentComponent);
                    
                    // Notify preview machine about save
                    if (meta.routedSend) {
                        try {
                            await meta.routedSend('../PreviewMachine', 'COMPONENT_SAVED', {
                                component: saved
                            });
                            console.log('📝 EditorMachine: Notified PreviewMachine of save');
                        } catch (error: any) {
                            console.warn('📝 EditorMachine: Could not notify PreviewMachine:', error.message);
                        }
                    }
                    
                    // Notify health machine of operation
                    if (meta.routedSend) {
                        try {
                            await meta.routedSend('../HealthMachine', 'OPERATION_COMPLETE', {
                                operation: 'save',
                                componentId: saved.id,
                                timestamp: Date.now()
                            });
                        } catch (error: any) {
                            console.warn('📝 EditorMachine: Could not notify HealthMachine:', error.message);
                        }
                    }
                    
                    return saved;
                },
                
                deleteComponentService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('📝 EditorMachine: Deleting component:', context.componentId);
                    
                    // Delete from storage
                    const deleted = await storageService.deleteComponent(context.componentId);
                    
                    if (!deleted) {
                        throw new Error(`Failed to delete component: ${context.componentId}`);
                    }
                    
                    // Notify preview to clear
                    if (meta.routedSend) {
                        await meta.routedSend('../PreviewMachine', 'CLEAR');
                    }
                    
                    return { success: true, id: context.componentId };
                },
                
                previewComponentService: async (context: any, event: any, meta: ServiceMeta) => {
                    console.log('📝 EditorMachine: Requesting preview:', context.currentComponent);
                    
                    // Send to preview machine using routed send
                    if (meta.routedSend) {
                        const response = await meta.routedSend('../PreviewMachine', 'RENDER_PREVIEW', {
                            component: context.currentComponent
                        });
                        console.log('📝 EditorMachine: Preview response:', response);
                        return response;
                    }
                    
                    throw new Error('Preview machine not available');
                }
            },
            actions: {
                createNewComponent: (context: any) => {
                    console.log('📝 EditorMachine: Creating new component');
                    context.currentComponent = {
                        id: `new-${Date.now()}`,
                        name: 'New Component',
                        type: 'generic',
                        content: '',
                        metadata: {
                            created: Date.now(),
                            modified: Date.now()
                        }
                    };
                    context.isDirty = true;
                },
                setComponent: (context: any, event: any) => {
                    console.log('📝 EditorMachine: Setting component:', event.data);
                    context.currentComponent = event.data;
                    context.componentId = event.data?.id;
                    context.isDirty = false;
                },
                setComponentList: (context: any, event: any) => {
                    console.log('📝 EditorMachine: Setting component list');
                    context.components = event.data?.components || [];
                },
                markDirty: (context: any) => {
                    console.log('📝 EditorMachine: Marking dirty');
                    context.isDirty = true;
                },
                markSaved: (context: any, event: any) => {
                    console.log('📝 EditorMachine: Marking saved');
                    context.currentComponent = event.data;
                    context.isDirty = false;
                    context.lastSaved = Date.now();
                },
                clearComponent: (context: any) => {
                    console.log('📝 EditorMachine: Clearing component');
                    context.currentComponent = null;
                    context.componentId = null;
                    context.isDirty = false;
                },
                setError: (context: any, event: any) => {
                    console.error('📝 EditorMachine: Error occurred:', event.data);
                    context.error = event.data;
                },
                resetEditor: (context: any) => {
                    console.log('📝 EditorMachine: Resetting editor');
                    context.currentComponent = null;
                    context.componentId = null;
                    context.isDirty = false;
                    context.error = null;
                }
            }
        }
    });
};

