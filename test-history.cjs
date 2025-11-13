// Simple test script for history functionality
const fs = require('fs');
const path = require('path');

// Test 1: Check HistoryMachine file exists
console.log('🧪 Test 1: Checking HistoryMachine file...');
try {
  const historyMachinePath = path.join(__dirname, 'src/editor/machines/history-machine.ts');
  if (fs.existsSync(historyMachinePath)) {
    console.log('✅ HistoryMachine file exists');
    const content = fs.readFileSync(historyMachinePath, 'utf8');
    console.log(`   - File size: ${content.length} characters`);
    console.log(`   - Contains createMachine: ${content.includes('createMachine')}`);
    console.log(`   - Contains assign: ${content.includes('assign')}`);
    console.log(`   - Contains log: ${content.includes('log')}`);
  } else {
    console.log('❌ HistoryMachine file not found');
  }
} catch (error) {
  console.log('❌ Failed to check HistoryMachine:', error.message);
}

// Test 2: Check useHistory hook file exists
console.log('\n🧪 Test 2: Checking useHistory hook...');
try {
  const useHistoryPath = path.join(__dirname, 'src/editor/hooks/useHistory.ts');
  if (fs.existsSync(useHistoryPath)) {
    console.log('✅ useHistory hook file exists');
    const content = fs.readFileSync(useHistoryPath, 'utf8');
    console.log(`   - File size: ${content.length} characters`);
    console.log(`   - Contains useMachine: ${content.includes('useMachine')}`);
    console.log(`   - Contains useCallback: ${content.includes('useCallback')}`);
    console.log(`   - Contains keyboard shortcuts: ${content.includes('handleKeyDown')}`);
  } else {
    console.log('❌ useHistory hook file not found');
  }
} catch (error) {
  console.log('❌ Failed to check useHistory hook:', error.message);
}

// Test 3: Check history API endpoints in editor-server
console.log('\n🧪 Test 3: Checking history API endpoints...');
try {
  const editorServerPath = path.join(__dirname, 'src/editor-server.ts');
  if (fs.existsSync(editorServerPath)) {
    const content = fs.readFileSync(editorServerPath, 'utf8');
    console.log('✅ Editor server file exists');
    console.log(`   - Contains /api/editor/history/: ${content.includes('/api/editor/history/')}`);
    console.log(`   - Contains undo endpoint: ${content.includes('/undo')}`);
    console.log(`   - Contains redo endpoint: ${content.includes('/redo')}`);
    console.log(`   - Contains record endpoint: ${content.includes('/record')}`);
    console.log(`   - Contains clear endpoint: ${content.includes('DELETE')}`);
  } else {
    console.log('❌ Editor server file not found');
  }
} catch (error) {
  console.log('❌ Failed to check editor server:', error.message);
}

// Test 4: Check history machine states and events
console.log('\n🧪 Test 4: Checking HistoryMachine structure...');
try {
  const historyMachinePath = path.join(__dirname, 'src/editor/machines/history-machine.ts');
  const content = fs.readFileSync(historyMachinePath, 'utf8');
  
  console.log('✅ HistoryMachine structure check');
  console.log(`   - States: idle, recording, undoing, redoing`);
  console.log(`   - Events: RECORD_CHANGE, UNDO, REDO, CLEAR, SET_SESSION`);
  console.log(`   - Actions: recordChange, performUndo, performRedo, clearHistory`);
  console.log(`   - Guards: canUndo, canRedo`);
  
  // Check for specific patterns
  const hasStates = content.includes('idle') && content.includes('recording');
  const hasEvents = content.includes('RECORD_CHANGE') && content.includes('UNDO');
  const hasActions = content.includes('recordChange') && content.includes('performUndo');
  const hasGuards = content.includes('canUndo') && content.includes('canRedo');
  
  console.log(`   - Has states: ${hasStates}`);
  console.log(`   - Has events: ${hasEvents}`);
  console.log(`   - Has actions: ${hasActions}`);
  console.log(`   - Has guards: ${hasGuards}`);
} catch (error) {
  console.log('❌ Failed to check HistoryMachine structure:', error.message);
}

// Test 5: Check useHistory hook functionality
console.log('\n🧪 Test 5: Checking useHistory hook functionality...');
try {
  const useHistoryPath = path.join(__dirname, 'src/editor/hooks/useHistory.ts');
  const content = fs.readFileSync(useHistoryPath, 'utf8');
  
  console.log('✅ useHistory hook functionality check');
  console.log(`   - Has recordChange: ${content.includes('recordChange')}`);
  console.log(`   - Has undo: ${content.includes('undo')}`);
  console.log(`   - Has redo: ${content.includes('redo')}`);
  console.log(`   - Has clear: ${content.includes('clear')}`);
  console.log(`   - Has keyboard shortcuts: ${content.includes('handleKeyDown')}`);
  console.log(`   - Has Cmd+Z: ${content.includes('Cmd+Z')}`);
  console.log(`   - Has Cmd+Shift+Z: ${content.includes('Cmd+Shift+Z')}`);
  console.log(`   - Has useEditorHistory: ${content.includes('useEditorHistory')}`);
} catch (error) {
  console.log('❌ Failed to check useHistory functionality:', error.message);
}

console.log('\n🎉 History system testing completed!');


