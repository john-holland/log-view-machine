/**
 * Fish Burger Demo Route
 * Clean, externalized route for the fish burger demo
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Path to fish-burger-mod demo template (relative to monorepo mod dir) */
function getDemoTemplatePath() {
  return path.join(__dirname, '..', '..', '..', 'examples', 'fish-burger-mod', 'assets', 'templates', 'fish-burger-demo', 'templates', 'demo-template.html');
}

export function setupFishBurgerDemoRoutes(app, logger) {
  const serveDemo = (req, res) => {
    try {
      logger.info('Serving Fish Burger Demo...');
      const templatePath = getDemoTemplatePath();
      res.sendFile(templatePath);
    } catch (error) {
      logger.error('Fish Burger Demo failed:', error);
      res.status(500).send(`
        <h1>Error Loading Fish Burger Demo</h1>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      `);
    }
  };

  // Fish Burger Demo (legacy path)
  app.get('/fish-burger-demo', serveDemo);

  // Mod index entryPoints.demo path - matches mod config /mods/fish-burger/demo
  app.get('/mods/fish-burger/demo', serveDemo);
}

