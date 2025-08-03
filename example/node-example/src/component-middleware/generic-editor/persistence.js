/**
 * Local Persistence Layer for Generic Editor
 * 
 * Handles local storage of dotCMS changes and component modifications
 */

import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Local Persistence Manager
 */
export class LocalPersistenceManager {
  constructor(config = {}) {
    this.config = {
      dataDir: config.dataDir || '/app/data',
      componentsDir: config.componentsDir || '/app/data/components',
      stateMachinesDir: config.stateMachinesDir || '/app/data/state-machines',
      sassDir: config.sassDir || '/app/data/sass',
      backupsDir: config.backupsDir || '/app/data/backups',
      ...config
    };
    this.initialized = false;
  }

  /**
   * Initialize persistence directories
   */
  async initialize() {
    console.log('💾 Initializing local persistence...');
    
    try {
      // Create all necessary directories
      const directories = [
        this.config.dataDir,
        this.config.componentsDir,
        this.config.stateMachinesDir,
        this.config.sassDir,
        this.config.backupsDir
      ];
      
      for (const dir of directories) {
        await this.ensureDirectoryExists(dir);
      }
      
      this.initialized = true;
      console.log('  ✅ Local persistence initialized');
      
    } catch (error) {
      console.error('  ❌ Failed to initialize persistence:', error);
      throw error;
    }
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Save component locally
   */
  async saveComponent(component) {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    const componentPath = join(this.config.componentsDir, `${component.id}.json`);
    const componentData = {
      ...component,
      lastModified: new Date().toISOString(),
      source: 'local'
    };
    
    await fs.writeFile(componentPath, JSON.stringify(componentData, null, 2));
    
    console.log(`  💾 Saved component: ${component.name}`);
    return componentData;
  }

  /**
   * Load component from local storage
   */
  async loadComponent(componentId) {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    const componentPath = join(this.config.componentsDir, `${componentId}.json`);
    
    try {
      const data = await fs.readFile(componentPath, 'utf8');
      const component = JSON.parse(data);
      
      console.log(`  📂 Loaded component: ${component.name}`);
      return component;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // Component not found locally
      }
      throw error;
    }
  }

  /**
   * Save state machine locally
   */
  async saveStateMachine(stateMachine) {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    const stateMachinePath = join(this.config.stateMachinesDir, `${stateMachine.id}.json`);
    const stateMachineData = {
      ...stateMachine,
      lastModified: new Date().toISOString(),
      source: 'local'
    };
    
    await fs.writeFile(stateMachinePath, JSON.stringify(stateMachineData, null, 2));
    
    console.log(`  💾 Saved state machine: ${stateMachine.name}`);
    return stateMachineData;
  }

