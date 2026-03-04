// Jest setup file for testing environment

// Polyfill fetch for Pact tests (jsdom does not provide fetch; Node 18+ has it in node env)
if (typeof globalThis.fetch === 'undefined') {
  try {
    const { fetch } = require('undici');
    globalThis.fetch = fetch;
  } catch {
    // Node 18+ has native fetch in node env
  }
}

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock DOM methods that might not be available (skip in node env)
if (typeof window !== 'undefined') {
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
