import { TomeBase } from '../../core/TomeBase';
import { createEditorMachine } from '../machines/editor-machine';
import { createPreviewMachine } from '../machines/preview-machine';
import { createTemplateMachine } from '../machines/template-machine';
import { createHealthMachine } from '../machines/health-machine';

/**
 * EditorTome
 * 
 * Main orchestrator for the GenericEditor system
 * Coordinates editor, preview, template, and health machines
 * Uses routed send for inter-machine communication
 */
export class EditorTome extends TomeBase {
    private editorMachine: any;
    private previewMachine: any;
    private templateMachine: any;
    private healthMachine: any;
    private isInitialized: boolean = false;

    constructor() {
        super();
        this.currentViewKey = 'loading';
    }

    /**
     * Initialize the tome and all its machines
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.warn('📚 EditorTome: Already initialized');
            return;
        }

        console.log('📚 EditorTome: Initializing editor system...');

        try {
            // Create all machines with router
            this.editorMachine = createEditorMachine(this.router);
            this.previewMachine = createPreviewMachine(this.router);
            this.templateMachine = createTemplateMachine(this.router);
            this.healthMachine = createHealthMachine(this.router);

            // Register machines with router
            this.router.register('EditorMachine', this.editorMachine);
            this.router.register('PreviewMachine', this.previewMachine);
            this.router.register('TemplateMachine', this.templateMachine);
            this.router.register('HealthMachine', this.healthMachine);

            // Set up parent-child relationships for relative routing
            this.editorMachine.parentMachine = this;
            this.previewMachine.parentMachine = this;
            this.templateMachine.parentMachine = this;
            this.healthMachine.parentMachine = this;

            // Start all machines
            await Promise.all([
                this.editorMachine.start(),
                this.previewMachine.start(),
                this.templateMachine.start(),
                this.healthMachine.start()
            ]);

            // Initialize health monitoring
            this.healthMachine.send('START_MONITORING');

            this.isInitialized = true;
            this.updateViewKey('initialized');

            console.log('📚 EditorTome: Initialization complete');
        } catch (error) {
            console.error('📚 EditorTome: Initialization failed', error);
            this.updateViewKey('error');
            throw error;
        }
    }

    /**
     * Send an event to a specific machine
     */
    async send(machineName: string, event: string, payload?: any): Promise<any> {
        const machine = this.router.resolve(machineName);
        if (!machine) {
            throw new Error(`Machine ${machineName} not found`);
        }

        return new Promise((resolve, reject) => {
            try {
                machine.send({ type: event, ...payload });
                
                // For now, resolve immediately
                // TODO: Implement proper promise-based event handling
                resolve({ success: true, machine: machineName, event });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get the current state of a machine
     */
    getMachineState(machineName: string): any {
        const machine = this.router.resolve(machineName);
        if (!machine) {
            return null;
        }
        return machine.getState?.() || null;
    }

    /**
     * Get the current context of a machine
     */
    getMachineContext(machineName: string): any {
        const machine = this.router.resolve(machineName);
        if (!machine) {
            return null;
        }
        const state = machine.getState?.();
        return state?.context || null;
    }

    /**
     * Subscribe to machine state changes
     */
    subscribeMachine(machineName: string, callback: (state: any) => void): () => void {
        const machine = this.router.resolve(machineName);
        if (!machine || !machine.subscribe) {
            console.warn(`📚 EditorTome: Cannot subscribe to ${machineName} - machine not found or no subscribe method`);
            return () => {};
        }

        return machine.subscribe(callback);
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        console.log('📚 EditorTome: Cleaning up...');

        if (this.editorMachine) {
            this.editorMachine.stop?.();
        }
        if (this.previewMachine) {
            this.previewMachine.stop?.();
        }
        if (this.templateMachine) {
            this.templateMachine.stop?.();
        }
        if (this.healthMachine) {
            this.healthMachine.stop?.();
        }

        super.cleanup();
        this.isInitialized = false;
    }
}

// Export singleton instance for convenience
export const editorTome = new EditorTome();

