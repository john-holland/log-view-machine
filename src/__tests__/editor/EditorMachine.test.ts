import { createEditorMachine } from '../../editor/machines/editor-machine';
import { MachineRouter } from '../../core/TomeBase';

describe('EditorMachine', () => {
    let machine: any;
    let router: MachineRouter;

    beforeEach(() => {
        router = new MachineRouter();
        machine = createEditorMachine(router);
    });

    afterEach(() => {
        if (machine) {
            machine.stop?.();
        }
    });

    it('should create editor machine with initial state', () => {
        expect(machine).toBeDefined();
        expect(machine.machineId).toBe('editor-machine');
    });

    it('should start in idle state', async () => {
        await machine.start();
        const state = machine.getState();
        expect(state.value).toBe('idle');
    });

    it('should transition to loading when LOAD_COMPONENT sent', async () => {
        await machine.start();
        
        machine.send('LOAD_COMPONENT', { componentId: '123' });
        
        // Give it a moment to transition
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const state = machine.getState();
        // Will be in loading or editing (after service completes)
        expect(['loading', 'editing']).toContain(state.value);
    });

    it('should transition to editing when CREATE_NEW sent', async () => {
        await machine.start();
        
        machine.send('CREATE_NEW');
        
        const state = machine.getState();
        expect(state.value).toBe('editing');
    });

    it('should mark component as dirty when COMPONENT_CHANGE sent', async () => {
        await machine.start();
        
        // Create new component
        machine.send('CREATE_NEW');
        
        // Change component
        machine.send('COMPONENT_CHANGE');
        
        const state = machine.getState();
        expect(state.context.isDirty).toBe(true);
    });

    it('should have router available for services', () => {
        expect(machine.router).toBeDefined();
        expect(machine.router).toBe(router);
    });

    it('should reset to idle on CANCEL from editing', async () => {
        await machine.start();
        
        // Enter editing state
        machine.send('CREATE_NEW');
        expect(machine.getState().value).toBe('editing');
        
        // Cancel
        machine.send('CANCEL');
        
        const state = machine.getState();
        expect(state.value).toBe('idle');
    });

    it('should clear component on cancel', async () => {
        await machine.start();
        
        // Create new component
        machine.send('CREATE_NEW');
        let state = machine.getState();
        expect(state.context.currentComponent).toBeTruthy();
        
        // Cancel
        machine.send('CANCEL');
        state = machine.getState();
        expect(state.context.currentComponent).toBeNull();
    });
});

