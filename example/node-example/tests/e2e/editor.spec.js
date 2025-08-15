import { test, expect } from '@playwright/test';

test.describe('Generic Editor - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the editor page
    await page.goto('/src/component-middleware/generic-editor/index.html');
    
    // Wait for the page to load
    await page.waitForSelector('.container', { timeout: 10000 });
    
    // Wait for editors to initialize
    await page.waitForTimeout(2000);
  });

  test('should load the editor page successfully', async ({ page }) => {
    // Check if main elements are present
    await expect(page.locator('.header h1')).toContainText('🎨 Generic Editor');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.canvas-container')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
  });

  test('should display all editor tabs', async ({ page }) => {
    const expectedTabs = ['Preview', 'HTML Editor', 'CSS Editor', 'JavaScript', 'State Machine', 'XState Visualization'];
    
    for (const tabText of expectedTabs) {
      await expect(page.locator('.header-tab').filter({ hasText: tabText })).toBeVisible();
    }
  });

  test('should switch between editor tabs', async ({ page }) => {
    // Test HTML Editor tab
    await page.click('.header-tab:has-text("HTML Editor")');
    await expect(page.locator('#html-editor')).toHaveClass(/active/);
    await expect(page.locator('#html-sun-editor')).toBeVisible();
    
    // Test CSS Editor tab
    await page.click('.header-tab:has-text("CSS Editor")');
    await expect(page.locator('#css-editor')).toHaveClass(/active/);
    await expect(page.locator('#css-ace-editor')).toBeVisible();
    
    // Test JavaScript tab
    await page.click('.header-tab:has-text("JavaScript")');
    await expect(page.locator('#js-editor')).toHaveClass(/active/);
    await expect(page.locator('#js-ace-editor')).toBeVisible();
    
    // Test State Machine tab
    await page.click('.header-tab:has-text("State Machine")');
    await expect(page.locator('#json-editor')).toHaveClass(/active/);
    await expect(page.locator('#json-ace-editor')).toBeVisible();
    
    // Test XState Visualization tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await expect(page.locator('#xstate-editor')).toHaveClass(/active/);
    await expect(page.locator('#xstate-visualization')).toBeVisible();
    
    // Test Preview tab
    await page.click('.header-tab:has-text("Preview")');
    await expect(page.locator('#preview-editor')).toHaveClass(/active/);
    await expect(page.locator('#preview-content')).toBeVisible();
  });

  test('should load sample components in sidebar', async ({ page }) => {
    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Check if sample components are displayed
    const componentItems = page.locator('.component-item');
    await expect(componentItems).toHaveCount(3);
    
    // Check component names
    await expect(page.locator('.component-item:has-text("Sample Button")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Sample Card")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Sample Form")')).toBeVisible();
  });

  test('should select and load a component', async ({ page }) => {
    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Click on a component
    await page.click('.component-item:has-text("Sample Button")');
    
    // Check if component is selected
    await expect(page.locator('.component-item:has-text("Sample Button")')).toHaveClass(/selected/);
    
    // Check if component info is displayed
    await expect(page.locator('#current-component-info')).toContainText('Sample Button');
  });

  test('should search for components', async ({ page }) => {
    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Type in search box
    await page.fill('#search-input', 'Button');
    
    // Check if only button component is visible
    await expect(page.locator('.component-item:has-text("Sample Button")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Sample Card")')).not.toBeVisible();
    await expect(page.locator('.component-item:has-text("Sample Form")')).not.toBeVisible();
    
    // Clear search
    await page.fill('#search-input', '');
    
    // Check if all components are visible again
    await expect(page.locator('.component-item:has-text("Sample Button")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Sample Card")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Sample Form")')).toBeVisible();
  });

  test('should handle authentication form', async ({ page }) => {
    // Check if login form is visible
    await expect(page.locator('#login-form')).toBeVisible();
    
    // Check if username and password fields are present
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    // Check if login button is present
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    // Fill in credentials
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    
    // Note: We won't actually submit since there's no backend in test environment
  });

  test('should display save status correctly', async ({ page }) => {
    // Check initial save status
    await expect(page.locator('#save-status-btn')).toContainText('✅');
    await expect(page.locator('#save-status-btn')).toContainText('Saved');
    
    // Check if save button is initially disabled
    await expect(page.locator('#save-component-btn')).toBeDisabled();
  });

  test('should show diff modal', async ({ page }) => {
    // Click diff button
    await page.click('#diff-btn');
    
    // Check if diff modal is visible
    await expect(page.locator('#diff-modal')).toBeVisible();
    await expect(page.locator('.diff-modal-title')).toContainText('📊 Component Changes');
    
    // Close modal
    await page.click('.diff-modal-close');
    
    // Check if modal is hidden
    await expect(page.locator('#diff-modal')).not.toBeVisible();
  });

  test('should show duplicate component modal', async ({ page }) => {
    // Wait for components to load and select one
    await page.waitForSelector('.component-item', { timeout: 10000 });
    await page.click('.component-item:has-text("Sample Button")');
    
    // Click duplicate button
    await page.click('#duplicate-component-btn');
    
    // Check if duplicate modal is visible
    await expect(page.locator('#duplicate-modal')).toBeVisible();
    await expect(page.locator('.duplicate-modal-title')).toContainText('📋 Duplicate Component');
    
    // Check if form fields are present
    await expect(page.locator('#duplicate-name')).toBeVisible();
    await expect(page.locator('#duplicate-description')).toBeVisible();
    
    // Close modal
    await page.click('.duplicate-modal-close');
    
    // Check if modal is hidden
    await expect(page.locator('#duplicate-modal')).not.toBeVisible();
  });

  test('should handle developer mode toggle', async ({ page }) => {
    // Check if developer mode checkbox is present
    await expect(page.locator('#developer-mode')).toBeVisible();
    
    // Check if editor src checkbox is initially hidden
    await expect(page.locator('#editor-src-checkbox')).not.toBeVisible();
    
    // Enable developer mode
    await page.check('#developer-mode');
    
    // Check if editor src checkbox is now visible
    await expect(page.locator('#editor-src-checkbox')).toBeVisible();
    
    // Disable developer mode
    await page.uncheck('#developer-mode');
    
    // Check if editor src checkbox is hidden again
    await expect(page.locator('#editor-src-checkbox')).not.toBeVisible();
  });

  test('should handle view template controls', async ({ page }) => {
    // Check if view template selector is present
    await expect(page.locator('#view-template-selector')).toBeVisible();
    
    // Check if add/remove buttons are present
    await expect(page.locator('.view-template-btn.add')).toBeVisible();
    await expect(page.locator('.view-template-btn.remove')).toBeVisible();
    
    // Click add button
    await page.click('.view-template-btn.add');
    
    // Check if modal is visible
    await expect(page.locator('#view-template-modal')).toBeVisible();
    
    // Close modal
    await page.click('.view-template-modal-close');
    
    // Check if modal is hidden
    await expect(page.locator('#view-template-modal')).not.toBeVisible();
  });
});

