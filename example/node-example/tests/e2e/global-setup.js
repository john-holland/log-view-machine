/**
 * Playwright global setup: clear the dev server port so webServer can bind.
 * Runs once before any tests. Prevents "address already in use" when
 * reuseExistingServer is false or when a previous run left a process on the port.
 */
import { execSync } from 'child_process';
import { platform } from 'os';

const PORT = parseInt(process.env.E2E_PORT || process.env.PORT || '3000', 10);

function killProcessOnPort(port) {
  const isWindows = platform() === 'win32';
  try {
    if (isWindows) {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = out.trim().split(/\r?\n/).filter((l) => l.includes('LISTENING'));
      const pids = new Set();
      for (const line of lines) {
        const match = line.trim().split(/\s+/);
        const pid = match[match.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        } catch (_) { /* process may already be gone */ }
      }
      return pids.size;
    } else {
      const pid = execSync(`lsof -ti :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (pid) {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        return 1;
      }
      return 0;
    }
  } catch (_) {
    return 0;
  }
}

export default async function globalSetup() {
  const killed = killProcessOnPort(PORT);
  if (killed > 0) {
    // Brief wait so the OS releases the port
    await new Promise((r) => setTimeout(r, 500));
  }
}
