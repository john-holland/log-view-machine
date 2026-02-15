# Logging and Warehousing Guide

## Overview

This guide covers the industry-standard logging and warehousing solution implemented for the Fish Burger application. The solution includes structured logging, log rotation, warehousing to non-git tracked volumes, and memory leak prevention.

## Architecture

### Logging Components

1. **Structured Logging** (`src/logging-config.js`)
   - Winston-based logging with JSON format
   - Multiple output destinations (console, file, warehouse)
   - Log rotation with size limits
   - Performance monitoring middleware

2. **Docker Integration** (`docker-compose.yml`)
   - Log volumes mounted to containers
   - Non-git tracked warehouse directories
   - Log management service for monitoring

3. **Log Aggregation** (`fluentd.conf`)
   - Fluentd configuration for log collection
   - Service-based log routing
   - Buffer management for high-volume logging

## Features

### Memory Leak Prevention

**Issue Identified**: Component template leak in the generic editor
- **Root Cause**: Blob URLs created in `updatePreview()` function were not properly cleaned up
- **Solution**: Implemented Blob URL tracking and debounced updates

**Key Fixes**:
```javascript
// Blob URL tracking
let activeBlobUrls = new Set();
let previewUpdateDebounceTimer = null;

// Debounced preview update
function debouncedUpdatePreview() {
    if (previewUpdateDebounceTimer) {
        clearTimeout(previewUpdateDebounceTimer);
    }
    previewUpdateDebounceTimer = setTimeout(() => {
        updatePreview();
    }, 300); // 300ms debounce
}

// Proper cleanup
activeBlobUrls.forEach(url => {
    URL.revokeObjectURL(url);
});
activeBlobUrls.clear();
```

### Log Warehousing

**Directory Structure**:
```
logs/                    # Active logs (git-ignored)
├── fish-burger-backend-combined-2024-08-02.log
├── fish-burger-backend-error-2024-08-02.log
└── generic-editor-combined-2024-08-02.log

log-warehouse/          # Long-term storage (git-ignored)
├── fish-burger-backend-warehouse-2024-08-02.log
├── active-logs-dump-2024-08-02T15-30-45-123Z.log
└── aggregated/
```

**Docker Volumes**:
```yaml
volumes:
  - ./logs:/app/logs
  - ./log-warehouse:/app/log-warehouse
  - ./src:/app/src
```

### Log Management

**CLI Commands**:
```bash
# Monitor logs continuously
node scripts/log-manager.js monitor

# Check for large log files
node scripts/log-manager.js check

# Dump active logs to warehouse
node scripts/log-manager.js dump

# Clean up old logs
node scripts/log-manager.js cleanup

# Analyze log patterns
node scripts/log-manager.js analyze

# Run all operations
node scripts/log-manager.js all
```

## Configuration

### Environment Variables

```bash
# Logging configuration
LOG_LEVEL=info                    # Log level (debug, info, warn, error)
LOG_DIR=./logs                   # Active log directory
LOG_WAREHOUSE_DIR=./log-warehouse # Warehouse directory
NODE_ENV=development             # Environment (affects console output)

# Docker-specific
NODE_ENV=production              # Production mode (console disabled)
```

### Log Rotation Settings

```javascript
const CONFIG = {
  MAX_LOG_SIZE: 100 * 1024 * 1024,      // 100MB
  MAX_WAREHOUSE_SIZE: 500 * 1024 * 1024, // 500MB
  RETENTION_DAYS: 30,                    // Regular logs
  WAREHOUSE_RETENTION_DAYS: 60,          // Warehouse logs
  CHECK_INTERVAL: 3600000                // 1 hour monitoring
};
```

## Usage Examples

### Basic Logging

```javascript
import { createLogger } from './src/logging-config.js';

const logger = createLogger('my-service', {
  level: 'info',
  enableConsole: true,
  enableFile: true,
  enableWarehouse: true
});

logger.info('Service started', { port: 3000 });
logger.error('Database connection failed', { error: 'timeout' });
```

### Performance Monitoring

```javascript
import { createPerformanceLogger } from './src/logging-config.js';

const app = express();
app.use(createPerformanceLogger(logger));
```

### Log Warehousing

