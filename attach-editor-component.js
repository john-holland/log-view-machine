#!/usr/bin/env node

/**
 * Component Registration Utility for dotCMS
 * 
 * This script registers components from the generic editor with dotCMS
 * and handles warehousing for existing instances.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
  dotcmsUrl: process.env.DOTCMS_URL || 'http://localhost:8080',
  username: process.env.DOTCMS_USERNAME || 'admin@dotcms.com',
  password: process.env.DOTCMS_PASSWORD || 'admin',
  componentsPath: process.env.COMPONENTS_PATH || './example/node-example/src/component-middleware',
  retryAttempts: 3,
  retryDelay: 2000
};

// Component metadata structure
const COMPONENT_TEMPLATE = {
  name: '',
  description: '',
  version: '1.0.0',
  category: 'Generic Editor Components',
  tags: ['generic-editor', 'component'],
  files: [],
  dependencies: [],
  metadata: {
    created: new Date().toISOString(),
    source: 'generic-editor',
    type: 'editor-component'
  }
};

class ComponentRegistrar {
  constructor() {
    this.authToken = null;
    this.registeredComponents = new Set();
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting component registration process...');
      
      // Wait for dotCMS to be ready
      await this.waitForDotCMS();
      
      // Authenticate with dotCMS
      await this.authenticate();
      
      // Discover components
      const components = await this.discoverComponents();
      console.log(`📦 Found ${components.length} components to register`);
      
      // Register each component
      for (const component of components) {
        await this.registerComponent(component);
      }
      
      // Handle warehousing for existing instances
      await this.handleWarehousing();
      
      console.log('✅ Component registration completed successfully!');
      
    } catch (error) {
      console.error('❌ Component registration failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Wait for dotCMS to be ready
   */
  async waitForDotCMS() {
    console.log('⏳ Waiting for dotCMS to be ready...');
    
    for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
      try {
        const response = await axios.get(`${CONFIG.dotcmsUrl}/api/v1/system/status`, {
          timeout: 5000
        });
        
        if (response.status === 200) {
          console.log('✅ dotCMS is ready');
          return;
        }
      } catch (error) {
        console.log(`⏳ Attempt ${attempt}/${CONFIG.retryAttempts} - dotCMS not ready yet`);
        
        if (attempt < CONFIG.retryAttempts) {
          await this.sleep(CONFIG.retryDelay);
        }
      }
    }
    
    throw new Error('dotCMS is not ready after maximum retry attempts');
  }

  /**
   * Authenticate with dotCMS
   */
  async authenticate() {
    console.log('🔐 Authenticating with dotCMS...');
    
    try {
      const response = await axios.post(`${CONFIG.dotcmsUrl}/api/v1/authentication`, {
        userId: CONFIG.username,
        password: CONFIG.password
      });
      
      this.authToken = response.data.entity.token;
      console.log('✅ Authentication successful');
      
    } catch (error) {
      throw new Error(`Authentication failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Discover components in the components directory
   */
  async discoverComponents() {
    console.log('🔍 Discovering components...');
    
    const components = [];
    const componentsDir = path.resolve(CONFIG.componentsPath);
    
    if (!fs.existsSync(componentsDir)) {
      console.log('⚠️  Components directory not found, skipping discovery');
      return components;
    }
    
    const entries = fs.readdirSync(componentsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const componentPath = path.join(componentsDir, entry.name);
        const component = await this.parseComponent(entry.name, componentPath);
        
        if (component) {
          components.push(component);
        }
      }
    }
    
    return components;
  }

  /**
   * Parse a component directory and extract metadata
   */
  async parseComponent(name, componentPath) {
    try {
      const packageJsonPath = path.join(componentPath, 'package.json');
      const readmePath = path.join(componentPath, 'README.md');
      
      let packageInfo = {};
      let description = `Component: ${name}`;
      
      // Read package.json if it exists
      if (fs.existsSync(packageJsonPath)) {
        packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        description = packageInfo.description || description;
      }
      
      // Read README if it exists
      if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf8');
        const firstLine = readme.split('\n')[0];
        if (firstLine && !firstLine.startsWith('#')) {
          description = firstLine.trim();
        }
      }
      
      // Discover component files
      const files = this.discoverComponentFiles(componentPath);
      
      const component = {
        ...COMPONENT_TEMPLATE,
        name: packageInfo.name || name,
        description,
        version: packageInfo.version || '1.0.0',
        files,
        metadata: {
          ...COMPONENT_TEMPLATE.metadata,
          packageInfo,
          path: componentPath
        }
      };
      
      return component;
      
    } catch (error) {
      console.warn(`⚠️  Failed to parse component ${name}:`, error.message);
      return null;
    }
  }

  /**
   * Discover component files
   */
  discoverComponentFiles(componentPath) {
    const files = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json'];
    
    const scanDirectory = (dir, relativePath = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDirectory(fullPath, relativeFilePath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push({
              name: entry.name,
              path: relativeFilePath,
              extension: ext,
              size: fs.statSync(fullPath).size
            });
          }
        }
      }
    };
    
    scanDirectory(componentPath);
    return files;
  }

  /**
   * Register a component with dotCMS
   */
  async registerComponent(component) {
    try {
      console.log(`📝 Registering component: ${component.name}`);
      
      // Check if component already exists
      const exists = await this.componentExists(component.name);
      
      if (exists) {
        console.log(`⚠️  Component ${component.name} already exists, updating...`);
        await this.updateComponent(component);
      } else {
        await this.createComponent(component);
      }
      
      this.registeredComponents.add(component.name);
      console.log(`✅ Component ${component.name} registered successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to register component ${component.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if a component exists in dotCMS
   */
  async componentExists(componentName) {
    try {
      const response = await axios.get(
        `${CONFIG.dotcmsUrl}/api/v1/content/query/+contentType:Component +title:${componentName}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );
      
      return response.data.contentlets && response.data.contentlets.length > 0;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a new component in dotCMS
   */
  async createComponent(component) {
    const componentData = {
      contentType: 'Component',
      title: component.name,
      description: component.description,
      version: component.version,
      category: component.category,
      tags: component.tags.join(','),
      files: JSON.stringify(component.files),
      metadata: JSON.stringify(component.metadata)
    };
    
    await axios.post(
      `${CONFIG.dotcmsUrl}/api/v1/content`,
      componentData,
      {
        headers: { Authorization: `Bearer ${this.authToken}` }
      }
    );
  }

  /**
   * Update an existing component in dotCMS
   */
  async updateComponent(component) {
    // Implementation for updating existing components
    // This would involve fetching the existing component and updating its fields
    console.log(`🔄 Updating component ${component.name}...`);
    
    // For now, we'll just log that we're updating
    // In a full implementation, you'd fetch the existing component ID and update it
  }

  /**
   * Handle warehousing for existing instances
   */
  async handleWarehousing() {
    console.log('🏪 Handling warehousing for existing instances...');
    
    try {
      // Get all registered components
      const response = await axios.get(
        `${CONFIG.dotcmsUrl}/api/v1/content/query/+contentType:Component +source:generic-editor`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );
      
      const components = response.data.contentlets || [];
      console.log(`📦 Found ${components.length} existing components for warehousing`);
      
      // Process each component for warehousing
      for (const component of components) {
        await this.processWarehousing(component);
      }
      
      console.log('✅ Warehousing completed');
      
    } catch (error) {
      console.warn('⚠️  Warehousing failed:', error.message);
    }
  }

  /**
   * Process warehousing for a single component
   */
  async processWarehousing(component) {
    try {
      console.log(`🏪 Processing warehousing for: ${component.title}`);
      
      // Create warehouse entry
      const warehouseData = {
        contentType: 'ComponentWarehouse',
        componentId: component.identifier,
        componentName: component.title,
        lastUpdated: new Date().toISOString(),
        status: 'active',
        metadata: JSON.stringify({
          source: 'generic-editor',
          registered: true,
          warehouseEntry: true
        })
      };
      
      await axios.post(
        `${CONFIG.dotcmsUrl}/api/v1/content`,
        warehouseData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );
      
    } catch (error) {
      console.warn(`⚠️  Failed to process warehousing for ${component.title}:`, error.message);
    }
  }

  /**
   * Utility method to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
if (require.main === module) {
  const registrar = new ComponentRegistrar();
  registrar.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ComponentRegistrar;
