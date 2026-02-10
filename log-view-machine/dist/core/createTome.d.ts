/**
 * createTome - Browser-safe Tome factory (no Express).
 * Builds ViewStateMachines from TomeConfig and returns a TomeInstance.
 * Use TomeManager when you have Express and need routing.
 */
import { TomeConfig, TomeInstance } from './TomeConfig';
/**
 * Create a TomeInstance from config without Express or routing.
 * Same machine-building logic as TomeManager.registerTome; use for browser or non-Express environments.
 */
export declare function createTome(config: TomeConfig): TomeInstance;
