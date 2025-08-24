#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { discoverEditors } from './discover-editors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

/**
 * Find an available port starting from the given port
 */
async function findAvailablePort(startPort = 3000) {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

/**
 * Run the selected editor
 */
async function runEditor(editorNumber, customPort = null) {
  try {
    const editors = discoverEditors();
    
    if (editors.length === 0) {
      console.log('❌ No editors found. Run "npm run editor:discover" first.');
      process.exit(1);
    }
    
    if (editorNumber < 1 || editorNumber > editors.length) {
      console.log(`❌ Invalid editor number. Choose between 1 and ${editors.length}`);
      process.exit(1);
    }
    
    const selectedEditor = editors[editorNumber - 1];
    console.log(`🚀 Starting ${selectedEditor.type}...`);
    console.log(`📁 Path: ${selectedEditor.path}`);
    console.log(`🔧 Server: ${selectedEditor.serverPath}`);
    
    // Determine port
    let port = customPort;
    if (!port) {
      if (selectedEditor.type === 'main-editor') {
        port = 3003; // Default for main editor
      } else {
        port = 3006; // Default for generic editors
      }
    }
    
    // Find available port
    const availablePort = await findAvailablePort(port);
    if (availablePort !== port) {
      console.log(`⚠️  Port ${port} is in use, using port ${availablePort} instead`);
      port = availablePort;
    }
    
    console.log(`🌐 Port: ${port}`);
    console.log(`🔗 URL: http://localhost:${port}`);
    console.log('');
    
    // Set environment variables
    const env = {
      ...process.env,
      PORT: port.toString(),
      EDITOR_PORT: port.toString(),
      NODE_ENV: 'development'
    };
    
    // Change to the editor directory
    const editorDir = resolve(selectedEditor.editorPath);
    process.chdir(editorDir);
    
    // Start the editor server
    const child = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: env,
      cwd: editorDir
    });
    
    // Handle process events
    child.on('error', (error) => {
      console.error('❌ Failed to start editor:', error.message);
      process.exit(1);
    });
    
    child.on('exit', (code) => {
      if (code !== 0) {
        console.log(`\n⚠️  Editor exited with code ${code}`);
      }
      process.exit(code || 0);
    });
    
    // Handle interrupt signals
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down editor...');
      child.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down editor...');
      child.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error('❌ Error running editor:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔍 Usage: npm run editor:run -- <editor-number> [port]');
    console.log('');
    console.log('Available editors:');
    const editors = discoverEditors();
    editors.forEach((editor, index) => {
      console.log(`  ${index + 1}. ${editor.type} - ${editor.path}`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  npm run editor:run -- 1        # Run first editor on default port');
    console.log('  npm run editor:run -- 2 3007   # Run second editor on port 3007');
    process.exit(1);
  }
  
  const editorNumber = parseInt(args[0]);
  const customPort = args[1] ? parseInt(args[1]) : null;
  
  if (isNaN(editorNumber)) {
    console.log('❌ Invalid editor number. Must be a number.');
    process.exit(1);
  }
  
  if (customPort && (isNaN(customPort) || customPort < 1024 || customPort > 65535)) {
    console.log('❌ Invalid port number. Must be between 1024 and 65535.');
    process.exit(1);
  }
  
  await runEditor(editorNumber, customPort);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

export { runEditor };
