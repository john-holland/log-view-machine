#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { join, dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Tome Connector Studio CLI
 * 
 * Usage:
 *   tome-studio                    # Start studio on default port 3003
 *   tome-studio --port 3006       # Start studio on specific port
 *   tome-studio --host 0.0.0.0    # Start studio on specific host
 *   tome-studio --dir ./my-project # Start studio with custom directory
 *   tome-studio --help            # Show help
 *   tome-studio --version         # Show version
 */

const VERSION = '1.2.0';
const DEFAULT_PORT = 3003;
const DEFAULT_HOST = 'localhost';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    port: DEFAULT_PORT,
    host: DEFAULT_HOST,
    help: false,
    version: false,
    dev: false,
    watch: false,
    directory: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
      case '--port':
      case '-p':
        options.port = parseInt(args[++i]) || DEFAULT_PORT;
        break;
      case '--host':
        options.host = args[++i] || DEFAULT_HOST;
        break;
      case '--dir':
      case '--directory':
      case '-d':
        options.directory = args[++i] || null;
        break;
      case '--dev':
      case '--development':
        options.dev = true;
        break;
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.log(`⚠️  Unknown option: ${arg}`);
        } else if (!options.directory) {
          // Treat non-flag arguments as directory
          options.directory = arg;
        }
    }
  }

  return options;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🌊 Tome Connector Studio v${VERSION}

A powerful studio for building and managing Tome Connector components, 
state machines, and integrations.

USAGE:
  tome-studio [options] [directory]

OPTIONS:
  -h, --help              Show this help message
  -v, --version           Show version information
  -p, --port <number>     Port to run on (default: ${DEFAULT_PORT})
  --host <string>         Host to bind to (default: ${DEFAULT_HOST})
  -d, --dir <path>        Custom directory to work with
  --dev, --development    Run in development mode
  -w, --watch             Enable file watching for development

EXAMPLES:
  tome-studio                                    # Start on default port ${DEFAULT_PORT}
  tome-studio --port 3006                       # Start on port 3006
  tome-studio --host 0.0.0.0                    # Bind to all interfaces
  tome-studio --dev --watch                     # Development mode with file watching
  tome-studio --dir ./my-project                # Work with custom directory
  tome-studio ./my-project                      # Work with custom directory (positional)
  tome-studio --port 3006 --dir ./my-project    # Combine options

ENVIRONMENT VARIABLES:
  PORT                        Port to run on
  HOST                        Host to bind to
  NODE_ENV                    Environment (development/production)
  EDITOR_PORT                 Alias for PORT
  ALLOWED_ORIGINS            CORS allowed origins (comma-separated)
  WORKING_DIRECTORY          Custom working directory

For more information, visit:
  https://github.com/viewstatemachine/tome-connector-studio
`);
}

/**
 * Show version information
 */
function showVersion() {
  console.log(`🌊 Tome Connector Studio v${VERSION}`);
  console.log(`📦 A powerful studio for building and managing Tome Connector components`);
  console.log(`🔗 https://github.com/viewstatemachine/tome-connector-studio`);
}

/**
 * Find available port
 */
async function findAvailablePort(startPort) {
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
 * Start the studio
 */
async function startStudio(options) {
  try {
    // Find available port
    const port = await findAvailablePort(options.port);
    if (port !== options.port) {
      console.log(`⚠️  Port ${options.port} is in use, using port ${port} instead`);
    }

    // Set environment variables
    const env = {
      ...process.env,
      PORT: port.toString(),
      EDITOR_PORT: port.toString(),
      HOST: options.host,
      NODE_ENV: options.dev ? 'development' : 'production'
    };

    // Add directory information if specified
    if (options.directory) {
      const resolvedDir = resolve(options.directory);
      if (!existsSync(resolvedDir)) {
        console.error(`❌ Directory not found: ${options.directory}`);
        process.exit(1);
      }
      env.WORKING_DIRECTORY = resolvedDir;
      console.log(`📁 Working directory: ${resolvedDir}`);
    }

    console.log(`🚀 Starting Tome Connector Studio...`);
    console.log(`🌐 Host: ${options.host}`);
    console.log(`🔌 Port: ${port}`);
    console.log(`🔗 URL: http://${options.host}:${port}`);
    console.log(`📊 Health: http://${options.host}:${port}/health`);
    console.log(`🎨 Wave Reader: http://${options.host}:${port}/wave-reader`);
    if (options.directory) {
      console.log(`📁 Project: ${options.directory}`);
    }
    console.log('');

    // Determine command and arguments
    let command = 'node';
    let args = ['editor-server.js'];
    
    if (options.watch || options.dev) {
      command = 'node';
      args = ['--watch', 'editor-server.js'];
    }

    // Start the studio
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: env,
      cwd: __dirname
    });

    // Handle process events
    child.on('error', (error) => {
      console.error('❌ Failed to start studio:', error.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        console.log(`\n⚠️  Studio exited with code ${code}`);
      }
      process.exit(code || 0);
    });

    // Handle interrupt signals
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down studio...');
      child.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down studio...');
      child.kill('SIGTERM');
    });

  } catch (error) {
    console.error('❌ Error starting studio:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const options = parseArgs();

    // Handle help and version flags
    if (options.help) {
      showHelp();
      process.exit(0);
    }

    if (options.version) {
      showVersion();
      process.exit(0);
    }

    // Validate options
    if (options.port < 1024 || options.port > 65535) {
      console.error('❌ Port must be between 1024 and 65535');
      process.exit(1);
    }

    // Check if editor server exists
    const serverPath = join(__dirname, 'editor-server.js');
    if (!existsSync(serverPath)) {
      console.error('❌ Editor server not found. Run "npm run editor-build" first.');
      process.exit(1);
    }

    // Start the studio
    await startStudio(options);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

export { startStudio, parseArgs };
