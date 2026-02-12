#!/usr/bin/env node

/**
 * Cleanup script to remove corrupted HTML content from server.js
 */

import fs from 'fs';
import path from 'path';

const serverPath = './src/server.js';
const backupPath = './src/server.js.backup';

try {
  console.log('🔧 Cleaning up corrupted server.js file...');
  
  // Create backup
  if (fs.existsSync(serverPath)) {
    fs.copyFileSync(serverPath, backupPath);
    console.log('✅ Created backup at server.js.backup');
  }
  
  // Read the file
  let content = fs.readFileSync(serverPath, 'utf8');
  console.log('📖 Read server.js file');
  
  // Find the start and end of the corrupted fish burger demo route
  const startMarker = '// Fish Burger Demo with Generic Editor Components';
  const endMarker = 'res.send(demoHTML);';
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    console.log('🎯 Found corrupted content boundaries');
    
    // Find the catch block
    const catchIndex = content.indexOf('} catch (error) {', endIndex);
    
    if (catchIndex !== -1) {
      // Remove everything from start to catch block
      const beforeRoute = content.substring(0, startIndex);
      const afterCatch = content.substring(catchIndex);
      
      // Create clean route
      const cleanRoute = `// Fish Burger Demo with Generic Editor Components
app.get('/fish-burger-demo', (req, res) => {
  try {
    logger.info('Serving Fish Burger Demo with Generic Editor Components...');
    
    // Serve the fish burger demo HTML template from external file
    res.sendFile('./src/component-middleware/generic-editor/assets/components/fish-burger-demo/templates/demo-template.html', { root: process.cwd() });
  } catch (error) {
    logger.error('Fish Burger Demo failed:', error);
    res.status(500).send(\`
      <h1>Error Loading Fish Burger Demo</h1>
      <p>\${error.message}</p>
      <pre>\${error.stack}</pre>
    \`);
  }
});

`;
      
      // Combine the parts
      const newContent = beforeRoute + cleanRoute + afterCatch;
      
      // Write the cleaned file
      fs.writeFileSync(serverPath, newContent, 'utf8');
      console.log('✅ Successfully cleaned server.js file');
      
    } else {
      console.log('❌ Could not find catch block');
    }
  } else {
    console.log('❌ Could not find corrupted content boundaries');
  }
  
} catch (error) {
  console.error('❌ Error during cleanup:', error);
}

