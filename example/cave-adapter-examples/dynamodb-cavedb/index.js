/**
 * Cave app with persistence.adapter: 'dynamodb'. Use buildPersistenceRegistry with createDynamoDBCaveDBAdapter.
 * Run: npm start. Set AWS_REGION and ensure DynamoDB table "cavedb" (PK: tomeId, SK: key) exists, or adapter falls back to in-memory.
 */
import express from 'express';
import { createCaveServer, Cave, createTomeConfig } from 'log-view-machine';
import { expressCaveAdapter } from 'express-cave-adapter';
import { createDuckDBCaveDBAdapter } from 'duckdb-cavedb-adapter';
import { createDynamoDBCaveDBAdapter } from 'dynamodb-cavedb-adapter';
import { buildPersistenceRegistry } from '../../node-example/src/persistence-registry.js';

const tomeConfigs = [
  createTomeConfig({
    id: 'donation-tome',
    name: 'Donation',
    machines: { d: { id: 'd', name: 'D', xstateConfig: { id: 'd', initial: 'idle', states: { idle: {} } } } },
    routing: { basePath: '/api/donation', routes: { d: { path: '/', method: 'POST' } } },
    persistence: { enabled: true, adapter: 'dynamodb', config: { tableName: 'cavedb' } },
  }),
];
const registry = await buildPersistenceRegistry(tomeConfigs, {
  duckdb: (o) => createDuckDBCaveDBAdapter(o),
  dynamodb: (o) => createDynamoDBCaveDBAdapter(o),
});
const app = express();
app.use(express.json());
const getCaveDBAdapter = (tomeId) => registry.get(tomeId) ?? createDuckDBCaveDBAdapter({ tomeId });
app.get('/api/editor/store/:tomeId/:key', async (req, res) => {
  try { res.json(await getCaveDBAdapter(req.params.tomeId).get(req.params.key) ?? null); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/editor/store/:tomeId/:key', async (req, res) => {
  try { await getCaveDBAdapter(req.params.tomeId).put(req.params.key, req.body ?? {}); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
const cave = Cave('dynamodb-example', { name: 'dynamodb-example' });
await createCaveServer({ cave, tomeConfigs, sections: {}, plugins: [expressCaveAdapter({ app, cors: true })] });
app.listen(Number(process.env.PORT) || 8082, () => console.log('Cave (dynamodb-cavedb) http://localhost:8082'));
