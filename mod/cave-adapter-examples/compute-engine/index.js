/**
 * Cave server for Google Compute Engine. Use compute-engine-cave-adapter; optional getGceMetadata().
 */
import { createCaveServer, Cave, createTomeConfig } from 'log-view-machine';
import { computeEngineCaveAdapter, getGceMetadata } from 'compute-engine-cave-adapter';
import { createServer } from 'http';

const tomeConfigs = [
  createTomeConfig({
    id: 'demo-tome',
    name: 'Demo',
    machines: { m: { id: 'm', name: 'M', xstateConfig: { id: 'm', initial: 'idle', states: { idle: {} } } } },
    routing: { basePath: '/api/demo', routes: { m: { path: '/', method: 'POST' } } },
  }),
];
const cave = Cave('compute-engine-example', { name: 'compute-engine-example' });
const adapter = computeEngineCaveAdapter({ cors: true });
await createCaveServer({ cave, tomeConfigs, sections: {}, plugins: [adapter] });
const port = Number(process.env.PORT) || 8080;
createServer(adapter.getApp()).listen(port, async () => {
  const meta = await getGceMetadata();
  console.log(`Compute Engine Cave on port ${port}`, meta.projectId ? `project=${meta.projectId}` : '');
});