import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import json from '@rollup/plugin-json';

const config = [
  // Browser-compatible build (ESM only, no OpenTelemetry)
  {
    input: 'src/index-browser.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
      inlineDynamicImports: true
    },
    external: [
      'react',
      'react-dom',
      '@xstate/react',
      'xstate',
      'graphql',
      // OpenTelemetry packages that should not be bundled for browser
      '@opentelemetry/api',
      '@opentelemetry/auto-instrumentations-node',
      '@opentelemetry/exporter-jaeger',
      '@opentelemetry/exporter-prometheus',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-node',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/sdk-metrics',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/exporter-metrics-otlp-http',
      // Node.js modules that should not be bundled for browser
      'path',
      'tty',
      'util',
      'fs',
      'net',
      'events',
      'stream',
      'zlib',
      'buffer',
      'string_decoder',
      'querystring',
      'url',
      'http',
      'crypto',
      'vm',
      'assert',
      'process',
      'util-deprecate',
      'stream-browserify',
      'readable-stream',
      'destroy',
      'morgan',
      'winston',
      'express',
      'cors',
      'helmet',
      'stream-http',
      'readable-stream'
    ],
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true,
        exportConditions: ['browser', 'import', 'module', 'default']
      }),
      commonjs({
        ignore: ['path', 'tty', 'util', 'fs', 'net', 'events', 'stream', 'zlib', 'buffer', 'string_decoder', 'querystring', 'url', 'http', 'crypto', 'vm', 'assert', 'process', 'util-deprecate', 'stream-browserify', 'readable-stream', 'destroy', 'morgan', 'winston', 'express', 'cors', 'helmet', 'stream-http'],
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto',
        esmExternals: true,
        dynamicRequireTargets: []
      }),
      json(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        filterRoot: process.cwd(),
        compilerOptions: {
          skipLibCheck: true
        },
        outputToFilesystem: false,
        noForceEmit: true,
        exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx']
      })
    ]
  },
      // Full build with OpenTelemetry (CommonJS)
      {
        input: 'src/index.ts',
        output: {
          file: 'dist/index.js',
          format: 'cjs',
          sourcemap: true,
          inlineDynamicImports: true
        },
        external: [
          'react',
          'react-dom',
          '@xstate/react',
          'xstate',
          'graphql',
          // OpenTelemetry packages - keep as external to avoid 'this is undefined' issues
          '@opentelemetry/api',
          '@opentelemetry/auto-instrumentations-node',
          '@opentelemetry/exporter-jaeger',
          '@opentelemetry/exporter-prometheus',
          '@opentelemetry/resources',
          '@opentelemetry/sdk-node',
          '@opentelemetry/semantic-conventions',
          '@opentelemetry/sdk-trace-node',
          '@opentelemetry/sdk-metrics',
          '@opentelemetry/exporter-trace-otlp-http',
          '@opentelemetry/exporter-metrics-otlp-http',
          // Node.js built-in modules
          'path',
          'tty',
          'util',
          'fs',
          'net',
          'events',
          'stream',
          'zlib',
          'buffer',
          'string_decoder',
          'querystring',
          'url',
          'http',
          'crypto',
          'vm',
          'assert',
          'process',
          'async_hooks',
          'os',
          'child_process',
          'cluster',
          'dgram',
          'dns',
          'https',
          'http2',
          'tls',
          'readline',
          'repl',
          'timers',
          'tty',
          'worker_threads',
          'worker_threads'
        ],
        plugins: [
          resolve({
            preferBuiltins: true,
            exportConditions: ['node', 'import', 'module', 'default']
          }),
          commonjs({
            transformMixedEsModules: true,
            requireReturnsDefault: 'auto',
            esmExternals: true,
            dynamicRequireTargets: []
          }),
          json(),
          typescript({
            tsconfig: './tsconfig.build.json',
            declaration: true,
            filterRoot: process.cwd(),
            compilerOptions: {
              skipLibCheck: true
            },
            exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
            outputToFilesystem: false,
            noForceEmit: true
          })
        ]
      },
      // TomeAPI Router (server-side)
      {
        input: 'src/server/TomeAPIRouter.ts',
        output: {
          file: 'dist/server/TomeAPIRouter.js',
          format: 'cjs',
          sourcemap: true,
          inlineDynamicImports: true
        },
        external: [
          'express',
          'react',
          'react-dom',
          '@xstate/react',
          'xstate',
          'graphql',
          // OpenTelemetry packages
          '@opentelemetry/api',
          '@opentelemetry/auto-instrumentations-node',
          '@opentelemetry/exporter-jaeger',
          '@opentelemetry/exporter-prometheus',
          '@opentelemetry/resources',
          '@opentelemetry/sdk-node',
          '@opentelemetry/semantic-conventions',
          '@opentelemetry/sdk-trace-node',
          '@opentelemetry/sdk-metrics',
          '@opentelemetry/exporter-trace-otlp-http',
          '@opentelemetry/exporter-metrics-otlp-http',
          // Node.js built-in modules
          'path', 'tty', 'util', 'fs', 'net', 'events', 'stream', 'zlib', 'buffer',
          'string_decoder', 'querystring', 'url', 'http', 'crypto', 'vm', 'assert',
          'process', 'async_hooks', 'os', 'child_process', 'cluster', 'dgram', 'dns',
          'https', 'http2', 'tls', 'readline', 'repl', 'timers', 'worker_threads'
        ],
        plugins: [
          resolve({
            preferBuiltins: true,
            exportConditions: ['node', 'import', 'module', 'default']
          }),
          commonjs({
            transformMixedEsModules: true,
            requireReturnsDefault: 'auto',
            esmExternals: true,
            dynamicRequireTargets: []
          }),
          json(),
          typescript({
            tsconfig: './tsconfig.build.json',
            declaration: true,
            filterRoot: process.cwd(),
            compilerOptions: {
              skipLibCheck: true
            },
            exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
            outputToFilesystem: false,
            noForceEmit: true
          })
        ]
      },
  {
    input: 'src/simple-server.ts',
    output: {
      file: 'dist/server.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
    },
    external: [
      'react',
      'react-dom',
      '@xstate/react',
      'xstate',
      'graphql',
      'express',
      // OpenTelemetry packages
      '@opentelemetry/api',
      '@opentelemetry/auto-instrumentations-node',
      '@opentelemetry/exporter-jaeger',
      '@opentelemetry/exporter-prometheus',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-node',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/sdk-metrics',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/exporter-metrics-otlp-http',
      // Node.js built-in modules
      'path', 'tty', 'util', 'fs', 'net', 'events', 'stream', 'zlib', 'buffer',
      'string_decoder', 'querystring', 'url', 'http', 'crypto', 'vm', 'assert',
      'process', 'async_hooks', 'os', 'child_process', 'cluster', 'dgram', 'dns',
      'https', 'http2', 'tls', 'readline', 'repl', 'timers', 'worker_threads'
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
        exportConditions: ['node', 'import', 'module', 'default']
      }),
      commonjs({
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto',
        esmExternals: true,
        dynamicRequireTargets: []
      }),
      json(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        filterRoot: process.cwd(),
        compilerOptions: {
          skipLibCheck: true
        },
        outputToFilesystem: false,
        noForceEmit: true,
        exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx']
      })
    ]
  },
  {
    input: 'src/examples/OpenTelemetryIntegrationExample.ts',
    output: {
      file: 'dist/examples/OpenTelemetryIntegrationExample.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
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
      // All OpenTelemetry packages
      '@opentelemetry/api',
      '@opentelemetry/auto-instrumentations-node',
      '@opentelemetry/exporter-jaeger',
      '@opentelemetry/exporter-prometheus',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-node',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/sdk-metrics',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/exporter-metrics-otlp-http',
      // Node.js built-in modules
      'path', 'tty', 'util', 'fs', 'net', 'events', 'stream', 'zlib', 'buffer',
      'string_decoder', 'querystring', 'url', 'http', 'crypto', 'vm', 'assert',
      'process', 'async_hooks', 'os', 'child_process', 'cluster', 'dgram', 'dns',
      'https', 'http2', 'tls', 'readline', 'repl', 'timers', 'worker_threads'
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
        exportConditions: ['node', 'import', 'module', 'default']
      }),
      commonjs({
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto',
        esmExternals: true,
        dynamicRequireTargets: []
      }),
      json(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        filterRoot: process.cwd(),
        compilerOptions: {
          skipLibCheck: true
        },
        outputToFilesystem: false,
        noForceEmit: true,
        exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx']
      })
    ]
  },
  {
    input: 'src/examples/StackTraceExample.ts',
    output: {
      file: 'dist/examples/StackTraceExample.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
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
        declaration: false,
        filterRoot: process.cwd(),
        compilerOptions: {
          skipLibCheck: true
        },
        outputToFilesystem: false,
        noForceEmit: true,
        exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx']
      })
    ]
  },
  {
    input: 'src/editor-server.ts',
    output: {
      file: 'editor-dist/editor-server.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
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
        declaration: false,
        filterRoot: process.cwd(),
        compilerOptions: {
          skipLibCheck: true
        },
        outputToFilesystem: false,
        noForceEmit: true,
        exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx']
      })
    ]
  },
  // Generate TypeScript declaration files
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    plugins: [dts()]
  },
  {
    input: 'src/index-browser.ts',
    output: {
      file: 'dist/index-browser.d.ts',
      format: 'esm'
    },
    plugins: [dts()]
  }
];

export default config;
