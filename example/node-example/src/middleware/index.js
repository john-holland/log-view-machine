import express from 'express';
import { body, validationResult } from 'express-validator';

// Setup middleware
export function setupMiddleware(app, logger) {
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });
    next();
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });

  // Validation error middleware
  app.use((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  });
}

// Validation schemas
export const validationSchemas = {
  createStateMachine: [
    body('id').isString().notEmpty().withMessage('Machine ID is required'),
    body('name').isString().notEmpty().withMessage('Machine name is required'),
    body('config').isObject().withMessage('Machine config must be an object')
  ],
  
  updateStateMachine: [
    body('name').optional().isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('config').optional().isObject().withMessage('Config must be an object')
  ],
  
  createProxyMachine: [
    body('id').isString().notEmpty().withMessage('Proxy ID is required'),
    body('name').isString().notEmpty().withMessage('Proxy name is required'),
    body('targetUrl').isURL().withMessage('Target URL must be a valid URL'),
    body('config').isObject().withMessage('Proxy config must be an object')
  ],
  
  updateProxyMachine: [
    body('name').optional().isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('targetUrl').optional().isURL().withMessage('Target URL must be a valid URL'),
    body('config').optional().isObject().withMessage('Config must be an object'),
    body('status').optional().isIn(['active', 'inactive', 'maintenance']).withMessage('Status must be active, inactive, or maintenance')
  ],
  
  createUser: [
    body('username').isString().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Role must be user, admin, or moderator')
  ],
  
  updateUser: [
    body('username').optional().isString().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('email').optional().isEmail().withMessage('Email must be a valid email address'),
    body('password').optional().isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Role must be user, admin, or moderator')
  ],
  
  login: [
    body('username').isString().notEmpty().withMessage('Username is required'),
    body('password').isString().notEmpty().withMessage('Password is required')
  ],
  
  sendProxyRequest: [
    body('method').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).withMessage('Method must be GET, POST, PUT, DELETE, or PATCH'),
    body('path').isString().notEmpty().withMessage('Path is required'),
    body('headers').optional().isObject().withMessage('Headers must be an object'),
    body('body').optional().withMessage('Body can be any valid JSON')
  ],
  
  sendStateMachineEvent: [
    body('event').isString().notEmpty().withMessage('Event name is required'),
    body('data').optional().withMessage('Event data can be any valid JSON')
  ]
}; 