  /**
   * Load state machine from local storage
   */
  async loadStateMachine(stateMachineId) {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    const stateMachinePath = join(this.config.stateMachinesDir, `${stateMachineId}.json`);
    
    try {
      const data = await fs.readFile(stateMachinePath, 'utf8');
      const stateMachine = JSON.parse(data);
      
      console.log(`  📂 Loaded state machine: ${stateMachine.name}`);
      return stateMachine;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // State machine not found locally
      }
      throw error;
    }
  }

  /**
   * Save SASS identity locally
   */
  async saveSASSIdentity(sassIdentity) {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    const sassPath = join(this.config.sassDir, `${sassIdentity.id}.scss`);
    const sassDataPath = join(this.config.sassDir, `${sassIdentity.id}.json`);
    
    // Save SASS file
    const sassContent = sassIdentity.generateSASSFile();
    await fs.writeFile(sassPath, sassContent);
    
    // Save SASS metadata
    const sassData = {
      ...sassIdentity,
      lastModified: new Date().toISOString(),
      source: 'local'
    };
    await fs.writeFile(sassDataPath, JSON.stringify(sassData, null, 2));
    
    console.log(`  💾 Saved SASS identity: ${sassIdentity.name}`);
    return sassData;
  }

  /**
   * Load SASS identity from local storage
   */
  async loadSASSIdentity(sassIdentityId) {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    const sassDataPath = join(this.config.sassDir, `${sassIdentityId}.json`);
    
    try {
      const data = await fs.readFile(sassDataPath, 'utf8');
      const sassIdentity = JSON.parse(data);
      
      console.log(`  📂 Loaded SASS identity: ${sassIdentity.name}`);
      return sassIdentity;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // SASS identity not found locally
      }
      throw error;
    }
  }

  /**
   * Create backup
   */
  async createBackup() {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(this.config.backupsDir, `backup-${timestamp}`);
    
    await this.ensureDirectoryExists(backupPath);
    
    // Copy all data directories to backup
    const dirsToBackup = [
      { src: this.config.componentsDir, dest: join(backupPath, 'components') },
      { src: this.config.stateMachinesDir, dest: join(backupPath, 'state-machines') },
      { src: this.config.sassDir, dest: join(backupPath, 'sass') }
    ];
    
    for (const { src, dest } of dirsToBackup) {
      await this.copyDirectory(src, dest);
    }
    
    console.log(`  💾 Created backup: ${backupPath}`);
    return backupPath;
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest) {
    await this.ensureDirectoryExists(dest);
    
    try {
      const entries = await fs.readdir(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch (error) {
      // Directory might not exist, that's okay
      console.log(`  📝 Skipping directory copy: ${src}`);
    }
  }

  /**
   * List all local components
   */
  async listLocalComponents() {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    try {
      const files = await fs.readdir(this.config.componentsDir);
      const components = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const componentId = file.replace('.json', '');
          const component = await this.loadComponent(componentId);
          if (component) {
            components.push(component);
          }
        }
      }
      
      return components;
      
    } catch (error) {
      return [];
    }
  }

  /**
   * List all local state machines
   */
  async listLocalStateMachines() {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    try {
      const files = await fs.readdir(this.config.stateMachinesDir);
      const stateMachines = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const stateMachineId = file.replace('.json', '');
          const stateMachine = await this.loadStateMachine(stateMachineId);
          if (stateMachine) {
            stateMachines.push(stateMachine);
          }
        }
      }
      
      return stateMachines;
      
    } catch (error) {
      return [];
    }
  }

  /**
   * List all local SASS identities
   */
  async listLocalSASSIdentities() {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    try {
      const files = await fs.readdir(this.config.sassDir);
      const sassIdentities = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const sassIdentityId = file.replace('.json', '');
          const sassIdentity = await this.loadSASSIdentity(sassIdentityId);
          if (sassIdentity) {
            sassIdentities.push(sassIdentity);
          }
        }
      }
      
      return sassIdentities;
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    if (!this.initialized) {
      throw new Error('Persistence not initialized');
    }
    
    const components = await this.listLocalComponents();
    const stateMachines = await this.listLocalStateMachines();
    const sassIdentities = await this.listLocalSASSIdentities();
    
    return {
      components: components.length,
      stateMachines: stateMachines.length,
      sassIdentities: sassIdentities.length,
      totalItems: components.length + stateMachines.length + sassIdentities.length,
      lastBackup: await this.getLastBackupTime()
    };
  }

  /**
   * Get last backup time
   */
  async getLastBackupTime() {
    try {
      const files = await fs.readdir(this.config.backupsDir);
      const backupDirs = files.filter(file => file.startsWith('backup-'));
      
      if (backupDirs.length === 0) {
        return null;
      }
      
      // Get the most recent backup
      backupDirs.sort().reverse();
      const latestBackup = backupDirs[0];
      const backupPath = join(this.config.backupsDir, latestBackup);
      const stats = await fs.stat(backupPath);
      
      return stats.mtime.toISOString();
      
    } catch (error) {
      return null;
    }
  }
}

/**
 * Create persistence manager
 */
export function createPersistenceManager(config = {}) {
  return new LocalPersistenceManager(config);
} 