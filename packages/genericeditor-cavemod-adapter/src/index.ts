/**
 * Generic Editor Cave Mod Adapter
 * Replaces Caves and Tomes via path entry points based on modMetadata configuration
 */

import type {
  CaveServerAdapter,
  CaveServerContext,
  NormalizedRequest,
  NormalizedResponse,
  NormalizedRequestHandler,
} from 'log-view-machine';

/** Mod metadata shape (aligned with TomeConfig.modMetadata in log-view-machine) */
export interface ModMetadata {
  pathReplacements?: Record<string, {
    modCaveId?: string;
    modTomeId?: string;
    spelunk?: Record<string, unknown>;
  }>;
  assetLinks?: {
    templates?: string;
    styles?: string;
    scripts?: string;
    serverUrl?: string;
  };
  spelunkMap?: Record<string, {
    route?: string;
    modCaveId?: string;
    modTomeId?: string;
    spelunk?: Record<string, unknown>;
  }>;
}

/** TomeConfig with optional mod fields (runtime shape from log-view-machine) */
interface TomeConfigWithMod {
  id: string;
  routing?: { basePath?: string };
  isModableTome?: boolean;
  modMetadata?: ModMetadata;
  [key: string]: unknown;
}

export interface GenericEditorCaveModAdapterOptions {
  /** URL to mod index server (kotlin-mod-index) */
  modIndexUrl?: string;
  /** Function to fetch mod metadata by mod ID */
  fetchModMetadata?: (modId: string) => Promise<ModMetadata | undefined>;
}

/**
 * Match a path pattern against a route path.
 * Supports "*" wildcard for matching any segment.
 */
function matchPath(pattern: string, path: string): boolean {
  if (pattern === '*') return true;
  if (pattern === path) return true;
  // Simple wildcard matching: * matches any segment
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(path);
}

/**
 * Find mod replacement for a given path from a TomeConfig's modMetadata.
 */
function findModReplacement(
  path: string,
  tomeConfig: TomeConfigWithMod
): { modCaveId?: string; modTomeId?: string; spelunk?: Record<string, unknown> } | null {
  if (!tomeConfig.modMetadata?.pathReplacements) return null;
  
  for (const [pattern, replacement] of Object.entries(tomeConfig.modMetadata.pathReplacements)) {
    if (matchPath(pattern, path)) {
      return replacement;
    }
  }
  return null;
}

/**
 * Find TomeConfig for a given path by checking route patterns.
 */
function findTomeConfigForPath(
  path: string,
  tomeConfigs: TomeConfigWithMod[]
): TomeConfigWithMod | null {
  for (const tomeConfig of tomeConfigs) {
    if (tomeConfig.routing?.basePath) {
      if (path.startsWith(tomeConfig.routing.basePath)) {
        return tomeConfig;
      }
    }
    // Check modMetadata pathReplacements
    if (tomeConfig.modMetadata?.pathReplacements) {
      for (const pattern of Object.keys(tomeConfig.modMetadata.pathReplacements)) {
        if (matchPath(pattern, path)) {
          return tomeConfig;
        }
      }
    }
  }
  return null;
}

/**
 * Route request to mod server based on replacement configuration.
 */
async function routeToMod(
  req: NormalizedRequest,
  replacement: { modCaveId?: string; modTomeId?: string; spelunk?: Record<string, unknown> },
  modMetadata: ModMetadata
): Promise<NormalizedResponse> {
  const serverUrl = modMetadata.assetLinks?.serverUrl || 'http://localhost:3004';
  
  try {
    // Forward request to mod server
    const modUrl = `${serverUrl}${req.path}`;
    const response = await fetch(modUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
    });
    
    const responseBody = await response.text();
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = responseBody;
    }
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedBody,
    };
  } catch (error) {
    return {
      status: 502,
      body: { error: `Failed to route to mod server: ${error instanceof Error ? error.message : String(error)}` },
    };
  }
}

/**
 * Generic Editor Cave Mod Adapter
 * Intercepts routes and replaces them with mod implementations when modMetadata is present.
 */
export function genericeditorCaveModAdapter(
  options: GenericEditorCaveModAdapterOptions = {}
): CaveServerAdapter {
  const { modIndexUrl, fetchModMetadata } = options;
  const activeMods = new Map<string, { modId: string; metadata: ModMetadata }>();
  let context: CaveServerContext | null = null;
  const routeWrappers = new Map<string, NormalizedRequestHandler>();
  
  const adapter: CaveServerAdapter = {
    async apply(ctx: CaveServerContext): Promise<void> {
      context = ctx;
      
      // Register mod loading routes
      if (ctx.cave && ctx.tomeConfigs) {
        for (const tomeConfig of (ctx.tomeConfigs as unknown) as TomeConfigWithMod[]) {
          if (tomeConfig.isModableTome && tomeConfig.modMetadata) {
            // Store mod metadata for route interception
            activeMods.set(tomeConfig.id, {
              modId: tomeConfig.id,
              metadata: tomeConfig.modMetadata,
            });
          }
        }
      }
    },
    
    registerRoute(method: string, path: string, handler: NormalizedRequestHandler): void {
      // Wrap handler to check for mod replacements
      const wrappedHandler: NormalizedRequestHandler = async (req: NormalizedRequest) => {
        if (!context) {
          return await handler(req);
        }
        
        // Check if this route should be replaced by a mod
        const tomeConfig = findTomeConfigForPath(req.path, (context.tomeConfigs as unknown) as TomeConfigWithMod[]);
        if (tomeConfig?.isModableTome && tomeConfig.modMetadata) {
          const replacement = findModReplacement(req.path, tomeConfig);
          if (replacement) {
            // Route to mod instead
            return await routeToMod(req, replacement, tomeConfig.modMetadata);
          }
        }
        
        // Fallback to original handler
        return await handler(req);
      };
      
      // Store wrapped handler (actual registration happens in underlying adapter)
      routeWrappers.set(`${method}:${path}`, wrappedHandler);
    },
  };
  
  return adapter;
}
