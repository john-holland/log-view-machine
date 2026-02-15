#!/usr/bin/env node

/**
 * Template Registration Script for dotCMS
 * 
 * This script registers the existing templates with the dotCMS instance
 * running in the docker-compose setup.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// dotCMS Configuration
const DOTCMS_CONFIG = {
  baseUrl: process.env.DOTCMS_URL || 'http://localhost:8080',
  apiKey: process.env.DOTCMS_API_KEY || 'demo-key',
  adminUser: process.env.DOTCMS_ADMIN_USER || 'admin@dotcms.com',
  adminPassword: process.env.DOTCMS_ADMIN_PASSWORD || 'admin'
};

// Template definitions
const TEMPLATES = [
  {
    name: 'HTML Editor',
    identifier: 'html-editor',
    description: 'Generic HTML editor component with SunEditor integration',
    category: 'Editor Components',
    templatePath: 'templates/html-editor',
    version: '1.0.0'
  },
  {
    name: 'CSS Editor',
    identifier: 'css-editor',
    description: 'CSS editor component with Ace editor integration',
    category: 'Editor Components',
    templatePath: 'templates/css-editor',
    version: '1.0.0'
  },
  {
    name: 'JavaScript Editor',
    identifier: 'javascript-editor',
    description: 'JavaScript editor component with Ace editor integration',
    category: 'Editor Components',
    templatePath: 'templates/javascript-editor',
    version: '1.0.0'
  },
  {
    name: 'XState Editor',
    identifier: 'xstate-editor',
    description: 'XState state machine editor and visualizer',
    category: 'Editor Components',
    templatePath: 'templates/xstate-editor',
    version: '1.0.0'
  },
  {
    name: 'Component Library',
    identifier: 'component-library',
    description: 'Component library and management system',
    category: 'Management Components',
    templatePath: 'templates/component-library',
    version: '1.0.0'
  },
  {
    name: 'Generic Editor',
    identifier: 'generic-editor',
    description: 'Complete generic editor with all components integrated',
    category: 'Editor Components',
    templatePath: 'templates/generic-editor',
    version: '1.0.0'
  }
];

/**
 * Read template files and create dotCMS resource
 */
async function readTemplateFiles(templatePath) {
  const fullPath = path.join(__dirname, templatePath);
  
  try {
    const files = await fs.readdir(fullPath, { recursive: true });
    const templateData = {};
    
    for (const file of files) {
      if (typeof file === 'string') {
        const filePath = path.join(fullPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const content = await fs.readFile(filePath, 'utf8');
          templateData[file] = {
            content,
            size: stats.size,
            modified: stats.mtime
          };
        }
      }
    }
    
    return templateData;
  } catch (error) {
    console.error(`Error reading template files for ${templatePath}:`, error);
    return null;
  }
}

/**
 * Create dotCMS resource for a template
 */
async function createDotCMSResource(template) {
  const templateData = await readTemplateFiles(template.templatePath);
  
  if (!templateData) {
    console.error(`Failed to read template files for ${template.name}`);
    return false;
  }
  
  const resource = {
    name: template.name,
    identifier: template.identifier,
    description: template.description,
    category: template.category,
    version: template.version,
    templateData,
    metadata: {
      createdBy: 'generic-editor',
      createdDate: new Date().toISOString(),
      templateType: 'component',
      dependencies: ['generic-editor']
    }
  };
  
  return resource;
}

/**
 * Register template with dotCMS
 */
