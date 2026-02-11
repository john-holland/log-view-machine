/**
 * Tests for CaveMessagingTransport and createInMemoryTransport.
 * Verifies two in-memory transports can send and receive.
 */

import {
  createInMemoryTransport,
  wireInMemoryTransportPair,
  type CaveMessage,
} from '../index';

describe('CaveMessagingTransport', () => {
  describe('createInMemoryTransport', () => {
    test('should create transport with contextType and optional tabId', () => {
      const t = createInMemoryTransport({ contextType: 'content', tabId: 1 });
      expect(t.contextType).toBe('content');
      expect(t.tabId).toBe(1);
      expect(t.send).toBeDefined();
      expect(t.onMessage).toBeDefined();
    });

    test('send without peer resolves with {}', async () => {
      const t = createInMemoryTransport({ contextType: 'background' });
      const result = await t.send('popup', { type: 'PING' });
      expect(result).toEqual({});
    });
  });

  describe('wireInMemoryTransportPair', () => {
    test('two transports can send and receive', async () => {
      const background = createInMemoryTransport({ contextType: 'background' });
      const content = createInMemoryTransport({ contextType: 'content', tabId: 42 });
      wireInMemoryTransportPair(background, content);

      content.onMessage((msg: CaveMessage) => {
        expect(msg.type).toBe('PING');
        return { pong: true };
      });

      const result = await background.send(
        { to: 'content', tabId: 42 },
        { type: 'PING' }
      );
      expect(result).toEqual({ pong: true });
    });

    test('content can send to background and get response', async () => {
      const background = createInMemoryTransport({ contextType: 'background' });
      const content = createInMemoryTransport({ contextType: 'content', tabId: 1 });
      wireInMemoryTransportPair(background, content);

      background.onMessage((msg: CaveMessage) => {
        if (msg.type === 'GET_STATUS') return { status: 'ok' };
        return {};
      });

      const result = await content.send('background', { type: 'GET_STATUS' });
      expect(result).toEqual({ status: 'ok' });
    });

    test('onMessage unsubscribe removes handler', async () => {
      const a = createInMemoryTransport({ contextType: 'background' });
      const b = createInMemoryTransport({ contextType: 'content', tabId: 1 });
      wireInMemoryTransportPair(a, b);

      let count = 0;
      const unsub = b.onMessage(() => {
        count++;
        return { count };
      });

      const r1 = await a.send({ to: 'content', tabId: 1 }, { type: 'X' });
      expect(r1).toEqual({ count: 1 });
      unsub();
      const r2 = await a.send({ to: 'content', tabId: 1 }, { type: 'Y' });
      expect(r2).toEqual({});
      expect(count).toBe(1);
    });
  });
});