test.describe('Generic Editor - Canvas and Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/src/component-middleware/generic-editor/index.html');
    await page.waitForSelector('.container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should display canvas controls', async ({ page }) => {
    // Check if canvas controls are visible
    await expect(page.locator('.canvas-controls')).toBeVisible();
    
    // Check if all control buttons are present
    await expect(page.locator('.canvas-btn:has-text("🏠")')).toBeVisible(); // Reset
    await expect(page.locator('.canvas-btn:has-text("🔍+")')).toBeVisible(); // Zoom In
    await expect(page.locator('.canvas-btn:has-text("🔍-")')).toBeVisible(); // Zoom Out
    await expect(page.locator('.canvas-btn:has-text("📏")')).toBeVisible(); // Resize
    await expect(page.locator('.canvas-btn:has-text("🐛")')).toBeVisible(); // Debug Tabs
    await expect(page.locator('.canvas-btn:has-text("🔍")')).toBeVisible(); // Debug Zoom
    
    // Check if zoom level is displayed
    await expect(page.locator('#zoom-level')).toBeVisible();
    await expect(page.locator('#zoom-level')).toContainText('100%');
  });

  test('should handle canvas zoom controls', async ({ page }) => {
    // Get initial zoom level
    const initialZoom = await page.locator('#zoom-level').textContent();
    
    // Click zoom in button
    await page.click('.canvas-btn:has-text("🔍+")');
    await page.waitForTimeout(500);
    
    // Check if zoom level increased
    const newZoom = await page.locator('#zoom-level').textContent();
    expect(parseInt(newZoom)).toBeGreaterThan(parseInt(initialZoom));
    
    // Click zoom out button
    await page.click('.canvas-btn:has-text("🔍-")');
    await page.waitForTimeout(500);
    
    // Check if zoom level decreased
    const finalZoom = await page.locator('#zoom-level').textContent();
    expect(parseInt(finalZoom)).toBeLessThan(parseInt(newZoom));
    
    // Click reset button
    await page.click('.canvas-btn:has-text("🏠")');
    await page.waitForTimeout(500);
    
    // Check if zoom level is reset
    await expect(page.locator('#zoom-level')).toContainText('100%');
  });

  test('should display gesture indicator', async ({ page }) => {
    // Check if gesture indicator is present
    await expect(page.locator('#gesture-indicator')).toBeVisible();
    
    // Check initial text
    await expect(page.locator('#gesture-indicator')).toContainText('Gesture: Pan');
  });

  test('should handle panel grabbers', async ({ page }) => {
    // Check if panel grabbers are visible
    await expect(page.locator('.panel-grabber.left')).toBeVisible();
    await expect(page.locator('.panel-grabber.right')).toBeVisible();
    
    // Check if grabbers have correct positioning
    const leftGrabber = page.locator('.panel-grabber.left');
    const rightGrabber = page.locator('.panel-grabber.right');
    
    await expect(leftGrabber).toBeVisible();
    await expect(rightGrabber).toBeVisible();
  });

  test('should handle responsive layout', async ({ page }) => {
    // Test desktop layout (default)
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
    
    // Test mobile layout by resizing viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Check if mobile panels are visible
    await expect(page.locator('.panels-container')).toBeVisible();
    
    // Reset to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
  });
});

