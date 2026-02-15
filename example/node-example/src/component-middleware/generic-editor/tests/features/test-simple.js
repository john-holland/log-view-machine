/**
 * Simple test for the refactored generic editor
 */

import { createTemplate } from './index-new.js';

console.log('🧪 Testing refactored generic editor...');

try {
  // Test creating a simple template
  const htmlEditor = createTemplate('html-editor');
  console.log('✅ HTML Editor template created successfully');
  console.log('📊 Template ID:', htmlEditor.id);
  console.log('📊 Template name:', htmlEditor.name);
  
  console.log('🎉 Basic test passed!');
  
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
} 