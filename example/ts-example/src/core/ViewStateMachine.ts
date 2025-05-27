import { BaseStateMachine, StateDefinition, StateHandler } from './StateMachine';
import { ViewModel, StateTransition } from '../types/TastyFishBurger';
import * as mori from 'mori';

export interface ViewStateConfig {
    recognizedStates: string[];
    ignoredStates?: string[];
    renderDelay?: number; // Optional delay before rendering after state change
}

export class ViewStateMachine extends BaseStateMachine {
    private recognizedStates: Set<string>;
    private ignoredStates: Set<string>;
    private renderDelay: number;
    private lastRenderTime: number = 0;
    private pendingRender: boolean = false;

    constructor(config: ViewStateConfig) {
        super();
        this.recognizedStates = new Set(config.recognizedStates);
        this.ignoredStates = new Set(config.ignoredStates || []);
        this.renderDelay = config.renderDelay || 0;
        this.addLogEntry('INFO', 'ViewStateMachine initialized');
    }

    protected states(): [StateDefinition, StateHandler] {
        // Create a state definition that allows transitions between all recognized states
        const stateDefinition: StateDefinition = {};
        const stateHandler: StateHandler = {};

        // Add transitions between all recognized states
        this.recognizedStates.forEach(state => {
            stateDefinition[state] = {};
            this.recognizedStates.forEach(targetState => {
                if (state !== targetState) {
                    stateDefinition[state][targetState] = {};
                }
            });

            // Add handler that syncs with log machine
            stateHandler[state] = (model, transition) => {
                const viewModel = this.getViewModel();
                this.addTransition(viewModel.currentState, transition.to);
                return {
                    from: viewModel.currentState,
                    to: transition.to,
                    timestamp: new Date().toISOString()
                };
            };
        });

        return [stateDefinition, stateHandler];
    }

    public shouldRender(state: string): boolean {
        // Don't render if state is in ignored list
        if (this.ignoredStates.has(state)) {
            return false;
        }

        // Only render if state is recognized
        if (!this.recognizedStates.has(state)) {
            return false;
        }

        // Check if we need to respect render delay
        if (this.renderDelay > 0) {
            const now = Date.now();
            if (now - this.lastRenderTime < this.renderDelay) {
                this.pendingRender = true;
                return false;
            }
            this.lastRenderTime = now;
            this.pendingRender = false;
        }

        return true;
    }

    public syncWithLogMachine(logMachine: BaseStateMachine): void {
        const logViewModel = logMachine.getViewModel();
        const currentState = logViewModel.currentState;

        if (this.shouldRender(currentState)) {
            // Update our view model with the log machine's state
            this.viewModel = mori.update_in(this.viewModel, ['currentState'], () => currentState);
            this.viewModel = mori.update_in(this.viewModel, ['transitions'], () => 
                mori.vector(...logViewModel.transitions)
            );
            this.viewModel = mori.update_in(this.viewModel, ['logEntries'], () => 
                mori.vector(...logViewModel.logEntries)
            );
            
            this.addLogEntry('INFO', `View synced with log machine state: ${currentState}`);
        } else {
            this.addLogEntry('INFO', `View ignoring log machine state: ${currentState}`);
        }
    }

    public hasPendingRender(): boolean {
        return this.pendingRender;
    }

    public getRecognizedStates(): string[] {
        return Array.from(this.recognizedStates);
    }

    public getIgnoredStates(): string[] {
        return Array.from(this.ignoredStates);
    }
} 