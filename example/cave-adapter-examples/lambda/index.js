/**
 * Cave Lambda handler using aws-lambda-cave-adapter.
 * Export handler for Lambda: exports.handler = getLambdaHandler().
 * For local testing, run with a Lambda emulator or invoke with a mock API Gateway event.
 */
import { createCaveServer, Cave, createTomeConfig } from 'log-view-machine';
import { createLambdaCaveAdapter } from 'aws-lambda-cave-adapter';

const tomeConfigs = [
  createTomeConfig({
    id: 'lambda-tome',
    name: 'Lambda Tome',
    machines: {
      m: { id: 'm', name: 'M', xstateConfig: { id: 'm', initial: 'idle', states: { idle: { on: { PING: 'idle' } } } } },
    },
    routing: { basePath: '/api/lambda', routes: { m: { path: '/', method: 'POST' } } },
  }),
];

const cave = Cave('lambda-example', { name: 'lambda-example' });
const adapter = createLambdaCaveAdapter();
await createCaveServer({ cave, tomeConfigs, sections: {}, plugins: [adapter] });

export const handler = adapter.getLambdaHandler();
