/**
 * Zoom State Machine
 * Handles zoom, pan, and gesture detection states
 */

export class ZoomStateMachine {
    constructor() {
        this.currentState = 'idle';
        this.states = {
            idle: {
                on: {
                    MOUSE_ENTER_CANVAS: 'canvas_hover',
                    MOUSE_ENTER_EDITOR: 'editor_hover',
                    TOUCH_START: 'touch_started'
                }
            },
            canvas_hover: {
                on: {
                    MOUSE_DOWN: 'canvas_dragging',
                    WHEEL: 'canvas_zooming',
                    MOUSE_LEAVE: 'idle',
                    TOUCH_START: 'touch_started'
                }
            },
            editor_hover: {
                on: {
                    WHEEL: 'editor_scrolling',
                    MOUSE_LEAVE: 'idle',
                    TOUCH_START: 'touch_started'
                }
            },
            canvas_dragging: {
                on: {
                    MOUSE_MOVE: 'canvas_dragging',
                    MOUSE_UP: 'canvas_hover',
                    MOUSE_LEAVE: 'canvas_dragging' // Stay in dragging state even if mouse leaves
                }
            },
            canvas_zooming: {
                on: {
                    WHEEL: 'canvas_zooming',
                    MOUSE_LEAVE: 'idle'
                }
            },
            editor_scrolling: {
                on: {
                    WHEEL: 'editor_scrolling',
                    MOUSE_LEAVE: 'idle'
                }
            },
            touch_started: {
                on: {
                    TOUCH_MOVE: 'touch_moving',
                    TOUCH_END: 'idle'
                }
            },
            touch_moving: {
                on: {
                    TOUCH_MOVE: 'touch_moving',
                    TOUCH_END: 'idle'
                }
            }
        };
    }

    transition(event) {
        const currentState = this.states[this.currentState];
        if (currentState && currentState.on && currentState.on[event]) {
            const previousState = this.currentState;
            this.currentState = currentState.on[event];
            console.log(`Zoom State Machine: ${previousState} -> ${this.currentState} (${event})`);
            this.updateStateIndicator();
            return true;
        }
        return false;
    }

    getCurrentState() {
        return this.currentState;
    }

    updateStateIndicator() {
        const indicator = document.getElementById('gesture-indicator');
        if (indicator) {
            indicator.textContent = `State: ${this.currentState}`;
        }
        
        // Update canvas grabber state indicator
        const grabberStateIndicator = document.getElementById('canvas-grabber-state');
        if (grabberStateIndicator) {
            grabberStateIndicator.textContent = `State: ${this.currentState.toUpperCase()}`;
            grabberStateIndicator.classList.toggle('active', this.currentState === 'canvas_dragging');
        }
    }

    // State query methods
    isIdle() {
        return this.currentState === 'idle';
    }

    isCanvasHover() {
        return this.currentState === 'canvas_hover';
    }

    isEditorHover() {
        return this.currentState === 'editor_hover';
    }

    isCanvasDragging() {
        return this.currentState === 'canvas_dragging';
    }

    isCanvasZooming() {
        return this.currentState === 'canvas_zooming';
    }

    isEditorScrolling() {
        return this.currentState === 'editor_scrolling';
    }

    isTouchStarted() {
        return this.currentState === 'touch_started';
    }

    isTouchMoving() {
        return this.currentState === 'touch_moving';
    }

    // Force state change (for testing or manual control)
    forceState(newState) {
        if (this.states[newState]) {
            const previousState = this.currentState;
            this.currentState = newState;
            console.log(`Zoom State Machine: ${previousState} -> ${this.currentState} (FORCED)`);
            this.updateStateIndicator();
            return true;
        }
        return false;
    }

    // Reset to idle state
    reset() {
        this.currentState = 'idle';
        this.updateStateIndicator();
    }
}

// Create and export a singleton instance
export const zoomStateMachine = new ZoomStateMachine();
