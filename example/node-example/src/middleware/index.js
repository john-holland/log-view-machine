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

  // Validation error middleware - temporarily disabled due to express-validator issues
  // app.use((req, res, next) => {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(400).json({
  //       error: 'Validation failed',
  //       details: errors.array()
  //     });
  //   }
  //   next();
  // });
}

// Validation schemas - temporarily disabled due to express-validator issues
// export const validationSchemas = {
//   // All validation schemas commented out
// }; 