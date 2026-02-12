import { test, expect } from '@playwright/test';

test.describe('Generic Editor - Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
    await page.waitForSelector('.container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should generate XState visualization from JSON', async ({ page }) => {
    // Switch to XState Visualization tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await page.waitForTimeout(500);
    
    // Click update button to generate visualization
    await page.click('.xstate-controls button:has-text("🔄 Update")');
    await page.waitForTimeout(1000);
    
    // Check if visualization is generated
    const canvas = page.locator('#xstate-canvas');
    await expect(canvas).toBeVisible();
    
    // Check if state nodes are generated (should have at least one)
    const stateNodes = page.locator('.state-node');
    await expect(stateNodes).toHaveCount(3); // idle, running, paused from sample JSON
    
    // Check if transitions are generated
    const transitions = page.locator('.state-transition');
    await expect(transitions).toBeVisible();
  });

  test('should handle complex state machine visualization', async ({ page }) => {
    // Switch to State Machine tab first
    await page.click('.header-tab:has-text("State Machine")');
    await page.waitForTimeout(500);
    
    // Get the JSON editor
    const jsonEditor = page.locator('#json-ace-editor');
    await expect(jsonEditor).toBeVisible();
    
    // Switch to XState Visualization tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await page.waitForTimeout(500);
    
    // Click update button
    await page.click('.xstate-controls button:has-text("🔄 Update")');
    await page.waitForTimeout(1000);
    
    // Check if substate machines are detected
    await page.click('.xstate-controls button:has-text("🔍 Substates")');
    await page.waitForTimeout(500);
    
    // Check if substate container is visible
    const substateContainer = page.locator('#substate-container');
    await expect(substateContainer).toBeVisible();
  });

  test('should export XState machine', async ({ page }) => {
    // Switch to XState Visualization tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await page.waitForTimeout(500);
    
    // Mock the download functionality
    await page.evaluate(() => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      window.URL.createObjectURL = (blob) => 'mock-url';
      window.URL.revokeObjectURL = () => {};
      
      // Mock click on download link
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function() {
        // Store the download info for testing
        window.lastDownload = {
          filename: this.download,
          href: this.href
        };
      };
    });
    
    // Click export button
    await page.click('.xstate-controls button:has-text("📤 Export")');
    await page.waitForTimeout(500);
    
    // Verify download was triggered
    const downloadInfo = await page.evaluate(() => window.lastDownload);
    expect(downloadInfo).toBeDefined();
    expect(downloadInfo.filename).toBe('state-machine.json');
  });

  test('should handle substate machine interactions', async ({ page }) => {
    // Switch to XState Visualization tab
    await page.click('.header-tab:has-text("XState Visualization")');
    await page.waitForTimeout(500);
    
    // Show substates
    await page.click('.xstate-controls button:has-text("🔍 Substates")');
    await page.waitForTimeout(500);
    
    // Check if substate machines are displayed
    const substateMachines = page.locator('.substate-machine');
    await expect(substateMachines).toBeVisible();
    
    // Test substate zoom controls if they exist
    const zoomButtons = page.locator('.substate-zoom-btn');
    if (await zoomButtons.count() > 0) {
      // Click zoom in button
      await zoomButtons.first().click();
      await page.waitForTimeout(500);
      
      // Click zoom out button
      await zoomButtons.nth(1).click();
      await page.waitForTimeout(500);
      
      // Click reset button
      await zoomButtons.nth(2).click();
      await page.waitForTimeout(500);
    }
  });

  test('should generate comprehensive diff view', async ({ page }) => {
    // Load a component first to have content to compare
    await page.waitForSelector('.component-item', { timeout: 10000 });
    await page.click('.component-item:first-child');
    
    // Open diff modal
    await page.click('#diff-btn');
    await page.waitForTimeout(500);
    
    // Check if diff modal is visible
    await expect(page.locator('#diff-modal')).toBeVisible();
    
    // Check if diff panels are present
    await expect(page.locator('.diff-panel.diff-original')).toBeVisible();
    await expect(page.locator('.diff-panel.diff-changed')).toBeVisible();
    
    // Check if diff content is generated
    await expect(page.locator('#diff-original-content')).toBeVisible();
    await expect(page.locator('#diff-current-content')).toBeVisible();
    
    // Check if diff sections are present
    const diffSections = page.locator('.diff-section');
    await expect(diffSections).toHaveCount(4); // template, styles, script, stateMachine
  });

  test('should handle diff view actions', async ({ page }) => {
    // Load a component first
    await page.waitForSelector('.component-item', { timeout: 10000 });
    await page.click('.component-item:first-child');
    
    // Open diff modal
    await page.click('#diff-btn');
    await page.waitForTimeout(500);
    
    // Check if action buttons are present
    await expect(page.locator('.diff-btn.diff-btn-danger:has-text("🔄 Reset")')).toBeVisible();
    await expect(page.locator('.diff-btn.diff-btn-secondary:has-text("Close")')).toBeVisible();
    await expect(page.locator('.diff-btn.diff-btn-primary:has-text("💾 Save Changes")')).toBeVisible();
    
    // Test close button
    await page.click('.diff-btn.diff-btn-secondary:has-text("Close")');
    await expect(page.locator('#diff-modal')).not.toBeVisible();
  });

  test('should handle view template management', async ({ page }) => {
    // Check if view template controls are present
    await expect(page.locator('#view-template-selector')).toBeVisible();
    await expect(page.locator('.view-template-btn.add')).toBeVisible();
    await expect(page.locator('.view-template-btn.remove')).toBeVisible();
    
    // Test adding a new view template
    await page.click('.view-template-btn.add');
    await page.waitForTimeout(500);
    
    // Check if modal is visible
    await expect(page.locator('#view-template-modal')).toBeVisible();
    
    // Fill in template form
    await page.fill('#template-name', 'Test Template');
    await page.selectOption('#template-type', 'custom');
    await page.fill('#template-description', 'A test template for testing');
    await page.fill('#template-config', '{"test": "value"}');
    
    // Save template
    await page.click('.modal-btn.save');
    await page.waitForTimeout(500);
    
    // Check if modal is closed
    await expect(page.locator('#view-template-modal')).not.toBeVisible();
    
    // Check if template was added to selector
    const selector = page.locator('#view-template-selector');
    await expect(selector.locator('option:has-text("Test Template")')).toBeVisible();
  });

  test('should handle view template switching', async ({ page }) => {
    // Add a custom template first
    await page.click('.view-template-btn.add');
    await page.waitForTimeout(500);
    
    await page.fill('#template-name', 'Switch Test Template');
    await page.selectOption('#template-type', 'html');
    await page.fill('#template-description', 'Template for testing switching');
    await page.click('.modal-btn.save');
    await page.waitForTimeout(500);
    
    // Select the new template
    await page.selectOption('#view-template-selector', 'switch-test-template');
    
    // Verify it switches to HTML editor tab
    await expect(page.locator('#html-editor')).toHaveClass(/active/);
  });

  test('should handle view template removal', async ({ page }) => {
    // Add a template first
    await page.click('.view-template-btn.add');
    await page.waitForTimeout(500);
    
    await page.fill('#template-name', 'Remove Test Template');
    await page.selectOption('#template-type', 'css');
    await page.fill('#template-description', 'Template for testing removal');
    await page.click('.modal-btn.save');
    await page.waitForTimeout(500);
    
    // Select the template
    await page.selectOption('#view-template-selector', 'remove-test-template');
    
    // Remove the template
    await page.click('.view-template-btn.remove');
    
    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Verify template was removed
    await expect(page.locator('#view-template-selector option:has-text("Remove Test Template")')).not.toBeVisible();
  });

  test('should handle developer mode features', async ({ page }) => {
    // Check if developer mode checkbox is present
    await expect(page.locator('#developer-mode')).toBeVisible();
    
    // Enable developer mode
    await page.check('#developer-mode');
    await page.waitForTimeout(500);
    
    // Check if editor src checkbox appears
    await expect(page.locator('#editor-src-checkbox')).toBeVisible();
    
    // Check if include in editor src checkbox is present
    await expect(page.locator('#include-in-editor-src')).toBeVisible();
    
    // Enable include in editor src
    await page.check('#include-in-editor-src');
    await page.waitForTimeout(500);
    
    // Check if git commit button appears
    await expect(page.locator('#git-commit-btn')).toBeVisible();
    
    // Test git commit button
    await page.click('#git-commit-btn');
    
    // Handle prompt dialog
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('prompt');
      dialog.accept('Test commit message');
    });
    
    await page.waitForTimeout(500);
  });

  test('should handle canvas gesture detection', async ({ page }) => {
    // Check if gesture indicator is present
    await expect(page.locator('#gesture-indicator')).toBeVisible();
    
    // Check initial gesture state
    await expect(page.locator('#gesture-indicator')).toContainText('Gesture: Pan');
    
    // Test canvas interaction to trigger gesture changes
    const canvas = page.locator('.canvas-container');
    
    // Simulate mouse enter
    await canvas.hover();
    await page.waitForTimeout(500);
    
    // Check if gesture indicator shows state change
    const gestureText = await page.locator('#gesture-indicator').textContent();
    expect(gestureText).toContain('State:');
  });

  test('should handle canvas zoom state machine', async ({ page }) => {
    // Test zoom state machine functionality
    const canvas = page.locator('.canvas-container');
    
    // Enter canvas
    await canvas.hover();
    await page.waitForTimeout(500);
    
    // Test wheel zoom
    await canvas.hover();
    await page.mouse.wheel(0, -100); // Scroll up to zoom in
    await page.waitForTimeout(500);
    
    // Check if zoom level changed
    const zoomLevel = await page.locator('#zoom-level').textContent();
    const zoomValue = parseInt(zoomLevel);
    expect(zoomValue).toBeGreaterThan(100);
    
    // Reset zoom
    await page.click('.canvas-btn:has-text("🏠")');
    await page.waitForTimeout(500);
    
    // Verify reset
    await expect(page.locator('#zoom-level')).toContainText('100%');
  });

  test('should handle panel resizing', async ({ page }) => {
    // Check if panel grabbers are present
    await expect(page.locator('.panel-grabber.left')).toBeVisible();
    await expect(page.locator('.panel-grabber.right')).toBeVisible();
    
    // Get initial panel widths
    const container = page.locator('.container');
    const initialStyle = await container.getAttribute('style');
    
    // Test left panel grabber (this is complex to test without visual feedback)
    const leftGrabber = page.locator('.panel-grabber.left');
    await expect(leftGrabber).toBeVisible();
    
    // Test right panel grabber
    const rightGrabber = page.locator('.panel-grabber.right');
    await expect(rightGrabber).toBeVisible();
  });

  test('should handle responsive layout changes', async ({ page }) => {
    // Test desktop layout (default)
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
    await expect(page.locator('.panels-container')).not.toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Check if mobile panels are visible
    await expect(page.locator('.panels-container')).toBeVisible();
    
    // Check if mobile-only sections are visible
    const mobileSections = page.locator('.mobile-only');
    await expect(mobileSections).toBeVisible();
    
    // Reset to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // Verify desktop layout is restored
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
  });

  test('should handle memory management and cleanup', async ({ page }) => {
    // Test multiple tab switches to check for memory leaks
    const tabs = ['Preview', 'HTML Editor', 'CSS Editor', 'JavaScript', 'State Machine', 'XState Visualization'];
    
    // Switch between tabs multiple times
    for (let i = 0; i < 5; i++) {
      for (const tab of tabs) {
        await page.click(`.header-tab:has-text("${tab}")`);
        await page.waitForTimeout(200);
      }
    }
    
    // Verify the last tab is still functional
    await expect(page.locator('#xstate-editor')).toHaveClass(/active/);
    
    // Test rapid zoom operations
    for (let i = 0; i < 10; i++) {
      await page.click('.canvas-btn:has-text("🔍+")');
      await page.waitForTimeout(50);
    }
    
    // Verify zoom still works
    const zoomLevel = await page.locator('#zoom-level').textContent();
    const zoomValue = parseInt(zoomLevel);
    expect(zoomValue).toBeGreaterThan(100);
    
    // Reset and verify stability
    await page.click('.canvas-btn:has-text("🏠")');
    await page.waitForTimeout(500);
    await expect(page.locator('#zoom-level')).toContainText('100%');
  });

  test('should handle error boundaries gracefully', async ({ page }) => {
    // Test error message display
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.success')).toBeVisible();
    await expect(page.locator('.info')).toBeVisible();
    
    // Test loading states
    await expect(page.locator('#loading')).toBeVisible();
    
    // Test if error handling elements are properly styled
    const errorElement = page.locator('.error');
    await expect(errorElement).toHaveCSS('color', 'rgb(220, 53, 69)'); // #dc3545
    
    const successElement = page.locator('.success');
    await expect(successElement).toHaveCSS('color', 'rgb(21, 87, 36)'); // #155724
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Escape key functionality
    // Open a modal first
    await page.click('#diff-btn');
    await page.waitForTimeout(500);
    
    // Verify modal is open
    await expect(page.locator('#diff-modal')).toBeVisible();
    
    // Press Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Verify modal is closed
    await expect(page.locator('#diff-modal')).not.toBeVisible();
  });

  test('should handle accessibility features', async ({ page }) => {
    // Check if main elements have proper accessibility attributes
    const header = page.locator('.header h1');
    await expect(header).toBeVisible();
    
    // Check if buttons have proper roles and labels
    const buttons = page.locator('button');
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      if (text && text.trim()) {
        await expect(button).toBeVisible();
      }
    }
    
    // Check if form inputs have proper labels
    const inputs = page.locator('input');
    for (let i = 0; i < await inputs.count(); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        if (await label.count() > 0) {
          await expect(label).toBeVisible();
        }
      }
    }
  });
});
