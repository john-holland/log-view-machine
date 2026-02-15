import type { ExtensionContextType, CaveMessagingTransport } from '../messaging/CaveMessagingTransport';

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
  docker?: { image?: string; composePath?: string };
  subdomains?: Record<string, unknown>;
  /** Optional: indicates this Cave can be replaced by a mod */
  isModableCave?: boolean;
  /** Optional: permission spec for this cave (e.g. ">anonymous", ">=user", "=anonymous"). Default ">anonymous". */
  permission?: string;
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

/** Optional security section (TLS, auth, network labels). Aligns with spec SecurityConfig. */
export interface SecurityConfig {
  transport?: {
    tls?: boolean;
    mtls?: boolean;
    certPath?: string;
    keyPath?: string;
    trustStore?: string;
  };
  authentication?: {
    type?: 'jwt' | 'api-key' | 'session';
    required?: boolean;
    issuer?: string;
    audience?: string;
  };
  authorization?: Record<string, string[]>;
  network?: {
    labels?: string[];
  };
  /** Optional: message token (CSRF-style) for cross-boundary Cave/Tome/VSM. Secret from env when secretEnv is set. */
  messageToken?: {
    secretEnv?: string;
    header?: string;
    ttlMs?: number;
  };
}

/** Optional extension context for Cave in browser extensions (content/background/popup). */
export interface CaveExtensionContext {
  contextType: ExtensionContextType;
  transport: CaveMessagingTransport;
}

export interface CaveConfig {
  name: string;
  spelunk: Spelunk;
  /** Optional: wan-os ROM build/registry */
  wanOsRomRegistry?: { enabled?: boolean; registryPath?: string };
  /** Optional: security (TLS, auth, network labels). Adapters apply as middleware. */
  security?: SecurityConfig;
  /** Optional: extension context and messaging transport (e.g. Chrome content/background/popup). */
  extensionContext?: CaveExtensionContext;
  /** Optional: called when tenant changes (e.g. from URL or tenant name provider); evented mod loader can subscribe. */
  onTenantChange?: (newTenant: string, previousTenant: string) => void;
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

function createChildCaves(spelunk: Spelunk): Record<string, CaveInstance> {
  const childCaves: Record<string, CaveInstance> = {};
  if (spelunk.childCaves) {
    for (const [key, childSpelunk] of Object.entries(spelunk.childCaves)) {
      childCaves[key] = Cave(key, childSpelunk);
    }
  }
  return childCaves;
}

export interface CaveOptions {
  extensionContext?: CaveExtensionContext;
}

/**
 * Cave factory: (name, caveDescent, options?) => CaveInstance.
 * Returns a Cave that is config-only until initialize() is called.
 */
export function Cave(name: string, caveDescent: Spelunk, options?: CaveOptions): CaveInstance {
  const config: CaveConfig = { name, spelunk: caveDescent, ...options };
  let isInitialized = false;
  const childCavesRef = createChildCaves(caveDescent);
  const viewKeyListeners: Array<(key: string) => void> = [];

  function getRenderKey(): string {
    return (caveDescent.renderKey as string) ?? name;
  }

  const instance: CaveInstance = {
    get name() {
      return name;
    },
    get isInitialized() {
      return isInitialized;
    },
    get childCaves() {
      return childCavesRef;
    },
    getConfig(): CaveConfig {
      return { ...config };
    },
    getRoutedConfig(path: string): Spelunk | CaveConfig {
      const trimmed = path.replace(/^\.\/?|\/$/g, '') || '.';
      if (trimmed === '.' || trimmed === '') {
        return config;
      }
      const parts = trimmed.split('/').filter(Boolean);
      let current: Spelunk = caveDescent;
      for (const part of parts) {
        const next = current.childCaves?.[part];
        if (!next) {
          return config;
        }
        current = next;
      }
      return current;
    },
    getRenderTarget(path: string): RenderTarget {
      const routed = instance.getRoutedConfig(path);
      const spelunk = 'spelunk' in routed ? (routed as CaveConfig).spelunk : (routed as Spelunk);
      return {
        route: spelunk.route,
        container: spelunk.container,
        tomes: spelunk.tomes,
        tomeId: spelunk.tomeId as string | undefined,
      };
    },
    getRenderKey,
    observeViewKey(callback: (key: string) => void): () => void {
      callback(getRenderKey());
      viewKeyListeners.push(callback);
      return () => {
        const i = viewKeyListeners.indexOf(callback);
        if (i !== -1) viewKeyListeners.splice(i, 1);
      };
    },
    async initialize(): Promise<CaveInstance> {
      if (isInitialized) {
        return instance;
      }
      // Load Tomes, set up routing, etc. Placeholder: just mark initialized.
      for (const child of Object.values(childCavesRef)) {
        await child.initialize();
      }
      isInitialized = true;
      return instance;
    },
  };

  return instance;
}

export function createCave(name: string, spelunk: Spelunk, options?: CaveOptions): CaveInstance {
  return Cave(name, spelunk, options);
}
