// Jest setup file for testing environment
import '@testing-library/jest-dom';

// Mock DOM environment for tests that need it
if (typeof document === 'undefined') {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.navigator = dom.window.navigator;
}

// Mock import.meta for Jest compatibility
global.import = {
  meta: {
    url: 'file://test.js'
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock process.argv for tests
global.process = {
  ...global.process,
  argv: ['node', 'test.js']
};

// Global test utilities
global.testUtils = {
  // Helper to create mock DOM elements
  createMockElement: (tagName = 'div', id = 'test-element') => {
    const element = document.createElement(tagName);
    element.id = id;
    return element;
  },
  
  // Helper to clean up DOM after tests
  cleanupDOM: () => {
    document.body.innerHTML = '';
  },
  
  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after each test
afterEach(() => {
  global.testUtils.cleanupDOM();
  jest.clearAllMocks();
});

// Suppress React warnings about act() in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('inside a test was not wrapped in act(...)')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
