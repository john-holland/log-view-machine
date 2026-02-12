/**
 * Cave server for Google App Engine. Use app-engine-cave-adapter; listen on process.env.PORT.
 * Deploy to GAE and set PORT in app.yaml or use default 8080.
 */
import { createCaveServer, Cave, createTomeConfig } from 'log-view-machine';
import { appEngineCaveAdapter } from 'app-engine-cave-adapter';
import { createServer } from 'http';

const tomeConfigs = [
  createTomeConfig({
    id: 'demo-tome',
    name: 'Demo',
    machines: { m: { id: 'm', name: 'M', xstateConfig: { id: 'm', initial: 'idle', states: { idle: {} } } } },
    routing: { basePath: '/api/demo', routes: { m: { path: '/', method: 'POST' } } },
  }),
];
const cave = Cave('app-engine-example', { name: 'app-engine-example' });
const adapter = appEngineCaveAdapter({ cors: true });
await createCaveServer({ cave, tomeConfigs, sections: {}, plugins: [adapter] });
const port = Number(process.env.PORT) || 8080;
createServer(adapter.getApp()).listen(port, () => console.log(`App Engine Cave on port ${port}`));
