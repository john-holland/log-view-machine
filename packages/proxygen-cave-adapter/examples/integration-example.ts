/**
 * Integration example: createCaveServer with proxygenCaveAdapter.
 * Run from repo root: npx tsx packages/proxygen-cave-adapter/examples/integration-example.ts
 * Requires the native addon to be built (npm run rebuild in packages/proxygen-cave-adapter).
 * The stub server does not listen; with real Proxygen you would GET /health and /registry.
 */

import { createCaveServer, createCave, createTomeConfig } from 'log-view-machine';
import { proxygenCaveAdapter, getVersion } from 'proxygen-cave-adapter';

async function main() {
  console.log('proxygen-cave-adapter version:', getVersion());

  const cave = createCave('example-cave', { childCaves: {} });

  const tomeConfig = createTomeConfig({
    id: 'example-tome',
    name: 'Example Tome',
    machines: {
      demo: {
        id: 'demo-machine',
        name: 'Demo',
        xstateConfig: { initial: 'idle', states: { idle: {} } },
      },
    },
    routing: {
      basePath: '/api/example-tome',
      routes: {
        demo: { path: '/event', method: 'POST' },
      },
    },
  });

  const adapter = proxygenCaveAdapter({ port: 8080, healthPath: '/health', registryPath: '/registry' });
  adapter.healthCheck?.('/health', 0);

  await createCaveServer({
    cave,
    tomeConfigs: [tomeConfig],
    sections: { registry: true },
    plugins: [adapter],
  });

  console.log('createCaveServer applied (stub server; no listener). With Proxygen, GET http://localhost:8080/health and http://localhost:8080/registry');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
