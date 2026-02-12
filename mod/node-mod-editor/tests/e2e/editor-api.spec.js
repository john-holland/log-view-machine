import { test, expect } from '@playwright/test';

test.describe('Generic Editor - API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
    await page.waitForSelector('.container', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should handle API health check', async ({ page }) => {
    // Mock the health check API call
    await page.route('**/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy' })
      });
    });

    // Trigger health check (this would normally happen on page load)
    // For now, we'll just verify the health check function exists
    const healthCheckExists = await page.evaluate(() => {
      return typeof window.checkHealth === 'function';
    });
    
    expect(healthCheckExists).toBe(true);
  });

  test('should handle component search API', async ({ page }) => {
    // Mock the component search API
    await page.route('**/api/components/search**', async route => {
      const url = route.request().url();
      const query = new URL(url).searchParams.get('query') || '';
      
      let components = [];
      if (query.toLowerCase().includes('button')) {
        components = [{
          id: 'demo-button',
          name: 'Button Component',
          description: 'A reusable button component',
          type: 'ui',
          template: '<button class="btn btn-primary">Click me</button>',
          styles: '.btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }',
          script: 'console.log("Button clicked!");'
        }];
      } else {
        components = [
          {
            id: 'demo-button',
            name: 'Button Component',
            description: 'A reusable button component',
            type: 'ui',
            template: '<button class="btn btn-primary">Click me</button>',
            styles: '.btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }',
            script: 'console.log("Button clicked!");'
          },
          {
            id: 'demo-card',
            name: 'Card Component',
            description: 'A card layout component',
            type: 'layout',
            template: '<div class="card"><div class="card-header">Header</div><div class="card-body">Content</div></div>',
            styles: '.card { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }',
            script: 'console.log("Card component loaded");'
          }
        ];
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, components })
      });
    });

    // Test search functionality
    await page.fill('#search-input', 'Button');
    await page.waitForTimeout(500);
    
    // Verify only button component is shown
    await expect(page.locator('.component-item:has-text("Button Component")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Card Component")')).not.toBeVisible();
    
    // Clear search
    await page.fill('#search-input', '');
    await page.waitForTimeout(500);
    
    // Verify all components are shown
    await expect(page.locator('.component-item:has-text("Button Component")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Card Component")')).toBeVisible();
  });

  test('should handle component loading API', async ({ page }) => {
    // Mock the component load API
    await page.route('**/api/components/**/load', async route => {
      const componentId = route.request().url().split('/').pop();
      
      const component = {
        id: componentId,
        name: 'Test Component',
        description: 'A test component for API testing',
        type: 'test',
        template: '<div class="test-component">Test Content</div>',
        styles: '.test-component { color: red; }',
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
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, component })
      });
    });

    // Mock the versions API
    await page.route('**/api/components/**/versions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, versions: ['1.0.0', '1.1.0', '2.0.0'] })
      });
    });

    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Select a component
    await page.click('.component-item:first-child');
    
    // Select a version
    await page.selectOption('#version-selector', '1.0.0');
    
    // Load the component
    await page.click('button:has-text("Load Component")');
    
    // Wait for loading to complete
    await page.waitForTimeout(2000);
    
    // Verify component info is updated
    await expect(page.locator('#current-component-info')).toContainText('Test Component');
    
    // Verify state machine viewer is updated
    await expect(page.locator('#state-machine-viewer')).toContainText('testMachine');
    
    // Verify SASS variables are updated
    await expect(page.locator('#sass-variables')).toContainText('2 variables loaded');
  });

  test('should handle component saving API', async ({ page }) => {
    // Mock the component save API
    await page.route('**/api/components/**/save', async route => {
      const requestBody = JSON.parse(route.request().postData() || '{}');
      
      // Verify the request structure
      expect(requestBody).toHaveProperty('id');
      expect(requestBody).toHaveProperty('version');
      expect(requestBody).toHaveProperty('template');
      expect(requestBody).toHaveProperty('styles');
      expect(requestBody).toHaveProperty('script');
      expect(requestBody).toHaveProperty('stateMachine');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Component saved successfully' })
      });
    });

    // Load a component first
    await page.route('**/api/components/**/load', async route => {
      const component = {
        id: 'test-save',
        name: 'Save Test Component',
        description: 'Component for testing save functionality',
        type: 'test',
        template: '<div>Test</div>',
        styles: 'div { color: blue; }',
        script: 'console.log("test");',
        stateMachine: { id: 'test', initial: 'idle', states: { idle: {} } }
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, component })
      });
    });

    await page.route('**/api/components/**/versions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, versions: ['1.0.0'] })
      });
    });

    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Select and load a component
    await page.click('.component-item:first-child');
    await page.selectOption('#version-selector', '1.0.0');
    await page.click('button:has-text("Load Component")');
    await page.waitForTimeout(2000);
    
    // Try to save the component
    await page.click('#save-component-btn');
    
    // Wait for save to complete
    await page.waitForTimeout(1000);
    
    // Verify save button is disabled (indicating successful save)
    await expect(page.locator('#save-component-btn')).toBeDisabled();
  });

  test('should handle component duplication API', async ({ page }) => {
    // Mock the duplicate API
    await page.route('**/api/components/**/duplicate', async route => {
      const requestBody = JSON.parse(route.request().postData() || '{}');
      
      // Verify the request structure
      expect(requestBody).toHaveProperty('newName');
      expect(requestBody).toHaveProperty('newDescription');
      
      const newComponent = {
        id: 'duplicated-component',
        name: requestBody.newName,
        description: requestBody.newDescription,
        type: 'test',
        template: '<div>Duplicated</div>',
        styles: 'div { color: green; }',
        script: 'console.log("duplicated");',
        stateMachine: { id: 'duplicated', initial: 'idle', states: { idle: {} } }
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, component: newComponent })
      });
    });

    // Mock other APIs needed for duplication
    await page.route('**/api/components/**/load', async route => {
      const component = {
        id: 'test-duplicate',
        name: 'Duplicate Test Component',
        description: 'Component for testing duplication',
        type: 'test',
        template: '<div>Original</div>',
        styles: 'div { color: red; }',
        script: 'console.log("original");',
        stateMachine: { id: 'original', initial: 'idle', states: { idle: {} } }
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, component })
      });
    });

    await page.route('**/api/components/**/versions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, versions: ['1.0.0'] })
      });
    });

    // Wait for components to load
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Select and load a component
    await page.click('.component-item:first-child');
    await page.selectOption('#version-selector', '1.0.0');
    await page.click('button:has-text("Load Component")');
    await page.waitForTimeout(2000);
    
    // Open duplicate modal
    await page.click('#duplicate-component-btn');
    
    // Fill in duplicate form
    await page.fill('#duplicate-name', 'Duplicated Component');
    await page.fill('#duplicate-description', 'This is a duplicated component');
    
    // Submit duplication
    await page.click('.duplicate-modal-btn.primary');
    
    // Wait for API call to complete
    await page.waitForTimeout(1000);
    
    // Verify modal is closed
    await expect(page.locator('#duplicate-modal')).not.toBeVisible();
  });

  test('should handle login API', async ({ page }) => {
    // Mock the login API
    await page.route('**/api/login', async route => {
      const requestBody = JSON.parse(route.request().postData() || '{}');
      
      if (requestBody.username === 'admin' && requestBody.password === 'admin') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { username: 'admin', email: 'admin@example.com' }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials'
          })
        });
      }
    });

    // Fill in login form
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    
    // Submit login
    await page.click('button:has-text("Login")');
    
    // Wait for API call to complete
    await page.waitForTimeout(1000);
    
    // Verify user info is displayed
    await expect(page.locator('#user-info')).toBeVisible();
    await expect(page.locator('#user-name')).toContainText('admin');
  });

  test('should handle logout API', async ({ page }) => {
    // Mock the logout API
    await page.route('**/api/logout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Mock successful login first
    await page.route('**/api/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { username: 'admin', email: 'admin@example.com' }
        })
      });
    });

    // Login first
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(1000);
    
    // Verify logged in
    await expect(page.locator('#user-info')).toBeVisible();
    
    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForTimeout(1000);
    
    // Verify logged out
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#user-info')).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return errors
    await page.route('**/api/components/search**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' })
      });
    });

    // Mock component loading to fail
    await page.route('**/api/components/**/load', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Component not found' })
      });
    });

    // Wait for components to load (should fall back to demo components)
    await page.waitForSelector('.component-item', { timeout: 15000 });
    
    // Verify demo components are loaded as fallback
    await expect(page.locator('.component-item:has-text("Sample Button")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Sample Card")')).toBeVisible();
    await expect(page.locator('.component-item:has-text("Sample Form")')).toBeVisible();
  });

  test('should handle network timeouts', async ({ page }) => {
    // Mock API to timeout
    await page.route('**/api/components/search**', async route => {
      // Simulate timeout by not calling route.fulfill
      // This will cause the request to hang until timeout
    });

    // Set a shorter timeout for this test
    page.setDefaultTimeout(5000);
    
    // Try to load components (should fall back to demo components)
    await page.waitForSelector('.component-item', { timeout: 10000 });
    
    // Verify fallback components are loaded
    await expect(page.locator('.component-item:has-text("Sample Button")')).toBeVisible();
  });
});
