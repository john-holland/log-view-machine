/**
 * Jest mock for log-view-machine (avoids ESM/CJS mismatch in tests).
 */
function createRobotCopy(config = {}) {
  return {
    config: { nodeBackendUrl: 'http://localhost:3004', apiBasePath: '/api/fish-burger', ...config },
    sendMessage: jest.fn().mockResolvedValue({}),
  };
}

module.exports = { createRobotCopy };
