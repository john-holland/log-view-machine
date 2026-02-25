/**
 * Minimal Pact provider server for Mod API verification.
 * Implements GET /api/mods, GET /api/mods/:modId, POST /provider-states.
 * Used by verify-provider.mjs to verify contract compliance.
 */
import express from 'express';

const modExample = {
  id: 'fish-burger-mod',
  name: 'Fish Burger Cart',
  description: 'Interactive shopping cart with fish burger state machine.',
  version: '1.0.0',
  serverUrl: 'http://localhost:3004',
  assets: {
    templates: '/mods/fish-burger/templates/',
    styles: '/mods/fish-burger/styles/',
    scripts: '/mods/fish-burger/scripts/',
  },
  entryPoints: { cart: '/mods/fish-burger/cart', demo: '/mods/fish-burger/demo' },
  modMetadata: { pathReplacements: {}, assetLinks: {}, spelunkMap: {} },
};

let modRegistry = { 'fish-burger-mod': modExample };

const app = express();
app.use(express.json());

app.post('/provider-states', (req, res) => {
  const { state } = req.body;
  if (state === 'mods exist') {
    modRegistry = { 'fish-burger-mod': modExample };
  } else if (state === 'mod fish-burger-mod exists') {
    modRegistry = { 'fish-burger-mod': modExample };
  } else if (state === 'mod does not exist') {
    modRegistry = {};
  }
  res.status(200).json({});
});

app.get('/api/mods', (_req, res) => {
  const mods = Object.values(modRegistry);
  res.json({ mods });
});

app.get('/api/mods/:modId', (req, res) => {
  const { modId } = req.params;
  const mod = modRegistry[modId];
  if (mod) {
    res.json(mod);
  } else {
    res.status(404).json({ error: 'Mod not found' });
  }
});

const port = parseInt(process.env.PACT_PROVIDER_PORT || '9292', 10);
const server = app.listen(port, () => {
  process.stdout.write(`Pact provider server listening on port ${port}\n`);
});

process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});
