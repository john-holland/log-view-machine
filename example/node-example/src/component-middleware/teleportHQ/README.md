# TeleportHQ Standalone Server

A standalone server for TeleportHQ integration that runs independently from the main node-example server.

## Overview

This server provides a complete API for managing TeleportHQ templates, ViewStateMachines, and component middleware. It runs on port 3001 by default and includes comprehensive endpoints for template management, state synchronization, and real-time collaboration.

## Quick Start

### 1. Install Dependencies

```bash
cd example/node-example/src/component-middleware/teleportHQ
npm install
```

### 2. Set Environment Variables

Create a `.env` file:

```bash
# TeleportHQ Configuration
TELEPORTHQ_API_KEY=your-api-key
TELEPORTHQ_PROJECT_ID=your-project-id
TELEPORTHQ_PORT=3001

# Server Configuration
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health & Status

- `GET /health` - Health check with middleware status
- `GET /api/teleporthq/status` - TeleportHQ middleware status
- `GET /api/teleporthq/demo` - Run TeleportHQ integration demo

### Template Management

- `POST /api/teleporthq/templates/:templateId/load` - Load template from TeleportHQ
- `POST /api/teleporthq/templates/:templateId/create-machine` - Create ViewStateMachine from template
- `GET /api/teleporthq/templates/:templateId/state` - Get template state
- `PUT /api/teleporthq/templates/:templateId/state` - Update template state
- `POST /api/teleporthq/templates/:templateId/validate` - Validate template structure

### Template Connections

- `POST /api/teleporthq/connections` - Connect two templates
- `GET /api/teleporthq/connections` - Get all connections
- `DELETE /api/teleporthq/connections/:connectionId` - Disconnect templates

### Cache Management

- `GET /api/teleporthq/cache/stats` - Get cache statistics
- `DELETE /api/teleporthq/cache` - Clear cache (optional templateId query param)

### Export

- `POST /api/teleporthq/export/all` - Export all template states to TeleportHQ
- `POST /api/teleporthq/templates/:templateId/export` - Export specific template state

## Usage Examples

### Load a Template

```bash
curl -X POST http://localhost:3001/api/teleporthq/templates/checkout-form/load \
  -H "Content-Type: application/json" \
  -d '{"options": {"enableRealTimeSync": true}}'
```

### Create ViewStateMachine

```bash
curl -X POST http://localhost:3001/api/teleporthq/templates/checkout-form/create-machine \
  -H "Content-Type: application/json" \
  -d '{"initialState": {"formData": {}, "validationErrors": []}}'
```

### Connect Templates

```bash
curl -X POST http://localhost:3001/api/teleporthq/connections \
  -H "Content-Type: application/json" \
  -d '{
    "sourceTemplateId": "checkout-form",
    "targetTemplateId": "payment-form",
    "config": {
      "eventMapping": {
        "SUBMIT_ORDER": "PROCESS_PAYMENT"
      },
      "stateMapping": {
        "formData.total": "paymentAmount"
      }
    }
  }'
```

### Update Template State

```bash
curl -X PUT http://localhost:3001/api/teleporthq/templates/checkout-form/state \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "email": "user@example.com",
      "items": ["Fish Burger", "French Fries"],
      "total": 17.98
    },
    "validationErrors": [],
    "isSubmitting": false
  }'
```

### Run Demo

```bash
curl http://localhost:3001/api/teleporthq/demo
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEPORTHQ_API_KEY` | `demo-key` | TeleportHQ API key |
| `TELEPORTHQ_PROJECT_ID` | `demo-project` | TeleportHQ project ID |
| `TELEPORTHQ_PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment |
| `LOG_LEVEL` | `info` | Logging level |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | CORS origins |

### Component Middleware Configuration

```javascript
{
  teleportHQ: {
    apiKey: process.env.TELEPORTHQ_API_KEY,
    projectId: process.env.TELEPORTHQ_PROJECT_ID,
    environment: process.env.NODE_ENV,
    enableRealTimeSync: true,
    enableComponentStateSync: true,
    enabled: true
  }
}
```

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run demo` - Run TeleportHQ demo
- `npm run status` - Check TeleportHQ status
- `npm run health` - Check server health

### Logs

Logs are written to:
- Console (colored output)
- `logs/teleporthq-error.log` (error level)
- `logs/teleporthq-combined.log` (all levels)

### Testing

```bash
npm test
```

## Integration with Main Server

The TeleportHQ server can run alongside the main node-example server:

```bash
# Terminal 1: Main server
cd example/node-example
npm start

# Terminal 2: TeleportHQ server
cd example/node-example/src/component-middleware/teleportHQ
npm start
```

## API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security

- Rate limiting: 100 requests per 15 minutes per IP
- CORS protection with configurable origins
- Helmet security headers
- Input validation and sanitization
- Error handling without information leakage

## Performance

- Compression enabled for all responses
- Template caching to reduce API calls
- State batching for efficient updates
- Connection pooling for external APIs

## Troubleshooting

### Common Issues

1. **Port already in use**: Change `TELEPORTHQ_PORT` in `.env`
2. **CORS errors**: Update `ALLOWED_ORIGINS` in `.env`
3. **API authentication failed**: Check `TELEPORTHQ_API_KEY` and `TELEPORTHQ_PROJECT_ID`
4. **Template not found**: Ensure template exists in TeleportHQ

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Health Check

```bash
curl http://localhost:3001/health
```

## Architecture

```
TeleportHQ Server
├── Component Middleware Manager
│   └── TeleportHQ Integration
│       ├── Template Manager
│       ├── ViewStateMachine Converter
│       ├── State Synchronizer
│       └── Connection Manager
├── Express Server
│   ├── API Endpoints
│   ├── Middleware (CORS, Helmet, etc.)
│   └── Logging (Winston)
└── Configuration
    ├── Environment Variables
    └── Component Middleware Config
```

## License

This TeleportHQ server is part of the log-view-machine project and follows the same license terms. 