import { EditorTome } from '../../editor/tomes/EditorTome';
import { storageService } from '../../editor/services/storage-service';

describe('EditorTome Integration Tests', () => {
    let editorTome: EditorTome;

    beforeEach(async () => {
        // Clear storage
        await storageService.clearAll();
        
        // Create new tome instance
        editorTome = new EditorTome();
        await editorTome.initialize();
    });

    afterEach(() => {
        editorTome?.cleanup();
    });

    describe('Tome Initialization', () => {
        it('should initialize all machines', async () => {
            const editorState = editorTome.getMachineState('EditorMachine');
            const previewState = editorTome.getMachineState('PreviewMachine');
            const templateState = editorTome.getMachineState('TemplateMachine');
            const healthState = editorTome.getMachineState('HealthMachine');

            expect(editorState).toBeDefined();
            expect(previewState).toBeDefined();
            expect(templateState).toBeDefined();
            expect(healthState).toBeDefined();
        });

        it('should register all machines with router', async () => {
            const editor = editorTome['router'].resolve('EditorMachine');
            const preview = editorTome['router'].resolve('PreviewMachine');
            const template = editorTome['router'].resolve('TemplateMachine');
            const health = editorTome['router'].resolve('HealthMachine');

            expect(editor).toBeDefined();
            expect(preview).toBeDefined();
            expect(template).toBeDefined();
            expect(health).toBeDefined();
        });

        it('should start health monitoring automatically', () => {
            const healthState = editorTome.getMachineState('HealthMachine');
            expect(healthState?.value).toBe('monitoring');
        });
    });

    describe('End-to-End Component Workflow', () => {
        it('should create, save, load, and preview a component', async () => {
            // 1. Create new component
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            let editorContext = editorTome.getMachineContext('EditorMachine');
            expect(editorContext.currentComponent).toBeDefined();
            expect(editorContext.isDirty).toBe(true);
            
            const componentId = editorContext.currentComponent.id;

            // 2. Update component content
            editorContext.currentComponent.content = '<div>Test Component {{version}}</div>';
            editorContext.currentComponent.metadata.version = '1.0';

            // 3. Save component
            await editorTome.send('EditorMachine', 'SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            editorContext = editorTome.getMachineContext('EditorMachine');
            expect(editorContext.isDirty).toBe(false);
            expect(editorContext.lastSaved).toBeDefined();

            // 4. Cancel to clear current component
            await editorTome.send('EditorMachine', 'CANCEL');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            editorContext = editorTome.getMachineContext('EditorMachine');
            expect(editorContext.currentComponent).toBeNull();

            // 5. Load saved component
            await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            editorContext = editorTome.getMachineContext('EditorMachine');
            expect(editorContext.currentComponent.id).toBe(componentId);
            expect(editorContext.currentComponent.content).toContain('Test Component');

            // 6. Preview component
            await editorTome.send('EditorMachine', 'PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const previewContext = editorTome.getMachineContext('PreviewMachine');
            expect(previewContext.previewData).toBeDefined();
            expect(previewContext.previewData.rendered).toContain('Test Component 1.0');
        });

        it('should list all components', async () => {
            // Create multiple components
            await storageService.createComponent('Component 1', 'type1');
            await storageService.createComponent('Component 2', 'type2');
            await storageService.createComponent('Component 3', 'type3');

            // List components
            await editorTome.send('EditorMachine', 'LIST_COMPONENTS');
            await new Promise(resolve => setTimeout(resolve, 200));

            const context = editorTome.getMachineContext('EditorMachine');
            expect(context.components).toHaveLength(3);
        });

        it('should delete a component', async () => {
            // Create and save component
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const context1 = editorTome.getMachineContext('EditorMachine');
            const componentId = context1.currentComponent.id;

            await editorTome.send('EditorMachine', 'SAVE');
            await new Promise(resolve => setTimeout(resolve, 200));

            // Delete it
            await editorTome.send('EditorMachine', 'DELETE');
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify deletion
            const exists = await storageService.exists(componentId);
            expect(exists).toBe(false);

            // Verify preview was cleared
            const previewContext = editorTome.getMachineContext('PreviewMachine');
            expect(previewContext.previewData).toBeNull();
        });
    });

    describe('Machine Communication via Routed Send', () => {
        it('should notify PreviewMachine when EditorMachine saves', async () => {
            // Create component
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            // Update content
            const editorContext = editorTome.getMachineContext('EditorMachine');
            editorContext.currentComponent.content = '<div>Updated</div>';

            // Save - should trigger routed send to PreviewMachine
            await editorTome.send('EditorMachine', 'SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Preview should have been updated
            const previewContext = editorTome.getMachineContext('PreviewMachine');
            expect(previewContext.componentData).toBeDefined();
            expect(previewContext.componentData.content).toContain('Updated');
        });

        it('should notify HealthMachine of successful operations', async () => {
            // Create and save component
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await editorTome.send('EditorMachine', 'SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Health machine should have recorded the operation
            const healthContext = editorTome.getMachineContext('HealthMachine');
            expect(healthContext.metrics.requestCount).toBeGreaterThan(0);
            expect(healthContext.metrics.saveCount).toBeGreaterThan(0);
        });

        it('should use TemplateMachine for preview rendering', async () => {
            // Create component with template variables
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            const editorContext = editorTome.getMachineContext('EditorMachine');
            editorContext.currentComponent.content = '<h1>{{title}}</h1><p>{{description}}</p>';
            editorContext.currentComponent.metadata = {
                ...editorContext.currentComponent.metadata,
                title: 'Test Title',
                description: 'Test Description'
            };

            // Save and preview
            await editorTome.send('EditorMachine', 'SAVE');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            await editorTome.send('EditorMachine', 'PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 400));

            // Check that template was processed
            const previewContext = editorTome.getMachineContext('PreviewMachine');
            const rendered = previewContext.previewData?.rendered;
            
            expect(rendered).toContain('Test Title');
            expect(rendered).toContain('Test Description');
        });
    });

    describe('Relative Path Routing', () => {
        it('should resolve sibling machines using relative paths', async () => {
            const editorMachine = editorTome['editorMachine'];
            const previewMachine = editorTome['previewMachine'];
            
            // Both machines should have the same parent (EditorTome)
            expect(editorMachine.parentMachine).toBe(editorTome);
            expect(previewMachine.parentMachine).toBe(editorTome);
        });

        it('should route from EditorMachine to PreviewMachine', async () => {
            // Create and save component to trigger routed send
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await editorTome.send('EditorMachine', 'SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            // PreviewMachine should have received the COMPONENT_SAVED event
            const previewState = editorTome.getMachineState('PreviewMachine');
            const previewContext = editorTome.getMachineContext('PreviewMachine');
            
            expect(previewContext.componentData).toBeDefined();
        });

        it('should route from PreviewMachine to TemplateMachine', async () => {
            // Create component
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            const editorContext = editorTome.getMachineContext('EditorMachine');
            editorContext.currentComponent.content = 'Template {{test}}';
            editorContext.currentComponent.metadata.test = 'value';

            // Trigger preview which should use TemplateMachine
            await editorTome.send('EditorMachine', 'PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 400));

            // Template should have been processed
            const templateContext = editorTome.getMachineContext('TemplateMachine');
            expect(templateContext.processedResult).toBeDefined();
        });
    });

    describe('State Coordination', () => {
        it('should coordinate states across multiple machines', async () => {
            // Create component - EditorMachine should be in editing state
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(editorTome.getMachineState('EditorMachine')?.value).toBe('editing');
            expect(editorTome.getMachineState('PreviewMachine')?.value).toBe('idle');

            // Preview - PreviewMachine should be rendering
            editorTome.send('EditorMachine', 'PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // During preview, PreviewMachine should be active
            const previewState = editorTome.getMachineState('PreviewMachine');
            expect(['rendering', 'ready']).toContain(previewState?.value);
        });

        it('should maintain health monitoring throughout operations', async () => {
            const healthState1 = editorTome.getMachineState('HealthMachine');
            expect(healthState1?.value).toBe('monitoring');

            // Perform multiple operations
            await editorTome.send('EditorMachine', 'CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await editorTome.send('EditorMachine', 'SAVE');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            await editorTome.send('EditorMachine', 'PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Health should still be monitoring
            const healthState2 = editorTome.getMachineState('HealthMachine');
            expect(healthState2?.value).toBe('monitoring');
        });
    });

    describe('Error Propagation', () => {
        it('should handle errors in component loading gracefully', async () => {
            // Try to load non-existent component
            await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: 'fake-id' });
            await new Promise(resolve => setTimeout(resolve, 200));

            const editorState = editorTome.getMachineState('EditorMachine');
            expect(editorState?.value).toBe('error');
        });

        it('should allow recovery from error state', async () => {
            // Cause error
            await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: 'fake-id' });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            expect(editorTome.getMachineState('EditorMachine')?.value).toBe('error');

            // Reset
            await editorTome.send('EditorMachine', 'RESET');
            
            const state = editorTome.getMachineState('EditorMachine');
            expect(state?.value).toBe('idle');
        });
    });

    describe('Machine Subscriptions', () => {
        it('should allow subscribing to machine state changes', (done) => {
            const states: string[] = [];

            const unsubscribe = editorTome.subscribeMachine('EditorMachine', (state) => {
                states.push(state.value);
                
                // Once we see 'editing', check and cleanup
                if (state.value === 'editing') {
                    expect(states).toContain('idle');
                    expect(states).toContain('editing');
                    unsubscribe();
                    done();
                }
            });

            // Trigger state change
            editorTome.send('EditorMachine', 'CREATE_NEW');
        });

        it('should handle multiple subscribers', (done) => {
            let subscriber1Called = false;
            let subscriber2Called = false;

            const checkDone = () => {
                if (subscriber1Called && subscriber2Called) {
                    unsub1();
                    unsub2();
                    done();
                }
            };

            const unsub1 = editorTome.subscribeMachine('EditorMachine', (state) => {
                if (state.value === 'editing') {
                    subscriber1Called = true;
                    checkDone();
                }
            });

            const unsub2 = editorTome.subscribeMachine('EditorMachine', (state) => {
                if (state.value === 'editing') {
                    subscriber2Called = true;
                    checkDone();
                }
            });

            editorTome.send('EditorMachine', 'CREATE_NEW');
        });
    });

    describe('Cleanup', () => {
        it('should cleanup all machines properly', () => {
            const tome = new EditorTome();
            
            tome.initialize().then(() => {
                expect(tome['isInitialized']).toBe(true);
                
                tome.cleanup();
                
                expect(tome['isInitialized']).toBe(false);
            });
        });
    });
});

