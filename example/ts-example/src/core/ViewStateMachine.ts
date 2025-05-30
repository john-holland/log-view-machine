import { BaseStateMachine, StateDefinition, StateHandler } from './StateMachine';
import { ViewModel, StateTransition, Log } from '../types/TastyFishBurger';
import * as mori from 'mori';

export interface ViewStateConfig {
    recognizedStates: string[];
    ignoredStates?: string[];
    renderDelay?: number; // Optional delay before rendering after state change
    superMachine?: BaseStateMachine;
    subMachines?: BaseStateMachine[];
    machineId: string; // Required for routing
}

export interface StateMachineMessage {
    type: string;
    payload?: any;
    metadata?: Record<string, any>;
    route?: string; // For routing messages
}

export class ViewStateMachine extends BaseStateMachine {
    private recognizedStates: Set<string>;
    private ignoredStates: Set<string>;
    private renderDelay: number;
    private lastRenderTime: number = 0;
    private pendingRender: boolean = false;
    private superMachine?: BaseStateMachine;
    private subMachines: Map<string, BaseStateMachine>;
    private machineId: string;
    private stateMap: Map<string, Set<string>>; // Maps state names to machine IDs

    constructor(config: ViewStateConfig) {
        super();
        this.recognizedStates = new Set(config.recognizedStates);
        this.ignoredStates = new Set(config.ignoredStates || []);
        this.renderDelay = config.renderDelay || 0;
        this.superMachine = config.superMachine;
        this.subMachines = new Map();
        this.machineId = config.machineId;
        this.stateMap = new Map();
        
        // Initialize state map
        config.recognizedStates.forEach(state => {
            this.stateMap.set(state, new Set([this.machineId]));
        });

        // Add sub machines
        config.subMachines?.forEach(machine => {
            this.addSubMachine(machine);
        });

        this.addLogEntry('INFO', 'ViewStateMachine initialized', { machineId: this.machineId });
    }

    private resolveRoute(route: string): BaseStateMachine | undefined {
        if (route.startsWith('...')) {
            // Go up three levels
            let current = this.superMachine;
            for (let i = 0; i < 3; i++) {
                current = current?.getSuperMachine();
            }
            return current;
        } else if (route.startsWith('../')) {
            // Go up one level
            return this.superMachine;
        } else if (route.startsWith('~')) {
            // Root machine
            let current = this;
            while (current.superMachine) {
                current = current.superMachine as ViewStateMachine;
            }
            return current;
        } else if (route.startsWith('*')) {
            // Broadcast to all sub machines
            return undefined; // Special case handled in sendMessage
        }
        return undefined;
    }

    private checkStateZFighting(state: string, machineId: string): void {
        const machines = this.stateMap.get(state);
        if (machines && machines.size > 0 && !machines.has(machineId)) {
            const machineList = Array.from(machines).join('|');
            throw new Error(
                `Illegal name z-fighting, please use relative state-machine routing to "${state}", ` +
                `for both should be, "${machineList}", or "${Array.from(machines)[0]}" if you only want one.`
            );
        }
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

    public sendMessage(message: StateMachineMessage): void {
        if (message.route) {
            const targetMachine = this.resolveRoute(message.route);
            if (message.route.startsWith('*')) {
                // Broadcast to all sub machines
                this.subMachines.forEach(machine => {
                    if (machine instanceof ViewStateMachine) {
                        machine.sendMessage({ ...message, route: undefined });
                    }
                });
            } else if (targetMachine) {
                targetMachine.sendMessage({ ...message, route: undefined });
            }
            return;
        }

        // Add log entry with message metadata
        this.addLogEntry('INFO', `Message received: ${message.type}`, {
            ...message.metadata,
            machineId: this.machineId
        });

        // Handle message based on type
        switch (message.type) {
            case 'TRANSITION':
                if (message.payload?.to) {
                    this.addTransition(this.getViewModel().currentState, message.payload.to);
                }
                break;
            case 'SYNC':
                if (this.superMachine) {
                    this.syncWithLogMachine(this.superMachine);
                }
                break;
            case 'BROADCAST':
                this.subMachines.forEach(machine => {
                    if (machine instanceof ViewStateMachine) {
                        machine.sendMessage(message);
                    }
                });
                break;
        }
    }

    public addSubMachine(machine: BaseStateMachine): void {
        if (machine instanceof ViewStateMachine) {
            this.subMachines.set(machine.machineId, machine);
            machine.setSuperMachine(this);
            
            // Update state map with sub machine states
            machine.getRecognizedStates().forEach(state => {
                const machines = this.stateMap.get(state) || new Set();
                machines.add(machine.machineId);
                this.stateMap.set(state, machines);
                this.checkStateZFighting(state, machine.machineId);
            });

            this.addLogEntry('INFO', 'Sub machine added', { 
                machineId: machine.machineId,
                parentId: this.machineId
            });
        }
    }

    public removeSubMachine(machine: BaseStateMachine): void {
        if (machine instanceof ViewStateMachine) {
            this.subMachines.delete(machine.machineId);
            
            // Remove states from state map
            machine.getRecognizedStates().forEach(state => {
                const machines = this.stateMap.get(state);
                if (machines) {
                    machines.delete(machine.machineId);
                    if (machines.size === 0) {
                        this.stateMap.delete(state);
                    }
                }
            });

            this.addLogEntry('INFO', 'Sub machine removed', { 
                machineId: machine.machineId,
                parentId: this.machineId
            });
        }
    }

    public setSuperMachine(machine: BaseStateMachine): void {
        this.superMachine = machine;
        this.addLogEntry('INFO', 'Super machine set', { 
            machineId: this.machineId,
            superId: machine instanceof ViewStateMachine ? machine.machineId : 'unknown'
        });
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
            
            // Sync with sub machines
            this.subMachines.forEach(machine => {
                if (machine instanceof ViewStateMachine) {
                    machine.syncWithLogMachine(this);
                }
            });
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

    public getSubMachines(): BaseStateMachine[] {
        return Array.from(this.subMachines.values());
    }

    public getSuperMachine(): BaseStateMachine | undefined {
        return this.superMachine;
    }

    public getMachineId(): string {
        return this.machineId;
    }
} 