async function registerTemplateWithDotCMS(resource) {
  try {
    const response = await fetch(`${DOTCMS_CONFIG.baseUrl}/api/v1/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOTCMS_CONFIG.apiKey}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        contentType: 'Template',
        title: resource.name,
        identifier: resource.identifier,
        description: resource.description,
        category: resource.category,
        version: resource.version,
        templateData: JSON.stringify(resource.templateData),
        metadata: resource.metadata
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Registered template: ${resource.name} (ID: ${result.id})`);
      return true;
    } else {
      console.error(`❌ Failed to register template ${resource.name}:`, response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error registering template ${resource.name}:`, error);
    return false;
  }
}

/**
 * Main registration function
 */
async function registerAllTemplates() {
  console.log('🚀 Starting template registration with dotCMS...');
  console.log(`📡 dotCMS URL: ${DOTCMS_CONFIG.baseUrl}`);
  
  let successCount = 0;
  let totalCount = TEMPLATES.length;
  
  for (const template of TEMPLATES) {
    console.log(`\n📦 Processing template: ${template.name}`);
    
    const resource = await createDotCMSResource(template);
    if (resource) {
      const success = await registerTemplateWithDotCMS(resource);
      if (success) {
        successCount++;
      }
    }
  }
  
  console.log(`\n📊 Registration Summary:`);
  console.log(`✅ Successfully registered: ${successCount}/${totalCount} templates`);
  
  if (successCount === totalCount) {
    console.log('🎉 All templates registered successfully!');
  } else {
    console.log('⚠️  Some templates failed to register. Check the logs above.');
  }
}

/**
 * Check dotCMS connectivity
 */
async function checkDotCMSConnectivity() {
  try {
    const response = await fetch(`${DOTCMS_CONFIG.baseUrl}/api/v1/system/status`);
    if (response.ok) {
      const status = await response.json();
      console.log('✅ dotCMS is accessible:', status);
      return true;
    } else {
      console.error('❌ dotCMS is not accessible:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to dotCMS:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Template Registration Script for dotCMS');
  console.log('==========================================');
  
  // Check connectivity first
  const isConnected = await checkDotCMSConnectivity();
  if (!isConnected) {
    console.log('\n💡 Make sure dotCMS is running:');
    console.log('   docker-compose up -d dotcms');
    console.log('\n💡 Or check the environment variables:');
    console.log('   DOTCMS_URL=http://localhost:8080');
    console.log('   DOTCMS_API_KEY=your-api-key');
    process.exit(1);
  }
  
  // Register templates
  await registerAllTemplates();
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { registerAllTemplates, checkDotCMSConnectivity }; 

/**
 * Template Registration Script for dotCMS
 * 
 * This script registers the existing templates with the dotCMS instance
 * running in the docker-compose setup.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// dotCMS Configuration
const DOTCMS_CONFIG = {
  baseUrl: process.env.DOTCMS_URL || 'http://localhost:8080',
  apiKey: process.env.DOTCMS_API_KEY || 'demo-key',
  adminUser: process.env.DOTCMS_ADMIN_USER || 'admin@dotcms.com',
  adminPassword: process.env.DOTCMS_ADMIN_PASSWORD || 'admin'
};

// Template definitions
const TEMPLATES = [
  {
    name: 'HTML Editor',
    identifier: 'html-editor',
    description: 'Generic HTML editor component with SunEditor integration',
    category: 'Editor Components',
    templatePath: 'templates/html-editor',
    version: '1.0.0'
  },
  {
    name: 'CSS Editor',
    identifier: 'css-editor',
    description: 'CSS editor component with Ace editor integration',
    category: 'Editor Components',
    templatePath: 'templates/css-editor',
    version: '1.0.0'
  },
  {
    name: 'JavaScript Editor',
    identifier: 'javascript-editor',
    description: 'JavaScript editor component with Ace editor integration',
    category: 'Editor Components',
    templatePath: 'templates/javascript-editor',
    version: '1.0.0'
  },
  {
    name: 'XState Editor',
    identifier: 'xstate-editor',
    description: 'XState state machine editor and visualizer',
    category: 'Editor Components',
    templatePath: 'templates/xstate-editor',
    version: '1.0.0'
  },
  {
    name: 'Component Library',
    identifier: 'component-library',
    description: 'Component library and management system',
    category: 'Management Components',
    templatePath: 'templates/component-library',
    version: '1.0.0'
  },
  {
    name: 'Generic Editor',
    identifier: 'generic-editor',
    description: 'Complete generic editor with all components integrated',
    category: 'Editor Components',
    templatePath: 'templates/generic-editor',
    version: '1.0.0'
  }
];

/**
 * Read template files and create dotCMS resource
 */
async function readTemplateFiles(templatePath) {
  const fullPath = path.join(__dirname, templatePath);
  
  try {
    const files = await fs.readdir(fullPath, { recursive: true });
    const templateData = {};
    
    for (const file of files) {
      if (typeof file === 'string') {
        const filePath = path.join(fullPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const content = await fs.readFile(filePath, 'utf8');
          templateData[file] = {
            content,
            size: stats.size,
            modified: stats.mtime
          };
        }
      }
    }
    
    return templateData;
  } catch (error) {
    console.error(`Error reading template files for ${templatePath}:`, error);
    return null;
  }
}

/**
 * Create dotCMS resource for a template
 */
async function createDotCMSResource(template) {
  const templateData = await readTemplateFiles(template.templatePath);
  
  if (!templateData) {
    console.error(`Failed to read template files for ${template.name}`);
    return false;
  }
  
  const resource = {
    name: template.name,
    identifier: template.identifier,
    description: template.description,
    category: template.category,
    version: template.version,
    templateData,
    metadata: {
      createdBy: 'generic-editor',
      createdDate: new Date().toISOString(),
      templateType: 'component',
      dependencies: ['generic-editor']
    }
  };
  
  return resource;
}

/**
 * Register template with dotCMS
 */
async function registerTemplateWithDotCMS(resource) {
  try {
    const response = await fetch(`${DOTCMS_CONFIG.baseUrl}/api/v1/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOTCMS_CONFIG.apiKey}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        contentType: 'Template',
        title: resource.name,
        identifier: resource.identifier,
        description: resource.description,
        category: resource.category,
        version: resource.version,
        templateData: JSON.stringify(resource.templateData),
        metadata: resource.metadata
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Registered template: ${resource.name} (ID: ${result.id})`);
      return true;
    } else {
      console.error(`❌ Failed to register template ${resource.name}:`, response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error registering template ${resource.name}:`, error);
    return false;
  }
}

