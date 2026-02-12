# Template Registration with dotCMS

This document describes how to register the existing templates with the dotCMS instance running in the docker-compose setup.

## Overview

The Generic Editor includes several pre-built templates that need to be registered with dotCMS for proper integration:

- **HTML Editor** - Generic HTML editor component with SunEditor integration
- **CSS Editor** - CSS editor component with Ace editor integration  
- **JavaScript Editor** - JavaScript editor component with Ace editor integration
- **XState Editor** - XState state machine editor and visualizer
- **Component Library** - Component library and management system
- **Generic Editor** - Complete generic editor with all components integrated

## Automatic Registration

The templates are automatically registered when the docker-compose setup starts:

```bash
# Start the full stack (dotCMS + Generic Editor)
docker-compose up -d

# The generic-editor service will:
# 1. Wait for dotCMS to be ready
# 2. Register all templates automatically
# 3. Start the Generic Editor server
```

## Manual Registration

If you need to register templates manually:

```bash
# Navigate to the generic-editor directory
cd example/node-example/src/component-middleware/generic-editor

# Set environment variables
export DOTCMS_URL=http://localhost:8080
export DOTCMS_API_KEY=demo-key
export DOTCMS_ADMIN_USER=admin@dotcms.com
export DOTCMS_ADMIN_PASSWORD=admin

# Run the registration script
node register-templates.js
```

## Template Structure

Each template follows this structure:

```
templates/
├── html-editor/
│   ├── views/
│   │   └── editor-view.tsx
│   ├── machine.js
│   ├── styles.css
│   └── index.js
├── css-editor/
│   ├── views/
│   │   └── editor-view.tsx
│   ├── machine.js
│   ├── styles.css
│   └── index.js
└── ...
```

## dotCMS Integration

### Content Types

Templates are registered as dotCMS content types with:

- **Content Type**: Template
- **Category**: Editor Components / Management Components
- **Version**: 1.0.0
- **Metadata**: Includes creation info and dependencies

### API Endpoints

The registration script uses these dotCMS API endpoints:

- `GET /api/v1/system/status` - Check dotCMS availability
- `POST /api/v1/content` - Create template content

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOTCMS_URL` | `http://localhost:8080` | dotCMS instance URL |
| `DOTCMS_API_KEY` | `demo-key` | API key for authentication |
| `DOTCMS_ADMIN_USER` | `admin@dotcms.com` | Admin username |
| `DOTCMS_ADMIN_PASSWORD` | `admin` | Admin password |

## Verification

After registration, you can verify templates are available:

