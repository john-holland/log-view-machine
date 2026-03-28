import { killProcessOnPort } from 'port-cavestartup-adapter';
import { createApp } from './create-app.js';

const { app, fishBurgerService, logger } = await createApp();

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
