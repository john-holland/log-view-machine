import { ViewModel, StateTransition, LogEntry } from '../types/TastyFishBurger';
import * as mori from 'mori';

export interface StateDefinition {
    [key: string]: {
        [key: string]: {
            [key: string]: {}
        }
    }
}

export interface StateHandler {
    [key: string]: (model: any, transition: any) => StateTransition;
}

export abstract class BaseStateMachine {
    protected viewModel: ViewModel = {
        currentState: 'INITIAL',
        transitions: [],
        logEntries: [],
        isStable: true
    };

    protected abstract states(): [StateDefinition, StateHandler];

    constructor() {
        const [definitions, handlers] = this.states();
        this.viewModel = mori.hash_map(
            'currentState', 'INITIAL',
            'transitions', mori.vector(),
            'logEntries', mori.vector(),
            'isStable', true,
            'definitions', definitions,
            'handlers', handlers
        );
    }

    protected addTransition(from: string, to: string) {
        const transition: StateTransition = {
            from,
            to,
            timestamp: new Date().toISOString()
        };
        this.viewModel = mori.update_in(this.viewModel, ['transitions'], (transitions: any) => 
            mori.conj(transitions, transition)
        );
    }

    public addLogEntry(level: 'INFO' | 'WARNING' | 'ERROR', message: string, metadata?: any) {
        const entry: LogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata
        };
        this.viewModel = mori.update_in(this.viewModel, ['logEntries'], (entries: any) => 
            mori.conj(entries, entry)
        );
    }

    protected setStable(stable: boolean) {
        this.viewModel = mori.assoc(this.viewModel, 'isStable', stable);
    }

    public getViewModel(): ViewModel {
        return {
            currentState: mori.get(this.viewModel, 'currentState') as string,
            transitions: mori.toJs(mori.get(this.viewModel, 'transitions')) as StateTransition[],
            logEntries: mori.toJs(mori.get(this.viewModel, 'logEntries')) as LogEntry[],
            isStable: mori.get(this.viewModel, 'isStable') as boolean,
            definitions: mori.get(this.viewModel, 'definitions') as StateDefinition,
            handlers: mori.get(this.viewModel, 'handlers') as StateHandler
        };
    }
}

export abstract class ViewStateMachine extends BaseStateMachine {
    protected logMachine: BaseStateMachine;

    constructor(logMachine: BaseStateMachine) {
        super();
        this.logMachine = logMachine;
    }

    protected sendToLog(level: 'INFO' | 'WARNING' | 'ERROR', message: string, metadata: Record<string, unknown> = {}): void {
        this.logMachine.addLogEntry(level, message, metadata);
    }

    protected transitionWithLog(from: string, to: string, logMessage: string): void {
        this.addTransition(from, to);
        this.sendToLog('INFO', logMessage);
    }
} 