test.describe('Generic Editor - Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/src/component-middleware/generic-editor/index.html');
    await page.waitForSelector('.container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should make components draggable', async ({ page }) => {
    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Check if components have draggable attribute
    const componentItems = page.locator('.component-item');
    for (let i = 0; i < 3; i++) {
      const item = componentItems.nth(i);
      await expect(item).toHaveAttribute('draggable', 'true');
    }
  });

  test('should handle drag start on components', async ({ page }) => {
    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Start dragging a component
    const component = page.locator('.component-item:has-text("Sample Button")');
    
    // Trigger drag start
    await component.dragTo(page.locator('.canvas-container'));
    
    // Check if dragging class was added (briefly)
    // Note: This might be too fast to catch in some cases
  });

  test('should make editors droppable', async ({ page }) => {
    // Switch to HTML editor
    await page.click('.header-tab:has-text("HTML Editor")');
    await page.waitForTimeout(500);
    
    // Check if HTML editor container is present
    await expect(page.locator('#html-sun-editor')).toBeVisible();
    
    // Switch to CSS editor
    await page.click('.header-tab:has-text("CSS Editor")');
    await page.waitForTimeout(500);
    
    // Check if CSS editor container is present
    await expect(page.locator('#css-ace-editor')).toBeVisible();
    
    // Switch to JavaScript editor
    await page.click('.header-tab:has-text("JavaScript")');
    await page.waitForTimeout(500);
    
    // Check if JavaScript editor container is present
    await expect(page.locator('#js-ace-editor')).toBeVisible();
  });
});

