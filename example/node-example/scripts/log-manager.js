#!/usr/bin/env node

/**
 * Log Management Script
 * 
 * Features:
 * - Monitor for large log files
 * - Dump active logs to warehousing
 * - Clean up old log files
 * - Analyze log patterns
 */

import fs from 'fs/promises';
import path from 'path';
import { createLogger, dumpActiveLogs, analyzeLogs } from '../src/logging-config.js';

const logger = createLogger('log-manager', {
  level: 'info',
  enableConsole: true,
  enableFile: true,
  enableWarehouse: true
});

// Configuration
const CONFIG = {
  LOG_DIR: process.env.LOG_DIR || './logs',
  WAREHOUSE_DIR: process.env.LOG_WAREHOUSE_DIR || './log-warehouse',
  MAX_LOG_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_WAREHOUSE_SIZE: 500 * 1024 * 1024, // 500MB
  RETENTION_DAYS: 30,
  CHECK_INTERVAL: 3600000 // 1 hour
};

// Log file monitoring
async function checkLogSizes() {
  try {
    logger.info('Checking log file sizes...');
    
    const logFiles = await fs.readdir(CONFIG.LOG_DIR);
    const warehouseFiles = await fs.readdir(CONFIG.WAREHOUSE_DIR);
    
    const largeLogFiles = [];
    const largeWarehouseFiles = [];
    
    // Check regular log files
    for (const file of logFiles) {
      if (file.endsWith('.log')) {
        const filePath = path.join(CONFIG.LOG_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.size > CONFIG.MAX_LOG_SIZE) {
          largeLogFiles.push({
            name: file,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2)
          });
        }
      }
    }
    
    // Check warehouse files
    for (const file of warehouseFiles) {
      if (file.endsWith('.log')) {
        const filePath = path.join(CONFIG.WAREHOUSE_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.size > CONFIG.MAX_WAREHOUSE_SIZE) {
          largeWarehouseFiles.push({
            name: file,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2)
          });
        }
      }
    }
    
    if (largeLogFiles.length > 0) {
      logger.warn('Large log files detected', { largeLogFiles });
    }
    
    if (largeWarehouseFiles.length > 0) {
      logger.warn('Large warehouse files detected', { largeWarehouseFiles });
    }
    
    logger.info('Log size check completed', {
      totalLogFiles: logFiles.filter(f => f.endsWith('.log')).length,
      totalWarehouseFiles: warehouseFiles.filter(f => f.endsWith('.log')).length,
      largeLogFiles: largeLogFiles.length,
      largeWarehouseFiles: largeWarehouseFiles.length
    });
    
    return { largeLogFiles, largeWarehouseFiles };
  } catch (error) {
    logger.error('Error checking log sizes', { error: error.message });
    throw error;
  }
}

