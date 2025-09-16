# Docker Development Environment

This Docker setup provides a complete development environment with the Generic Editor and dotCMS integration.

## 🏗️ Architecture

The Docker environment includes:

- **Generic Editor** (Port 3001): The main editor interface with two-panel layout
- **dotCMS** (Port 8080): Content management system for component storage
- **PostgreSQL** (Port 5432): Database for dotCMS
- **Component Registrar**: Utility to register components with dotCMS

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 3001, 8080, and 5432 available

### Starting the Environment

```bash
# Start the complete environment
./start-docker-environment.sh
```

This script will:
1. Stop any existing containers
2. Build and start all services
3. Wait for services to be ready
4. Register components with dotCMS
5. Display service URLs and useful commands

### Manual Start

If you prefer to start services manually:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 Services

### Generic Editor
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Demo API**: http://localhost:3001/api/demo

### dotCMS
- **URL**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/admin
- **Default Credentials**: admin@dotcms.com / admin

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: dotcms
- **Username**: dotcms
- **Password**: dotcms

## 🔧 Component Registration

The `attach-editor-component.js` utility automatically:

1. **Discovers Components**: Scans the component middleware directory
2. **Registers with dotCMS**: Creates component entries in dotCMS
3. **Handles Warehousing**: Manages existing component instances
4. **Updates Metadata**: Keeps component information current

### Manual Component Registration

```bash
# Run the component registrar manually
docker-compose run --rm component-registrar
```

### Component Structure

Components are automatically discovered from:
```
example/node-example/src/component-middleware/
├── go-button/
├── wave-tabs/
├── selector-input/
└── error-boundary/
```

Each component should have:
- `package.json` (optional) - for metadata
- `README.md` (optional) - for description
- Source files (`.js`, `.jsx`, `.ts`, `.tsx`, `.css`, etc.)

## 🛠️ Development Workflow

### Making Changes

1. **Edit Components**: Modify files in the component middleware directory
2. **Restart Services**: `docker-compose restart generic-editor`
3. **Re-register**: `docker-compose run --rm component-registrar`

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f generic-editor
docker-compose logs -f dotcms
docker-compose logs -f postgres
```

### Accessing Services

```bash
# Shell access to generic editor
docker-compose exec generic-editor sh

# Shell access to dotCMS
docker-compose exec dotcms sh

# Database access
docker-compose exec postgres psql -U dotcms -d dotcms
```

## 🔍 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check Docker is running
docker info

# Check port availability
lsof -i :3001
lsof -i :8080
lsof -i :5432
```

**dotCMS not ready:**
```bash
# Check dotCMS logs
docker-compose logs dotcms

# Wait longer for startup
docker-compose restart dotcms
```

**Component registration fails:**
```bash
# Check component registrar logs
docker-compose logs component-registrar

# Run registration manually
docker-compose run --rm component-registrar
```

### Reset Environment

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
./start-docker-environment.sh
```

## 📁 File Structure

```
log-view-machine/
├── docker-compose.yml              # Main Docker configuration
├── Dockerfile.registrar            # Component registrar image
├── attach-editor-component.js      # Component registration utility
├── start-docker-environment.sh     # Startup script
├── DOCKER_SETUP_README.md          # This file
└── example/node-example/src/component-middleware/
    └── generic-editor/
        ├── Dockerfile              # Generic editor image
        ├── package.json            # Dependencies
        └── server.js               # Main server file
```

## 🔐 Environment Variables

### Generic Editor
- `NODE_ENV`: development
- `PORT`: 3001
- `DOTCMS_URL`: http://dotcms:8080
- `DOTCMS_USERNAME`: admin@dotcms.com
- `DOTCMS_PASSWORD`: admin

### dotCMS
- `DOTCMS_DB_DRIVER`: org.postgresql.Driver
- `DOTCMS_DB_BASE_URL`: jdbc:postgresql://postgres:5432/dotcms
- `DOTCMS_DB_USERNAME`: dotcms
- `DOTCMS_DB_PASSWORD`: dotcms
- `DOTCMS_ADMIN_EMAIL`: admin@dotcms.com
- `DOTCMS_ADMIN_PASSWORD`: admin

### Component Registrar
- `DOTCMS_URL`: http://dotcms:8080
- `DOTCMS_USERNAME`: admin@dotcms.com
- `DOTCMS_PASSWORD`: admin
- `COMPONENTS_PATH`: ./example/node-example/src/component-middleware

## 🎯 Next Steps

1. **Access the Generic Editor**: http://localhost:3001
2. **Explore dotCMS**: http://localhost:8080/admin
3. **View Registered Components**: Check the dotCMS admin panel
4. **Develop Components**: Edit files in the component middleware directory
5. **Test Integration**: Use the editor to create and manage components

## 📞 Support

For issues with this Docker setup:
1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs -f`
3. Verify all prerequisites are met
4. Try resetting the environment with `docker-compose down -v`
