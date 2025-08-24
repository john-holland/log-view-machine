# Log View Machine Editor Commands

This document describes the new editor commands that allow you to easily discover and run editors from the project root.

## Available Commands

### 1. Discover Editors
```bash
npm run editor:discover
```
Discovers all available editors in the project, including:
- Main editor server
- Generic editors in component-middleware directories
- Shows paths and types for each editor

### 2. Run Editor
```bash
npm run editor:run -- <editor-number> [port]
```
Runs a specific editor by number (from the discovery list).

**Examples:**
```bash
# Run first editor (main editor) on default port 3003
npm run editor:run -- 1

# Run second editor (generic editor) on default port 3006
npm run editor:run -- 2

# Run second editor on custom port 3007
npm run editor:run -- 2 3007
```

### 3. Tome Connector Studio Commands
```bash
# Build the studio (includes copying package files)
npm run studio:build

# Create a publishable package
npm run studio:pack

# Publish to npm (requires npm login)
npm run studio:publish
```

## How It Works

The system automatically:
1. **Discovers** component-middleware directories throughout the project
2. **Finds** generic-editor servers in those directories
3. **Manages** ports automatically (finds available ports if default is busy)
4. **Runs** the selected editor with proper environment variables
5. **Builds** the tome-connector-studio as a publishable npm package

## Discovered Editors

Based on the current project structure, you should see:

1. **Main Editor** - The primary editor server
   - Path: `editor-build/`
   - Default Port: 3003
   - Type: Main Editor Server

2. **Generic Editor** - Component middleware editor
   - Path: `example/node-example/src/component-middleware/`
   - Default Port: 3006
   - Type: Generic Editor

3. **Additional Generic Editors** - Any other component-middleware directories found

## Port Management

- **Main Editor**: Defaults to port 3003
- **Generic Editors**: Default to port 3006
- **Custom Ports**: Can be specified as second argument
- **Auto-detection**: Automatically finds available ports if defaults are busy

## Environment Variables

The following environment variables are automatically set:
- `PORT` - The port the editor will run on
- `EDITOR_PORT` - Same as PORT (for compatibility)
- `NODE_ENV` - Set to 'development'

## Tome Connector Studio

The `tome-connector-studio` is a publishable npm module that provides:

### Features
- **CLI Tool**: `tome-studio` command for easy startup
- **Component Builder**: Create and manage React components
- **State Machine Editor**: Visual editor for XState
- **Generic Editor**: Flexible editor for various component types
- **Wave Reader**: Motion reader for eye tracking
- **Component Middleware**: Built-in support for component-middleware architecture

### Usage
```bash
# Install globally
npm install -g tome-connector-studio

# Start studio
tome-studio

# Start on specific port
tome-studio --port 3006

# Development mode with file watching
tome-studio --dev --watch
```

### Publishing
The studio is automatically built and packaged during the build process:
```bash
# Build and copy package files
npm run studio:build

# Create publishable package
npm run studio:pack

# Publish to npm
npm run studio:publish
```

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
1. Use the discovery command to see available editors
2. Specify a custom port: `npm run editor:run -- 2 3007`
3. The system will automatically find an available port

### Editor Not Found
If an editor isn't discovered:
1. Ensure the component-middleware directory exists
2. Check that `server.js` exists in the generic-editor subdirectory
3. Verify the directory structure matches the expected pattern

### Permission Issues
If you get permission errors:
1. Make sure the scripts are executable: `chmod +x scripts/*.js`
2. Check that you have read access to the directories

### Studio Build Issues
If the tome-connector-studio build fails:
1. Ensure all source files exist in the scripts directory
2. Check that the rollup.editor.config.js is properly configured
3. Verify that the editor-build directory is writable

## Directory Structure

The system looks for this structure:
```
project-root/
├── editor-build/                    # Main editor (built)
├── scripts/                         # Build scripts and package files
│   ├── discover-editors.js
│   ├── run-editor.js
│   ├── tome-connector-studio-package.json
│   ├── tome-connector-studio-cli.js
│   ├── tome-connector-studio-README.md
│   └── LICENSE
├── src/component-middleware/        # Component middleware
│   └── generic-editor/
│       └── server.js               # Generic editor server
└── example/node-example/
    └── src/component-middleware/   # Example component middleware
        └── generic-editor/
            └── server.js           # Example generic editor server
```

## Integration with Existing Commands

These new commands complement the existing ones:
- `npm run start:editor` - Starts the main editor server
- `npm run editor:discover` - Discovers all available editors
- `npm run editor:run` - Runs a specific discovered editor
- `npm run studio:build` - Builds the tome-connector-studio
- `npm run studio:pack` - Creates a publishable package
- `npm run studio:publish` - Publishes to npm

## Development

The scripts are located in `scripts/`:
- `discover-editors.js` - Discovers available editors
- `run-editor.js` - Runs a selected editor
- `tome-connector-studio-package.json` - Package configuration
- `tome-connector-studio-cli.js` - CLI tool
- `tome-connector-studio-README.md` - Documentation

All scripts can be imported and used programmatically in other Node.js applications.

## Publishing Workflow

To publish the tome-connector-studio:

1. **Build the project**:
   ```bash
   npm run build
   npm run editor-build
   ```

2. **Verify the package**:
   ```bash
   npm run studio:pack
   ```

3. **Publish to npm**:
   ```bash
   npm run studio:publish
   ```

The build process automatically:
- Compiles the TypeScript editor server
- Copies package.json, CLI, README, and LICENSE
- Makes the CLI executable
- Creates a publishable npm package
