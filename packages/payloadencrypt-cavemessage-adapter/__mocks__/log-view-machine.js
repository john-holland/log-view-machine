/**
 * Jest mock for log-view-machine (avoids ESM/CJS mismatch with dist).
 */

function createRobotCopy(config = {}) {
  const instance = {
    config: {
      nodeBackendUrl: config.nodeBackendUrl || 'http://localhost:3001',
      apiBasePath: config.apiBasePath || '/api',
      ...config,
    },
    sendMessage: jest.fn().mockResolvedValue({}),
    generateMessageId: jest.fn().mockReturnValue('mock-msg-id'),
    generateTraceId: jest.fn().mockReturnValue('mock-trace-id'),
    generateSpanId: jest.fn().mockReturnValue('mock-span-id'),
    trackMessage: jest.fn(),
    getMessage: jest.fn(),
    getTraceMessages: jest.fn(),
    getFullTrace: jest.fn(),
    isEnabled: jest.fn().mockResolvedValue(false),
    getBackendUrl: jest.fn().mockResolvedValue('http://localhost:3001'),
    getBackendType: jest.fn().mockResolvedValue('node'),
    setLocation: jest.fn(),
    onResponse: jest.fn(),
    getConfig: jest.fn(function () {
      return this.config;
    }),
  };
  return instance;
}

module.exports = {
  createRobotCopy,
  RobotCopy: {},
};
