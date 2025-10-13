export default {
  // Test environment
  testEnvironment: 'node',
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest',
  },
  
  // Test file patterns - only include example tests
  testMatch: [
    '**/example/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/example/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Exclude patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/editor-build/',
    '/editor-dist/',
    '/example/node-example/tests/e2e/',  // Keep e2e tests separate
    '\\.d\\.ts$'
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^log-view-machine$': '<rootDir>/src/index.ts',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'example/**/*.{js,jsx,ts,tsx}',
    '!example/**/*.d.ts',
    '!example/**/node_modules/**',
  ],
  
  // Test timeout - examples may take longer
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // TypeScript configuration
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    },
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(xstate|@xstate)/)'
  ],
  
  // Extensions to treat as ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
};

