/**
 * OpenTelemetry Startup Adapter
 * Starts the OTEL collector service via docker-compose.
 * Optional: only start when toggle 'otel-startup-enabled' is true.
 */

import { spawn } from 'child_process';
import path from 'path';

const DEFAULT_SERVICE = 'otel-collector';
const READINESS_TIMEOUT_MS = 60000;
const READINESS_POLL_MS = 2000;

/**
 * @param {Object} options
 * @param {boolean} options.startOtel - If false, startUp() no-ops.
 * @param {(toggleName: string) => Promise<boolean>} [options.otelIsEnabled] - If provided, start only when otelIsEnabled('otel-startup-enabled') is true.
 * @param {string} [options.otelEndpoint] - URL for readiness (e.g. collector health). If missing, skip wait.
 * @param {{ info?: (msg: string) => void, warn?: (msg: string) => void, error?: (msg: string) => void }} [options.logger]
 * @param {string} [options.composePath] - Path to docker-compose file. Default from process.env.OTEL_COMPOSE_PATH or cwd.
 * @param {string} [options.composeProject] - Docker Compose project name.
 * @returns {{ startUp(): Promise<void> }}
 */
export function createOtelStartupAdapter(options) {
  const {
    startOtel = false,
    otelIsEnabled,
    otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    logger = {},
    composePath = process.env.OTEL_COMPOSE_PATH || '',
    composeProject,
  } = options;

  const log = (fn, msg) => { if (logger[fn]) logger[fn](msg); };

  async function startUp() {
    if (startOtel === false) {
      return;
    }

    if (typeof otelIsEnabled === 'function') {
      const enabled = await otelIsEnabled('otel-startup-enabled');
      if (!enabled) {
        log('info', '[opentelemetry-cavestartup-adapter] Toggle otel-startup-enabled is false; skipping OTEL start');
        return;
      }
    }

    const composeFile = composePath.trim() || path.join(process.cwd(), 'docker-compose.yml');
    const args = ['compose', '-f', composeFile];
    if (composeProject) args.push('-p', composeProject);
    args.push('up', '-d', DEFAULT_SERVICE);

    log('info', '[opentelemetry-cavestartup-adapter] Starting OTEL collector: docker ' + args.join(' '));

    await new Promise((resolve, reject) => {
      const proc = spawn('docker', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });
      let stderr = '';
      proc.stderr?.on('data', (chunk) => { stderr += chunk; });
      proc.on('error', (err) => {
        log('error', '[opentelemetry-cavestartup-adapter] spawn error: ' + (err?.message || err));
        reject(err);
      });
      proc.on('close', (code) => {
        if (code === 0) {
          log('info', '[opentelemetry-cavestartup-adapter] OTEL collector start command completed');
          resolve();
        } else {
          log('warn', '[opentelemetry-cavestartup-adapter] docker compose exited with code ' + code + (stderr ? ': ' + stderr.slice(-500) : ''));
          resolve();
        }
      });
    });

    const urlToCheck = (otelEndpoint && otelEndpoint.trim()) ? otelEndpoint.trim().replace(/\/v1\/traces$/, '') : 'http://localhost:4318';
    const baseUrl = urlToCheck.replace(/\/$/, '');

    log('info', '[opentelemetry-cavestartup-adapter] Waiting for OTEL collector at ' + baseUrl + ' (timeout ' + READINESS_TIMEOUT_MS + 'ms)');

    const deadline = Date.now() + READINESS_TIMEOUT_MS;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(baseUrl + '/v1/traces', { method: 'POST', body: '', signal: AbortSignal.timeout(3000) });
        if (res.status === 200 || res.status === 404 || res.status === 405) {
          log('info', '[opentelemetry-cavestartup-adapter] OTEL collector is ready');
          return;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, READINESS_POLL_MS));
    }

    log('warn', '[opentelemetry-cavestartup-adapter] OTEL collector readiness wait timed out; continuing anyway');
  }

  return { startUp };
}

export default { createOtelStartupAdapter };