```javascript
import { dumpActiveLogs } from './src/logging-config.js';

// Dump active logs to warehouse
const dumpFile = await dumpActiveLogs(logger);
console.log('Logs dumped to:', dumpFile);
```

## Docker Deployment

### Starting with Logging

```bash
# Start all services with logging
docker-compose up -d

# Check log volumes
docker-compose exec fish-burger-node-backend ls -la /app/logs
docker-compose exec fish-burger-node-backend ls -la /app/log-warehouse

# Monitor logs in real-time
docker-compose logs -f fish-burger-node-backend
```

### Log Management in Docker

```bash
# Run log manager in container
docker-compose exec fish-burger-node-backend node scripts/log-manager.js check

# Dump logs from container
docker-compose exec fish-burger-node-backend node scripts/log-manager.js dump
```

## Monitoring and Alerts

### Large File Detection

The log manager automatically detects and reports large log files:

```bash
# Check for large files
node scripts/log-manager.js check

# Output example:
# Large log files detected: [
#   { name: 'combined.log', size: 150MB, sizeMB: '150.00' }
# ]
```

### Log Analysis

```bash
# Analyze log patterns
node scripts/log-manager.js analyze

# Output example:
# {
#   totalFiles: 5,
#   totalSize: 250MB,
#   errorCount: 15,
#   warningCount: 8,
#   infoCount: 1250,
#   debugCount: 0
# }
```

## Troubleshooting

### Memory Leaks

**Symptoms**:
- Large log files (>100MB)
- Browser memory usage increasing
- Blob URLs not being cleaned up

**Solutions**:
1. Check Blob URL cleanup in `updatePreview()`
2. Verify debounced updates are working
3. Monitor `activeBlobUrls` Set size

### Log Rotation Issues

**Symptoms**:
- Disk space filling up
- Old log files not being cleaned up

**Solutions**:
1. Check `RETENTION_DAYS` configuration
2. Verify file permissions on log directories
3. Run manual cleanup: `node scripts/log-manager.js cleanup`

### Docker Volume Issues

**Symptoms**:
- Logs not appearing in mounted volumes
- Permission denied errors

**Solutions**:
1. Check volume mount paths in `docker-compose.yml`
2. Verify directory permissions
3. Restart containers: `docker-compose restart`

## Best Practices

### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General application flow
- **WARN**: Warning conditions
- **ERROR**: Error conditions

### Structured Logging

```javascript
// Good
logger.info('User action completed', {
  userId: 123,
  action: 'save',
  duration: 150,
  success: true
});

// Avoid
logger.info('User 123 saved something in 150ms');
```

### Performance Considerations

1. **Debounced Updates**: Use debouncing for real-time preview updates
2. **Blob URL Cleanup**: Always revoke Blob URLs after use
3. **Log Rotation**: Configure appropriate size limits
4. **Warehouse Storage**: Use separate volumes for long-term storage

### Security

1. **Non-Git Tracked**: Log directories are excluded from version control
2. **Access Control**: Log files should have appropriate permissions
3. **Sensitive Data**: Avoid logging passwords, tokens, or PII

## Integration with Existing Services

### Fish Burger Backend

The backend now uses structured logging:

```javascript
// Before
console.log(`Starting cooking for order ${context.orderId}`);

// After
logger.info('Starting cooking for order', {
  orderId: context.orderId,
  ingredients: context.ingredients,
  traceId: event.traceId
});
```

### Generic Editor

The editor includes memory leak prevention:

```javascript
// Blob URL tracking
let activeBlobUrls = new Set();

// Debounced preview updates
function debouncedUpdatePreview() {
    // Implementation prevents excessive Blob URL creation
}
```

## Future Enhancements

1. **Log Analytics**: Integration with ELK stack or similar
2. **Alerting**: Automated alerts for large log files
3. **Compression**: Automatic log compression for warehouse
4. **Backup**: Automated backup of warehouse logs
5. **Metrics**: Log-based metrics and monitoring

## Conclusion

This logging and warehousing solution provides:

- ✅ Industry-standard structured logging
- ✅ Memory leak prevention for component templates
- ✅ Docker volume-based warehousing
- ✅ Automated log management and cleanup
- ✅ Performance monitoring and analysis
- ✅ Non-git tracked log storage

The solution is production-ready and includes comprehensive monitoring, cleanup, and analysis capabilities. 