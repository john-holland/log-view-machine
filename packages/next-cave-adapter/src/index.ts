/**
 * Next.js Cave server adapter.
 * Implements CaveServerAdapter via Next.js API routes / route handlers and middleware.
 */

import type { CaveServerAdapter, CaveServerContext } from 'log-view-machine';

export interface NextCaveAdapterOptions {
  /** Path for Address registry when sections.registry is true (default /api/registry). */
  registryPath?: string;
  /** Next.js runtime: node (default) or edge. */
  runtime?: 'node' | 'edge';
}

export function nextCaveAdapter(options: NextCaveAdapterOptions = {}): CaveServerAdapter {
  const registryPath = options.registryPath ?? '/api/registry';

  const adapter: CaveServerAdapter = {
    async apply(context: CaveServerContext): Promise<void> {
      const { cave, sections } = context;
      if (sections.registry === true) {
        const config = cave.getConfig();
        const spelunk = config.spelunk;
        if (spelunk.childCaves) {
          for (const [_name, _child] of Object.entries(spelunk.childCaves)) {
          }
        }
      }
    },
  };

  return adapter;
}
