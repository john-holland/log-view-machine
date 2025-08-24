import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Post-build function to copy package files
function copyPackageFiles() {
  const scriptsDir = join(__dirname, 'scripts');
  const editorBuildDir = join(__dirname, 'editor-build');
  
  // Ensure editor-build directory exists
  if (!existsSync(editorBuildDir)) {
    mkdirSync(editorBuildDir, { recursive: true });
  }
  
  // Copy package files
  const filesToCopy = [
    'tome-connector-studio-package.json',
    'tome-connector-studio-cli.js', 
    'tome-connector-studio-README.md',
    'LICENSE'
  ];
  
  filesToCopy.forEach(file => {
    const source = join(scriptsDir, file);
    let dest = join(editorBuildDir, file);
    
    // Remove the prefix for destination files
    if (file.startsWith('tome-connector-studio-')) {
      dest = join(editorBuildDir, file.replace('tome-connector-studio-', ''));
    }
    
    if (existsSync(source)) {
      copyFileSync(source, dest);
      console.log(`📁 Copied ${file} to editor-build/`);
    }
  });
  
  // Make CLI executable
  const cliPath = join(editorBuildDir, 'cli.js');
  if (existsSync(cliPath)) {
    try {
      const { chmodSync } = require('fs');
      chmodSync(cliPath, '755');
      console.log('🔧 Made CLI executable');
    } catch (error) {
      console.log('⚠️  Could not make CLI executable (this is normal on some systems)');
    }
  }
}

export default {
  input: 'log-view-machine/src/editor-server.ts',
  output: {
    file: 'editor-build/editor-server.js',
    format: 'es',
    sourcemap: true
  },
  external: [
    'react',
    'react-dom',
    '@xstate/react',
    'xstate',
    'graphql',
    'express',
    'cors',
    'helmet'
  ],
  plugins: [
    resolve(),
    commonjs(),
    json(),
    typescript({
      tsconfig: './log-view-machine/tsconfig.build.json',
      declaration: false
    }),
    {
      name: 'copy-package-files',
      writeBundle() {
        copyPackageFiles();
      }
    }
  ]
};
