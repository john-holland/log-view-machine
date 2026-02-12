#!/usr/bin/env node
/**
 * Merge docker-compose.fragment.yml from dependencies into docker-compose.generated.yml.
 * Run from example/node-example: npm run compose:merge
 * Reads package.json dependencies (and devDependencies), for each package that has
 * docker-compose.fragment.yml in its package root, merges services/volumes/networks (last wins per key).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const packageJsonPath = join(cwd, 'package.json');
const outPath = join(cwd, 'docker-compose.generated.yml');

const FRAGMENT_FILE = 'docker-compose.fragment.yml';

async function loadYaml(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  try {
    const { parse } = await import('yaml');
    return parse(raw);
  } catch (_) {}
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    return require('js-yaml').load(raw);
  } catch (_) {}
  console.warn('merge-compose-fragments: no yaml parser (install yaml or js-yaml). Skipping merge.');
  return null;
}

async function findFragmentPath(pkgName) {
  try {
    const resolved = await import.meta.resolve(`${pkgName}/package.json`);
    const pkgRoot = dirname(fileURLToPath(resolved));
    const fragmentPath = join(pkgRoot, FRAGMENT_FILE);
    return existsSync(fragmentPath) ? fragmentPath : null;
  } catch (_) {}
  const local = join(cwd, 'node_modules', pkgName, FRAGMENT_FILE);
  if (existsSync(local)) return local;
  const hoisted = join(cwd, '..', '..', 'node_modules', pkgName, FRAGMENT_FILE);
  if (existsSync(hoisted)) return hoisted;
  return null;
}

function mergeCompose(target, source) {
  return {
    services: { ...target.services, ...(source.services || {}) },
    volumes: { ...target.volumes, ...(source.volumes || {}) },
    networks: { ...target.networks, ...(source.networks || {}) },
  };
}

async function main() {
  if (!existsSync(packageJsonPath)) {
    console.warn('merge-compose-fragments: no package.json in cwd');
    process.exit(0);
  }
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...(pkg.devDependencies || {}) };
  let merged = { services: {}, volumes: {}, networks: {} };

  for (const name of Object.keys(deps)) {
    const fragmentPath = await findFragmentPath(name);
    if (!fragmentPath) continue;
    let data;
    try {
      data = await loadYaml(fragmentPath);
    } catch (e) {
      console.warn('merge-compose-fragments: failed to load', fragmentPath, e?.message);
      continue;
    }
    if (!data || typeof data !== 'object') continue;
    merged = mergeCompose(merged, data);
    console.log('merge-compose-fragments: included', name);
  }

  const hasServices = Object.keys(merged.services).length > 0;
  if (!hasServices) {
    console.log('merge-compose-fragments: no fragments found; skipping write');
    process.exit(0);
  }

  let out;
  try {
    const { stringify } = await import('yaml');
    out = stringify(merged);
  } catch (_) {
    const { createRequire } = await import('module');
    out = createRequire(import.meta.url)('js-yaml').dump(merged);
  }
  writeFileSync(outPath, out, 'utf8');
  console.log('merge-compose-fragments: wrote', outPath);
}

main().catch((err) => {
  console.error('merge-compose-fragments:', err);
  process.exit(1);
});
