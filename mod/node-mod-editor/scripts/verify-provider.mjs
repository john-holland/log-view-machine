/**
 * Pact provider verification for Mod API.
 * Runs the pact-provider-server, then verifies against the consumer pact file.
 * Run `npm run test:pact` first to generate the pact file.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { Verifier } from '@pact-foundation/pact';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pactsDir = path.resolve(__dirname, '../pacts');
const pactFile = path.join(pactsDir, 'ModApiConsumer-ModIndexProvider.json');

const providerPort = parseInt(process.env.PACT_PROVIDER_PORT || '9292', 10);
const providerBaseUrl = `http://127.0.0.1:${providerPort}`;
const providerStatesSetupUrl = `${providerBaseUrl}/provider-states`;

async function waitForServer(url, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error(`Server at ${url} did not become ready`);
}

async function main() {
  if (!existsSync(pactFile)) {
    throw new Error(
      `Pact file not found: ${pactFile}\nRun "npm run test:pact" first to generate the contract.`
    );
  }

  let serverProcess = null;

  try {
    serverProcess = spawn('node', ['scripts/pact-provider-server.js'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PACT_PROVIDER_PORT: String(providerPort) },
    });

    serverProcess.stdout?.on('data', (d) => process.stdout.write(d));
    serverProcess.stderr?.on('data', (d) => process.stderr.write(d));

    await waitForServer(`${providerBaseUrl}/api/mods`);

    const verifier = new Verifier({
      provider: 'ModIndexProvider',
      providerBaseUrl,
      providerStatesSetupUrl,
      pactUrls: [pactFile],
      logLevel: 'warn',
    });

    await verifier.verifyProvider();
    console.log('Pact provider verification passed.');
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

main().catch((err) => {
  console.error('Pact provider verification failed:', err);
  process.exit(1);
});
