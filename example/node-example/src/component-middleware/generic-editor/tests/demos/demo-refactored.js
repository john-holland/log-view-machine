/**
 * Generic Editor Demo - Refactored with Log View Model
 * 
 * This demo showcases the refactored generic editor that uses the log-view-model
 * and implements a hierarchical template structure.
 */

import { 
  createGenericEditor, 
  createTemplate, 
  runGenericEditorDemo,
  integrateWithFishBurger 
} from './index-new.js';

/**
 * Demo: Basic Template Creation
 */
async function demoBasicTemplates() {
  console.log('\n🎯 Demo: Basic Template Creation');
  console.log('================================');
  
  try {
    // Create individual templates
    const htmlEditor = createTemplate('html-editor');
    const cssEditor = createTemplate('css-editor');
    const jsEditor = createTemplate('javascript-editor');
    const xstateEditor = createTemplate('xstate-editor');
    const componentLibrary = createTemplate('component-library');
    
    console.log('✅ Individual templates created successfully');
    console.log('📊 HTML Editor state:', htmlEditor.getCurrentState());
    console.log('📊 CSS Editor state:', cssEditor.getCurrentState());
    console.log('📊 JS Editor state:', jsEditor.getCurrentState());
    console.log('📊 XState Editor state:', xstateEditor.getCurrentState());
    console.log('📊 Component Library state:', componentLibrary.getCurrentState());
    
    return { htmlEditor, cssEditor, jsEditor, xstateEditor, componentLibrary };
    
  } catch (error) {
    console.error('❌ Error in basic templates demo:', error);
    throw error;
  }
}

/**
 * Demo: Main Editor Composition
 */
async function demoMainEditor() {
  console.log('\n🎯 Demo: Main Editor Composition');
  console.log('================================');
  
  try {
    // Create the main editor
    const editor = createGenericEditor({
      enablePersistence: true,
      autoSaveInterval: 5000
    });
    
    console.log('✅ Main editor created');
    console.log('📋 Available templates:', editor.getAvailableTemplates());
    
    // Log template metadata
    editor.getAvailableTemplates().forEach(templateId => {
      const metadata = editor.getTemplateMetadata(templateId);
      console.log(`📄 ${metadata.name} (${metadata.id})`);
      console.log(`   Description: ${metadata.description}`);
      console.log(`   Version: ${metadata.version}`);
      console.log(`   Dependencies: ${metadata.dependencies.join(', ')}`);
    });
    
    // Create the main editor instance
    const mainEditor = editor.createEditor();
    console.log('🎯 Main editor instance created');
    console.log('📊 Current state:', mainEditor.getCurrentState());
    
    return { editor, mainEditor };
    
  } catch (error) {
    console.error('❌ Error in main editor demo:', error);
    throw error;
  }
}

/**
 * Demo: State Machine Events
 */
async function demoStateMachineEvents() {
  console.log('\n🎯 Demo: State Machine Events');
  console.log('=============================');
  
  try {
    const editor = createGenericEditor();
    const mainEditor = editor.createEditor();
    
    console.log('📊 Initial state:', mainEditor.getCurrentState());
    
    // Send events to transition states
    console.log('🔄 Sending LOAD_COMPONENT event...');
    mainEditor.send({ type: 'LOAD_COMPONENT' });
    console.log('📊 State after LOAD_COMPONENT:', mainEditor.getCurrentState());
    
    // Simulate component loaded
    console.log('🔄 Sending COMPONENT_LOADED event...');
    mainEditor.send({ type: 'COMPONENT_LOADED' });
    console.log('📊 State after COMPONENT_LOADED:', mainEditor.getCurrentState());
    
    // Switch to library
    console.log('🔄 Sending OPEN_LIBRARY event...');
    mainEditor.send({ type: 'OPEN_LIBRARY' });
    console.log('📊 State after OPEN_LIBRARY:', mainEditor.getCurrentState());
    
    // Close library
    console.log('🔄 Sending LIBRARY_CLOSE event...');
    mainEditor.send({ type: 'LIBRARY_CLOSE' });
    console.log('📊 State after LIBRARY_CLOSE:', mainEditor.getCurrentState());
    
    return { editor, mainEditor };
    
  } catch (error) {
    console.error('❌ Error in state machine events demo:', error);
    throw error;
  }
}

/**
 * Demo: Template Rendering
 */
async function demoTemplateRendering() {
  console.log('\n🎯 Demo: Template Rendering');
  console.log('==========================');
  
  try {
    // Create individual templates
    const htmlEditor = createTemplate('html-editor');
    const cssEditor = createTemplate('css-editor');
    const jsEditor = createTemplate('javascript-editor');
    const xstateEditor = createTemplate('xstate-editor');
    const componentLibrary = createTemplate('component-library');
    
    // Render each template with a sample model
    const sampleModel = {
      content: '<div>Sample content</div>',
      metadata: { author: 'Demo User', created: new Date() }
    };
    
    console.log('🎨 Rendering HTML Editor...');
    const htmlRender = htmlEditor.render(sampleModel);
    console.log('✅ HTML Editor rendered');
    
    console.log('🎨 Rendering CSS Editor...');
    const cssRender = cssEditor.render(sampleModel);
    console.log('✅ CSS Editor rendered');
    
    console.log('🎨 Rendering JS Editor...');
    const jsRender = jsEditor.render(sampleModel);
    console.log('✅ JS Editor rendered');
    
    console.log('🎨 Rendering XState Editor...');
    const xstateRender = xstateEditor.render(sampleModel);
    console.log('✅ XState Editor rendered');
    
    console.log('🎨 Rendering Component Library...');
    const libraryRender = componentLibrary.render(sampleModel);
    console.log('✅ Component Library rendered');
    
    return {
      renders: {
        html: htmlRender,
        css: cssRender,
        js: jsRender,
        xstate: xstateRender,
        library: libraryRender
      }
    };
    
  } catch (error) {
    console.error('❌ Error in template rendering demo:', error);
    throw error;
  }
}

/**
 * Demo: Fish Burger Integration
 */
async function demoFishBurgerIntegration() {
  console.log('\n🎯 Demo: Fish Burger Integration');
  console.log('================================');
  
  try {
    const fishBurgerConfig = {
      backendUrl: 'http://localhost:3000',
      enableTracing: true,
      enableLogging: true
    };
    
    const result = await integrateWithFishBurger(fishBurgerConfig);
    
    console.log('✅ Fish Burger integration successful');
    console.log('📊 Editor state:', result.editor.getCurrentState());
    console.log('⚙️  Config:', result.config);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in Fish Burger integration demo:', error);
    throw error;
  }
}

/**
 * Main demo runner
 */
async function runAllDemos() {
  console.log('🚀 Generic Editor Demo - Refactored with Log View Model');
  console.log('========================================================');
  
  try {
    // Run all demos
    await demoBasicTemplates();
    await demoMainEditor();
    await demoStateMachineEvents();
    await demoTemplateRendering();
    await demoFishBurgerIntegration();
    
    console.log('\n🎉 All demos completed successfully!');
    console.log('✅ Generic Editor refactored with log-view-model');
    console.log('✅ Hierarchical template structure implemented');
    console.log('✅ Each component exported as standalone template');
    console.log('✅ State machine integration working');
    console.log('✅ Template composition working');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos().catch(console.error);
}

export {
  demoBasicTemplates,
  demoMainEditor,
  demoStateMachineEvents,
  demoTemplateRendering,
  demoFishBurgerIntegration,
  runAllDemos
}; 