1. **Check dotCMS Admin**:
   - Login to dotCMS admin (http://localhost:8080/admin)
   - Navigate to Content → Templates
   - Verify all templates are listed

2. **Check API**:
   ```bash
   curl -H "Authorization: Bearer demo-key" \
        http://localhost:8080/api/v1/content?contentType=Template
   ```

3. **Check Generic Editor**:
   - Open http://localhost:3000
   - Load a component
   - Verify templates are available in the editor

## Troubleshooting

### dotCMS Not Accessible

```bash
# Check if dotCMS is running
docker-compose ps

# Check dotCMS logs
docker-compose logs dotcms

# Restart dotCMS
docker-compose restart dotcms
```

### Registration Failed

```bash
# Check registration logs
docker-compose logs generic-editor

# Manual registration with debug
DOTCMS_URL=http://localhost:8080 node register-templates.js
```

### Templates Not Showing

1. **Check dotCMS API**:
   ```bash
   curl http://localhost:8080/api/v1/system/status
   ```

2. **Verify API Key**:
   - Check dotCMS admin for correct API key
   - Update environment variables if needed

3. **Check Template Files**:
   ```bash
   ls -la templates/
   ```

## Development

### Adding New Templates

1. Create template directory in `templates/`
2. Add template definition to `register-templates.js`
3. Restart the docker-compose stack

### Updating Templates

1. Modify template files
2. Update version in template definition
3. Re-register templates

### Testing

Use the test page to verify functionality:

```bash
# Open test page
open http://localhost:3000/test-tab-switching.html
```

## Security Notes

- API keys should be properly secured in production
- Admin credentials should be changed from defaults
- Consider using dotCMS's built-in authentication for production

## Next Steps

After successful registration:

1. **Test Template Loading** - Verify templates load in the editor
2. **Test Template Editing** - Verify templates can be modified
3. **Test Template Saving** - Verify templates can be saved back to dotCMS
4. **Production Setup** - Configure proper security and authentication 

This document describes how to register the existing templates with the dotCMS instance running in the docker-compose setup.

## Overview

The Generic Editor includes several pre-built templates that need to be registered with dotCMS for proper integration:

- **HTML Editor** - Generic HTML editor component with SunEditor integration
- **CSS Editor** - CSS editor component with Ace editor integration  
- **JavaScript Editor** - JavaScript editor component with Ace editor integration
- **XState Editor** - XState state machine editor and visualizer
- **Component Library** - Component library and management system
- **Generic Editor** - Complete generic editor with all components integrated

## Automatic Registration

The templates are automatically registered when the docker-compose setup starts:

```bash
# Start the full stack (dotCMS + Generic Editor)
docker-compose up -d

# The generic-editor service will:
# 1. Wait for dotCMS to be ready
# 2. Register all templates automatically
# 3. Start the Generic Editor server
```

## Manual Registration

If you need to register templates manually:

```bash
# Navigate to the generic-editor directory
cd example/node-example/src/component-middleware/generic-editor

# Set environment variables
export DOTCMS_URL=http://localhost:8080
export DOTCMS_API_KEY=demo-key
export DOTCMS_ADMIN_USER=admin@dotcms.com
export DOTCMS_ADMIN_PASSWORD=admin

# Run the registration script
node register-templates.js
```

## Template Structure

Each template follows this structure:

```
templates/
├── html-editor/
│   ├── views/
│   │   └── editor-view.tsx
│   ├── machine.js
│   ├── styles.css
│   └── index.js
├── css-editor/
│   ├── views/
│   │   └── editor-view.tsx
│   ├── machine.js
│   ├── styles.css
│   └── index.js
└── ...
```

## dotCMS Integration

### Content Types

Templates are registered as dotCMS content types with:

- **Content Type**: Template
- **Category**: Editor Components / Management Components
- **Version**: 1.0.0
- **Metadata**: Includes creation info and dependencies

### API Endpoints

The registration script uses these dotCMS API endpoints:

- `GET /api/v1/system/status` - Check dotCMS availability
- `POST /api/v1/content` - Create template content

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOTCMS_URL` | `http://localhost:8080` | dotCMS instance URL |
| `DOTCMS_API_KEY` | `demo-key` | API key for authentication |
| `DOTCMS_ADMIN_USER` | `admin@dotcms.com` | Admin username |
| `DOTCMS_ADMIN_PASSWORD` | `admin` | Admin password |

## Verification

After registration, you can verify templates are available:

1. **Check dotCMS Admin**:
   - Login to dotCMS admin (http://localhost:8080/admin)
   - Navigate to Content → Templates
   - Verify all templates are listed

2. **Check API**:
   ```bash
   curl -H "Authorization: Bearer demo-key" \
        http://localhost:8080/api/v1/content?contentType=Template
   ```

3. **Check Generic Editor**:
   - Open http://localhost:3000
   - Load a component
   - Verify templates are available in the editor

## Troubleshooting

### dotCMS Not Accessible

```bash
# Check if dotCMS is running
docker-compose ps

# Check dotCMS logs
docker-compose logs dotcms

# Restart dotCMS
docker-compose restart dotcms
```

### Registration Failed

```bash
# Check registration logs
docker-compose logs generic-editor

# Manual registration with debug
DOTCMS_URL=http://localhost:8080 node register-templates.js
```

### Templates Not Showing

1. **Check dotCMS API**:
   ```bash
   curl http://localhost:8080/api/v1/system/status
   ```

2. **Verify API Key**:
   - Check dotCMS admin for correct API key
   - Update environment variables if needed

3. **Check Template Files**:
   ```bash
   ls -la templates/
   ```

## Development

### Adding New Templates

1. Create template directory in `templates/`
2. Add template definition to `register-templates.js`
3. Restart the docker-compose stack

### Updating Templates

1. Modify template files
2. Update version in template definition
3. Re-register templates

### Testing

Use the test page to verify functionality:

```bash
# Open test page
open http://localhost:3000/test-tab-switching.html
```

## Security Notes

- API keys should be properly secured in production
- Admin credentials should be changed from defaults
- Consider using dotCMS's built-in authentication for production

## Next Steps

After successful registration:

1. **Test Template Loading** - Verify templates load in the editor
2. **Test Template Editing** - Verify templates can be modified
3. **Test Template Saving** - Verify templates can be saved back to dotCMS
4. **Production Setup** - Configure proper security and authentication 