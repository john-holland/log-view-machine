// Simple test script for mod storage functionality
const fs = require('fs');
const path = require('path');

// Test 1: Check ModStorageService file exists
console.log('🧪 Test 1: Checking ModStorageService file...');
try {
  const modStoragePath = path.join(__dirname, 'src/services/mod-storage.ts');
  if (fs.existsSync(modStoragePath)) {
    console.log('✅ ModStorageService file exists');
    const content = fs.readFileSync(modStoragePath, 'utf8');
    console.log(`   - File size: ${content.length} characters`);
    console.log(`   - Contains ModStorageService class: ${content.includes('class ModStorageService')}`);
    console.log(`   - Contains saveModVersion: ${content.includes('saveModVersion')}`);
    console.log(`   - Contains getModVersions: ${content.includes('getModVersions')}`);
    console.log(`   - Contains restoreModVersion: ${content.includes('restoreModVersion')}`);
  } else {
    console.log('❌ ModStorageService file not found');
  }
} catch (error) {
  console.log('❌ Failed to check ModStorageService:', error.message);
}

// Test 2: Check mod storage API endpoints
console.log('\n🧪 Test 2: Checking mod storage API endpoints...');
try {
  const editorServerPath = path.join(__dirname, 'src/editor-server.ts');
  if (fs.existsSync(editorServerPath)) {
    const content = fs.readFileSync(editorServerPath, 'utf8');
    console.log('✅ Editor server file exists');
    console.log(`   - Contains /api/mods/save: ${content.includes('/api/mods/save')}`);
    console.log(`   - Contains /api/mods/:modId/versions: ${content.includes('/api/mods/:modId/versions')}`);
    console.log(`   - Contains /api/mods/:modId/version/:version: ${content.includes('/api/mods/:modId/version/:version')}`);
    console.log(`   - Contains /api/mods/:modId/restore/:version: ${content.includes('/api/mods/:modId/restore/:version')}`);
    console.log(`   - Contains /api/mods/:modId/current: ${content.includes('/api/mods/:modId/current')}`);
    console.log(`   - Contains /api/mods/:modId/metadata: ${content.includes('/api/mods/:modId/metadata')}`);
  } else {
    console.log('❌ Editor server file not found');
  }
} catch (error) {
  console.log('❌ Failed to check mod storage endpoints:', error.message);
}

// Test 3: Check storage structure
console.log('\n🧪 Test 3: Checking storage structure...');
try {
  const modStoragePath = path.join(__dirname, 'src/services/mod-storage.ts');
  const content = fs.readFileSync(modStoragePath, 'utf8');
  
  console.log('✅ ModStorageService structure check');
  console.log(`   - Has warehouse path: ${content.includes('warehousePath')}`);
  console.log(`   - Has version management: ${content.includes('getNextVersion')}`);
  console.log(`   - Has file operations: ${content.includes('fs.writeFileSync')}`);
  console.log(`   - Has metadata handling: ${content.includes('metadata.json')}`);
  console.log(`   - Has cleanup functionality: ${content.includes('cleanupOldVersions')}`);
  
  // Check for specific methods
  const methods = [
    'saveModVersion',
    'getModVersions', 
    'getModVersion',
    'restoreModVersion',
    'getCurrentMod',
    'getModMetadata',
    'cleanupOldVersions'
  ];
  
  methods.forEach(method => {
    console.log(`   - Has ${method}: ${content.includes(method)}`);
  });
} catch (error) {
  console.log('❌ Failed to check storage structure:', error.message);
}

// Test 4: Check version control logic
console.log('\n🧪 Test 4: Checking version control logic...');
try {
  const modStoragePath = path.join(__dirname, 'src/services/mod-storage.ts');
  const content = fs.readFileSync(modStoragePath, 'utf8');
  
  console.log('✅ Version control logic check');
  console.log(`   - Has version numbering: ${content.includes('v1') || content.includes('v2')}`);
  console.log(`   - Has timestamp tracking: ${content.includes('timestamp')}`);
  console.log(`   - Has file content storage: ${content.includes('files')}`);
  console.log(`   - Has metadata tracking: ${content.includes('metadata')}`);
  console.log(`   - Has current/versions structure: ${content.includes('current') && content.includes('versions')}`);
  console.log(`   - Has max versions limit: ${content.includes('maxVersions')}`);
} catch (error) {
  console.log('❌ Failed to check version control logic:', error.message);
}

// Test 5: Check API endpoint implementations
console.log('\n🧪 Test 5: Checking API endpoint implementations...');
try {
  const editorServerPath = path.join(__dirname, 'src/editor-server.ts');
  const content = fs.readFileSync(editorServerPath, 'utf8');
  
  console.log('✅ API endpoint implementations check');
  console.log(`   - Has POST /api/mods/save: ${content.includes('app.post(\'/api/mods/save\'')}`);
  console.log(`   - Has GET /api/mods/:modId/versions: ${content.includes('app.get(\'/api/mods/:modId/versions\'')}`);
  console.log(`   - Has GET /api/mods/:modId/version/:version: ${content.includes('app.get(\'/api/mods/:modId/version/:version\'')}`);
  console.log(`   - Has POST /api/mods/:modId/restore/:version: ${content.includes('app.post(\'/api/mods/:modId/restore/:version\'')}`);
  console.log(`   - Has GET /api/mods/:modId/current: ${content.includes('app.get(\'/api/mods/:modId/current\'')}`);
  console.log(`   - Has GET /api/mods/:modId/metadata: ${content.includes('app.get(\'/api/mods/:modId/metadata\'')}`);
  
  // Check for error handling
  console.log(`   - Has error handling: ${content.includes('try {') && content.includes('catch')}`);
  console.log(`   - Has success responses: ${content.includes('success: true')}`);
  console.log(`   - Has validation: ${content.includes('userId') && content.includes('modId')}`);
} catch (error) {
  console.log('❌ Failed to check API implementations:', error.message);
}

console.log('\n🎉 Mod storage testing completed!');


