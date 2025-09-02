import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import json from '@rollup/plugin-json';

const config = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    external: [
      'react',
      'react-dom',
      '@xstate/react',
      'xstate',
      'graphql'
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true
      })
    ]
  },
  {
    input: 'src/simple-server.ts',
    output: {
      file: 'dist/server.js',
      format: 'es',
      sourcemap: true
    },
    external: [
      'react',
      'react-dom',
      '@xstate/react',
      'xstate',
      'graphql',
      'express'
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true
      })
    ]
  },
  {
    input: 'src/examples/OpenTelemetryIntegrationExample.ts',
    output: {
      file: 'dist/examples/OpenTelemetryIntegrationExample.js',
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
      'helmet',
      '@opentelemetry/api',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/sdk-metrics',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/exporter-metrics-otlp-http',
      '@opentelemetry/resources',
      '@opentelemetry/semantic-conventions'
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true
      })
    ]
  },
  {
    input: 'src/examples/StackTraceExample.ts',
    output: {
      file: 'dist/examples/StackTraceExample.js',
      format: 'es',
      sourcemap: true
    },
    external: [
      '@opentelemetry/api'
    ],
    plugins: [
      resolve(),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true
      })
    ]
  },
  {
    input: 'src/editor-server.ts',
    output: {
      file: 'editor-dist/editor-server.js',
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
        declaration: true
      })
    ]
  }
];

export default config;
