/**
 * Minimal Cave app with persistence override: one Tome uses Redis for store (persistence.adapter: 'redis').
 * Run: npm start. Requires Redis on localhost:6379 (or set REDIS_URL). Store API: GET/PUT /api/editor/store/:tomeId/:key
 */
import express from 'express';
import { createCaveServer, Cave, createTomeConfig } from 'log-view-machine';
import { expressCaveAdapter } from 'express-cave-adapter';
import { createDuckDBCaveDBAdapter } from 'duckdb-cavedb-adapter';
import { createRedisCaveDBAdapter } from 'redis-cavedb-adapter';
import { buildPersistenceRegistry } from '../../node-example/src/persistence-registry.js';

const tomeConfigs = [
  createTomeConfig({
    id: 'donation-tome',
    name: 'Donation',
    machines: {
      donation: {
        id: 'donation-machine',
        name: 'Donation',
        xstateConfig: { id: 'donation', initial: 'idle', states: { idle: { on: { DONATE: 'idle' } } } },
      },
    },
    routing: { basePath: '/api/donation', routes: { donation: { path: '/', method: 'POST' } } },
    persistence: { enabled: true, adapter: 'redis', config: { url: process.env.REDIS_URL || 'redis://localhost:6379' } },
  }),
];

const registry = await buildPersistenceRegistry(tomeConfigs, {
  duckdb: (opts) => createDuckDBCaveDBAdapter(opts),
  redis: (opts) => createRedisCaveDBAdapter(opts),
});

const app = express();
app.use(express.json());
function getCaveDBAdapter(tomeId) {
  return registry.get(tomeId) ?? createDuckDBCaveDBAdapter({ tomeId });
}

const cave = Cave('redis-cavedb-example', { name: 'redis-cavedb-example' });
const adapter = expressCaveAdapter({ app, cors: true });
await createCaveServer({ cave, tomeConfigs, sections: {}, plugins: [adapter] });

app.get('/api/editor/store/:tomeId/:key', async (req, res) => {
  try {
    const value = await getCaveDBAdapter(req.params.tomeId).get(req.params.key);
    res.json(value ?? null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.put('/api/editor/store/:tomeId/:key', async (req, res) => {
  try {
    await getCaveDBAdapter(req.params.tomeId).put(req.params.key, req.body ?? {});
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = Number(process.env.PORT) || 8081;
app.listen(port, () => {
  console.log(`Cave (redis-cavedb persistence) on http://localhost:${port}`);
  console.log('PUT /api/editor/store/donation-tome/settings then GET /api/editor/store/donation-tome/settings');
});
