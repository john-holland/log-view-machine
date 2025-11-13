import { createEditorMachine } from '../../editor/machines/editor-machine';
import { MachineRouter } from '../../core/TomeBase';
import { storageService } from '../../editor/services/storage-service';

describe('EditorMachine', () => {
    let router: MachineRouter;
    let editorMachine: any;

    beforeEach(async () => {
        // Clear storage before each test
        await storageService.clearAll();
        
        // Create a new router and machine
        router = new MachineRouter();
        editorMachine = createEditorMachine(router);
        
        // Register the machine
        router.register('EditorMachine', editorMachine);
        
        // Start the machine
        await editorMachine.start();
    });

    afterEach(async () => {
        // Stop the machine
        editorMachine.stop?.();
        
        // Clear storage
        await storageService.clearAll();
    });

    describe('Initialization', () => {
        it('should start in idle state', () => {
            const state = editorMachine.getState();
            expect(state?.value).toBe('idle');
        });

        it('should have empty initial context', () => {
            const state = editorMachine.getState();
            expect(state?.context.currentComponent).toBeNull();
            expect(state?.context.components).toEqual([]);
            expect(state?.context.isDirty).toBe(false);
            expect(state?.context.error).toBeNull();
        });
    });

    describe('CREATE_NEW event', () => {
        it('should transition to editing state when CREATE_NEW is sent', async () => {
            editorMachine.send('CREATE_NEW');
            
            // Wait for transition
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('editing');
        });

        it('should create a new component with default values', async () => {
            editorMachine.send('CREATE_NEW');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state = editorMachine.getState();
            const component = state?.context.currentComponent;
            
            expect(component).toBeDefined();
            expect(component.name).toBe('New Component');
            expect(component.type).toBe('generic');
            expect(component.content).toBe('');
            expect(component.id).toMatch(/^new-/);
        });

        it('should mark the editor as dirty after creating new component', async () => {
            editorMachine.send('CREATE_NEW');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state = editorMachine.getState();
            expect(state?.context.isDirty).toBe(true);
        });
    });

    describe('LOAD_COMPONENT event', () => {
        it('should transition to loading state when LOAD_COMPONENT is sent', () => {
            editorMachine.send('LOAD_COMPONENT', { componentId: 'test-1' });
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('loading');
        });

        it('should load an existing component from storage', async () => {
            // Create a test component in storage
            const testComponent = await storageService.createComponent('Test Component', 'test');
            
            // Load it
            editorMachine.send('LOAD_COMPONENT', { componentId: testComponent.id });
            
            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('editing');
            expect(state?.context.currentComponent.id).toBe(testComponent.id);
            expect(state?.context.currentComponent.name).toBe('Test Component');
        });

        it('should transition to error state if component not found', async () => {
            editorMachine.send('LOAD_COMPONENT', { componentId: 'non-existent' });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('error');
            expect(state?.context.error).toBeDefined();
        });
    });

    describe('SAVE event', () => {
        it('should save component to storage', async () => {
            // Create new component
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Save it
            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('editing');
            expect(state?.context.isDirty).toBe(false);
            expect(state?.context.lastSaved).toBeDefined();
        });

        it('should persist component data across sessions', async () => {
            // Create and save a component
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const state1 = editorMachine.getState();
            const componentId = state1?.context.currentComponent.id;
            
            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Create a new machine instance
            const newMachine = createEditorMachine(router);
            await newMachine.start();
            
            // Load the saved component
            newMachine.send('LOAD_COMPONENT', { componentId });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state2 = newMachine.getState();
            expect(state2?.context.currentComponent.id).toBe(componentId);
            
            // Cleanup
            newMachine.stop?.();
        });
    });

    describe('LIST_COMPONENTS event', () => {
        it('should list all components from storage', async () => {
            // Create some test components
            await storageService.createComponent('Component 1', 'type1');
            await storageService.createComponent('Component 2', 'type2');
            
            // List them
            editorMachine.send('LIST_COMPONENTS');
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = editorMachine.getState();
            expect(state?.context.components).toHaveLength(2);
        });

        it('should return to idle state after listing', async () => {
            editorMachine.send('LIST_COMPONENTS');
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('idle');
        });
    });

    describe('COMPONENT_CHANGE event', () => {
        it('should mark component as dirty when changed', async () => {
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Save first to clear dirty flag
            editorMachine.send('SAVE');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            expect(editorMachine.getState()?.context.isDirty).toBe(false);
            
            // Make a change
            editorMachine.send('COMPONENT_CHANGE');
            
            const state = editorMachine.getState();
            expect(state?.context.isDirty).toBe(true);
        });
    });

    describe('CANCEL event', () => {
        it('should return to idle state and clear component', async () => {
            editorMachine.send('CREATE_NEW');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            editorMachine.send('CANCEL');
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('idle');
            expect(state?.context.currentComponent).toBeNull();
            expect(state?.context.isDirty).toBe(false);
        });
    });

    describe('DELETE event', () => {
        it('should delete component from storage', async () => {
            // Create and save a component
            const component = await storageService.createComponent('To Delete', 'test');
            
            // Load it
            editorMachine.send('LOAD_COMPONENT', { componentId: component.id });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Delete it
            editorMachine.send('DELETE');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verify it's deleted
            const exists = await storageService.exists(component.id);
            expect(exists).toBe(false);
        });

        it('should return to idle state after deletion', async () => {
            const component = await storageService.createComponent('To Delete', 'test');
            
            editorMachine.send('LOAD_COMPONENT', { componentId: component.id });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            editorMachine.send('DELETE');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('idle');
        });
    });

    describe('Error handling', () => {
        it('should provide RETRY action from error state', async () => {
            // Trigger an error by loading non-existent component
            editorMachine.send('LOAD_COMPONENT', { componentId: 'non-existent' });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            expect(editorMachine.getState()?.value).toBe('error');
            
            // Create the component
            await storageService.saveComponent({
                id: 'non-existent',
                name: 'Now Exists',
                type: 'test',
                content: '',
                metadata: { created: Date.now(), modified: Date.now() }
            });
            
            // Retry
            editorMachine.send('RETRY');
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('editing');
        });

        it('should provide RESET action from error state', async () => {
            editorMachine.send('LOAD_COMPONENT', { componentId: 'non-existent' });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            editorMachine.send('RESET');
            
            const state = editorMachine.getState();
            expect(state?.value).toBe('idle');
            expect(state?.context.error).toBeNull();
        });
    });
});
