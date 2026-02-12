/**
 * Unleash Startup Adapter
 * Starts the Unleash service (and optional postgres/redis) via docker-compose.
 * Optional: only start when toggle 'unleash-startup-enabled' is true.
 */

import { spawn } from 'child_process';
import path from 'path';

const DEFAULT_SERVICE = 'unleash';
const READINESS_TIMEOUT_MS = 90000;
const READINESS_POLL_MS = 2000;

/**
 * @param {Object} options
 * @param {boolean} options.startUnleash - If false, startUp() no-ops.
 * @param {(toggleName: string) => Promise<boolean>} [options.unleashIsEnabled] - If provided, start only when unleashIsEnabled('unleash-startup-enabled') is true.
 * @param {string} [options.unleashUrl] - URL for readiness check (e.g. from process.env.UNLEASH_URL). If missing, skip wait.
 * @param {{ info?: (msg: string) => void, warn?: (msg: string) => void, error?: (msg: string) => void }} [options.logger]
 * @param {string} [options.composePath] - Path to docker-compose file. Default from process.env.UNLEASH_COMPOSE_PATH or cwd.
 * @param {string} [options.composeProject] - Docker Compose project name.
 * @returns {{ startUp(): Promise<void> }}
 */
export function createUnleashStartupAdapter(options) {
  const {
    startUnleash = false,
    unleashIsEnabled,
    unleashUrl = process.env.UNLEASH_URL || '',
    logger = {},
    composePath = process.env.UNLEASH_COMPOSE_PATH || '',
    composeProject,
  } = options;

  const log = (fn, msg) => { if (logger[fn]) logger[fn](msg); };

  async function startUp() {
    if (startUnleash === false) {
      return;
    }

    if (typeof unleashIsEnabled === 'function') {
      const enabled = await unleashIsEnabled('unleash-startup-enabled');
      if (!enabled) {
        log('info', '[unleash-cavestartup-adapter] Toggle unleash-startup-enabled is false; skipping Unleash start');
        return;
      }
    }

    const composeFile = composePath.trim() || path.join(process.cwd(), 'docker-compose.yml');
    const args = ['compose', '-f', composeFile];
    if (composeProject) args.push('-p', composeProject);
    args.push('up', '-d', DEFAULT_SERVICE);

    log('info', '[unleash-cavestartup-adapter] Starting Unleash: docker ' + args.join(' '));

    await new Promise((resolve, reject) => {
      const proc = spawn('docker', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });
      let stderr = '';
      proc.stderr?.on('data', (chunk) => { stderr += chunk; });
      proc.on('error', (err) => {
        log('error', '[unleash-cavestartup-adapter] spawn error: ' + (err?.message || err));
        reject(err);
      });
      proc.on('close', (code) => {
        if (code === 0) {
          log('info', '[unleash-cavestartup-adapter] Unleash start command completed');
          resolve();
        } else {
          log('warn', '[unleash-cavestartup-adapter] docker compose exited with code ' + code + (stderr ? ': ' + stderr.slice(-500) : ''));
          resolve();
        }
      });
    });

    const urlToCheck = (unleashUrl && unleashUrl.trim()) ? unleashUrl.trim() : 'http://localhost:4242';
    const baseUrl = urlToCheck.replace(/\/$/, '');

    log('info', '[unleash-cavestartup-adapter] Waiting for Unleash at ' + baseUrl + ' (timeout ' + READINESS_TIMEOUT_MS + 'ms)');

    const deadline = Date.now() + READINESS_TIMEOUT_MS;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(baseUrl + '/health', { method: 'GET', signal: AbortSignal.timeout(5000) });
        if (res.ok || res.status === 200) {
          log('info', '[unleash-cavestartup-adapter] Unleash is ready');
          return;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, READINESS_POLL_MS));
    }

    log('warn', '[unleash-cavestartup-adapter] Unleash readiness wait timed out; continuing anyway');
  }

  return { startUp };
}

export default { createUnleashStartupAdapter };
