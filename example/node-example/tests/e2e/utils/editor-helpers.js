/**
 * Utility functions for testing the Generic Editor
 */

/**
 * Wait for the editor to be fully loaded and ready
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function waitForEditorReady(page) {
  // Wait for main container
  await page.waitForSelector('.container', { timeout: 10000 });
  
  // Wait for editors to initialize
  await page.waitForTimeout(2000);
  
  // Wait for sample components to load
  await page.waitForSelector('.component-item', { timeout: 10000 });
}

/**
 * Load a component for testing
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} componentName - Name of the component to load
 */
export async function loadComponent(page, componentName) {
  // Wait for components to load
  await page.waitForSelector('.component-item', { timeout: 10000 });
  
  // Click on the specified component
  await page.click(`.component-item:has-text("${componentName}")`);
  
  // Select first available version
  await page.selectOption('#version-selector', '1.0.0');
  
  // Load the component
  await page.click('button:has-text("Load Component")');
  
  // Wait for loading to complete
  await page.waitForTimeout(2000);
}

/**
 * Switch to a specific editor tab
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} tabName - Name of the tab to switch to
 */
export async function switchToTab(page, tabName) {
  await page.click(`.header-tab:has-text("${tabName}")`);
  await page.waitForTimeout(500);
  
  // Verify tab is active
  const tabId = getTabId(tabName);
  if (tabId) {
    await page.waitForSelector(`#${tabId}.active`);
  }
}

/**
 * Get the editor content ID for a given tab name
 * @param {string} tabName - Name of the tab
 * @returns {string} The editor content ID
 */
function getTabId(tabName) {
  const tabMap = {
    'Preview': 'preview-editor',
    'HTML Editor': 'html-editor',
    'CSS Editor': 'css-editor',
    'JavaScript': 'js-editor',
    'State Machine': 'json-editor',
    'XState Visualization': 'xstate-editor'
  };
  
  return tabMap[tabName];
}

/**
 * Mock API responses for testing
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} mocks - Object containing API mocks
 */
export async function mockAPIs(page, mocks = {}) {
  // Default mocks
  const defaultMocks = {
    health: { status: 'healthy' },
    components: [],
    versions: ['1.0.0'],
    component: {
      id: 'test-component',
      name: 'Test Component',
      description: 'A test component',
      type: 'test',
      template: '<div>Test</div>',
      styles: 'div { color: red; }',
      script: 'console.log("test");',
      stateMachine: { id: 'test', initial: 'idle', states: { idle: {} } }
    }
  };
  
  const finalMocks = { ...defaultMocks, ...mocks };
  
  // Mock health check
  await page.route('**/health', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(finalMocks.health)
    });
  });
  
  // Mock component search
  await page.route('**/api/components/search**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, components: finalMocks.components })
    });
  });
  
  // Mock component versions
  await page.route('**/api/components/**/versions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, versions: finalMocks.versions })
    });
  });
  
  // Mock component loading
  await page.route('**/api/components/**/load', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, component: finalMocks.component })
    });
  });
}

/**
 * Create a test component with specified properties
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test component object
 */
export function createTestComponent(overrides = {}) {
  const defaultComponent = {
    id: 'test-component',
    name: 'Test Component',
    description: 'A test component for testing',
    type: 'test',
    template: '<div class="test-component">Test Content</div>',
    styles: '.test-component { color: red; padding: 10px; }',
    script: 'console.log("Test component loaded");',
    stateMachine: {
      id: 'testMachine',
      initial: 'idle',
      states: {
        idle: { on: { START: 'running' } },
        running: { on: { STOP: 'idle' } }
      }
    },
    sassVariables: {
      primaryColor: '#667eea',
      secondaryColor: '#764ba2'
    }
  };
  
  return { ...defaultComponent, ...overrides };
}

/**
 * Wait for a specific condition with timeout
 * @param {Function} condition - Function that returns a boolean
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 */
export async function waitForCondition(condition, timeout = 10000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Take a screenshot of the current state
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} name - Name for the screenshot
 */
export async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage: true 
  });
}

/**
 * Check if an element is visible and has expected text
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {string} expectedText - Expected text content
 */
export async function expectElementWithText(page, selector, expectedText) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await expect(element).toContainText(expectedText);
}

/**
 * Check if a modal is visible and has expected content
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} modalId - Modal element ID
 * @param {string} expectedTitle - Expected modal title
 */
