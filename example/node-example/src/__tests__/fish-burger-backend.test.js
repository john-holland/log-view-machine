const request = require('supertest');
const express = require('express');
const { createMachine, interpret } = require('xstate');
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const { v4: uuidv4 } = require('uuid');

// Mock the fish burger backend
const app = require('../fish-burger-backend');

describe('Fish Burger Backend API', () => {
  let server;

  beforeAll(() => {
    server = app.listen(0); // Use random port for testing
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('POST /api/fish-burger/start', () => {
    it('should start cooking a fish burger order', async () => {
      const orderData = {
        orderId: 'TEST-ORDER-001',
        ingredients: ['fish', 'lettuce', 'tomato', 'bun'],
        customer: 'John Doe',
        specialInstructions: 'Extra crispy fish'
      };

      const response = await request(app)
        .post('/api/fish-burger/start')
        .set('x-trace-id', 'test-trace-123')
        .set('x-span-id', 'test-span-456')
        .send(orderData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        orderId: 'TEST-ORDER-001',
        status: 'cooking',
        message: expect.stringContaining('Started cooking'),
        traceId: 'test-trace-123'
      });

      expect(response.body.messageId).toBeDefined();
      expect(response.body.spanId).toBeDefined();
    });

    it('should handle missing order data', async () => {
      const response = await request(app)
        .post('/api/fish-burger/start')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Order data is required')
      });
    });

    it('should handle invalid ingredients', async () => {
      const orderData = {
        orderId: 'TEST-ORDER-002',
        ingredients: ['invalid-ingredient'],
        customer: 'John Doe'
      };

      const response = await request(app)
        .post('/api/fish-burger/start')
        .send(orderData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid ingredients')
      });
    });
  });

  describe('POST /api/fish-burger/progress', () => {
    it('should update cooking progress', async () => {
      const progressData = {
        orderId: 'TEST-ORDER-001',
        progress: 50,
        currentStep: 'frying_fish',
        estimatedTimeRemaining: 300
      };

      const response = await request(app)
        .post('/api/fish-burger/progress')
        .set('x-trace-id', 'test-trace-123')
        .send(progressData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        orderId: 'TEST-ORDER-001',
        progress: 50,
        status: 'cooking',
        message: expect.stringContaining('Progress updated'),
        traceId: 'test-trace-123'
      });
    });

    it('should handle progress completion', async () => {
      const progressData = {
        orderId: 'TEST-ORDER-001',
        progress: 100,
        currentStep: 'completed',
        estimatedTimeRemaining: 0
      };

      const response = await request(app)
        .post('/api/fish-burger/progress')
        .send(progressData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        orderId: 'TEST-ORDER-001',
        progress: 100,
        status: 'completed',
        message: expect.stringContaining('Cooking completed')
      });
    });
  });

  describe('POST /api/fish-burger/complete', () => {
    it('should complete a fish burger order', async () => {
      const completionData = {
        orderId: 'TEST-ORDER-001',
        finalStatus: 'ready_for_pickup',
        cookingTime: 450,
        qualityScore: 95
      };

      const response = await request(app)
        .post('/api/fish-burger/complete')
        .set('x-trace-id', 'test-trace-123')
        .send(completionData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        orderId: 'TEST-ORDER-001',
        status: 'ready_for_pickup',
        message: expect.stringContaining('Order completed'),
        traceId: 'test-trace-123'
      });

      expect(response.body.cookingTime).toBe(450);
      expect(response.body.qualityScore).toBe(95);
    });
  });

  describe('GET /api/trace/:traceId', () => {
    it('should retrieve trace information', async () => {
      const traceId = 'test-trace-123';

      const response = await request(app)
        .get(`/api/trace/${traceId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        traceId: 'test-trace-123',
        messages: expect.arrayContaining([
          expect.objectContaining({
            messageId: expect.any(String),
            action: expect.any(String),
            timestamp: expect.any(String)
          })
        ])
      });
    });

    it('should handle non-existent trace', async () => {
      const response = await request(app)
        .get('/api/trace/non-existent-trace')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Trace not found'
      });
    });
  });

  describe('GET /api/message/:messageId', () => {
    it('should retrieve message information', async () => {
      // First create a message
      const orderData = {
        orderId: 'TEST-ORDER-003',
        ingredients: ['fish', 'lettuce', 'tomato', 'bun'],
        customer: 'John Doe'
      };

      const startResponse = await request(app)
        .post('/api/fish-burger/start')
        .send(orderData)
        .expect(200);

      const messageId = startResponse.body.messageId;

      const response = await request(app)
        .get(`/api/message/${messageId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        messageId: messageId,
        action: 'start',
        backend: expect.stringMatching(/kotlin|node/),
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'fish-burger-backend',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock a server error by sending invalid data
      const response = await request(app)
        .post('/api/fish-burger/start')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing trace headers', async () => {
      const orderData = {
        orderId: 'TEST-ORDER-004',
        ingredients: ['fish', 'lettuce', 'tomato', 'bun'],
        customer: 'John Doe'
      };

      const response = await request(app)
        .post('/api/fish-burger/start')
        .send(orderData)
        .expect(200);

      // Should still work without trace headers
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('traceId');
    });
  });
}); 