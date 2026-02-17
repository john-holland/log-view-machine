/**
 * Docker Startup Adapter
 * Generic adapter: start any set of services via docker-compose at app startup.
 * Use for continuum, DBs, or other stacks without a dedicated adapter per service.
 */

import { spawn } from 'child_process';
import path from 'path';

const READINESS_POLL_MS = 2000;
const DEFAULT_READINESS_TIMEOUT_MS = 90000;

/**
 * @param {Object} options
 * @param {boolean} [options.enabled=true] - If false, startUp() no-ops.
 * @param {(toggleName: string) => Promise<boolean>} [options.isEnabled] - If provided, start only when isEnabled(toggleName) is true (e.g. Unleash). Pass toggle name when calling.
 * @param {string} [options.toggleName] - Toggle name for isEnabled (e.g. 'docker-startup-enabled').
 * @param {string} [options.composePath] - Path to docker-compose file. Default from process.env.DOCKER_STARTUP_COMPOSE_PATH or cwd/docker-compose.yml.
 * @param {string} [options.composeProject] - Docker Compose project name (e.g. process.env.DOCKER_STARTUP_PROJECT).
 * @param {string[]} [options.services] - Service names to start (e.g. ['app', 'db']). Default from process.env.DOCKER_STARTUP_SERVICES (comma-separated) or ['app'].
 * @param {string} [options.readinessUrl] - URL to poll until ready (optional). If missing, skip wait.
 * @param {number} [options.readinessTimeoutMs] - Max ms to wait for readiness. Default 90000.
 * @param {{ info?: (msg: string) => void, warn?: (msg: string) => void, error?: (msg: string) => void }} [options.logger]
 * @returns {{ startUp(): Promise<void> }}
 */
export function createDockerStartupAdapter(options) {
  const {
    enabled = true,
    isEnabled,
    toggleName = 'docker-startup-enabled',
    composePath = process.env.DOCKER_STARTUP_COMPOSE_PATH || '',
    composeProject = process.env.DOCKER_STARTUP_PROJECT || undefined,
    services = (process.env.DOCKER_STARTUP_SERVICES || 'app').split(',').map((s) => s.trim()).filter(Boolean),
    readinessUrl = process.env.DOCKER_STARTUP_READINESS_URL || '',
    readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS,
    logger = {},
  } = options;

  const log = (fn, msg) => { if (logger[fn]) logger[fn](msg); };

  async function startUp() {
    if (enabled === false) {
      return;
    }

    if (typeof isEnabled === 'function') {
      const allowed = await isEnabled(toggleName);
      if (!allowed) {
        log('info', '[docker-cavestartup-adapter] Toggle ' + toggleName + ' is false; skipping Docker start');
        return;
      }
    }

    const composeFile = (composePath && composePath.trim()) || path.join(process.cwd(), 'docker-compose.yml');
    const serviceList = Array.isArray(services) && services.length > 0 ? services : ['app'];
    const args = ['compose', '-f', composeFile];
    if (composeProject) args.push('-p', composeProject);
    args.push('up', '-d', ...serviceList);

    log('info', '[docker-cavestartup-adapter] Starting: docker ' + args.join(' '));

    await new Promise((resolve, reject) => {
      const proc = spawn('docker', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });
      let stderr = '';
      proc.stderr?.on('data', (chunk) => { stderr += chunk; });
      proc.on('error', (err) => {
        log('error', '[docker-cavestartup-adapter] spawn error: ' + (err?.message || err));
        reject(err);
      });
      proc.on('close', (code) => {
        if (code === 0) {
          log('info', '[docker-cavestartup-adapter] docker compose up completed');
          resolve();
        } else {
          log('warn', '[docker-cavestartup-adapter] docker compose exited with code ' + code + (stderr ? ': ' + stderr.slice(-500) : ''));
          resolve();
        }
      });
    });

    const urlToCheck = (readinessUrl && readinessUrl.trim()) ? readinessUrl.trim() : '';
    if (!urlToCheck) {
      return;
    }

    const baseUrl = urlToCheck.replace(/\/$/, '');
    log('info', '[docker-cavestartup-adapter] Waiting for readiness at ' + baseUrl + ' (timeout ' + readinessTimeoutMs + 'ms)');

    const deadline = Date.now() + readinessTimeoutMs;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(baseUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
        if (res.ok || res.status === 200 || res.status === 302 || res.status === 401) {
          log('info', '[docker-cavestartup-adapter] Readiness check passed');
          return;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, READINESS_POLL_MS));
    }

    log('warn', '[docker-cavestartup-adapter] Readiness wait timed out; continuing anyway');
  }

  return { startUp };
}

export default { createDockerStartupAdapter };
