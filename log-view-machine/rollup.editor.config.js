import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
  input: 'src/editor-server.ts',
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
      tsconfig: './tsconfig.build.json',
      declaration: false
    })
  ]
};
