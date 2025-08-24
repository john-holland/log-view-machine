#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

/**
 * Discover component-middleware directories and available editors
 */
function discoverEditors() {
  const projectRoot = resolve(__dirname, '..');
  const editors = [];
  
  console.log('🔍 Discovering component-middleware directories and editors...\n');
  
  // Search for component-middleware directories
  function findComponentMiddlewareDirs(dir, depth = 0) {
    if (depth > 5) return; // Limit recursion depth
    
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        
        if (statSync(fullPath).isDirectory()) {
          // Check if this is a component-middleware directory
          if (item === 'component-middleware') {
            const editorPath = join(fullPath, 'generic-editor');
            const serverPath = join(editorPath, 'server.js');
            
            if (existsSync(serverPath)) {
              const relativePath = fullPath.replace(projectRoot, '').replace(/^\//, '');
              editors.push({
                type: 'generic-editor',
                path: relativePath,
                fullPath: fullPath,
                serverPath: serverPath,
                editorPath: editorPath
              });
            }
          }
          
          // Recursively search subdirectories
          findComponentMiddlewareDirs(fullPath, depth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  findComponentMiddlewareDirs(projectRoot);
  
  // Also check for the main editor server
  const mainEditorPath = join(projectRoot, 'editor-build', 'editor-server.js');
  if (existsSync(mainEditorPath)) {
    editors.unshift({
      type: 'main-editor',
      path: 'editor-build',
      fullPath: join(projectRoot, 'editor-build'),
      serverPath: mainEditorPath,
      editorPath: join(projectRoot, 'editor-build')
    });
  }
  
  return editors;
}

/**
 * Display discovered editors
 */
function displayEditors(editors) {
  if (editors.length === 0) {
    console.log('❌ No editors found');
    return;
  }
  
  console.log(`✅ Found ${editors.length} editor(s):\n`);
  
  editors.forEach((editor, index) => {
    console.log(`${index + 1}. ${editor.type.toUpperCase()}`);
    console.log(`   Path: ${editor.path}`);
    console.log(`   Server: ${editor.serverPath}`);
    console.log(`   Type: ${editor.type === 'main-editor' ? 'Main Editor Server' : 'Generic Editor'}`);
    console.log('');
  });
  
  console.log('💡 Usage:');
  console.log('   npm run editor:run -- <editor-number> [port]');
  console.log('   npm run editor:run -- 1 3006    # Run first editor on port 3006');
  console.log('   npm run editor:run -- 2         # Run second editor on default port');
  console.log('');
}

/**
 * Main function
 */
function main() {
  try {
    const editors = discoverEditors();
    displayEditors(editors);
    
    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error('❌ Error discovering editors:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { discoverEditors, displayEditors };
