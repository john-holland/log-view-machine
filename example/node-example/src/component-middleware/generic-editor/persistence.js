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
 * Cave Store Persistence Manager
 * Uses the store API (PUT/GET /api/editor/store/:tomeId/:key) so editor components
 * use the Tome's persistence backend (duckdb/redis/dynamodb per Tome).
 */
export class CaveStorePersistenceManager {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000',
      editorTomeId: config.editorTomeId || 'editor-tome',
      ...config
    };
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  _key(prefix, id) {
    return `${prefix}:${id}`;
  }

  async _get(key) {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/api/editor/store/${encodeURIComponent(this.config.editorTomeId)}/${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  }

  async _put(key, value) {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/api/editor/store/${encodeURIComponent(this.config.editorTomeId)}/${encodeURIComponent(key)}`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
  }

  async saveComponent(component) {
    if (!this.initialized) throw new Error('Persistence not initialized');
    const key = this._key('component', component.id);
    const data = { ...component, lastModified: new Date().toISOString(), source: 'cave-store' };
    await this._put(key, data);
    return data;
  }

  async loadComponent(componentId) {
    if (!this.initialized) throw new Error('Persistence not initialized');
    const key = this._key('component', componentId);
    const component = await this._get(key);
    return component ?? null;
  }

  async listLocalComponents() {
    if (!this.initialized) throw new Error('Persistence not initialized');
    try {
      const url = `${this.config.baseUrl.replace(/\/$/, '')}/api/editor/store/${encodeURIComponent(this.config.editorTomeId)}/find`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selector: {} })
      });
      if (!res.ok) return [];
      const result = await res.json();
      const list = Array.isArray(result) ? result : (result?.items ?? []);
      return list.filter((item) => item && (item.key?.startsWith('component:') || item.id)).map((item) => (item.value ?? item));
    } catch {
      return [];
    }
  }

  async saveStateMachine(stateMachine) {
    if (!this.initialized) throw new Error('Persistence not initialized');
    const key = this._key('stateMachine', stateMachine.id);
    await this._put(key, { ...stateMachine, lastModified: new Date().toISOString() });
    return stateMachine;
  }

  async loadStateMachine(stateMachineId) {
    if (!this.initialized) throw new Error('Persistence not initialized');
    const key = this._key('stateMachine', stateMachineId);
    return (await this._get(key)) ?? null;
  }

  async saveSASSIdentity(sassIdentity) {
    if (!this.initialized) throw new Error('Persistence not initialized');
    const key = this._key('sassIdentity', sassIdentity.id);
    await this._put(key, { ...sassIdentity, lastModified: new Date().toISOString() });
    return sassIdentity;
  }

  async loadSASSIdentity(sassIdentityId) {
    if (!this.initialized) throw new Error('Persistence not initialized');
    const key = this._key('sassIdentity', sassIdentityId);
    return (await this._get(key)) ?? null;
  }

  async listLocalStateMachines() {
    return [];
  }

  async listLocalSASSIdentities() {
    return [];
  }

  async getStorageStats() {
    const components = await this.listLocalComponents();
    return {
      components: components.length,
      stateMachines: 0,
      sassIdentities: 0,
      totalItems: components.length,
      lastBackup: null
    };
  }

  async getLastBackupTime() {
    return null;
  }
}

/**
 * Create persistence manager
 * @param {Object} config - persistenceConfig from GenericEditorConfig; use persistenceBackend: 'local' | 'cave-store'
 */
export function createPersistenceManager(config = {}) {
  const backend = config.persistenceBackend || 'local';
  if (backend === 'cave-store') {
    return new CaveStorePersistenceManager(config);
  }
  return new LocalPersistenceManager(config);
} 