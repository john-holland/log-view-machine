#!/usr/bin/env node
/**
 * Build ESM bundle (index.esm.js) for log-view-machine.
 * Uses esbuild to create a single-file ESM bundle with externals for peer deps.
 */
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, '..');

await esbuild.build({
  entryPoints: [path.join(pkgRoot, 'src/index.ts')],
  bundle: true,
  format: 'esm',
  outfile: path.join(pkgRoot, 'dist/index.esm.js'),
  platform: 'neutral', // works in both Node and browser
  target: 'es2020',
  sourcemap: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'xstate',
    '@xstate/react',
    'express',
  ],
});

console.log('Built dist/index.esm.js');
