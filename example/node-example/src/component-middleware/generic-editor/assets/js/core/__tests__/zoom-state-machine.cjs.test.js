/**
 * Tests for ZoomStateMachine (CommonJS version)
 * Tests all states, transitions, and edge cases for the canvas dragging state machine
 */

const { ZoomStateMachine } = require('../zoom-state-machine.cjs.js');

describe('ZoomStateMachine', () => {
    let stateMachine;
    let mockGestureIndicator;
    let mockGrabberStateIndicator;

    beforeEach(() => {
        // Create a fresh instance for each test
        stateMachine = new ZoomStateMachine();
        
        // Mock DOM elements
        mockGestureIndicator = {
            textContent: ''
        };
        mockGrabberStateIndicator = {
            textContent: '',
            classList: {
                toggle: jest.fn()
            }
        };
        
        // Mock document.getElementById
        document.getElementById = jest.fn((id) => {
            if (id === 'gesture-indicator') return mockGestureIndicator;
            if (id === 'canvas-grabber-state') return mockGrabberStateIndicator;
            return null;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initial State', () => {
        test('should start in idle state', () => {
            expect(stateMachine.getCurrentState()).toBe('idle');
        });

        test('should have all required states defined', () => {
            const expectedStates = [
                'idle', 'canvas_hover', 'editor_hover', 'canvas_dragging',
                'canvas_zooming', 'editor_scrolling', 'touch_started', 'touch_moving'
            ];
            
            expectedStates.forEach(state => {
                expect(stateMachine.states[state]).toBeDefined();
            });
        });
    });

    describe('State Transitions', () => {
        describe('From idle state', () => {
            beforeEach(() => {
                expect(stateMachine.getCurrentState()).toBe('idle');
            });

            test('should transition to canvas_hover on MOUSE_ENTER_CANVAS', () => {
                const result = stateMachine.transition('MOUSE_ENTER_CANVAS');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('canvas_hover');
            });

            test('should transition to editor_hover on MOUSE_ENTER_EDITOR', () => {
                const result = stateMachine.transition('MOUSE_ENTER_EDITOR');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('editor_hover');
            });

            test('should transition to touch_started on TOUCH_START', () => {
                const result = stateMachine.transition('TOUCH_START');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('touch_started');
            });

            test('should reject invalid transitions', () => {
                const result = stateMachine.transition('MOUSE_DOWN');
                expect(result).toBe(false);
                expect(stateMachine.getCurrentState()).toBe('idle');
            });
        });

        describe('From canvas_hover state', () => {
            beforeEach(() => {
                stateMachine.transition('MOUSE_ENTER_CANVAS');
                expect(stateMachine.getCurrentState()).toBe('canvas_hover');
            });

            test('should transition to canvas_dragging on MOUSE_DOWN', () => {
                const result = stateMachine.transition('MOUSE_DOWN');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('canvas_dragging');
            });

            test('should transition to canvas_zooming on WHEEL', () => {
                const result = stateMachine.transition('WHEEL');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('canvas_zooming');
            });

            test('should transition to idle on MOUSE_LEAVE', () => {
                const result = stateMachine.transition('MOUSE_LEAVE');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('idle');
            });

            test('should transition to touch_started on TOUCH_START', () => {
                const result = stateMachine.transition('TOUCH_START');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('touch_started');
            });
        });

        describe('From editor_hover state', () => {
            beforeEach(() => {
                stateMachine.transition('MOUSE_ENTER_EDITOR');
                expect(stateMachine.getCurrentState()).toBe('editor_hover');
            });

            test('should transition to editor_scrolling on WHEEL', () => {
                const result = stateMachine.transition('WHEEL');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('editor_scrolling');
            });

            test('should transition to idle on MOUSE_LEAVE', () => {
                const result = stateMachine.transition('MOUSE_LEAVE');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('idle');
            });

            test('should transition to touch_started on TOUCH_START', () => {
                const result = stateMachine.transition('TOUCH_START');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('touch_started');
            });
        });

        describe('From canvas_dragging state', () => {
            beforeEach(() => {
                stateMachine.transition('MOUSE_ENTER_CANVAS');
                stateMachine.transition('MOUSE_DOWN');
                expect(stateMachine.getCurrentState()).toBe('canvas_dragging');
            });

            test('should stay in canvas_dragging on MOUSE_MOVE', () => {
                const result = stateMachine.transition('MOUSE_MOVE');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('canvas_dragging');
            });

            test('should transition to canvas_hover on MOUSE_UP', () => {
                const result = stateMachine.transition('MOUSE_UP');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('canvas_hover');
            });

            test('should stay in canvas_dragging on MOUSE_LEAVE', () => {
                const result = stateMachine.transition('MOUSE_LEAVE');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('canvas_dragging');
            });
        });

        describe('From canvas_zooming state', () => {
            beforeEach(() => {
                stateMachine.transition('MOUSE_ENTER_CANVAS');
                stateMachine.transition('WHEEL');
                expect(stateMachine.getCurrentState()).toBe('canvas_zooming');
            });

            test('should stay in canvas_zooming on WHEEL', () => {
                const result = stateMachine.transition('WHEEL');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('canvas_zooming');
            });

            test('should transition to idle on MOUSE_LEAVE', () => {
                const result = stateMachine.transition('MOUSE_LEAVE');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('idle');
            });
        });

        describe('From editor_scrolling state', () => {
            beforeEach(() => {
                stateMachine.transition('MOUSE_ENTER_EDITOR');
                stateMachine.transition('WHEEL');
                expect(stateMachine.getCurrentState()).toBe('editor_scrolling');
            });

            test('should stay in editor_scrolling on WHEEL', () => {
                const result = stateMachine.transition('WHEEL');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('editor_scrolling');
            });

            test('should transition to idle on MOUSE_LEAVE', () => {
                const result = stateMachine.transition('MOUSE_LEAVE');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('idle');
            });
        });

        describe('From touch_started state', () => {
            beforeEach(() => {
                stateMachine.transition('TOUCH_START');
                expect(stateMachine.getCurrentState()).toBe('touch_started');
            });

            test('should transition to touch_moving on TOUCH_MOVE', () => {
                const result = stateMachine.transition('TOUCH_MOVE');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('touch_moving');
            });

            test('should transition to idle on TOUCH_END', () => {
                const result = stateMachine.transition('TOUCH_END');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('idle');
            });
        });

        describe('From touch_moving state', () => {
            beforeEach(() => {
                stateMachine.transition('TOUCH_START');
                stateMachine.transition('TOUCH_MOVE');
                expect(stateMachine.getCurrentState()).toBe('touch_moving');
            });

            test('should stay in touch_moving on TOUCH_MOVE', () => {
                const result = stateMachine.transition('TOUCH_MOVE');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('touch_moving');
            });

            test('should transition to idle on TOUCH_END', () => {
                const result = stateMachine.transition('TOUCH_END');
                expect(result).toBe(true);
                expect(stateMachine.getCurrentState()).toBe('idle');
            });
        });
    });

    describe('State Query Methods', () => {
        test('isIdle should return true only when in idle state', () => {
            expect(stateMachine.isIdle()).toBe(true);
            
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            expect(stateMachine.isIdle()).toBe(false);
        });

        test('isCanvasHover should return true only when in canvas_hover state', () => {
            expect(stateMachine.isCanvasHover()).toBe(false);
            
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            expect(stateMachine.isCanvasHover()).toBe(true);
        });

        test('isEditorHover should return true only when in editor_hover state', () => {
            expect(stateMachine.isEditorHover()).toBe(false);
            
            stateMachine.transition('MOUSE_ENTER_EDITOR');
            expect(stateMachine.isEditorHover()).toBe(true);
        });

        test('isCanvasDragging should return true only when in canvas_dragging state', () => {
            expect(stateMachine.isCanvasDragging()).toBe(false);
            
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            stateMachine.transition('MOUSE_DOWN');
            expect(stateMachine.isCanvasDragging()).toBe(true);
        });

        test('isCanvasZooming should return true only when in canvas_zooming state', () => {
            expect(stateMachine.isCanvasZooming()).toBe(false);
            
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            stateMachine.transition('WHEEL');
            expect(stateMachine.isCanvasZooming()).toBe(true);
        });

        test('isEditorScrolling should return true only when in editor_scrolling state', () => {
            expect(stateMachine.isEditorScrolling()).toBe(false);
            
            stateMachine.transition('MOUSE_ENTER_EDITOR');
            stateMachine.transition('WHEEL');
            expect(stateMachine.isEditorScrolling()).toBe(true);
        });

        test('isTouchStarted should return true only when in touch_started state', () => {
            expect(stateMachine.isTouchStarted()).toBe(false);
            
            stateMachine.transition('TOUCH_START');
            expect(stateMachine.isTouchStarted()).toBe(true);
        });

        test('isTouchMoving should return true only when in touch_moving state', () => {
            expect(stateMachine.isTouchMoving()).toBe(false);
            
            stateMachine.transition('TOUCH_START');
            stateMachine.transition('TOUCH_MOVE');
            expect(stateMachine.isTouchMoving()).toBe(true);
        });
    });

    describe('State Indicator Updates', () => {
        test('should update gesture indicator on state change', () => {
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            expect(mockGestureIndicator.textContent).toBe('State: canvas_hover');
        });

        test('should update grabber state indicator on state change', () => {
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            expect(mockGrabberStateIndicator.textContent).toBe('State: CANVAS_HOVER');
        });

        test('should toggle active class for canvas_dragging state', () => {
            // Go to canvas_dragging state
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            stateMachine.transition('MOUSE_DOWN');
            
            expect(mockGrabberStateIndicator.classList.toggle).toHaveBeenCalledWith('active', true);
        });

        test('should not toggle active class for non-dragging states', () => {
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            
            // Should not have active class for canvas_hover
            expect(mockGrabberStateIndicator.classList.toggle).toHaveBeenCalledWith('active', false);
        });
    });

    describe('Utility Methods', () => {
        test('forceState should allow forcing to valid state', () => {
            const result = stateMachine.forceState('canvas_dragging');
            expect(result).toBe(true);
            expect(stateMachine.getCurrentState()).toBe('canvas_dragging');
        });

        test('forceState should reject forcing to invalid state', () => {
            const result = stateMachine.forceState('invalid_state');
            expect(result).toBe(false);
            expect(stateMachine.getCurrentState()).toBe('idle');
        });

        test('reset should reset to idle state', () => {
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            expect(stateMachine.getCurrentState()).toBe('canvas_hover');
            
            stateMachine.reset();
            expect(stateMachine.getCurrentState()).toBe('idle');
        });

        test('reset should update indicators after reset', () => {
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            stateMachine.reset();
            
            expect(mockGestureIndicator.textContent).toBe('State: idle');
            expect(mockGrabberStateIndicator.textContent).toBe('State: IDLE');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            document.getElementById = jest.fn(() => null);
            
            // Should not throw errors when elements don't exist
            expect(() => {
                stateMachine.transition('MOUSE_ENTER_CANVAS');
            }).not.toThrow();
        });

        test('should handle multiple rapid transitions', () => {
            // Rapidly transition through multiple states
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            stateMachine.transition('MOUSE_DOWN');
            stateMachine.transition('MOUSE_UP');
            stateMachine.transition('WHEEL');
            
            expect(stateMachine.getCurrentState()).toBe('canvas_zooming');
        });

        test('should maintain state consistency during invalid transitions', () => {
            const initialState = stateMachine.getCurrentState();
            
            // Try multiple invalid transitions
            stateMachine.transition('INVALID_EVENT_1');
            stateMachine.transition('INVALID_EVENT_2');
            stateMachine.transition('INVALID_EVENT_3');
            
            expect(stateMachine.getCurrentState()).toBe(initialState);
        });
    });

    describe('Integration Scenarios', () => {
        test('should handle complete mouse interaction flow', () => {
            // Simulate entering canvas, starting drag, moving, and releasing
            expect(stateMachine.getCurrentState()).toBe('idle');
            
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            expect(stateMachine.getCurrentState()).toBe('canvas_hover');
            
            stateMachine.transition('MOUSE_DOWN');
            expect(stateMachine.getCurrentState()).toBe('canvas_dragging');
            
            stateMachine.transition('MOUSE_MOVE');
            expect(stateMachine.getCurrentState()).toBe('canvas_dragging');
            
            stateMachine.transition('MOUSE_UP');
            expect(stateMachine.getCurrentState()).toBe('canvas_hover');
            
            stateMachine.transition('MOUSE_LEAVE');
            expect(stateMachine.getCurrentState()).toBe('idle');
        });

        test('should handle complete touch interaction flow', () => {
            // Simulate touch start, move, and end
            expect(stateMachine.getCurrentState()).toBe('idle');
            
            stateMachine.transition('TOUCH_START');
            expect(stateMachine.getCurrentState()).toBe('touch_started');
            
            stateMachine.transition('TOUCH_MOVE');
            expect(stateMachine.getCurrentState()).toBe('touch_moving');
            
            stateMachine.transition('TOUCH_MOVE');
            expect(stateMachine.getCurrentState()).toBe('touch_moving');
            
            stateMachine.transition('TOUCH_END');
            expect(stateMachine.getCurrentState()).toBe('idle');
        });

        test('should handle mixed mouse and touch interactions', () => {
            // Start with touch, then switch to mouse
            stateMachine.transition('TOUCH_START');
            expect(stateMachine.getCurrentState()).toBe('touch_started');
            
            stateMachine.transition('TOUCH_END');
            expect(stateMachine.getCurrentState()).toBe('idle');
            
            stateMachine.transition('MOUSE_ENTER_CANVAS');
            expect(stateMachine.getCurrentState()).toBe('canvas_hover');
            
            stateMachine.transition('TOUCH_START');
            expect(stateMachine.getCurrentState()).toBe('touch_started');
        });
    });
});
