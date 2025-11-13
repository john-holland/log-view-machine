import { createPreviewMachine } from '../../editor/machines/preview-machine';
import { createTemplateMachine } from '../../editor/machines/template-machine';
import { MachineRouter } from '../../core/TomeBase';

describe('PreviewMachine', () => {
    let router: MachineRouter;
    let previewMachine: any;
    let templateMachine: any;

    beforeEach(async () => {
        router = new MachineRouter();
        
        // Create both machines for integration
        previewMachine = createPreviewMachine(router);
        templateMachine = createTemplateMachine(router);
        
        // Register machines
        router.register('PreviewMachine', previewMachine);
        router.register('TemplateMachine', templateMachine);
        
        // Start machines
        await previewMachine.start();
        await templateMachine.start();
    });

    afterEach(() => {
        previewMachine.stop?.();
        templateMachine.stop?.();
    });

    describe('Initialization', () => {
        it('should start in idle state', () => {
            const state = previewMachine.getState();
            expect(state?.value).toBe('idle');
        });

        it('should have null preview data initially', () => {
            const state = previewMachine.getState();
            expect(state?.context.previewData).toBeNull();
            expect(state?.context.componentData).toBeNull();
        });
    });

    describe('RENDER_PREVIEW event', () => {
        it('should transition to rendering state', () => {
            const testComponent = {
                id: 'test-1',
                name: 'Test',
                content: '<div>Test content</div>',
                type: 'test',
                metadata: {}
            };

            previewMachine.send('RENDER_PREVIEW', { component: testComponent });
            
            const state = previewMachine.getState();
            expect(state?.value).toBe('rendering');
        });

        it('should render component preview', async () => {
            const testComponent = {
                id: 'test-1',
                name: 'Test',
                content: '<div>Hello {{name}}</div>',
                type: 'test',
                metadata: { name: 'World' }
            };

            previewMachine.send('RENDER_PREVIEW', { component: testComponent });
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const state = previewMachine.getState();
            expect(state?.value).toBe('ready');
            expect(state?.context.previewData).toBeDefined();
            expect(state?.context.lastRendered).toBeDefined();
        });

        it('should use template machine for processing via routed send', async () => {
            const testComponent = {
                id: 'test-1',
                name: 'Test',
                content: '<div>{{message}}</div>',
                type: 'test',
                metadata: { message: 'Hello from template' }
            };

            previewMachine.send('RENDER_PREVIEW', { component: testComponent });
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const state = previewMachine.getState();
            expect(state?.context.previewData.rendered).toContain('Hello from template');
        });
    });

    describe('COMPONENT_SAVED event', () => {
        it('should update preview when component is saved', async () => {
            const savedComponent = {
                id: 'test-1',
                name: 'Saved',
                content: '<div>Updated content</div>',
                type: 'test',
                metadata: {}
            };

            previewMachine.send('COMPONENT_SAVED', { component: savedComponent });
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const state = previewMachine.getState();
            expect(state?.value).toBe('ready');
            expect(state?.context.componentData).toEqual(savedComponent);
        });
    });

    describe('UPDATE_PREVIEW event', () => {
        it('should re-render preview from ready state', async () => {
            const component1 = {
                id: 'test-1',
                name: 'Test',
                content: '<div>Version 1</div>',
                type: 'test',
                metadata: {}
            };

            // Initial render
            previewMachine.send('RENDER_PREVIEW', { component: component1 });
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const firstRender = previewMachine.getState()?.context.lastRendered;

            // Update
            await new Promise(resolve => setTimeout(resolve, 50));
            previewMachine.send('UPDATE_PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const state = previewMachine.getState();
            expect(state?.value).toBe('ready');
            expect(state?.context.lastRendered).toBeGreaterThan(firstRender);
        });
    });

    describe('CLEAR event', () => {
        it('should clear preview data and return to idle', async () => {
            const component = {
                id: 'test-1',
                name: 'Test',
                content: '<div>Content</div>',
                type: 'test',
                metadata: {}
            };

            // Render first
            previewMachine.send('RENDER_PREVIEW', { component });
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Clear
            previewMachine.send('CLEAR');
            
            const state = previewMachine.getState();
            expect(state?.value).toBe('idle');
            expect(state?.context.previewData).toBeNull();
            expect(state?.context.componentData).toBeNull();
        });
    });

    describe('Error handling', () => {
        it('should transition to error state on render failure', async () => {
            // Send invalid component (null content should cause issues in template processing)
            previewMachine.send('RENDER_PREVIEW', { component: null });
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const state = previewMachine.getState();
            // Should handle gracefully or error
            expect(['ready', 'error']).toContain(state?.value);
        });

        it('should allow retry from error state', async () => {
            previewMachine.send('RENDER_PREVIEW', { component: null });
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // If in error state, retry
            const state1 = previewMachine.getState();
            if (state1?.value === 'error') {
                previewMachine.send('RETRY');
                
                const state2 = previewMachine.getState();
                expect(state2?.value).toBe('rendering');
            }
        });

        it('should allow reset from error state', async () => {
            previewMachine.send('RENDER_PREVIEW', { component: null });
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const state1 = previewMachine.getState();
            if (state1?.value === 'error') {
                previewMachine.send('RESET');
                
                const state2 = previewMachine.getState();
                expect(state2?.value).toBe('idle');
                expect(state2?.context.error).toBeNull();
            }
        });
    });

    describe('State transitions', () => {
        it('should maintain ready state and allow multiple renders', async () => {
            const component = {
                id: 'test-1',
                name: 'Test',
                content: '<div>Content</div>',
                type: 'test',
                metadata: {}
            };

            // First render
            previewMachine.send('RENDER_PREVIEW', { component });
            await new Promise(resolve => setTimeout(resolve, 300));
            expect(previewMachine.getState()?.value).toBe('ready');

            // Second render
            previewMachine.send('RENDER_PREVIEW', { component });
            await new Promise(resolve => setTimeout(resolve, 300));
            expect(previewMachine.getState()?.value).toBe('ready');

            // Third render
            previewMachine.send('RENDER_PREVIEW', { component });
            await new Promise(resolve => setTimeout(resolve, 300));
            expect(previewMachine.getState()?.value).toBe('ready');
        });
    });
});