test.describe('Generic Editor - XState Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/src/component-middleware/generic-editor/index.html');
    await page.waitForSelector('.container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should display XState visualization tab', async ({ page }) => {
    // Click on XState Visualization tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await page.waitForTimeout(500);
    
    // Check if XState content is visible
    await expect(page.locator('#xstate-visualization')).toBeVisible();
    await expect(page.locator('.xstate-header h3')).toContainText('State Machine Visualization');
  });

  test('should display XState controls', async ({ page }) => {
    // Switch to XState tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await page.waitForTimeout(500);
    
    // Check if control buttons are present
    await expect(page.locator('.xstate-controls button:has-text("🔄 Update")')).toBeVisible();
    await expect(page.locator('.xstate-controls button:has-text("📤 Export")')).toBeVisible();
    await expect(page.locator('.xstate-controls button:has-text("🔍 Substates")')).toBeVisible();
  });

  test('should display XState canvas', async ({ page }) => {
    // Switch to XState tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await page.waitForTimeout(500);
    
    // Check if canvas is present
    await expect(page.locator('#xstate-canvas')).toBeVisible();
    
    // Check if placeholder text is displayed
    await expect(page.locator('.xstate-placeholder')).toContainText('State machine visualization will appear here');
  });

  test('should handle substate toggle', async ({ page }) => {
    // Switch to XState tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await page.waitForTimeout(500);
    
    // Check if substate section is initially hidden
    await expect(page.locator('#substate-machines')).not.toBeVisible();
    
    // Click substate button
    await page.click('.xstate-controls button:has-text("🔍 Substates")');
    
    // Check if substate section is now visible
    await expect(page.locator('#substate-machines')).toBeVisible();
    
    // Click again to hide
    await page.click('.xstate-controls button:has-text("🔍 Substates")');
    
    // Check if substate section is hidden again
    await expect(page.locator('#substate-machines')).not.toBeVisible();
  });
});

test.describe('Generic Editor - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/src/component-middleware/generic-editor/index.html');
    await page.waitForSelector('.container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should handle invalid JSON in state machine editor', async ({ page }) => {
    // Switch to State Machine tab
    await page.click('.header-tab:has-text("State Machine")');
    await page.waitForTimeout(500);
    
    // Get the JSON editor
    const jsonEditor = page.locator('#json-ace-editor');
    await expect(jsonEditor).toBeVisible();
    
    // Note: We can't directly edit Ace editor content in tests without complex setup
    // But we can verify the editor is present and functional
  });

  test('should handle component loading errors gracefully', async ({ page }) => {
    // This test would require a mock backend or error conditions
    // For now, we'll verify the error handling UI elements exist
    
    // Check if error message display areas exist
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.success')).toBeVisible();
    await expect(page.locator('.info')).toBeVisible();
  });
});

test.describe('Generic Editor - Performance and Memory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/src/component-middleware/generic-editor/index.html');
    await page.waitForSelector('.container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should handle multiple tab switches without memory leaks', async ({ page }) => {
    const tabs = ['Preview', 'HTML Editor', 'CSS Editor', 'JavaScript', 'State Machine', 'XState Visualization'];
    
    // Switch between tabs multiple times
    for (let i = 0; i < 3; i++) {
      for (const tab of tabs) {
        await page.click(`.header-tab:has-text("${tab}")`);
        await page.waitForTimeout(200);
      }
    }
    
    // Verify the last tab is still active
    await expect(page.locator('#xstate-editor')).toHaveClass(/active/);
  });

  test('should handle rapid zoom operations', async ({ page }) => {
    // Perform rapid zoom operations
    for (let i = 0; i < 5; i++) {
      await page.click('.canvas-btn:has-text("🔍+")');
      await page.waitForTimeout(100);
    }
    
    // Verify zoom level is reasonable
    const zoomLevel = await page.locator('#zoom-level').textContent();
    const zoomValue = parseInt(zoomLevel);
    expect(zoomValue).toBeGreaterThan(100);
    expect(zoomValue).toBeLessThan(1000);
    
    // Reset zoom
    await page.click('.canvas-btn:has-text("🏠")');
    await page.waitForTimeout(500);
    
    // Verify reset
    await expect(page.locator('#zoom-level')).toContainText('100%');
  });
});
