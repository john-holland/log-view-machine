/**
 * Optional addon build on install. Succeeds even if node-gyp fails (e.g. no Windows SDK).
 * Users can run "npm run rebuild" with proper build tools to build the addon.
 */
const { execSync } = require('child_process');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
process.chdir(packageRoot);
try {
  execSync('node-gyp configure build', { stdio: 'inherit' });
} catch {
  console.warn('proxygen-cave-adapter: native addon build skipped (run "npm run rebuild" with C++ build tools to build).');
}
