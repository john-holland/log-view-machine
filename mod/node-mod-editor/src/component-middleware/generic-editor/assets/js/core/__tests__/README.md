# Zoom State Machine Test Suite

This directory contains comprehensive tests for the `ZoomStateMachine` class, which handles canvas dragging, zooming, and touch interactions in the generic editor.

## Test Coverage

### 1. **State Transitions** ✅
- **Idle State**: Tests all valid transitions from idle
- **Canvas Hover**: Tests mouse down, wheel, mouse leave, and touch events
- **Editor Hover**: Tests wheel scrolling and mouse leave
- **Canvas Dragging**: Tests mouse move, mouse up, and mouse leave persistence
- **Canvas Zooming**: Tests wheel events and mouse leave
- **Editor Scrolling**: Tests wheel events and mouse leave
- **Touch Started**: Tests touch move and touch end
- **Touch Moving**: Tests continuous touch move and touch end

### 2. **State Query Methods** ✅
- `isIdle()`, `isCanvasHover()`, `isEditorHover()`
- `isCanvasDragging()`, `isCanvasZooming()`, `isEditorScrolling()`
- `isTouchStarted()`, `isTouchMoving()`

### 3. **State Indicator Updates** ✅
- Gesture indicator text updates
- Grabber state indicator text updates
- Active class toggling for dragging state

### 4. **Utility Methods** ✅
- `forceState()` for testing and manual control
- `reset()` for returning to idle state
- Error handling for invalid states

### 5. **Edge Cases** ✅
- Missing DOM elements
- Multiple rapid transitions
- Invalid event handling
- State consistency maintenance

### 6. **Integration Scenarios** ✅
- Complete mouse interaction flows
- Complete touch interaction flows
- Mixed mouse and touch interactions

## Running Tests

### Quick Test
```bash
npm run test:unit
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Using the Test Runner Script
```bash
./scripts/run-unit-tests.sh
```

## Test Structure

```
__tests__/
├── zoom-state-machine.test.js    # Main test file
├── README.md                     # This documentation
└── fixtures/                     # Test data (if needed)
```

## Test Environment

- **Jest**: Testing framework
- **jsdom**: DOM environment for browser-like testing
- **Babel**: ES6+ support and module transformation
- **Mocking**: DOM elements and console methods

## State Machine Diagram

```
                    ┌─────────────┐
                    │    idle     │
                    └─────┬───────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│canvas_hover │   │editor_hover │   │touch_started│
└─────┬───────┘   └─────┬───────┘   └─────┬───────┘
      │                 │                 │
      ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│canvas_drag  │   │editor_scroll│   │touch_moving │
└─────────────┘   └─────────────┘   └─────────────┘
      │
      ▼
┌─────────────┐
│canvas_zoom  │
└─────────────┘
```

## Key Test Scenarios

### Mouse Interaction Flow
1. Enter canvas → `canvas_hover`
2. Mouse down → `canvas_dragging`
3. Mouse move → `canvas_dragging` (stays)
4. Mouse up → `canvas_hover`
5. Leave canvas → `idle`

### Touch Interaction Flow
1. Touch start → `touch_started`
2. Touch move → `touch_moving`
3. Touch move → `touch_moving` (stays)
4. Touch end → `idle`

### Zoom Interaction Flow
1. Enter canvas → `canvas_hover`
2. Wheel → `canvas_zooming`
3. Wheel → `canvas_zooming` (stays)
4. Leave canvas → `idle`

## Assertions and Expectations

Each test verifies:
- **State Transitions**: Correct state changes on events
- **Return Values**: Transition methods return expected booleans
- **Side Effects**: DOM updates and indicator changes
- **State Consistency**: Machine maintains valid state
- **Error Handling**: Graceful handling of invalid inputs

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Test both positive and negative cases
3. Include edge cases and error conditions
4. Update this documentation
5. Ensure 100% test coverage for new features

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure Babel is configured for ES modules
2. **DOM Errors**: Check that jsdom environment is properly set up
3. **Mock Failures**: Verify DOM element mocking in test setup
4. **State Machine Issues**: Check that all states and transitions are defined

### Debug Mode

Run tests with verbose output:
```bash
npm run test:unit -- --verbose
```

### Coverage Analysis

Generate detailed coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```
