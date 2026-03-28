/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs'],
  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.mjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: ['node_modules/(?!(babel-jest)/)'],
  moduleNameMapper: {
    '^log-view-machine$': '<rootDir>/__mocks__/log-view-machine.js',
  },
};
