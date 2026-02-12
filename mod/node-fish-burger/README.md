# Node Fish Burger Server

Standalone fish burger server for mod backend. Provides fish burger state machine and cart functionality as a separate service.

## Features

- Fish burger state machine
- Cart functionality
- REST API endpoints
- OpenTelemetry tracing support

## Usage

```bash
npm install
npm start
```

Server runs on port 3004 by default (configurable via `PORT` environment variable).

## API Endpoints

- `POST /api/fish-burger/start` - Start cooking
- `POST /api/fish-burger/progress` - Update cooking progress
- `POST /api/fish-burger/complete` - Complete cooking
- `GET /api/fish-burger/state` - Get current state
- `GET /health` - Health check

## Environment Variables

- `PORT`: Server port (default: 3004)
- `LOG_LEVEL`: Logging level (default: info)
- `EDITOR_ORIGIN`: CORS origin for editor (default: http://localhost:3000)
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OpenTelemetry endpoint (optional)

## Architecture

This server was extracted from `node-mod-editor` to demonstrate the mod system's capability to replace hardcoded features. The fish burger cart functionality that was previously hardcoded in the editor is now provided as a standalone mod backend.

## Integration

The server is designed to be called by the `fish-burger-mod` frontend mod, which is loaded dynamically on the landing page. This demonstrates how mods can extend the core editor functionality without requiring changes to the core codebase.
