import express from 'express';
import cors from 'cors';
import { killProcessOnPort } from 'port-cavestartup-adapter';
import { createLogger } from './logging-config.js';
import { setupFishBurgerDemoRoutes } from './routes/fish-burger-demo.js';
import { createFishBurgerRobotCopy } from './fish-burger-robotcopy.js';
import { createFishBurgerStateMachine } from './machines/fish-burger-state-machine.js';
import { interpret } from 'xstate';

// Initialize logging
const logger = createLogger('node-fish-burger', {
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  enableWarehouse: true
});

// Create Express app
const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.EDITOR_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Root: simple info page so GET / does not 404
app.get('/', (req, res) => {
  res.type('html');
  res.send(`
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Fish Burger Ecommerce</title></head>
    <body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem;">
      <h1>🛒 Fish Burger Ecommerce</h1>
      <p>API server for the fish-burger mod. Use the editor at <a href="http://localhost:3000">localhost:3000</a> to try the Fish Burger Cart.</p>
      <ul>
        <li><a href="/health">Health</a></li>
        <li><a href="/fish-burger-demo">Fish Burger Demo</a></li>
      </ul>
    </body></html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'node-fish-burger',
    version: '1.0.0'
  });
});

// Initialize fish burger state machine
const fishBurgerMachine = createFishBurgerStateMachine();
const fishBurgerService = interpret(fishBurgerMachine)
  .onTransition((state) => {
    logger.info('Fish Burger State Transition', {
      state: state.value,
      context: state.context
    });
  })
  .start();

// Initialize RobotCopy
const robotCopy = createFishBurgerRobotCopy();

// Fish Burger API endpoints
app.post('/api/fish-burger/start', async (req, res) => {
  try {
    const { orderId, ingredients } = req.body;
    fishBurgerService.send({
      type: 'START_COOKING',
      orderId,
      ingredients
    });
    const state = fishBurgerService.getSnapshot();
    res.json({
      success: true,
      state: state.value,
      context: state.context
    });
  } catch (error) {
    logger.error('Error starting fish burger', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fish-burger/progress', async (req, res) => {
  try {
    const { orderId, cookingTime, temperature, progress } = req.body;
    fishBurgerService.send({
      type: 'UPDATE_PROGRESS',
      orderId,
      cookingTime,
      temperature,
      progress
    });
    const state = fishBurgerService.getSnapshot();
    res.json({
      success: true,
      state: state.value,
      context: state.context
    });
  } catch (error) {
    logger.error('Error updating progress', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fish-burger/complete', async (req, res) => {
  try {
    const { orderId } = req.body;
    fishBurgerService.send({
      type: 'COMPLETE_COOKING',
      orderId
    });
    const state = fishBurgerService.getSnapshot();
    res.json({
      success: true,
      state: state.value,
      context: state.context
    });
  } catch (error) {
    logger.error('Error completing cooking', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fish-burger/state', (req, res) => {
  const state = fishBurgerService.getSnapshot();
  res.json({
    state: state.value,
    context: state.context
  });
});

// Setup demo routes
setupFishBurgerDemoRoutes(app, logger);

// Start server
const PORT = process.env.PORT || 3004;
await killProcessOnPort(PORT, { logger });
app.listen(PORT, () => {
  logger.info('Node Fish Burger server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

export { app, fishBurgerService };
