import { MachineRouter as RouterType } from '../../core/TomeBase';
/**
 * EditorMachine
 *
 * Manages component editing lifecycle with CRUD operations
 * Uses invoke services for async operations and routed send for coordination
 */
export declare const createEditorMachine: (router?: RouterType) => import("../..").ViewStateMachine<any>;
