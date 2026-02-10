/**
 * Cave - Physical device/location description; contains Tomes; owns docker/warehousing.
 * Config-only until initialize() is called; isInitialized reflects whether the Cave has been initialized.
 * See docs/ARCHITECTURE_AND_CAVE.md.
 */
export type Spelunk = {
    childCaves?: Record<string, Spelunk>;
    tomes?: Record<string, unknown>;
    /** Optional: route path for this cave (e.g. '/tracing', '/connections'). */
    route?: string;
    /** Optional: container identifier (e.g. 'EditorWrapper', 'main'). */
    container?: string;
    /** Optional: stable key for React key / render slot; default uses cave name. */
    renderKey?: string;
    /** Optional: id of the Tome to render at this cave (for lookup in a Tome registry). */
    tomeId?: string;
    /** Optional: docker, subdomains, address records, wan-os ROM, etc. */
    docker?: {
        image?: string;
        composePath?: string;
    };
    subdomains?: Record<string, unknown>;
    [key: string]: unknown;
};
/** Return type of getRenderTarget(path): route, container, tomes, and optional tomeId for the routed spelunk. */
export interface RenderTarget {
    route?: string;
    container?: string;
    tomes?: Record<string, unknown>;
    /** Optional: id of the Tome to render (for lookup in a Tome registry). */
    tomeId?: string;
}
export interface CaveConfig {
    name: string;
    spelunk: Spelunk;
    /** Optional: wan-os ROM build/registry */
    wanOsRomRegistry?: {
        enabled?: boolean;
        registryPath?: string;
    };
}
export interface CaveInstance {
    readonly name: string;
    readonly isInitialized: boolean;
    getConfig(): CaveConfig;
    getRoutedConfig(path: string): Spelunk | CaveConfig;
    /** Returns route, container, and tomes for the given path from the routed spelunk. */
    getRenderTarget(path: string): RenderTarget;
    /** Returns a stable key for this Cave in the render tree (e.g. React key). */
    getRenderKey(): string;
    /** Subscribes to render-key updates; returns unsubscribe. Callback is invoked when the key may have changed. */
    observeViewKey(callback: (key: string) => void): () => void;
    get childCaves(): Record<string, CaveInstance>;
    initialize(): Promise<CaveInstance>;
    render?(): unknown;
}
/**
 * Cave factory: (name, caveDescent) => CaveInstance.
 * Returns a Cave that is config-only until initialize() is called.
 */
export declare function Cave(name: string, caveDescent: Spelunk): CaveInstance;
export declare function createCave(name: string, spelunk: Spelunk): CaveInstance;
