# Generic Editor & Burger Cart Testing Plan

## 🎯 Testing Overview
This plan covers comprehensive testing of the Generic Editor and Burger Cart components to ensure all functionality works properly after our canvas grabber fixes.

## 🚀 Pre-Testing Setup

### 1. Start the Development Server
```bash
cd example/node-example
npm run dev
```

### 2. Verify Server Status
- Server should be running on http://localhost:3000
- Check health endpoint: http://localhost:3000/api/health
- Verify GraphQL endpoint: http://localhost:3000/graphql

## 🧪 Testing Categories

### A. Generic Editor Core Functionality

#### 1. **Page Loading & Initialization**
- [ ] Editor loads without errors
- [ ] All editor tabs are visible and functional
- [ ] Sidebar components load properly
- [ ] Canvas container initializes correctly
- [ ] Zoom state machine initializes

#### 2. **Editor Tab Functionality**
- [ ] **Preview Tab**: Shows component preview
- [ ] **HTML Editor**: SunEditor loads and functions
- [ ] **CSS Editor**: Ace editor loads and functions
- [ ] **JavaScript Editor**: Ace editor loads and functions
- [ ] **State Machine**: JSON editor loads and functions
- [ ] **XState Visualization**: State machine visualizer loads

#### 3. **Component Management**
- [ ] Sample components load in sidebar
- [ ] Component selection works
- [ ] Component search functionality
- [ ] Component editing and saving
- [ ] Component export/import

### B. Canvas System Testing (Post-Fix)

#### 1. **Zoom Functionality**
- [ ] Mouse wheel zoom works in all states
- [ ] Zoom centers on mouse position
- [ ] Zoom limits are respected (0.05x to 3x)
- [ ] Zoom controls (+/- buttons) work
- [ ] Reset zoom functionality

#### 2. **Pan/Drag Functionality**
- [ ] Canvas dragging works from any area
- [ ] Dragging works from editor content
- [ ] Touch drag works on mobile devices
- [ ] Drag state indicators update properly
- [ ] Transform consistency maintained

#### 3. **State Machine Integration**
- [ ] Zoom state machine transitions correctly
- [ ] State indicators update in real-time
- [ ] No state conflicts between zoom and pan
- [ ] State machine resets properly

#### 4. **Touch Gesture Support**
- [ ] Single touch panning works
- [ ] Two-finger pinch-to-zoom works
- [ ] Gesture detection is accurate
- [ ] Touch events don't interfere with mouse

### C. Burger Cart Component Testing

#### 1. **Component Loading**
- [ ] Burger cart template loads properly
- [ ] All ingredient controls are visible
- [ ] Cart section initializes correctly
- [ ] No JavaScript errors in console

#### 2. **Ingredient Builder**
- [ ] **Bun**: Add/remove functionality
- [ ] **Beef Patty**: Add/remove functionality
- [ ] **Cheese**: Add/remove functionality
- [ ] **Lettuce**: Add/remove functionality
- [ ] **Tomato**: Add/remove functionality
- [ ] **Eggplant**: Add/remove functionality
- [ ] **Onion**: Add/remove functionality

#### 3. **Cart Management**
- [ ] Add custom burger to cart
- [ ] Cart updates with correct totals
- [ ] Cart items display properly
- [ ] Remove items from cart
- [ ] Cart persistence (localStorage)

#### 4. **State Machine Integration**
- [ ] Cart state machine transitions
- [ ] Order processing states
- [ ] Error handling states
- [ ] State persistence

### D. Integration Testing

#### 1. **Generic Editor + Burger Cart**
- [ ] Load burger cart in editor
- [ ] Edit burger cart template
- [ ] Preview changes in real-time
- [ ] Save modified burger cart

#### 2. **Backend Integration**
- [ ] GraphQL queries work
- [ ] State machines persist to database
- [ ] Proxy machines function correctly
- [ ] Robot copy integration works

## 🔧 Testing Tools & Commands

### 1. **Playwright Tests**
```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/e2e/editor.spec.js

# Run tests with UI
npx playwright test --ui

# Run tests in specific browser
npx playwright test --project=chromium
```

