# Generic Editor with dotCMS Integration

This directory contains the Generic Editor with dotCMS integration, including SASS identity management and a complete UI flow.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 3000, 8080, and 5432 available

### Running the Stack

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   # View all logs
   docker-compose logs -f
   
   # View specific service logs
   docker-compose logs -f generic-editor
   docker-compose logs -f dotcms
   docker-compose logs -f postgres
   ```

### Services

- **Generic Editor**: `http://localhost:3000`
- **dotCMS**: `http://localhost:8080`
- **PostgreSQL**: `localhost:5432`

## 📋 API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Initialize Generic Editor
```bash
curl http://localhost:3000/api/init
```

### Login to dotCMS
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### Search Components
```bash
curl "http://localhost:3000/api/components/search?query=button"
```

### Select Component
```bash
curl -X POST http://localhost:3000/api/components/select \
  -H "Content-Type: application/json" \
  -d '{"componentId": "button-component"}'
```

### Get Component Versions
```bash
curl http://localhost:3000/api/components/button-component/versions
```

### Load Component Version
```bash
curl -X POST http://localhost:3000/api/components/button-component/load \
  -H "Content-Type: application/json" \
  -d '{"version": "1.0.0"}'
```

### Get Current State
```bash
curl http://localhost:3000/api/state
```

### Run Demo
```bash
curl -X POST http://localhost:3000/api/demo
```

### Logout
```bash
curl -X POST http://localhost:3000/api/logout
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOTCMS_URL` | `http://dotcms:8080` | dotCMS server URL |
| `DOTCMS_API_KEY` | `demo-key` | dotCMS API key |
| `NODE_ENV` | `development` | Node.js environment |
| `PORT` | `3000` | Generic Editor server port |

### dotCMS Credentials

**Admin User:**
- Username: `admin`
- Password: `password`

**Developer User:**
- Username: `developer`
- Password: `dev123`

## 🎨 Features

### SASS Identity Management
- Semantic versioning for components
- SASS variables, mixins, and functions
- Theme variants and responsive breakpoints
- SASS compilation and validation

### Complete UI Flow
- dotCMS login with role-based authentication
- Component search with dropdown filtering
- Semantic version selection
- Dynamic component loading/unloading
- State machine integration

### Default Components
- **Empty Container**: Default empty div container with state machine
- **Button Component**: Reusable button with multiple variants
- **Card Component**: Card component for displaying content
- **Form Component**: Form component with validation

## 🐛 Troubleshooting

### Service Not Starting
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8080
lsof -i :5432

# Restart services
docker-compose restart
```

### dotCMS Not Accessible
```bash
# Check dotCMS logs
docker-compose logs dotcms

# Wait for dotCMS to fully start (can take 2-3 minutes)
docker-compose logs -f dotcms
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

### Generic Editor Issues
```bash
# Check Generic Editor logs
docker-compose logs generic-editor

# Rebuild Generic Editor
docker-compose build generic-editor
docker-compose up -d generic-editor
```

## 🧹 Cleanup

### Stop Services
```bash
docker-compose down
```

### Remove Volumes (WARNING: This will delete all data)
```bash
docker-compose down -v
```

### Remove Images
```bash
docker-compose down --rmi all
```

## 📁 File Structure

```
generic-editor/
├── Dockerfile                 # Generic Editor container
├── docker-compose.yml         # Service orchestration
├── package.json              # Node.js dependencies
├── server.js                 # Express server
├── index.js                  # Generic Editor core
├── ui.js                     # UI flow implementation
├── ui-demo.js               # UI demo scenarios
└── README.md                # This file
```

## 🔗 Integration Points

### dotCMS Integration
- Component template management
- Semantic versioning
- State machine configuration
- SASS identity management

### Component Middleware
- TeleportHQ integration
- Jump Server UI integration
- BoundaryHQ security integration
- Generic Editor UI flow

## 🚀 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Adding New Components
1. Add component definition to `ui.js`
2. Update component search logic
3. Add SASS identity configuration
4. Test with Docker setup

## 📊 Monitoring

### Health Checks
- Generic Editor: `http://localhost:3000/health`
- dotCMS: `http://localhost:8080/api/v1/system/health`
- PostgreSQL: Check container status

### Logs
```bash
# Real-time logs
docker-compose logs -f

# Service-specific logs
docker-compose logs -f generic-editor
docker-compose logs -f dotcms
docker-compose logs -f postgres
```

## 🎯 Next Steps

1. **Add more components** to the default set
2. **Implement real dotCMS API integration**
3. **Add SASS compilation pipeline**
4. **Integrate with XState visualizer**
5. **Add component preview functionality**
6. **Implement version control workflow**
7. **Add user management and permissions**
8. **Integrate with other component middleware**

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify service health: `docker-compose ps`
3. Restart services: `docker-compose restart`
4. Check this README for troubleshooting steps 