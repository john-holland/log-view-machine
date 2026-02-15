import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';

// Setup WebSocket server for GraphQL subscriptions
export function setupWebSocketServer(server, schema, logger) {
  const wsServer = new WebSocketServer({
    server,
    path: '/graphql'
  });

  useServer(
    {
      schema,
      onConnect: (ctx) => {
        logger.info('WebSocket client connected', {
          url: ctx.extra.request.url,
          headers: ctx.extra.request.headers
        });
      },
      onDisconnect: (ctx) => {
        logger.info('WebSocket client disconnected');
      },
      onSubscribe: (ctx, msg) => {
        logger.info('GraphQL subscription started', {
          query: msg.payload.query,
          variables: msg.payload.variables
        });
      },
      onNext: (ctx, msg, args, result) => {
        logger.info('GraphQL subscription message sent', {
          subscriptionId: msg.id
        });
      },
      onError: (ctx, msg, errors) => {
        logger.error('GraphQL subscription error', {
          subscriptionId: msg.id,
          errors: errors.map(e => e.message)
        });
      }
    },
    wsServer
  );

  logger.info('WebSocket server setup complete');
} 