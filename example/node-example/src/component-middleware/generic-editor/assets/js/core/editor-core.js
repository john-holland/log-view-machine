/**
 * Generic Editor Core
 * Main editor functionality, configuration, and global state management
 */

// Configuration
export const config = {
    apiUrl: 'http://localhost:3000',
    dotCMSUrl: 'http://localhost:8080'
};

// Global state
export let currentUser = null;
export let currentComponent = null;
export let currentVersion = null;
export let editors = {};
export let isDraggingGrabber = false;
export let dragStartX = 0;
export let originalLeftWidth = 300;
export let originalRightWidth = 400;
export let activeGrabber = null; // Track which grabber is being dragged

// Blob URL tracking for memory leak prevention
export let activeBlobUrls = new Set();
export let previewUpdateDebounceTimer = null;

// Canvas dragging variables
export let isDraggingCanvas = false;
export let canvasStartX = 0;
export let canvasStartY = 0;
export let canvasOffsetX = 0;
export let canvasOffsetY = 0;

// Canvas zoom variables
export let canvasScale = 1;
export let isZooming = false;
export let zoomStartDistance = 0;
export let zoomStartScale = 1;

// Vector analysis variables
export let touchVectors = [];
export let gestureHistory = [];
export let vectorTolerance = 0.15; // 15% tolerance for vector similarity
export let zoomThreshold = 0.25; // 25% change triggers zoom mode
export let panThreshold = 0.1; // 10% change triggers pan mode

// Touch analysis with lead time and debouncing
export let touchAnalysisBuffer = [];
export let analysisDebounceTimer = null;
export let gestureDetectionDelay = 50; // 50ms lead time for gesture detection
export let analysisBufferSize = 3; // Number of touch events to buffer
export let currentGestureType = 'unknown';
export let gestureConfidence = 0;

// Change tracking and localStorage
export let originalComponentData = null;
export let hasUnsavedChanges = false;
export let changeListeners = [];

// State management functions
export function setCurrentComponent(component) {
    currentComponent = component;
    updateSaveStatus();
}

export function setCurrentVersion(version) {
    currentVersion = version;
}

export function setCurrentUser(user) {
    currentUser = user;
}

export function addChangeListener(listener) {
    changeListeners.push(listener);
}

export function removeChangeListener(listener) {
    const index = changeListeners.indexOf(listener);
    if (index > -1) {
        changeListeners.splice(index, 1);
    }
}

export function notifyChangeListeners() {
    changeListeners.forEach(listener => listener());
}

export function markAsChanged() {
    hasUnsavedChanges = true;
    updateSaveStatus();
    notifyChangeListeners();
}

export function markAsSaved() {
    hasUnsavedChanges = false;
    updateSaveStatus();
}

// Blob URL management
export function addBlobUrl(url) {
    activeBlobUrls.add(url);
}

export function removeBlobUrl(url) {
    activeBlobUrls.delete(url);
    URL.revokeObjectURL(url);
}

export function cleanupBlobUrls() {
    activeBlobUrls.forEach(url => {
        URL.revokeObjectURL(url);
    });
    activeBlobUrls.clear();
}

// Canvas state management
export function setCanvasScale(scale) {
    canvasScale = scale;
}

export function setCanvasOffset(x, y) {
    canvasOffsetX = x;
    canvasOffsetY = y;
}

export function setDraggingState(dragging) {
    isDraggingCanvas = dragging;
}

export function setZoomingState(zooming) {
    isZooming = zooming;
}

// Utility functions
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export all state variables for external access
export const editorState = {
    currentUser,
    currentComponent,
    currentVersion,
    editors,
    isDraggingGrabber,
    dragStartX,
    originalLeftWidth,
    originalRightWidth,
    activeGrabber,
    activeBlobUrls,
    previewUpdateDebounceTimer,
    isDraggingCanvas,
    canvasStartX,
    canvasStartY,
    canvasOffsetX,
    canvasOffsetY,
    canvasScale,
    isZooming,
    zoomStartDistance,
    zoomStartScale,
    touchVectors,
    gestureHistory,
    vectorTolerance,
    zoomThreshold,
    panThreshold,
    touchAnalysisBuffer,
    analysisDebounceTimer,
    gestureDetectionDelay,
    analysisBufferSize,
    currentGestureType,
    gestureConfidence,
    originalComponentData,
    hasUnsavedChanges,
    changeListeners
};
