import { Pact } from '@pact-foundation/pact';
import { GraphQLClient } from 'graphql-request';
import path from 'path';

const provider = new Pact({
  consumer: 'LogViewConsumer',
  provider: 'LogViewProvider',
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  logLevel: 'info',
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: 2
});

describe('Log View State Machine PACT Tests', () => {
  const client = new GraphQLClient('http://localhost:4000/graphql');

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Query Logs', () => {
    it('should return logs with filter', async () => {
      const query = `
        query GetLogs($filter: LogFilter) {
          logs(filter: $filter) {
            id
            timestamp
            level
            message
            metadata
          }
        }
      `;

      const variables = {
        filter: {
          level: 'INFO',
          search: 'test'
        }
      };

      await provider.addInteraction({
        state: 'logs exist',
        uponReceiving: 'a request for logs with filter',
        withRequest: {
          method: 'POST',
          path: '/graphql',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            query,
            variables
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              logs: [
                {
                  id: '1',
                  timestamp: '2024-03-20T12:00:00Z',
                  level: 'INFO',
                  message: 'Test log message',
                  metadata: { source: 'test' }
                }
              ]
            }
          }
        }
      });

      const response = await client.request(query, variables);
      expect(response.logs).toBeDefined();
      expect(response.logs[0].level).toBe('INFO');
    });
  });
}); 