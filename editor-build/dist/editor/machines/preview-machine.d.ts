import { MachineRouter } from '../../core/TomeBase';
/**
 * PreviewMachine
 *
 * Manages real-time component preview rendering
 * Coordinates with EditorMachine and TemplateMachine via routed send
 */
export declare const createPreviewMachine: (router?: MachineRouter) => import("../..").ViewStateMachine<any>;
