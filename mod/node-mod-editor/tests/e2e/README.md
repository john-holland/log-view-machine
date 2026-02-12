# Generic Editor - Playwright Test Suite

This directory contains comprehensive end-to-end tests for the Generic Editor component using Playwright.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- The Generic Editor application running on `http://localhost:3000`

### Installation

```bash
# Install Playwright
npm install @playwright/test

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test editor.spec.js

# Run tests for specific browser
npx playwright test --project=chromium
```

## 📁 Test Structure

```
tests/e2e/
├── editor.spec.js           # Core editor functionality tests
├── editor-api.spec.js       # API integration tests
├── editor-advanced.spec.js  # Advanced features tests
├── utils/
│   └── editor-helpers.js    # Test utility functions
└── README.md                # This file
```

## 🧪 Test Categories

### 1. Core Functionality (`editor.spec.js`)

Tests the basic editor features:

- **Page Loading**: Editor initialization and basic UI elements
- **Tab Management**: Switching between different editor tabs
- **Component Management**: Loading, selecting, and searching components
- **Authentication**: Login form and user management
- **Save Status**: Change tracking and save button states
- **Modals**: Diff view, duplicate component, and view template modals
- **Developer Mode**: Toggle and advanced features

### 2. Canvas and Interaction (`editor.spec.js`)

Tests the canvas system and user interactions:

- **Canvas Controls**: Zoom, pan, and reset functionality
- **Gesture Detection**: Touch and mouse gesture handling
- **Panel Management**: Resizable panels and grabbers
- **Responsive Layout**: Mobile and desktop layout switching

### 3. Drag and Drop (`editor.spec.js`)

Tests component drag and drop functionality:

- **Component Dragging**: Making components draggable
- **Editor Dropping**: Making editors accept dropped components
- **Content Insertion**: Inserting components into editors

### 4. XState Integration (`editor.spec.js`)

Tests state machine visualization:

- **Visualization Generation**: Creating state machine diagrams
- **Substate Handling**: Managing nested state machines
- **Export Functionality**: Downloading state machine definitions
- **Interactive Elements**: State selection and zoom controls

### 5. API Integration (`editor-api.spec.js`)

Tests backend API interactions:

- **Health Checks**: API status monitoring
- **Component Operations**: Search, load, save, and duplicate
- **Authentication**: Login/logout flows
- **Error Handling**: Network failures and API errors
- **Mock Responses**: Simulating backend behavior

### 6. Advanced Features (`editor-advanced.spec.js`)

Tests complex editor capabilities:

- **XState Visualization**: Advanced state machine features
- **Diff Views**: Comprehensive change comparison
- **View Templates**: Custom template management
- **Developer Tools**: Git integration and debugging
- **Performance**: Memory management and optimization
- **Accessibility**: Keyboard shortcuts and screen reader support

## 🛠️ Test Utilities

The `utils/editor-helpers.js` file provides helper functions for common testing tasks:

### Core Functions

- `waitForEditorReady(page)` - Wait for editor to be fully loaded
- `loadComponent(page, componentName)` - Load a specific component
- `switchToTab(page, tabName)` - Switch to a specific editor tab
- `mockAPIs(page, mocks)` - Mock API responses for testing

### Utility Functions

- `createTestComponent(overrides)` - Generate test component data
- `expectElementWithText(page, selector, text)` - Check element visibility and text
- `expectModalVisible(page, modalId, title)` - Verify modal display
- `closeModal(page, modalId)` - Close a modal dialog
- `fillAndSubmitForm(page, formData, submitButton)` - Handle form interactions
- `testResponsiveBehavior(page, viewport, testFunction)` - Test responsive layouts
- `testKeyboardShortcut(page, key, before, after)` - Test keyboard interactions
- `testDragAndDrop(page, source, target)` - Test drag and drop functionality

## 🔧 Configuration

The test suite is configured via `playwright.config.js`:

- **Test Directory**: `./tests/e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Web Server**: Automatically starts the dev server before tests
- **Timeouts**: 30s global, 10s for assertions
- **Reporting**: HTML, JSON, and JUnit reports

## 📊 Test Reports

After running tests, reports are generated in:

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/results.xml`
- **Screenshots**: `test-results/screenshots/` (on failure)
- **Videos**: `test-results/videos/` (on failure)

## 🐛 Debugging Tests

