import express from 'express';
import { initializeUnleash } from './scripts/init-unleash';
import { initializeFeatureToggles } from './config/feature-toggles';
import { ipBanMiddleware } from './middleware/ip-ban';
import { initializeTracing } from './tracing';

const app = express();
const port = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize Unleash
    await initializeUnleash();
    console.log('Unleash initialized');

    // Initialize feature toggles
    await initializeFeatureToggles();
    console.log('Feature toggles initialized');

    // Initialize tracing if enabled
    if (process.env.ENABLE_TRACING === 'true') {
      await initializeTracing();
      console.log('Tracing initialized');
    }

    // Apply IP ban middleware
    app.use(ipBanMiddleware);

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 