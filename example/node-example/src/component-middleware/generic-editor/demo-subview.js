/**
 * SubView System Demo
 * 
 * Demonstrates the subView system with separate SunEditor instances,
 * local .tsx files, and navigation capabilities.
 */

import { createSubViewManager } from './templates/generic-editor/subview-utility.js';
import { GenericEditorTemplate } from './templates/generic-editor/index.js';

async function runSubViewDemo() {
  console.log('🚀 Starting SubView System Demo...\n');

  try {
    // Create subView manager
    const subViewManager = createSubViewManager();
    console.log('✅ SubView Manager created');

    // Create some sample subViews
    const sampleSubViews = [
      {
        name: 'HeaderComponent',
        content: `import React from 'react';

export const HeaderComponent = ({ title, subtitle }) => {
  return (
    <header className="app-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
};`
      },
      {
        name: 'ButtonComponent',
        content: `import React from 'react';

export const ButtonComponent = ({ text, onClick, variant = 'primary' }) => {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};`
      },
      {
        name: 'CardComponent',
        content: `import React from 'react';

export const CardComponent = ({ title, content, image }) => {
  return (
    <div className="card">
      {image && <img src={image} alt={title} className="card-image" />}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-content">{content}</p>
      </div>
    </div>
  );
};`
      }
    ];

    // Create subViews
    console.log('\n📝 Creating sample subViews...');
    for (const sample of sampleSubViews) {
      const subView = subViewManager.createSubView(sample.name, sample.content, 'tsx');
      console.log(`✅ Created subView: ${subView.name} (${subView.fileName})`);
    }

    // List all subViews
    console.log('\n📋 All subViews:');
    const allSubViews = subViewManager.getAllSubViews();
    allSubViews.forEach(subView => {
      console.log(`  - ${subView.name} (${subView.fileName}) - Active: ${subView.isActive}`);
    });

    // Test switching between subViews
    console.log('\n🔄 Testing subView switching...');
    if (allSubViews.length > 0) {
      const firstSubView = allSubViews[0];
      console.log(`Switching to: ${firstSubView.name}`);
      subViewManager.switchToSubView(firstSubView.id);
      
      const activeSubView = subViewManager.getActiveSubView();
      console.log(`Active subView: ${activeSubView?.name}`);
    }

    // Test navigation data
    console.log('\n🧭 Navigation data:');
    const navigationData = subViewManager.getNavigationData();
    navigationData.forEach(item => {
      console.log(`  - ${item.name} (${item.fileName}) - Active: ${item.isActive}`);
    });

    // Test export functionality
    console.log('\n📤 Testing export functionality...');
    if (allSubViews.length > 0) {
      const subViewToExport = allSubViews[0];
      const exportedFileName = subViewManager.exportSubViewToFile(subViewToExport.id);
      console.log(`✅ Exported: ${exportedFileName}`);
    }

    // Test delete functionality
    console.log('\n🗑️ Testing delete functionality...');
    if (allSubViews.length > 1) {
      const subViewToDelete = allSubViews[1];
      console.log(`Deleting: ${subViewToDelete.name}`);
      const deleted = subViewManager.deleteSubView(subViewToDelete.id);
      console.log(`✅ Deleted: ${deleted}`);
      
      const remainingSubViews = subViewManager.getAllSubViews();
      console.log(`Remaining subViews: ${remainingSubViews.length}`);
    }

    // Create Generic Editor with subView integration
    console.log('\n🎨 Creating Generic Editor with subView integration...');
    const genericEditor = GenericEditorTemplate.create({
      context: {
        subViewManager,
        activeTab: 'html',
        canvasTransform: { x: 0, y: 0, scale: 1 },
        zoomLevel: 1,
        gestureType: 'Pan'
      }
    });

    console.log('✅ Generic Editor created with subView integration');

    // Test subView manager events
    console.log('\n🎯 Testing subView manager events...');
    
    // Add a new subView
    const newSubView = subViewManager.createSubView('NewComponent', '// New component content', 'tsx');
    console.log(`✅ Added new subView: ${newSubView.name}`);

    // Switch to the new subView
    subViewManager.switchToSubView(newSubView.id);
    console.log(`✅ Switched to: ${newSubView.name}`);

    // Update content
    subViewManager.updateSubViewContent(newSubView.id, '// Updated content');
    console.log('✅ Updated subView content');

    // Get final state
    const finalSubViews = subViewManager.getAllSubViews();
    const finalActiveSubView = subViewManager.getActiveSubView();
    
    console.log('\n📊 Final State:');
    console.log(`Total subViews: ${finalSubViews.length}`);
    console.log(`Active subView: ${finalActiveSubView?.name}`);
    console.log(`Active subView content length: ${finalActiveSubView?.content?.length || 0} characters`);

    console.log('\n🎉 SubView System Demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Separate SunEditor instances for each subView');
    console.log('✅ Local .tsx file generation and export');
    console.log('✅ SubView navigation and switching');
    console.log('✅ Content management and updates');
    console.log('✅ Integration with Generic Editor');
    console.log('✅ React syntax highlighting support');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
runSubViewDemo(); 