/**
 * Main registration function
 */
async function registerAllTemplates() {
  console.log('🚀 Starting template registration with dotCMS...');
  console.log(`📡 dotCMS URL: ${DOTCMS_CONFIG.baseUrl}`);
  
  let successCount = 0;
  let totalCount = TEMPLATES.length;
  
  for (const template of TEMPLATES) {
    console.log(`\n📦 Processing template: ${template.name}`);
    
    const resource = await createDotCMSResource(template);
    if (resource) {
      const success = await registerTemplateWithDotCMS(resource);
      if (success) {
        successCount++;
      }
    }
  }
  
  console.log(`\n📊 Registration Summary:`);
  console.log(`✅ Successfully registered: ${successCount}/${totalCount} templates`);
  
  if (successCount === totalCount) {
    console.log('🎉 All templates registered successfully!');
  } else {
    console.log('⚠️  Some templates failed to register. Check the logs above.');
  }
}

/**
 * Check dotCMS connectivity
 */
async function checkDotCMSConnectivity() {
  try {
    const response = await fetch(`${DOTCMS_CONFIG.baseUrl}/api/v1/system/status`);
    if (response.ok) {
      const status = await response.json();
      console.log('✅ dotCMS is accessible:', status);
      return true;
    } else {
      console.error('❌ dotCMS is not accessible:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to dotCMS:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Template Registration Script for dotCMS');
  console.log('==========================================');
  
  // Check connectivity first
  const isConnected = await checkDotCMSConnectivity();
  if (!isConnected) {
    console.log('\n💡 Make sure dotCMS is running:');
    console.log('   docker-compose up -d dotcms');
    console.log('\n💡 Or check the environment variables:');
    console.log('   DOTCMS_URL=http://localhost:8080');
    console.log('   DOTCMS_API_KEY=your-api-key');
    process.exit(1);
  }
  
  // Register templates
  await registerAllTemplates();
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { registerAllTemplates, checkDotCMSConnectivity }; 