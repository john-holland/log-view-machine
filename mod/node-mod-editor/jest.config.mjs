export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Test file patterns (include editor auth unit test)
  testMatch: [
    '**/zoom-state-machine.cjs.test.js',
    '**/__tests__/can-publish.cjs.test.js',
    '**/__tests__/cave-adapters.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/component-middleware/generic-editor/assets/js/core/zoom-state-machine.cjs.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(babel-jest)/)'
  ],
};
