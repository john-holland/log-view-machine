/**
 * Vite Cave server adapter.
 * Implements CaveServerAdapter via Vite's configureServer and proxy/middleware.
 */

import type { Plugin, ViteDevServer } from 'vite';
import type { CaveServerAdapter, CaveServerContext } from 'log-view-machine';

export interface ViteCaveAdapterOptions {
  /** Path for Address registry when sections.registry is true (default /registry). */
  registryPath?: string;
  /** Proxy target for API when using proxy (e.g. http://localhost:3000). */
  proxyTarget?: string;
}

type ViteConfigEnv = { mode: string; command: string };

export function viteCaveAdapter(options: ViteCaveAdapterOptions = {}): Plugin & CaveServerAdapter {
  const registryPath = options.registryPath ?? '/registry';

  async function applyCave(context: CaveServerContext): Promise<void> {
    const { cave, sections } = context;
    if (sections.registry === true) {
      const config = cave.getConfig();
      const spelunk = config.spelunk;
      if (spelunk.childCaves) {
        for (const [_name, _child] of Object.entries(spelunk.childCaves)) {
        }
      }
    }
  }

  const adapter = {
    name: 'vite-cave-adapter',
    apply(
      configOrContext: CaveServerContext | unknown,
      env?: ViteConfigEnv
    ): boolean | Promise<void> {
      if (env !== undefined) return true;
      return applyCave(configOrContext as CaveServerContext);
    },

    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use((req: unknown, res: unknown, next: () => void) => {
          const r = req as { url?: string; method?: string };
          const w = res as { setHeader: (k: string, v: string) => void; end: (s: string) => void };
          const url = r.url ?? '';
          if (r.method === 'GET' && url.startsWith(registryPath)) {
            w.setHeader('Content-Type', 'application/json');
            w.end(JSON.stringify({ cave: '', addresses: [], message: 'Registry: configure via apply(context)' }));
            return;
          }
          next();
        });
      };
    },
  };

  return adapter as Plugin & CaveServerAdapter;
}
