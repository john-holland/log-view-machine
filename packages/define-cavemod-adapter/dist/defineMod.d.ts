/**
 * define-cavemod-adapter: defineMod() - declarative mod definition.
 */
import type { ModConfig, DefineModOptions } from './schema.js';
/**
 * Define a mod declaratively. Accepts plain object and returns ModConfig with defaults.
 */
export declare function defineMod(options: DefineModOptions): ModConfig;
