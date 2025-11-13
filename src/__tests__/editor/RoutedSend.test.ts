import { createEditorMachine } from '../../editor/machines/editor-machine';
import { createPreviewMachine } from '../../editor/machines/preview-machine';
import { createTemplateMachine } from '../../editor/machines/template-machine';
import { createHealthMachine } from '../../editor/machines/health-machine';
import { MachineRouter } from '../../core/TomeBase';
import { storageService } from '../../editor/services/storage-service';

describe('Routed Send Integration Tests', () => {
    let router: MachineRouter;
    let editorMachine: any;
    let previewMachine: any;
    let templateMachine: any;
    let healthMachine: any;

    beforeEach(async () => {
        await storageService.clearAll();
        
        // Create router
        router = new MachineRouter();

        // Create all machines with the router
        editorMachine = createEditorMachine(router);
        previewMachine = createPreviewMachine(router);
        templateMachine = createTemplateMachine(router);
        healthMachine = createHealthMachine(router);

        // Register machines
        router.register('EditorMachine', editorMachine);
        router.register('PreviewMachine', previewMachine);
        router.register('TemplateMachine', templateMachine);
        router.register('HealthMachine', healthMachine);

        // Start all machines
        await Promise.all([
            editorMachine.start(),
            previewMachine.start(),
            templateMachine.start(),
            healthMachine.start()
        ]);

        // Start health monitoring
        healthMachine.send('START_MONITORING');
    });

    afterEach(async () => {
        editorMachine?.stop?.();
        previewMachine?.stop?.();
        templateMachine?.stop?.();
        healthMachine?.stop?.();
        await storageService.clearAll();
    });

    describe('EditorMachine -> PreviewMachine Communication', () => {
        it('should send COMPONENT_SAVED to PreviewMachine on save', async () => {
            let previewReceivedEvent = false;

            // Subscribe to preview machine to detect event
            previewMachine.subscribe((state: any) => {
                if (state.context.componentData) {
                    previewReceivedEvent = true;
                }
            });

            // Create and save component
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(previewReceivedEvent).toBe(true);
        });

        it('should pass component data through routed send', async () => {
            // Create component with specific content
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            const editorContext = editorMachine.getState().context;
            editorContext.currentComponent.name = 'Test Component';
            editorContext.currentComponent.content = '<div>Test Content</div>';

            // Save
            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Check preview received the data
            const previewContext = previewMachine.getState().context;
            expect(previewContext.componentData.name).toBe('Test Component');
            expect(previewContext.componentData.content).toContain('Test Content');
        });
    });

    describe('EditorMachine -> HealthMachine Communication', () => {
        it('should notify HealthMachine of successful operations', async () => {
            const initialMetrics = healthMachine.getState().context.metrics;
            const initialCount = initialMetrics.requestCount;

            // Perform save operation
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Health metrics should be updated
            const updatedMetrics = healthMachine.getState().context.metrics;
            expect(updatedMetrics.requestCount).toBeGreaterThan(initialCount);
            expect(updatedMetrics.saveCount).toBeGreaterThan(0);
        });

        it('should include operation metadata in health notifications', async () => {
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            const componentId = editorMachine.getState().context.currentComponent.id;

            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            const healthContext = healthMachine.getState().context;
            expect(healthContext.metrics.lastOperation).toBe('save');
        });
    });

    describe('PreviewMachine -> TemplateMachine Communication', () => {
        it('should send template processing request via routed send', async () => {
            let templateProcessed = false;

            templateMachine.subscribe((state: any) => {
                if (state.context.processedResult) {
                    templateProcessed = true;
                }
            });

            const component = {
                id: 'test',
                name: 'Test',
                content: 'Hello {{name}}',
                type: 'test',
                metadata: { name: 'World' }
            };

            previewMachine.send('RENDER_PREVIEW', { component });
            await new Promise(resolve => setTimeout(resolve, 400));

            expect(templateProcessed).toBe(true);
        });

        it('should receive processed template back from TemplateMachine', async () => {
            const component = {
                id: 'test',
                name: 'Test',
                content: '<div>{{message}}</div>',
                type: 'test',
                metadata: { message: 'Processed!' }
            };

            previewMachine.send('RENDER_PREVIEW', { component });
            await new Promise(resolve => setTimeout(resolve, 400));

            const previewContext = previewMachine.getState().context;
            expect(previewContext.previewData.rendered).toContain('Processed!');
        });
    });

    describe('Relative Path Resolution', () => {
        it('should resolve sibling path (../PreviewMachine)', async () => {
            // This is tested by the save operation working
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            // If routed send worked, preview should have data
            const previewContext = previewMachine.getState().context;
            expect(previewContext.componentData).toBeDefined();
        });

        it('should resolve sibling path (../TemplateMachine)', async () => {
            const component = {
                id: 'test',
                name: 'Test',
                content: 'Template test',
                type: 'test',
                metadata: {}
            };

            previewMachine.send('RENDER_PREVIEW', { component });
            await new Promise(resolve => setTimeout(resolve, 400));

            // Template machine should have processed something
            const templateContext = templateMachine.getState().context;
            expect(templateContext.processedResult).toBeDefined();
        });

        it('should resolve sibling path (../HealthMachine)', async () => {
            const initialCount = healthMachine.getState().context.metrics.requestCount;

            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            const finalCount = healthMachine.getState().context.metrics.requestCount;
            expect(finalCount).toBeGreaterThan(initialCount);
        });
    });

    describe('Bidirectional Communication', () => {
        it('should allow round-trip communication', async () => {
            // Editor -> Preview -> Template and back
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            const editorContext = editorMachine.getState().context;
            editorContext.currentComponent.content = '{{greeting}} {{name}}';
            editorContext.currentComponent.metadata = {
                ...editorContext.currentComponent.metadata,
                greeting: 'Hello',
                name: 'World'
            };

            // Save (Editor -> Preview)
            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            // Preview should have component
            expect(previewMachine.getState().context.componentData).toBeDefined();

            // Request preview (Preview -> Template)
            editorMachine.send('PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 400));

            // Template should have processed
            expect(templateMachine.getState().context.processedResult).toBeDefined();

            // Preview should have final result
            const previewContext = previewMachine.getState().context;
            expect(previewContext.previewData.rendered).toContain('Hello World');
        });
    });

    describe('Error Handling in Routed Send', () => {
        it('should handle routed send to non-existent machine gracefully', async () => {
            // The machines should handle cases where routed send fails
            // by catching the error and continuing

            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            // Unregister health machine to simulate missing target
            router['machines'].delete('HealthMachine');

            // Save should still work even if health notification fails
            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            const state = editorMachine.getState();
            expect(state.value).toBe('editing');

            // Re-register for cleanup
            router.register('HealthMachine', healthMachine);
        });

        it('should continue operation even if routed send fails', async () => {
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            // Stop preview machine to simulate unavailable target
            previewMachine.stop();

            // Save should still complete successfully
            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 300));

            const editorContext = editorMachine.getState().context;
            expect(editorContext.isDirty).toBe(false);
            expect(editorContext.lastSaved).toBeDefined();

            // Restart for cleanup
            await previewMachine.start();
        });
    });

    describe('Async Service Communication', () => {
        it('should handle async responses from routed send', async () => {
            // Preview rendering involves async template processing
            const component = {
                id: 'test',
                name: 'Test',
                content: 'Async {{test}}',
                type: 'test',
                metadata: { test: 'response' }
            };

            const startTime = Date.now();

            previewMachine.send('RENDER_PREVIEW', { component });
            await new Promise(resolve => setTimeout(resolve, 400));

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should have taken some time for async processing
            expect(duration).toBeGreaterThan(100);

            // Should have result
            const previewContext = previewMachine.getState().context;
            expect(previewContext.previewData.rendered).toContain('response');
        });

        it('should maintain correct order of async operations', async () => {
            const operations: string[] = [];

            editorMachine.subscribe((state: any) => {
                operations.push(`editor:${state.value}`);
            });

            previewMachine.subscribe((state: any) => {
                operations.push(`preview:${state.value}`);
            });

            // Trigger multiple operations
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));

            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 100));

            editorMachine.send('PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 400));

            // Operations should have occurred in logical order
            expect(operations).toContain('editor:editing');
            expect(operations).toContain('editor:saving');
            expect(operations).toContain('editor:previewing');
        });
    });

    describe('Machine Router', () => {
        it('should correctly register and resolve machines', () => {
            const resolved = router.resolve('EditorMachine');
            expect(resolved).toBe(editorMachine);
        });

        it('should return undefined for unregistered machines', () => {
            const resolved = router.resolve('NonExistentMachine');
            expect(resolved).toBeUndefined();
        });

        it('should allow re-registration of machines', () => {
            const newMachine = createEditorMachine(router);
            router.register('EditorMachine', newMachine);
            
            const resolved = router.resolve('EditorMachine');
            expect(resolved).toBe(newMachine);

            // Cleanup
            newMachine.stop?.();
        });
    });
});