// Dump active logs to warehousing
async function dumpLogsToWarehouse() {
  try {
    logger.info('Starting log dump to warehouse...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFile = path.join(CONFIG.WAREHOUSE_DIR, `active-logs-dump-${timestamp}.log`);
    
    // Get all log files
    const logFiles = await fs.readdir(CONFIG.LOG_DIR);
    const logFilePaths = logFiles
      .filter(file => file.endsWith('.log'))
      .map(file => path.join(CONFIG.LOG_DIR, file));
    
    // Combine all log files into warehouse dump
    let combinedContent = '';
    for (const logFile of logFilePaths) {
      try {
        const content = await fs.readFile(logFile, 'utf8');
        combinedContent += `\n=== ${path.basename(logFile)} ===\n`;
        combinedContent += content;
        combinedContent += '\n';
      } catch (error) {
        logger.warn(`Could not read log file: ${logFile}`, { error: error.message });
      }
    }
    
    // Write to warehouse
    await fs.writeFile(dumpFile, combinedContent);
    
    logger.info('Log dump completed', {
      dumpFile,
      sourceFiles: logFilePaths.length,
      dumpSize: combinedContent.length
    });
    
    return dumpFile;
  } catch (error) {
    logger.error('Error dumping logs to warehouse', { error: error.message });
    throw error;
  }
}

// Clean up old log files
async function cleanupOldLogs() {
  try {
    logger.info('Cleaning up old log files...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.RETENTION_DAYS);
    
    const logFiles = await fs.readdir(CONFIG.LOG_DIR);
    const warehouseFiles = await fs.readdir(CONFIG.WAREHOUSE_DIR);
    
    let deletedCount = 0;
    
    // Clean up regular logs
    for (const file of logFiles) {
      if (file.endsWith('.log')) {
        const filePath = path.join(CONFIG.LOG_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.info(`Deleted old log file: ${file}`);
        }
      }
    }
    
    // Clean up warehouse files (keep longer)
    const warehouseCutoffDate = new Date();
    warehouseCutoffDate.setDate(warehouseCutoffDate.getDate() - (CONFIG.RETENTION_DAYS * 2));
    
    for (const file of warehouseFiles) {
      if (file.endsWith('.log')) {
        const filePath = path.join(CONFIG.WAREHOUSE_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < warehouseCutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.info(`Deleted old warehouse file: ${file}`);
        }
      }
    }
    
    logger.info('Log cleanup completed', { deletedCount });
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old logs', { error: error.message });
    throw error;
  }
}

// Analyze log patterns
async function analyzeLogPatterns() {
  try {
    logger.info('Analyzing log patterns...');
    
    const logFiles = await fs.readdir(CONFIG.LOG_DIR);
    const analysis = {
      totalFiles: logFiles.filter(f => f.endsWith('.log')).length,
      totalSize: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      debugCount: 0,
      topErrors: [],
      serviceBreakdown: {}
    };
    
    for (const file of logFiles) {
      if (file.endsWith('.log')) {
        const filePath = path.join(CONFIG.LOG_DIR, file);
        const stats = await fs.stat(filePath);
        analysis.totalSize += stats.size;
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\n');
          
          for (const line of lines) {
            if (line.includes('"level":"error"')) analysis.errorCount++;
            else if (line.includes('"level":"warn"')) analysis.warningCount++;
            else if (line.includes('"level":"info"')) analysis.infoCount++;
            else if (line.includes('"level":"debug"')) analysis.debugCount++;
          }
        } catch (error) {
          logger.warn(`Could not analyze log file: ${file}`, { error: error.message });
        }
      }
    }
    
    logger.info('Log analysis completed', analysis);
    return analysis;
  } catch (error) {
    logger.error('Error analyzing log patterns', { error: error.message });
    throw error;
  }
}

// Main monitoring loop
async function startMonitoring() {
  logger.info('Starting log monitoring service', CONFIG);
  
  while (true) {
    try {
      await checkLogSizes();
      await cleanupOldLogs();
      await analyzeLogPatterns();
      
      logger.info('Monitoring cycle completed, waiting for next cycle...');
      await new Promise(resolve => setTimeout(resolve, CONFIG.CHECK_INTERVAL));
    } catch (error) {
      logger.error('Error in monitoring cycle', { error: error.message });
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on error
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'monitor':
      await startMonitoring();
      break;
      
    case 'check':
      await checkLogSizes();
      break;
      
    case 'dump':
      await dumpLogsToWarehouse();
      break;
      
    case 'cleanup':
      await cleanupOldLogs();
      break;
      
    case 'analyze':
      await analyzeLogPatterns();
      break;
      
    case 'all':
      await checkLogSizes();
      await dumpLogsToWarehouse();
      await cleanupOldLogs();
      await analyzeLogPatterns();
      break;
      
    default:
      console.log(`
Log Manager - Usage:
  node scripts/log-manager.js <command>
  
Commands:
  monitor  - Start continuous monitoring
  check    - Check log file sizes
  dump     - Dump active logs to warehouse
  cleanup  - Clean up old log files
  analyze  - Analyze log patterns
  all      - Run all operations once
      `);
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Log manager failed:', error);
    process.exit(1);
  });
}

export {
  checkLogSizes,
  dumpLogsToWarehouse,
  cleanupOldLogs,
  analyzeLogPatterns,
  startMonitoring
}; 