/**
 * SubView Utility
 * 
 * Manages local subViews with .tsx files and separate SunEditor instances.
 */

import { createViewStateMachine } from '../../../../../log-view-machine/src/core/ViewStateMachine.js';

export class SubViewManager {
  constructor() {
    this.subViews = new Map();
    this.currentSubView = null;
    this.sunEditorInstances = new Map();
    this.subViewFiles = new Map();
  }

  /**
   * Create a new subView
   */
  createSubView(name, content = '', type = 'tsx') {
    const subViewId = `subview-${Date.now()}`;
    const fileName = `${name}.${type}`;
    
    const subView = {
      id: subViewId,
      name: name,
      fileName: fileName,
      type: type,
      content: content,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isActive: false
    };

    this.subViews.set(subViewId, subView);
    this.subViewFiles.set(fileName, subView);
    
    // Create separate SunEditor instance for this subView
    this.createSunEditorInstance(subViewId);
    
    return subView;
  }

  /**
   * Create a separate SunEditor instance for a subView
   */
  createSunEditorInstance(subViewId) {
    const subView = this.subViews.get(subViewId);
    if (!subView) return null;

    const editorId = `sun-editor-${subViewId}`;
    
    // Create editor container
    const editorContainer = document.createElement('div');
    editorContainer.id = editorId;
    editorContainer.className = 'sun-editor-container';
    editorContainer.style.cssText = `
      width: 100%;
      height: 100%;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    `;

    // Initialize SunEditor with React syntax highlighting
    const editor = SUNEDITOR.create(editorId, {
      height: '100%',
      width: '100%',
      buttonList: [
        ['undo', 'redo'],
        ['font', 'fontSize', 'formatBlock'],
        ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
        ['fontColor', 'hiliteColor'],
        ['removeFormat'],
        ['outdent', 'indent'],
        ['align', 'verticalAlign', 'horizontalRule', 'list', 'lineHeight'],
        ['table', 'link', 'image', 'video'],
        ['fullScreen', 'showBlocks', 'codeView'],
        ['preview', 'print']
      ],
      plugins: [
        // Add React syntax highlighting plugin
        'react-syntax-highlight'
      ],
      reactSyntaxHighlight: {
        enabled: true,
        theme: 'vs-dark',
        language: 'tsx'
      },
      callbacks: {
        onChange: (contents, isChanged) => {
          this.updateSubViewContent(subViewId, contents);
        }
      }
    });

    this.sunEditorInstances.set(subViewId, {
      editor: editor,
      container: editorContainer,
      id: editorId
    });

    // Add event delegation to the subview editor
    this.addSubViewEventDelegation(editorContainer, editorId);

    return editor;
  }

