/**
 * Port Cave Startup Adapter
 * Kills any process listening on a given port before the server starts.
 */

import { execSync } from 'child_process';
import { platform } from 'os';

/**
 * Kill the process using the given port, if any. No-op if port is free or kill fails.
 * @param {number} port - Port to free (e.g. 3000)
 * @param {{ logger?: { info?: (msg: string) => void } }} [options] - Optional logger
 * @returns {Promise<void>}
 */
export async function killProcessOnPort(port, options = {}) {
  const log = options.logger?.info ? (msg) => options.logger.info(msg) : () => {};
  const portStr = String(port);

  try {
    if (platform() === 'win32') {
      const out = execSync('netstat -ano', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const lines = out.split(/\r?\n/);
      const pids = new Set();
      for (const line of lines) {
        if (line.includes(`:${portStr}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && /^\d+$/.test(pid)) pids.add(pid);
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: ['pipe', 'pipe', 'pipe'] });
          log(`Port ${port}: killed process ${pid}`);
        } catch (_) {}
      }
    } else {
      const pidsOut = execSync(`lsof -ti:${portStr}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      const pids = pidsOut ? pidsOut.split(/\s+/).filter(Boolean) : [];
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: ['pipe', 'pipe', 'pipe'] });
          log(`Port ${port}: killed process ${pid}`);
        } catch (_) {}
      }
    }
  } catch (e) {
    if (e.status !== 1 && e.code !== 'ENOENT') {
      log(`Port ${port}: could not free port (${e.message || e})`);
    }
  }
}

export default { killProcessOnPort };