export async function expectModalVisible(page, modalId, expectedTitle) {
  const modal = page.locator(`#${modalId}`);
  await expect(modal).toBeVisible();
  
  if (expectedTitle) {
    const title = modal.locator('.modal-title, .diff-modal-title, .duplicate-modal-title');
    await expect(title).toContainText(expectedTitle);
  }
}

/**
 * Close a modal by clicking the close button
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} modalId - Modal element ID
 */
export async function closeModal(page, modalId) {
  const modal = page.locator(`#${modalId}`);
  const closeButton = modal.locator('.modal-close, .diff-modal-close, .duplicate-modal-close');
  
  await closeButton.click();
  await page.waitForTimeout(500);
  
  // Verify modal is closed
  await expect(modal).not.toBeVisible();
}

/**
 * Fill and submit a form
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} formData - Object with field selectors and values
 * @param {string} submitButtonSelector - Selector for submit button
 */
export async function fillAndSubmitForm(page, formData, submitButtonSelector) {
  // Fill in form fields
  for (const [selector, value] of Object.entries(formData)) {
    const field = page.locator(selector);
    await expect(field).toBeVisible();
    
    if (field.evaluate(el => el.tagName === 'SELECT')) {
      await field.selectOption(value);
    } else {
      await field.fill(value);
    }
  }
  
  // Submit form
  const submitButton = page.locator(submitButtonSelector);
  await expect(submitButton).toBeVisible();
  await submitButton.click();
  
  // Wait for form submission
  await page.waitForTimeout(500);
}

/**
 * Test responsive behavior by changing viewport size
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} viewport - Viewport dimensions
 * @param {Function} testFunction - Function to run with the viewport
 */
export async function testResponsiveBehavior(page, viewport, testFunction) {
  // Store original viewport
  const originalViewport = page.viewportSize();
  
  try {
    // Set new viewport
    await page.setViewportSize(viewport);
    await page.waitForTimeout(1000);
    
    // Run test function
    await testFunction();
    
  } finally {
    // Restore original viewport
    if (originalViewport) {
      await page.setViewportSize(originalViewport);
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Test keyboard shortcuts
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} key - Key to press
 * @param {Function} beforeAction - Function to run before pressing key
 * @param {Function} afterAction - Function to run after pressing key
 */
export async function testKeyboardShortcut(page, key, beforeAction, afterAction) {
  // Run before action
  if (beforeAction) {
    await beforeAction();
  }
  
  // Press key
  await page.keyboard.press(key);
  await page.waitForTimeout(500);
  
  // Run after action
  if (afterAction) {
    await afterAction();
  }
}

/**
 * Test drag and drop functionality
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} sourceSelector - Selector for draggable element
 * @param {string} targetSelector - Selector for drop target
 */
export async function testDragAndDrop(page, sourceSelector, targetSelector) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);
  
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();
  
  // Perform drag and drop
  await source.dragTo(target);
  await page.waitForTimeout(500);
  
  // Check if drag-over class was applied (briefly)
  // Note: This might be too fast to catch in some cases
}

/**
 * Generate test data for different component types
 * @param {string} type - Component type
 * @returns {Object} Test component data
 */
export function generateTestComponent(type) {
  const baseComponent = {
    id: `test-${type}`,
    name: `Test ${type} Component`,
    description: `A test ${type} component`,
    type: type,
    version: '1.0.0'
  };
  
  switch (type) {
    case 'button':
      return {
        ...baseComponent,
        template: '<button class="test-btn">Click me</button>',
        styles: '.test-btn { background: #007bff; color: white; padding: 10px 20px; }',
        script: 'document.querySelector(".test-btn").addEventListener("click", () => alert("Clicked!"));'
      };
      
    case 'card':
      return {
        ...baseComponent,
        template: '<div class="test-card"><h3>Title</h3><p>Content</p></div>',
        styles: '.test-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }',
        script: 'console.log("Card component loaded");'
      };
      
    case 'form':
      return {
        ...baseComponent,
        template: '<form class="test-form"><input type="text" placeholder="Name"><button type="submit">Submit</button></form>',
        styles: '.test-form { display: flex; gap: 10px; } .test-form input { flex: 1; }',
        script: 'document.querySelector(".test-form").addEventListener("submit", (e) => { e.preventDefault(); console.log("Form submitted"); });'
      };
      
    default:
      return baseComponent;
  }
}
