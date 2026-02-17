#!/usr/bin/env node
/**
 * CLI: write pact-results.json. Usage: node write-results.js <pass|fail> [outputPath]
 * Or: pact-cavemod-write-results pass
 */

import { writePactResults } from '../src/write-results.js';

const status = process.argv[2] || 'fail';
const outputPath = process.argv[3] || 'pact-results.json';
if (status !== 'pass' && status !== 'fail') {
  console.error('Usage: pact-cavemod-write-results <pass|fail> [outputPath]');
  process.exit(1);
}
const path = writePactResults({ status, outputPath });
console.log('Wrote', path);
