/**
 * Unit tests for node-fish-burger server API
 */
import request from 'supertest';
import { createApp } from '../create-app.js';

describe('node-fish-burger server', () => {
  let app;

  beforeAll(async () => {
    const { app: createdApp } = await createApp({
      enableFileLogging: false,
      enableWarehouseLogging: false,
      setupDemoRoutes: false,
    });
    app = createdApp;
  });

  describe('GET /', () => {
    it('returns HTML info page', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Fish Burger Ecommerce');
    });
  });

  describe('GET /health', () => {
    it('returns healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'healthy',
        service: 'node-fish-burger',
        version: '1.0.0',
      });
    });
  });

  describe('GET /api/fish-burger/state', () => {
    it('returns initial idle state', async () => {
      const res = await request(app).get('/api/fish-burger/state');
      expect(res.status).toBe(200);
      expect(res.body.state).toBe('idle');
      expect(res.body.context).toHaveProperty('order');
    });
  });

  describe('POST /api/fish-burger/start', () => {
    it('transitions to cooking and returns state', async () => {
      const res = await request(app)
        .post('/api/fish-burger/start')
        .send({ orderId: 'ord-1', ingredients: ['lettuce', 'tomato'] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.state).toBe('cooking');
      expect(res.body.context.orderId).toBe('ord-1');
    });
  });

  describe('POST /api/fish-burger/progress', () => {
    it('updates progress and stays in cooking', async () => {
      await request(app)
        .post('/api/fish-burger/start')
        .send({ orderId: 'ord-2', ingredients: [] });
      const res = await request(app)
        .post('/api/fish-burger/progress')
        .send({
          orderId: 'ord-2',
          cookingTime: 30,
          temperature: 180,
          progress: 50,
        });
      expect(res.status).toBe(200);
      expect(res.body.state).toBe('cooking');
      expect(res.body.context.progress).toBe(50);
      expect(res.body.context.cookingTime).toBe(30);
    });
  });

  describe('POST /api/fish-burger/complete', () => {
    it('transitions to order_complete', async () => {
      await request(app)
        .post('/api/fish-burger/start')
        .send({ orderId: 'ord-3', ingredients: [] });
      const res = await request(app)
        .post('/api/fish-burger/complete')
        .send({ orderId: 'ord-3' });
      expect(res.status).toBe(200);
      expect(res.body.state).toBe('order_complete');
    });
  });
});
