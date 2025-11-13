import { TomeBase } from '../../core/TomeBase';
/**
 * EditorTome
 *
 * Main orchestrator for the GenericEditor system
 * Coordinates editor, preview, template, and health machines
 * Uses routed send for inter-machine communication
 */
export declare class EditorTome extends TomeBase {
    private editorMachine;
    private previewMachine;
    private templateMachine;
    private healthMachine;
    private isInitialized;
    constructor();
    /**
     * Initialize the tome and all its machines
     */
    initialize(): Promise<void>;
    /**
     * Send an event to a specific machine
     */
    send(machineName: string, event: string, payload?: any): Promise<any>;
    /**
     * Get the current state of a machine
     */
    getMachineState(machineName: string): any;
    /**
     * Get the current context of a machine
     */
    getMachineContext(machineName: string): any;
    /**
     * Subscribe to machine state changes
     */
    subscribeMachine(machineName: string, callback: (state: any) => void): () => void;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export declare const editorTome: EditorTome;