### 2. **Manual Testing Checklist**
- [ ] Open http://localhost:3000/src/component-middleware/generic-editor/index.html
- [ ] Test canvas zoom/pan functionality
- [ ] Load burger cart component
- [ ] Test ingredient builder
- [ ] Test cart functionality
- [ ] Verify state machine integration

### 3. **Console Testing**
- [ ] Open browser developer tools
- [ ] Check for JavaScript errors
- [ ] Monitor network requests
- [ ] Verify state machine logs

## 📊 Test Results Tracking

### Canvas System Test Results
| Test Case | Status | Notes |
|-----------|--------|-------|
| Mouse Wheel Zoom | ⏳ Pending | Test zoom in different states |
| Canvas Dragging | ⏳ Pending | Test drag from various areas |
| Touch Gestures | ⏳ Pending | Test mobile interactions |
| State Consistency | ⏳ Pending | Verify transform consistency |

### Burger Cart Test Results
| Test Case | Status | Notes |
|-----------|--------|-------|
| Component Loading | ⏳ Pending | Verify template loads |
| Ingredient Builder | ⏳ Pending | Test all ingredients |
| Cart Management | ⏳ Pending | Test add/remove items |
| State Integration | ⏳ Pending | Verify state machine |

## 🐛 Known Issues & Fixes Applied

### Canvas Grabber Fixes
- ✅ Extended zoom functionality to work in more states
- ✅ Improved drag detection from editor content areas
- ✅ Added transform consistency checks
- ✅ Enhanced touch gesture handling
- ✅ Added periodic transform validation

### Expected Improvements
- Canvas panning should work consistently across all zoom levels
- Zoom should center on mouse position for better UX
- Touch gestures should work reliably on mobile devices
- State machine should maintain consistent state

## 🚨 Critical Test Cases

### 1. **Canvas Transform Consistency**
- Test rapid zoom/pan operations
- Verify transforms don't get out of sync
- Check for NaN values in transforms
- Ensure smooth 60fps performance

### 2. **State Machine Reliability**
- Test state transitions under load
- Verify no state conflicts
- Check state persistence
- Monitor memory usage

### 3. **Integration Stability**
- Test Generic Editor + Burger Cart together
- Verify backend connectivity
- Check database persistence
- Monitor error rates

## 📈 Performance Benchmarks

### Canvas Performance
- **Target**: 60fps smooth interactions
- **Zoom Response**: < 16ms
- **Pan Response**: < 16ms
- **Memory Usage**: < 100MB for large components

### State Machine Performance
- **State Transition**: < 50ms
- **Database Operations**: < 100ms
- **GraphQL Queries**: < 200ms

## 🔍 Debugging Commands

### Canvas Debug
```javascript
// In browser console
debugZoomState();           // Show zoom state info
ensureCanvasTransformConsistency(); // Fix transform issues
handleCanvasTransformEdgeCases();   // Handle edge cases
```

### State Machine Debug
```javascript
// In browser console
console.log('Current State:', zoomStateMachine.getCurrentState());
console.log('Canvas Scale:', canvasScale);
console.log('Canvas Offset:', { x: canvasOffsetX, y: canvasOffsetY });
```

## 📝 Test Execution Log

### Test Session: [DATE]
- **Tester**: [NAME]
- **Environment**: [BROWSER/OS]
- **Server Status**: [RUNNING/STOPPED]
- **Canvas Fixes Applied**: ✅ YES

### Test Results Summary
- **Total Tests**: 0/0
- **Passed**: 0
- **Failed**: 0
- **Skipped**: 0
- **Canvas System**: ⏳ Pending
- **Burger Cart**: ⏳ Pending

---

## 🎯 Next Steps After Testing

1. **Document Results**: Record all test outcomes
2. **Identify Issues**: Note any remaining problems
3. **Performance Analysis**: Measure actual vs. target performance
4. **User Experience**: Assess overall usability improvements
5. **Integration Testing**: Verify end-to-end functionality

This testing plan ensures comprehensive coverage of all functionality and validates that our canvas grabber fixes have resolved the previous issues.

