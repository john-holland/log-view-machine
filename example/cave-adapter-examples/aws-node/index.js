/**
 * Minimal Cave server using aws-node-cave-adapter.
 * Run: npm start (or node index.js). Listens on PORT or 8080.
 */
import { createCaveServer, Cave, createTomeConfig } from 'log-view-machine';
import { awsNodeCaveAdapter } from 'aws-node-cave-adapter';
import { createServer } from 'http';

const tomeConfigs = [
  createTomeConfig({
    id: 'demo-tome',
    name: 'Demo Tome',
    machines: {
      demo: {
        id: 'demo-machine',
        name: 'Demo',
        xstateConfig: {
          id: 'demo',
          initial: 'idle',
          states: { idle: { on: { PING: 'idle' } } },
        },
      },
    },
    routing: { basePath: '/api/demo', routes: { demo: { path: '/', method: 'POST' } } },
  }),
];

const cave = Cave('aws-node-example', { name: 'aws-node-example' });
const adapter = awsNodeCaveAdapter({ cors: true });
await createCaveServer({ cave, tomeConfigs, sections: {}, plugins: [adapter] });

const app = adapter.getApp();
const port = Number(process.env.PORT) || 8080;
createServer(app).listen(port, () => {
  console.log(`Cave (aws-node-cave-adapter) listening on http://localhost:${port}`);
  console.log('POST /api/demo/ with body { event: "PING", data: {} }');
});
