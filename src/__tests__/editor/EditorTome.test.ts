import { EditorTome } from '../../editor/tomes/EditorTome';

describe('EditorTome', () => {
    let editorTome: EditorTome;

    beforeEach(() => {
        editorTome = new EditorTome();
    });

    afterEach(() => {
        if (editorTome) {
            editorTome.cleanup();
        }
    });

    it('should create EditorTome instance', () => {
        expect(editorTome).toBeDefined();
        expect(editorTome.router).toBeDefined();
    });

    it('should initialize all machines', async () => {
        await editorTome.initialize();
        
        // Check that machines are registered
        expect(editorTome.router.resolve('EditorMachine')).toBeDefined();
        expect(editorTome.router.resolve('PreviewMachine')).toBeDefined();
        expect(editorTome.router.resolve('TemplateMachine')).toBeDefined();
        expect(editorTome.router.resolve('HealthMachine')).toBeDefined();
    });

    it('should not initialize twice', async () => {
        await editorTome.initialize();
        
        // Try to initialize again
        const consoleSpy = jest.spyOn(console, 'warn');
        await editorTome.initialize();
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Already initialized'));
        consoleSpy.mockRestore();
    });

    it('should send events to machines', async () => {
        await editorTome.initialize();
        
        const result = await editorTome.send('EditorMachine', 'CREATE_NEW');
        
        expect(result.success).toBe(true);
        expect(result.machine).toBe('EditorMachine');
    });

    it('should get machine state', async () => {
        await editorTome.initialize();
        
        const state = editorTome.getMachineState('EditorMachine');
        
        expect(state).toBeDefined();
        expect(state.value).toBeDefined();
    });

    it('should get machine context', async () => {
        await editorTome.initialize();
        
        const context = editorTome.getMachineContext('EditorMachine');
        
        expect(context).toBeDefined();
        expect(context).toHaveProperty('currentComponent');
        expect(context).toHaveProperty('isDirty');
    });

    it('should handle missing machine gracefully', async () => {
        await editorTome.initialize();
        
        await expect(
            editorTome.send('NonExistentMachine', 'EVENT')
        ).rejects.toThrow('Machine NonExistentMachine not found');
    });

    it('should cleanup all machines', async () => {
        await editorTome.initialize();
        
        // Spy on console.log to verify cleanup was called
        const consoleSpy = jest.spyOn(console, 'log');
        
        editorTome.cleanup();
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cleaning up'));
        consoleSpy.mockRestore();
    });
});

