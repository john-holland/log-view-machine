#!/usr/bin/env node
/**
 * Integration test for POST /api/editor/publish (401 when no token and PUBLISH_REQUIRES_LOGIN).
 * Run: node scripts/test-editor-publish.mjs
 * Requires: SKIP_SERVER_LISTEN=1, PUBLISH_REQUIRES_LOGIN=true before loading main-server.
 */
import request from 'supertest';

process.env.SKIP_SERVER_LISTEN = '1';
process.env.PUBLISH_REQUIRES_LOGIN = 'true';

const { app } = await import('../src/main-server.js');

const res = await request(app)
  .post('/api/editor/publish')
  .set('Content-Type', 'application/json')
  .send({ componentId: 'test', name: 'Test' });

if (res.status !== 401 || !res.body.error || !/sign in/i.test(res.body.error)) {
  console.error('Expected 401 with "sign in" error, got', res.status, res.body);
  process.exit(1);
}
console.log('OK: POST /api/editor/publish returns 401 when no token');
process.exit(0);