  /**
   * Add event delegation to subview editor
   */
  addSubViewEventDelegation(container, editorId) {
    console.log(`Adding event delegation to subview editor: ${editorId}`);
    
    // Prevent default behavior for all mouse events
    const preventDefaultHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`SubView editor event prevented: ${e.type} on ${editorId}`);
    };
    
    // Add event listeners to the editor container
    container.addEventListener('mousedown', preventDefaultHandler);
    container.addEventListener('mousemove', preventDefaultHandler);
    container.addEventListener('mouseup', preventDefaultHandler);
    container.addEventListener('click', preventDefaultHandler);
    container.addEventListener('dblclick', preventDefaultHandler);
    container.addEventListener('contextmenu', preventDefaultHandler);
    container.addEventListener('wheel', preventDefaultHandler);
    container.addEventListener('touchstart', preventDefaultHandler);
    container.addEventListener('touchmove', preventDefaultHandler);
    container.addEventListener('touchend', preventDefaultHandler);
    
    // Also add to the SunEditor's iframe if it exists
    const iframe = container.querySelector('iframe');
    if (iframe) {
      iframe.addEventListener('mousedown', preventDefaultHandler);
      iframe.addEventListener('mousemove', preventDefaultHandler);
      iframe.addEventListener('mouseup', preventDefaultHandler);
      iframe.addEventListener('click', preventDefaultHandler);
      iframe.addEventListener('dblclick', preventDefaultHandler);
      iframe.addEventListener('contextmenu', preventDefaultHandler);
      iframe.addEventListener('wheel', preventDefaultHandler);
      iframe.addEventListener('touchstart', preventDefaultHandler);
      iframe.addEventListener('touchmove', preventDefaultHandler);
      iframe.addEventListener('touchend', preventDefaultHandler);
    }
    
    // Add to the SunEditor's toolbar if it exists
    const toolbar = container.querySelector('.se-toolbar');
    if (toolbar) {
      toolbar.addEventListener('mousedown', preventDefaultHandler);
      toolbar.addEventListener('mousemove', preventDefaultHandler);
      toolbar.addEventListener('mouseup', preventDefaultHandler);
      toolbar.addEventListener('click', preventDefaultHandler);
      toolbar.addEventListener('dblclick', preventDefaultHandler);
      toolbar.addEventListener('contextmenu', preventDefaultHandler);
      toolbar.addEventListener('wheel', preventDefaultHandler);
      toolbar.addEventListener('touchstart', preventDefaultHandler);
      toolbar.addEventListener('touchmove', preventDefaultHandler);
      toolbar.addEventListener('touchend', preventDefaultHandler);
    }
  }

  /**
   * Update subView content
   */
  updateSubViewContent(subViewId, content) {
    const subView = this.subViews.get(subViewId);
    if (subView) {
      subView.content = content;
      subView.lastModified = new Date().toISOString();
    }
  }

  /**
   * Switch to a subView
   */
  switchToSubView(subViewId) {
    const subView = this.subViews.get(subViewId);
    if (!subView) return false;

    // Hide all subView editors
    this.hideAllSubViewEditors();

    // Show the selected subView editor
    const editorInstance = this.sunEditorInstances.get(subViewId);
    if (editorInstance) {
      editorInstance.container.style.display = 'block';
      editorInstance.editor.core.focus();
    }

    // Update active state
    this.subViews.forEach(sv => sv.isActive = false);
    subView.isActive = true;
    this.currentSubView = subViewId;

    return true;
  }

  /**
   * Hide all subView editors
   */
  hideAllSubViewEditors() {
    this.sunEditorInstances.forEach(instance => {
      instance.container.style.display = 'none';
    });
  }

  /**
   * Get all subViews
   */
  getAllSubViews() {
    return Array.from(this.subViews.values());
  }

  /**
   * Get active subView
   */
  getActiveSubView() {
    return this.subViews.get(this.currentSubView);
  }

  /**
   * Delete a subView
   */
  deleteSubView(subViewId) {
    const subView = this.subViews.get(subViewId);
    if (!subView) return false;

    // Destroy SunEditor instance
    const editorInstance = this.sunEditorInstances.get(subViewId);
    if (editorInstance) {
      editorInstance.editor.destroy();
      this.sunEditorInstances.delete(subViewId);
    }

    // Remove from maps
    this.subViews.delete(subViewId);
    this.subViewFiles.delete(subView.fileName);

    // If this was the active subView, switch to another
    if (this.currentSubView === subViewId) {
      const remainingSubViews = this.getAllSubViews();
      if (remainingSubViews.length > 0) {
        this.switchToSubView(remainingSubViews[0].id);
      } else {
        this.currentSubView = null;
      }
    }

    return true;
  }

  /**
   * Export subView to .tsx file
   */
  exportSubViewToFile(subViewId) {
    const subView = this.subViews.get(subViewId);
    if (!subView) return null;

    const fileContent = this.generateTSXContent(subView);
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = subView.fileName;
    a.click();
    
    URL.revokeObjectURL(url);
    return subView.fileName;
  }

  /**
   * Generate TSX content from subView
   */
  generateTSXContent(subView) {
    return `import React from 'react';
import { createViewStateMachine } from '../../../../../log-view-machine/src/core/ViewStateMachine.js';

/**
 * ${subView.name} Component
 * 
 * Generated from Generic Editor subView
 * Created: ${subView.createdAt}
 * Last Modified: ${subView.lastModified}
 */

export const ${this.toPascalCase(subView.name)}Component = {
  id: '${subView.name.toLowerCase()}-component',
  name: '${subView.name}',
  description: 'Generated component from Generic Editor',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  create: (config = {}) => {
    return createViewStateMachine({
      id: '${subView.name.toLowerCase()}-machine',
      initial: 'ready',
      context: {
        ...config,
        componentName: '${subView.name}',
        lastModified: '${subView.lastModified}'
      },
      states: {
        ready: {
          on: {
            INIT: 'active'
          }
        },
        active: {
          on: {
            DESTROY: 'destroyed'
          }
        },
        destroyed: {
          type: 'final'
        }
      }
    });
  }
};

export default ${this.toPascalCase(subView.name)}Component;
`;
  }

  /**
   * Convert string to PascalCase
   */
  toPascalCase(str) {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Import subView from .tsx file
   */
  async importSubViewFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const fileName = file.name;
          const name = fileName.replace(/\.(tsx|ts|jsx|js)$/, '');
          
          const subView = this.createSubView(name, content, 'tsx');
          resolve(subView);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Get subView navigation data
   */
  getNavigationData() {
    return this.getAllSubViews().map(subView => ({
      id: subView.id,
      name: subView.name,
      fileName: subView.fileName,
      isActive: subView.isActive,
      lastModified: subView.lastModified
    }));
  }
}

/**
 * Create SubView Manager instance
 */
export const createSubViewManager = () => {
  return new SubViewManager();
};

/**
 * SubView Navigation Component
 */
export const createSubViewNavigation = (subViewManager) => {
  return {
    id: 'subview-navigation',
    name: 'SubView Navigation',
    description: 'Navigation component for managing subViews',
    
    create: (config = {}) => {
      return createViewStateMachine({
        id: 'subview-navigation-machine',
        initial: 'idle',
        context: {
          subViewManager,
          ...config
        },
        states: {
          idle: {
            on: {
              SHOW_NAVIGATION: 'navigating',
              ADD_SUBVIEW: 'adding'
            }
          },
          navigating: {
            on: {
              SELECT_SUBVIEW: 'idle',
              CLOSE_NAVIGATION: 'idle'
            }
          },
          adding: {
            on: {
              SUBVIEW_CREATED: 'idle',
              CANCEL_ADD: 'idle'
            }
          }
        }
      });
    }
  };
}; 