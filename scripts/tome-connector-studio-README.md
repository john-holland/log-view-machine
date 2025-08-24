# 🌊 Tome Connector Studio

A powerful studio for building and managing Tome Connector components, state machines, and integrations.

## 🚀 Features

- **Component Builder**: Create and manage React components with TypeScript support
- **State Machine Editor**: Visual editor for XState state machines
- **Generic Editor**: Flexible editor for various component types
- **Wave Reader**: Motion reader for eye tracking applications
- **Component Middleware**: Built-in support for component-middleware architecture
- **Hot Reload**: Development mode with file watching
- **REST API**: Full API for programmatic access
- **Health Monitoring**: Built-in health checks and monitoring

## 📦 Installation

### Global Installation
```bash
npm install -g tome-connector-studio
```

### Local Installation
```bash
npm install tome-connector-studio
```

## 🎯 Quick Start

### Using the CLI
```bash
# Start studio on default port (3003)
tome-studio

# Start on specific port
tome-studio --port 3006

# Development mode with file watching
tome-studio --dev --watch

# Bind to all interfaces
tome-studio --host 0.0.0.0
```

### Using npm scripts
```bash
# Start studio
npm start

# Development mode
npm run start:dev

# With file watching
npm run dev
```

### Programmatic Usage
```javascript
import { startStudio } from 'tome-connector-studio';

await startStudio({
  port: 3006,
  host: 'localhost',
  dev: true
});
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3003` | Port to run on |
| `HOST` | `localhost` | Host to bind to |
| `NODE_ENV` | `production` | Environment mode |
| `EDITOR_PORT` | `3003` | Alias for PORT |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |

### Configuration File
```javascript
// config.js
export default {
  port: process.env.PORT || 3003,
  host: process.env.HOST || 'localhost',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  security: {
    helmet: true,
    rateLimit: false
  }
};
```

## 🌐 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/editor/status` - Editor status
- `GET /wave-reader` - Wave Reader interface

### Component Management
- `GET /api/components` - List components
- `POST /api/components` - Create component
- `PUT /api/components/:id` - Update component
- `DELETE /api/components/:id` - Delete component

### State Machine Management
- `GET /api/state-machines` - List state machines
- `POST /api/state-machines` - Create state machine
- `PUT /api/state-machines/:id` - Update state machine
- `DELETE /api/state-machines/:id` - Delete state machine

### Tracing & Monitoring
- `GET /api/tracing/status` - Tracing status
- `GET /api/tracing/message/:id` - Get message by ID
- `GET /api/tracing/trace/:id` - Get trace by ID
- `POST /api/tracing/message` - Send tracing message

## 🏗️ Architecture

### Component Middleware Support
The studio automatically detects and integrates with `src/component-middleware` directories:

```
project/
├── src/
│   └── component-middleware/
│       └── generic-editor/
│           └── server.js
├── example/
│   └── node-example/
│       └── src/
│           └── component-middleware/
│               └── generic-editor/
│                   └── server.js
└── editor-build/
    └── editor-server.js
```

### Plugin System
The studio supports plugins for extending functionality:

```javascript
// plugins/my-plugin.js
export default {
  name: 'my-plugin',
  version: '1.0.0',
  initialize: (studio) => {
    // Plugin initialization
  },
  routes: [
    // Custom routes
  ]
};
```

## 🎨 UI Components

### Wave Reader
Interactive motion reader for eye tracking applications:
- CSS selector management
- Wave animation controls
- Real-time status monitoring
- Component integration

### Generic Editor
Flexible editor for various component types:
- Component templates
- State machine visualization
- Code editing
- Preview and testing

### Component Builder
Visual component builder:
- Drag and drop interface
- Property panels
- Live preview
- Export functionality

## 🔌 Integrations

### XState
Full support for XState state machines:
- Visual editor
- State visualization
- Event handling
- State persistence

### React
React component support:
- JSX editing
- Component testing
- Hot reloading
- TypeScript support

### OpenTelemetry
Built-in observability:
- Request tracing
- Performance monitoring
- Error tracking
- Metrics collection

## 🚀 Development

### Building from Source
```bash
git clone https://github.com/viewstatemachine/tome-connector-studio.git
cd tome-connector-studio
npm install
npm run build
npm start
```

### Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📚 Examples

### Basic Component
```javascript
import React from 'react';

export const MyComponent = ({ title, children }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {children}
    </div>
  );
};
```

### State Machine
```javascript
import { createMachine } from 'xstate';

export const myMachine = createMachine({
  id: 'myMachine',
  initial: 'idle',
  states: {
    idle: {
      on: { START: 'active' }
    },
    active: {
      on: { STOP: 'idle' }
    }
  }
});
```

### API Integration
```javascript
// Create component via API
const response = await fetch('/api/components', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'MyComponent',
    type: 'react',
    template: '<div>Hello World</div>'
  })
});

const component = await response.json();
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- Use TypeScript
- Follow ESLint rules
- Write meaningful commit messages
- Add JSDoc comments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Reference](docs/API.md)
- [Component Guide](docs/COMPONENTS.md)
- [State Machine Guide](docs/STATE_MACHINES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

### Community
- [GitHub Issues](https://github.com/viewstatemachine/tome-connector-studio/issues)
- [Discussions](https://github.com/viewstatemachine/tome-connector-studio/discussions)
- [Wiki](https://github.com/viewstatemachine/tome-connector-studio/wiki)

### Commercial Support
For commercial support and enterprise features, contact us at:
- Email: support@viewstatemachine.com
- Website: https://viewstatemachine.com

## 🔗 Links

- [Website](https://viewstatemachine.com)
- [Documentation](https://docs.viewstatemachine.com)
- [GitHub](https://github.com/viewstatemachine/tome-connector-studio)
- [NPM Package](https://www.npmjs.com/package/tome-connector-studio)

---

Made with ❤️ by the ViewStateMachine Team
