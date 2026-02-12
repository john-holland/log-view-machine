/**
 * Fish Burger Demo Route
 * Clean, externalized route for the fish burger demo
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupFishBurgerDemoRoutes(app, logger) {
  // Fish Burger Demo with Generic Editor Components
  app.get('/fish-burger-demo', (req, res) => {
    try {
      logger.info('Serving Fish Burger Demo with Generic Editor Components...');
      
      // Serve the fish burger demo HTML template from external file
      res.sendFile('./src/component-middleware/generic-editor/assets/components/fish-burger-demo/templates/demo-template.html', { root: process.cwd() });
    } catch (error) {
      logger.error('Fish Burger Demo failed:', error);
      res.status(500).send(`
        <h1>Error Loading Fish Burger Demo</h1>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      `);
    }
  });
}

