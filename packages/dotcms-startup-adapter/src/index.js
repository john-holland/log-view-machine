/**
 * dotCMS Startup Adapter
 * Starts the dotCMS (backend) service via docker-compose so existing DOTCMS_* credentials point at a running instance.
 * Optional: only start when Unleash toggle 'dotcms-startup-enabled' is true.
 */

import { spawn } from 'child_process';
import path from 'path';

const DEFAULT_COMPOSE_SERVICE = 'dotcms';
const READINESS_TIMEOUT_MS = 120000;
const READINESS_POLL_MS = 2000;

/**
 * @param {Object} options
 * @param {boolean} options.startDotcms - If false, startUp() no-ops. If true, may start dotCMS (subject to Unleash).
 * @param {(toggleName: string) => Promise<boolean>} [options.unleashIsEnabled] - If provided, start only when unleashIsEnabled('dotcms-startup-enabled') is true.
 * @param {string} [options.dotCmsUrl] - URL to poll for readiness (e.g. from process.env.DOTCMS_URL). If missing, skip wait.
 * @param {{ info?: (msg: string) => void, warn?: (msg: string) => void, error?: (msg: string) => void }} [options.logger]
 * @param {string} [options.composePath] - Path to docker-compose file. Default from process.env.DOTCMS_COMPOSE_PATH or cwd-relative.
 * @param {string} [options.composeProject] - Docker Compose project name.
 * @returns {{ startUp(): Promise<void> }}
 */
export function createDotcmsStartupAdapter(options) {
  const {
    startDotcms = false,
    unleashIsEnabled,
    dotCmsUrl = process.env.DOTCMS_URL || '',
    logger = {},
    composePath = process.env.DOTCMS_COMPOSE_PATH || '',
    composeProject,
  } = options;

  const log = (fn, msg) => { if (logger[fn]) logger[fn](msg); };

  async function startUp() {
    if (startDotcms === false) {
      return;
    }

    if (typeof unleashIsEnabled === 'function') {
      const enabled = await unleashIsEnabled('dotcms-startup-enabled');
      if (!enabled) {
        log('info', '[dotcms-startup-adapter] Unleash toggle dotcms-startup-enabled is false; skipping dotCMS start');
        return;
      }
    }

    const composeFile = composePath.trim() || path.join(process.cwd(), 'docker-compose.yml');
    const args = ['compose', '-f', composeFile];
    if (composeProject) args.push('-p', composeProject);
    args.push('up', '-d', DEFAULT_COMPOSE_SERVICE);

    log('info', '[dotcms-startup-adapter] Starting dotCMS: docker ' + args.join(' '));

    await new Promise((resolve, reject) => {
      const proc = spawn('docker', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });
      let stderr = '';
      proc.stderr?.on('data', (chunk) => { stderr += chunk; });
      proc.on('error', (err) => {
        log('error', '[dotcms-startup-adapter] spawn error: ' + (err?.message || err));
        reject(err);
      });
      proc.on('close', (code) => {
        if (code === 0) {
          log('info', '[dotcms-startup-adapter] dotCMS start command completed');
          resolve();
        } else {
          log('warn', '[dotcms-startup-adapter] docker compose exited with code ' + code + (stderr ? ': ' + stderr.slice(-500) : ''));
          resolve(); // resolve so app can still start; caller can check DOTCMS_URL health elsewhere
        }
      });
    });

    const urlToCheck = (dotCmsUrl && dotCmsUrl.trim()) ? dotCmsUrl.trim() : 'http://localhost:8080';
    const baseUrl = urlToCheck.replace(/\/$/, '');

    log('info', '[dotcms-startup-adapter] Waiting for dotCMS at ' + baseUrl + ' (timeout ' + READINESS_TIMEOUT_MS + 'ms)');

    const deadline = Date.now() + READINESS_TIMEOUT_MS;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(baseUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
        if (res.ok || res.status === 302 || res.status === 401) {
          log('info', '[dotcms-startup-adapter] dotCMS is ready');
          return;
        }
      } catch (_) {
        // not ready yet
      }
      await new Promise((r) => setTimeout(r, READINESS_POLL_MS));
    }

    log('warn', '[dotcms-startup-adapter] dotCMS readiness wait timed out; continuing anyway');
  }

  return { startUp };
}

export default { createDotcmsStartupAdapter };
