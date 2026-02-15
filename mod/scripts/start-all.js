#!/usr/bin/env node
/**
 * Consolidated mod stack startup: editor, ecommerce, index.
 * Starts all three services, polls /health until ready (or timeout), then prints a report.
 * Keeps running; Ctrl+C stops all child processes.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOD_ROOT = path.resolve(__dirname, '..');

const SERVICES = [
  {
    id: 'editor',
    name: 'Editor',
    port: Number(process.env.EDITOR_PORT) || 3000,
    healthPath: '/health',
    cwd: path.join(MOD_ROOT, 'node-mod-editor'),
    command: 'node',
    args: ['src/main-server.js'],
    env: { ...process.env, PORT: String(Number(process.env.EDITOR_PORT) || 3000) },
    dependsOn: [],
  },
  {
    id: 'ecommerce',
    name: 'Ecommerce',
    port: Number(process.env.ECOMMERCE_PORT) || 3004,
    healthPath: '/health',
    cwd: path.join(MOD_ROOT, 'node-fish-burger'),
    command: 'node',
    args: ['src/server.js'],
    env: { ...process.env, PORT: String(Number(process.env.ECOMMERCE_PORT) || 3004) },
    dependsOn: [],
  },
  {
    id: 'index',
    name: 'Index',
    port: Number(process.env.INDEX_PORT) || 8082,
    healthPath: '/health',
    cwd: path.join(MOD_ROOT, 'kotlin-mod-index'),
    command: process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
    args: ['run'],
    env: { ...process.env, PORT: String(Number(process.env.INDEX_PORT) || 8082) },
    shell: true,
    dependsOn: ['editor'],
  },
];

const HEALTH_POLL_MS = 500;
// Editor can wait up to ~2 min for dotCMS before binding; give all services time to be ready
const HEALTH_TIMEOUT_MS = Number(process.env.MOD_HEALTH_TIMEOUT_MS) || 180_000;

async function checkHealth(baseUrl, healthPath) {
  const url = `${baseUrl}${healthPath}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const ok = res.ok;
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    return { ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: null, error: err?.message ?? String(err) };
  }
}

async function waitForHealthy(service, startTime) {
  const baseUrl = `http://127.0.0.1:${service.port}`;
  while (Date.now() - startTime < HEALTH_TIMEOUT_MS) {
    const result = await checkHealth(baseUrl, service.healthPath);
    if (result.ok) return { healthy: true, ...result };
    await new Promise((r) => setTimeout(r, HEALTH_POLL_MS));
  }
  const last = await checkHealth(baseUrl, service.healthPath);
  return { healthy: false, ...last };
}

function getDeps(service) {
  const deps = service.dependsOn;
  return Array.isArray(deps) ? deps : [];
}

function checkCycle(services) {
  const ids = new Set(services.map((s) => s.id));
  for (const s of services) {
    for (const d of getDeps(s)) {
      if (!ids.has(d)) {
        throw new Error(`Service "${s.id}" depends on unknown "${d}".`);
      }
    }
  }
  const inDegree = Object.fromEntries(services.map((s) => [s.id, getDeps(s).length]));
  const queue = services.filter((s) => inDegree[s.id] === 0).map((s) => s.id);
  let processed = 0;
  while (queue.length > 0) {
    const id = queue.shift();
    processed++;
    for (const s of services) {
      if (getDeps(s).includes(id)) {
        inDegree[s.id]--;
        if (inDegree[s.id] === 0) queue.push(s.id);
      }
    }
  }
  if (processed !== services.length) {
    throw new Error('Cycle detected in service dependsOn.');
  }
}

function printReport(serviceResults) {
  const lines = [
    '',
    '═══════════════════════════════════════════════════════════════',
    '  Mod stack – service report',
    '═══════════════════════════════════════════════════════════════',
  ];
  for (const s of SERVICES) {
    const r = serviceResults.get(s.id) ?? {};
    const url = `http://localhost:${s.port}`;
    const status = r.healthy ? '✓ healthy' : (r.error ? `✗ ${r.error}` : `✗ HTTP ${r.status}`);
    lines.push(`  ${s.name.padEnd(12)}  ${url.padEnd(28)}  ${status}`);
  }
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  Editor:     landing + mod editor');
  lines.push('  Ecommerce:  fish-burger / cart backend');
  lines.push('  Index:      kotlin-mod-index (mod registry)');
  lines.push('  Press Ctrl+C to stop all services.');
  lines.push('');
  console.log(lines.join('\n'));
}

function main() {
  const children = [];
  checkCycle(SERVICES);

  const shutdown = () => {
    console.log('\nShutting down all services...');
    for (const p of children) {
      try {
        p.kill('SIGTERM');
      } catch (_) {}
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const startTime = Date.now();
  console.log('Starting editor, ecommerce, and index (dependency order)...\n');

  (async () => {
    const healthy = new Set();
    const results = new Map();
    const started = new Set();

    while (started.size < SERVICES.length) {
      const ready = SERVICES.filter(
        (s) => !started.has(s.id) && getDeps(s).every((d) => healthy.has(d))
      );
      if (ready.length === 0) {
        const missing = SERVICES.find((s) => !started.has(s.id));
        throw new Error(
          `No service ready to start. Missing deps for "${missing?.id}": ${getDeps(missing || {}).join(', ')}`
        );
      }

      for (const service of ready) {
        const opts = {
          cwd: service.cwd,
          env: service.env,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: !!service.shell,
        };
        const proc = spawn(service.command, service.args, opts);
        proc.stdout?.on('data', (c) => process.stdout.write(`[${service.id}] ${c}`));
        proc.stderr?.on('data', (c) => process.stderr.write(`[${service.id}] ${c}`));
        proc.on('error', (err) => console.error(`[${service.id}] spawn error:`, err.message));
        proc.on('exit', (code, sig) => {
          if (code != null && code !== 0) console.error(`[${service.id}] exited ${code}`);
          if (sig) console.error(`[${service.id}] signal ${sig}`);
        });
        children.push(proc);
      }

      const waveStart = Date.now();
      await Promise.all(
        ready.map(async (s) => {
          const r = await waitForHealthy(s, waveStart);
          results.set(s.id, r);
          if (r.healthy) healthy.add(s.id);
          started.add(s.id);
        })
      );
    }

    printReport(results);
  })();
}

main();
