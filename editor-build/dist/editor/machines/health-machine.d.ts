import { MachineRouter } from '../../core/TomeBase';
/**
 * HealthMachine
 *
 * Monitors editor system health and performance metrics
 * Tracks operations and provides health status
 */
export declare const createHealthMachine: (router?: MachineRouter) => import("../..").ViewStateMachine<any>;
