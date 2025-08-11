import { test, expect } from '@playwright/test';
import { 
  waitForEditorReady, 
  loadComponent, 
  switchToTab, 
  mockAPIs, 
  createTestComponent,
  expectElementWithText,
  expectModalVisible,
  closeModal,
  fillAndSubmitForm,
  testResponsiveBehavior,
  testKeyboardShortcut,
  testDragAndDrop,
  generateTestComponent
} from './utils/editor-helpers.js';

test.describe('Example Usage - Demonstrating Utility Functions', () => {
  test.beforeEach(async ({ page }) => {
    // Use the utility function to wait for editor to be ready
    await waitForEditorReady(page);
  });

  test('should demonstrate basic utility usage', async ({ page }) => {
    // Example 1: Check if main elements are present using utility
    await expectElementWithText(page, '.header h1', '🎨 Generic Editor');
    await expectElementWithText(page, '.sidebar', 'Component Search');
    
    // Example 2: Switch to different tabs using utility
    await switchToTab(page, 'HTML Editor');
    await expect(page.locator('#html-editor')).toHaveClass(/active/);
    
    await switchToTab(page, 'CSS Editor');
    await expect(page.locator('#css-editor')).toHaveClass(/active/);
    
    await switchToTab(page, 'Preview');
    await expect(page.locator('#preview-editor')).toHaveClass(/active/);
  });

  test('should demonstrate API mocking with utilities', async ({ page }) => {
    // Create a custom test component
    const customComponent = createTestComponent({
      name: 'Custom Test Component',
      template: '<div class="custom">Custom Content</div>',
      styles: '.custom { color: blue; font-weight: bold; }',
      script: 'console.log("Custom component loaded");'
    });
    
    // Mock APIs with custom data
    await mockAPIs(page, {
      components: [customComponent],
      component: customComponent
    });
    
    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Verify custom component is displayed
    await expectElementWithText(page, '.component-item', 'Custom Test Component');
  });

  test('should demonstrate modal handling with utilities', async ({ page }) => {
    // Open diff modal
    await page.click('#diff-btn');
    await page.waitForTimeout(500);
    
    // Use utility to check modal visibility
    await expectModalVisible(page, 'diff-modal', '📊 Component Changes');
    
    // Use utility to close modal
    await closeModal(page, 'diff-modal');
    
    // Verify modal is closed
    await expect(page.locator('#diff-modal')).not.toBeVisible();
  });

  test('should demonstrate form handling with utilities', async ({ page }) => {
    // Open view template modal
    await page.click('.view-template-btn.add');
    await page.waitForTimeout(500);
    
    // Use utility to fill and submit form
    const formData = {
      '#template-name': 'Test Template',
      '#template-type': 'custom',
      '#template-description': 'A test template',
      '#template-config': '{"test": "value"}'
    };
    
    await fillAndSubmitForm(page, formData, '.modal-btn.save');
    
    // Verify modal is closed after submission
    await expect(page.locator('#view-template-modal')).not.toBeVisible();
  });

  test('should demonstrate responsive testing with utilities', async ({ page }) => {
    // Test mobile layout using utility
    await testResponsiveBehavior(page, { width: 768, height: 1024 }, async () => {
      // Check if mobile panels are visible
      await expect(page.locator('.panels-container')).toBeVisible();
      await expect(page.locator('.mobile-only')).toBeVisible();
    });
    
    // Test tablet layout
    await testResponsiveBehavior(page, { width: 1024, height: 768 }, async () => {
      // Check if desktop layout is maintained
      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('.right-panel')).toBeVisible();
    });
  });

  test('should demonstrate keyboard shortcut testing with utilities', async ({ page }) => {
    // Open a modal first
    await page.click('#diff-btn');
    await page.waitForTimeout(500);
    
    // Test Escape key using utility
    await testKeyboardShortcut(
      page, 
      'Escape',
      async () => {
        // Before: modal should be open
        await expect(page.locator('#diff-modal')).toBeVisible();
      },
      async () => {
        // After: modal should be closed
        await expect(page.locator('#diff-modal')).not.toBeVisible();
      }
    );
  });

  test('should demonstrate drag and drop testing with utilities', async ({ page }) => {
    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Test drag and drop using utility
    await testDragAndDrop(
      page,
      '.component-item:first-child',
      '.canvas-container'
    );
    
    // Note: Drag and drop effects might be too fast to catch in tests
    // but the utility ensures the elements are present and draggable
  });

  test('should demonstrate component generation utilities', async ({ page }) => {
    // Generate different types of test components
    const buttonComponent = generateTestComponent('button');
    const cardComponent = generateTestComponent('card');
    const formComponent = generateTestComponent('form');
    
    // Verify generated components have correct structure
    expect(buttonComponent.template).toContain('<button');
    expect(cardComponent.template).toContain('<div class="test-card"');
    expect(formComponent.template).toContain('<form');
    
    // Mock APIs with generated components
    await mockAPIs(page, {
      components: [buttonComponent, cardComponent, formComponent]
    });
    
    // Wait for components to load
    await page.waitForTimeout(2000);
    
    // Verify components are displayed
    await expectElementWithText(page, '.component-item', 'Test Button Component');
    await expectElementWithText(page, '.component-item', 'Test Card Component');
    await expectElementWithText(page, '.component-item', 'Test Form Component');
  });

  test('should demonstrate complex workflow testing', async ({ page }) => {
    // This test demonstrates a complete workflow using multiple utilities
    
    // Step 1: Load a component
    await loadComponent(page, 'Sample Button');
    
    // Step 2: Switch to HTML editor
    await switchToTab(page, 'HTML Editor');
    await expect(page.locator('#html-editor')).toHaveClass(/active/);
    
    // Step 3: Switch to CSS editor
    await switchToTab(page, 'CSS Editor');
    await expect(page.locator('#css-editor')).toHaveClass(/active/);
    
    // Step 4: Switch to JavaScript editor
    await switchToTab(page, 'JavaScript');
    await expect(page.locator('#js-editor')).toHaveClass(/active/);
    
    // Step 5: Switch to State Machine editor
    await switchToTab(page, 'State Machine');
    await expect(page.locator('#json-editor')).toHaveClass(/active/);
    
    // Step 6: Switch to XState Visualization
    await switchToTab(page, 'XState Visualization');
    await expect(page.locator('#xstate-editor')).toHaveClass(/active/);
    
    // Step 7: Test XState controls
    await page.click('.xstate-controls button:has-text("🔄 Update")');
    await page.waitForTimeout(1000);
    
    // Step 8: Show substates
    await page.click('.xstate-controls button:has-text("🔍 Substates")');
    await page.waitForTimeout(500);
    
    // Step 9: Verify substate section is visible
    await expect(page.locator('#substate-machines')).toBeVisible();
    
    // Step 10: Return to preview
    await switchToTab(page, 'Preview');
    await expect(page.locator('#preview-editor')).toHaveClass(/active/);
    
    // This demonstrates how utilities can be combined for complex testing scenarios
  });

  test('should demonstrate error handling and edge cases', async ({ page }) => {
    // Test with invalid component data
    const invalidComponent = {
      id: 'invalid',
      name: 'Invalid Component',
      template: '', // Empty template
      styles: 'invalid css {', // Invalid CSS
      script: 'console.log(', // Invalid JavaScript
      stateMachine: null // No state machine
    };
    
    // Mock APIs with invalid data
    await mockAPIs(page, {
      components: [invalidComponent],
      component: invalidComponent
    });
    
    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Verify invalid component is still displayed (graceful degradation)
    await expectElementWithText(page, '.component-item', 'Invalid Component');
    
    // Test error message display
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.success')).toBeVisible();
    await expect(page.locator('.info')).toBeVisible();
  });
});