### Debug Mode

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector for step-by-step debugging.

### UI Mode

```bash
npm run test:e2e:ui
```

This opens the Playwright UI for interactive test development.

### Screenshots and Videos

Tests automatically capture screenshots and videos on failure. Check the `test-results/` directory.

### Console Logging

Tests include extensive console logging for debugging:

```javascript
console.log('=== TAB SWITCHING DEBUG ===');
console.log('Tab name:', tabName);
console.log('Event:', event);
```

## 🧹 Test Data Management

### Sample Components

The editor loads sample components for testing:

- **Sample Button**: Basic button component with click handler
- **Sample Card**: Card layout component
- **Sample Form**: Form input component

### Mock APIs

Tests use mocked API responses to ensure consistent behavior:

```javascript
await mockAPIs(page, {
  components: [createTestComponent('button')],
  component: createTestComponent('custom')
});
```

## 🚨 Common Issues and Solutions

### 1. Editor Not Loading

**Problem**: Tests fail with "container not found" errors.

**Solution**: Increase timeout in `waitForEditorReady()` or check if the dev server is running.

### 2. Component Loading Failures

**Problem**: Sample components don't appear.

**Solution**: Verify the `loadSampleComponents()` function is working and check browser console for errors.

### 3. Tab Switching Issues

**Problem**: Tabs don't switch properly.

**Solution**: Check if editors are properly initialized and wait for tab content to load.

### 4. API Mock Failures

**Problem**: Mocked APIs don't work as expected.

**Solution**: Verify route patterns match actual API calls and check network tab in browser dev tools.

### 5. Responsive Test Failures

**Problem**: Mobile layout tests fail.

**Solution**: Ensure CSS media queries are working and viewport changes are applied correctly.

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Variables

```bash
# CI environment
CI=true

# Browser selection
PLAYWRIGHT_BROWSERS_PATH=0

# Test results directory
PLAYWRIGHT_HTML_REPORT=./test-results/html-report
```

## 📈 Performance Testing

### Memory Leak Detection

Tests include memory management checks:

```javascript
test('should handle multiple tab switches without memory leaks', async ({ page }) => {
  // Switch between tabs multiple times
  for (let i = 0; i < 5; i++) {
    for (const tab of tabs) {
      await page.click(`.header-tab:has-text("${tab}")`);
      await page.waitForTimeout(200);
    }
  }
  
  // Verify functionality is maintained
  await expect(page.locator('#xstate-editor')).toHaveClass(/active/);
});
```

### Rapid Operation Testing

Tests verify stability under stress:

```javascript
test('should handle rapid zoom operations', async ({ page }) => {
  // Perform rapid zoom operations
  for (let i = 0; i < 10; i++) {
    await page.click('.canvas-btn:has-text("🔍+")');
    await page.waitForTimeout(50);
  }
  
  // Verify zoom still works
  const zoomLevel = await page.locator('#zoom-level').textContent();
  expect(parseInt(zoomLevel)).toBeGreaterThan(100);
});
```

## 🤝 Contributing

### Adding New Tests

1. **Identify the feature** to test
2. **Choose the appropriate test file** based on category
3. **Use existing utility functions** when possible
4. **Follow the naming convention**: `should [action] [expected result]`
5. **Include proper error handling** and timeouts
6. **Add debugging logs** for complex scenarios

### Test Structure

```javascript
test('should [action] [expected result]', async ({ page }) => {
  // Arrange: Set up test conditions
  await waitForEditorReady(page);
  
  // Act: Perform the action
  await page.click('#some-button');
  
  // Assert: Verify the result
  await expect(page.locator('#result')).toContainText('Expected');
});
```

### Best Practices

- **Use descriptive test names** that explain the behavior
- **Keep tests independent** - don't rely on other tests
- **Clean up after tests** - reset state when needed
- **Use appropriate timeouts** - balance speed with reliability
- **Mock external dependencies** - ensure consistent test environment
- **Test both success and failure paths** - verify error handling

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Generic Editor Documentation](../README.md)
- [XState Documentation](https://xstate.js.org/)

## 🆘 Support

For issues with the test suite:

1. Check the browser console for JavaScript errors
2. Verify the editor application is running correctly
3. Review test logs and screenshots in `test-results/`
4. Check if the issue is test-specific or application-specific
5. Use debug mode to step through failing tests

---

**Happy Testing! 🎯**
