/**
 * Write pact-results.json to a given path. Used after running consumer Pact tests.
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { MOD_PACT_CONSUMER, MOD_PACT_PROVIDER } from './contract.js';

/**
 * Write pact test result to JSON file.
 * @param {Object} options
 * @param {'pass'|'fail'} options.status - Result of consumer Pact run
 * @param {string} [options.outputPath='pact-results.json'] - Output file path (relative to cwd or absolute)
 * @param {string} [options.consumer] - Consumer name (default MOD_PACT_CONSUMER)
 * @param {string} [options.provider] - Provider name (default MOD_PACT_PROVIDER)
 */
export function writePactResults(options = {}) {
  const {
    status,
    outputPath = 'pact-results.json',
    consumer = MOD_PACT_CONSUMER,
    provider = MOD_PACT_PROVIDER,
  } = options;
  const path = resolve(process.cwd(), outputPath);
  const payload = {
    consumer,
    provider,
    status: status === 'pass' ? 'pass' : 'fail',
    timestamp: new Date().toISOString(),
  };
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf8');
  return path;
}
