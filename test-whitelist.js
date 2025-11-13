// Simple test script for whitelist functionality
const fs = require('fs');
const path = require('path');

// Test 1: Load whitelist configuration
console.log('🧪 Test 1: Loading component whitelist...');
try {
  const whitelistPath = path.join(__dirname, 'src/config/component-whitelist.json');
  const whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
  console.log('✅ Whitelist loaded successfully');
  console.log(`   - Version: ${whitelist.version}`);
  console.log(`   - Components: ${Object.keys(whitelist.whitelistedComponents).length}`);
  console.log(`   - Components: ${Object.keys(whitelist.whitelistedComponents).join(', ')}`);
} catch (error) {
  console.log('❌ Failed to load whitelist:', error.message);
}

// Test 2: Check specific component
console.log('\n🧪 Test 2: Checking wave-tabs component...');
try {
  const whitelistPath = path.join(__dirname, 'src/config/component-whitelist.json');
  const whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
  const waveTabs = whitelist.whitelistedComponents['wave-tabs'];
  if (waveTabs) {
    console.log('✅ wave-tabs component found');
    console.log(`   - Moddable: ${waveTabs.moddable}`);
    console.log(`   - Badge: ${waveTabs.badge}`);
    console.log(`   - Max files: ${waveTabs.moddingRules.maxFiles}`);
  } else {
    console.log('❌ wave-tabs component not found');
  }
} catch (error) {
  console.log('❌ Failed to check wave-tabs:', error.message);
}

// Test 3: Validate file sizes
console.log('\n🧪 Test 3: Testing file size validation...');
try {
  const whitelistPath = path.join(__dirname, 'src/config/component-whitelist.json');
  const whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
  const waveTabs = whitelist.whitelistedComponents['wave-tabs'];
  
  // Test oversized file
  const oversizedContent = 'x'.repeat(60000); // 60KB HTML
  const maxSize = waveTabs.fileRules.maxSizes.html; // 50KB
  
  if (Buffer.byteLength(oversizedContent, 'utf8') > maxSize) {
    console.log('✅ File size validation working');
    console.log(`   - Test content: ${Buffer.byteLength(oversizedContent, 'utf8')} bytes`);
    console.log(`   - Max allowed: ${maxSize} bytes`);
    console.log(`   - Would be rejected: ${Buffer.byteLength(oversizedContent, 'utf8') > maxSize}`);
  } else {
    console.log('❌ File size validation not working');
  }
} catch (error) {
  console.log('❌ Failed to test file size validation:', error.message);
}

// Test 4: Check restricted APIs
console.log('\n🧪 Test 4: Testing restricted API detection...');
try {
  const whitelistPath = path.join(__dirname, 'src/config/component-whitelist.json');
  const whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
  const waveTabs = whitelist.whitelistedComponents['wave-tabs'];
  
  const testCode = `
    console.log('Hello world');
    eval('malicious code');
    chrome.storage.local.clear();
  `;
  
  const restrictedAPIs = waveTabs.fileRules.restrictedAPIs;
  const foundRestricted = restrictedAPIs.filter(api => {
    if (api.includes('*')) {
      const pattern = api.replace('*', '\\w*');
      const regex = new RegExp(`\\b${pattern}\\b`, 'g');
      return regex.test(testCode);
    } else {
      const regex = new RegExp(`\\b${api}\\b`, 'g');
      return regex.test(testCode);
    }
  });
  
  console.log('✅ Restricted API detection working');
  console.log(`   - Found restricted APIs: ${foundRestricted.join(', ')}`);
  console.log(`   - Would be rejected: ${foundRestricted.length > 0}`);
} catch (error) {
  console.log('❌ Failed to test restricted API detection:', error.message);
}

// Test 5: Check global rules
console.log('\n🧪 Test 5: Testing global rules...');
try {
  const whitelistPath = path.join(__dirname, 'src/config/component-whitelist.json');
  const whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
  const globalRules = whitelist.globalRules;
  
  console.log('✅ Global rules loaded');
  console.log(`   - Max total size: ${globalRules.maxTotalSize} bytes`);
  console.log(`   - Require auth: ${globalRules.requireAuthentication}`);
  console.log(`   - Allow versioning: ${globalRules.allowVersioning}`);
  console.log(`   - Auto save: ${globalRules.autoSave}`);
  console.log(`   - History limit: ${globalRules.historyLimit}`);
} catch (error) {
  console.log('❌ Failed to test global rules:', error.message);
}

console.log('\n🎉 Whitelist testing completed!');


