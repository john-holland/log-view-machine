/**
 * Main Editor Initialization
 * Handles DOM content loaded and initializes all editor components
 */

import { componentManager } from './component-manager.js';
import { zoomStateMachine } from './zoom-state-machine.js';
import { cleanupBlobUrls } from './editor-core.js';

// Initialize editors
function initializeEditors() {
    console.log('Initializing editors...');
    // Editor initialization logic will be moved here
}

// Initialize grabbers
function initializeGrabbers() {
    console.log('Initializing grabbers...');
    // Grabber initialization logic will be moved here
}

// Initialize canvas dragging
function initializeCanvasDragging() {
    console.log('Initializing canvas dragging...');
    // Canvas dragging logic will be moved here
}

// Initialize drag and drop
function initializeDragAndDrop() {
    console.log('Initializing drag and drop...');
    // Drag and drop logic will be moved here
}

// Setup change tracking
function setupChangeTracking() {
    console.log('Setting up change tracking...');
    // Change tracking logic will be moved here
}

// Load from localStorage
function loadFromLocalStorage() {
    console.log('Loading from localStorage...');
    // Local storage loading logic will be moved here
}

// Check health
function checkHealth() {
    console.log('Checking health...');
    // Health check logic will be moved here
}

// Load components
async function loadComponents() {
    console.log('Loading components...');
    try {
        await componentManager.loadComponents();
        console.log('Components loaded successfully');
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// Setup real-time updates
function setupRealTimeUpdates() {
    console.log('Setting up real-time updates...');
    // Real-time update logic will be moved here
}

// Load sample components if none exist
function loadSampleComponentsIfNeeded() {
    if (!window.components || window.components.length === 0) {
        console.log('No components found, loading samples...');
        componentManager.loadSampleComponents();
    }
}

// Update save status
function updateSaveStatus() {
    console.log('Updating save status...');
    // Save status update logic will be moved here
}

// Update layout heights
function updateLayoutHeights() {
    console.log('Updating layout heights...');
    // Layout height update logic will be moved here
}

// Setup keyboard shortcuts (one log per physical key press; ignore repeat and duplicate keydowns)
function setupKeyboardShortcuts() {
    const keysDown = {};
    document.addEventListener('keydown', function(e) {
        if (e.repeat || keysDown[e.code]) return;
        keysDown[e.code] = true;
        console.log('keydown (main.js)', { key: e.key, code: e.code, shiftKey: e.shiftKey });
        if (e.key === 'Escape') {
            console.log('Escape key pressed');
        }
    });
    document.addEventListener('keyup', function(e) {
        keysDown[e.code] = false;
    });
}

// Setup cleanup on page unload
function setupCleanup() {
    window.addEventListener('beforeunload', function() {
        console.log('Cleaning up before unload...');
        cleanupBlobUrls();
    });
}

// Main initialization function
async function initializeEditor() {
    console.log('🚀 Initializing Generic Editor...');
    
    try {
        // Initialize core systems
        initializeEditors();
        initializeGrabbers();
        initializeCanvasDragging();
        initializeDragAndDrop();
        setupChangeTracking();
        loadFromLocalStorage();
        checkHealth();
        
        // Load components
        await loadComponents();
        
        // Setup additional features
        setupRealTimeUpdates();
        loadSampleComponentsIfNeeded();
        updateSaveStatus();
        updateLayoutHeights();
        setupKeyboardShortcuts();
        setupCleanup();
        
        console.log('✅ Generic Editor initialized successfully');
        
        // Dispatch custom event for other modules
        window.dispatchEvent(new CustomEvent('generic-editor-ready', {
            detail: {
                componentManager,
                zoomStateMachine
            }
        }));
        
    } catch (error) {
        console.error('❌ Error initializing Generic Editor:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEditor);
} else {
    // DOM is already ready
    initializeEditor();
}

// Export for external use
export {
    initializeEditor,
    componentManager,
    zoomStateMachine
};
