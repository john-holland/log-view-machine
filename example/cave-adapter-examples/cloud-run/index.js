/**
 * Cave server for Google Cloud Run. Use cloud-run-cave-adapter; listen on process.env.PORT.
 */
import { createCaveServer, Cave, createTomeConfig } from 'log-view-machine';
import { cloudRunCaveAdapter } from 'cloud-run-cave-adapter';
import { createServer } from 'http';

const tomeConfigs = [
  createTomeConfig({
    id: 'demo-tome',
    name: 'Demo',
    machines: { m: { id: 'm', name: 'M', xstateConfig: { id: 'm', initial: 'idle', states: { idle: {} } } } },
    routing: { basePath: '/api/demo', routes: { m: { path: '/', method: 'POST' } } },
  }),
];
const cave = Cave('cloud-run-example', { name: 'cloud-run-example' });
const adapter = cloudRunCaveAdapter({ cors: true });
await createCaveServer({ cave, tomeConfigs, sections: {}, plugins: [adapter] });
const port = Number(process.env.PORT) || 8080;
createServer(adapter.getApp()).listen(port, () => console.log(`Cloud Run Cave on port ${port}`));
