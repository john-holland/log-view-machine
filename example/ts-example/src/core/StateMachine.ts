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

export interface StateMachineConfig<TConfig = any, TViewModel = any> {
    defaultConfig: TConfig;
    defaultViewModel: TViewModel;
    states: StateDefinition;
}

export interface StateMachineContext<TConfig = any, TViewModel = any> {
    machine: {
        config: TConfig;
    };
    viewModel: TViewModel & {
        setStable: (stable: boolean) => void;
    };
    transition: (to: string) => void;
    sendMessage: (type: string, payload?: any) => void;
}

export type StateHandlerFn<TConfig = any, TViewModel = any> = (context: StateMachineContext<TConfig, TViewModel>) => void;

export interface GraphQLOperation {
    query: string;
    variables?: Record<string, any>;
    operationName?: string;
}

export interface GraphQLStateContext<TConfig, TViewModel> extends StateContext<TConfig, TViewModel> {
    graphql: {
        query: (operation: GraphQLOperation) => Promise<any>;
        mutate: (operation: GraphQLOperation) => Promise<any>;
        subscribe: (operation: GraphQLOperation, callback: (data: any) => void) => () => void;
    };
}

export interface GraphQLStateHandler<TConfig, TViewModel> {
    (context: GraphQLStateContext<TConfig, TViewModel>): void | Promise<void>;
}

export interface StateContext<TConfig, TViewModel> {
    machine: {
        config: TConfig;
    };
    viewModel: TViewModel;
    transition: (state: string) => void;
    sendMessage: (type: string, payload: any) => void;
}

export class StateMachine<TConfig = any, TViewModel = any> {
    private config: TConfig;
    private viewModel: TViewModel & {
        currentState: string;
        transitions: StateTransition[];
        logEntries: LogEntry[];
        isStable: boolean;
        setStable: (stable: boolean) => void;
    };
    private stateHandlers: Map<string, StateHandlerFn<TConfig, TViewModel>>;
    private methods: Map<string, StateHandlerFn<TConfig, TViewModel>>;
    protected stateDefinitions: StateDefinition;

    constructor(config: StateMachineConfig<TConfig, TViewModel>) {
        this.config = config.defaultConfig;
        this.viewModel = {
            ...config.defaultViewModel,
            currentState: 'INITIAL',
            transitions: [],
            logEntries: [],
            isStable: true,
            setStable: (stable: boolean) => {
                this.viewModel.isStable = stable;
            }
        };
        this.stateHandlers = new Map();
        this.methods = new Map();
        this.stateDefinitions = config.states;
    }

    public withState(state: string, handler: StateHandlerFn<TConfig, TViewModel>): StateMachine<TConfig, TViewModel> {
        this.stateHandlers.set(state, handler);
        return this;
    }

    public withMethod(name: string, handler: StateHandlerFn<TConfig, TViewModel>): StateMachine<TConfig, TViewModel> {
        this.methods.set(name, handler);
        return this;
    }

    private addTransition(from: string, to: string) {
        const transition: StateTransition = {
            from,
            to,
            timestamp: new Date().toISOString()
        };
        this.viewModel.transitions.push(transition);
        this.viewModel.currentState = to;
    }

    private addLogEntry(level: 'INFO' | 'WARNING' | 'ERROR', message: string, metadata: Record<string, unknown> = {}, viewModel?: Record<string, unknown>) {
        const entry: LogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata,
            viewModel: viewModel || {}
        };
        this.viewModel.logEntries.push(entry);
    }

    public sendMessage(type: string, payload?: any) {
        if (type === 'LOG') {
            const { level, message, metadata, viewModel } = payload;
            this.addLogEntry(level, message, metadata, viewModel);
        }
    }

    public transition(to: string) {
        const from = this.viewModel.currentState;
        this.addTransition(from, to);
        
        const handler = this.stateHandlers.get(to);
        if (handler) {
            handler({
                machine: { config: this.config },
                viewModel: this.viewModel,
                transition: this.transition.bind(this),
                sendMessage: this.sendMessage.bind(this)
            });
        }
    }

    public getViewModel(): ViewModel {
        return {
            currentState: this.viewModel.currentState,
            transitions: this.viewModel.transitions,
            logEntries: this.viewModel.logEntries,
            isStable: this.viewModel.isStable
        };
    }

    public withGraphQLState(
        state: string,
        operation: 'query' | 'mutation' | 'subscription',
        handler: GraphQLStateHandler<TConfig, TViewModel>
    ): StateMachine<TConfig, TViewModel> {
        const stateHandler = async (context: StateContext<TConfig, TViewModel>) => {
            const graphqlContext: GraphQLStateContext<TConfig, TViewModel> = {
                ...context,
                graphql: {
                    query: async (operation: GraphQLOperation) => {
                        // Implement GraphQL client query
                        return Promise.resolve({});
                    },
                    mutate: async (operation: GraphQLOperation) => {
                        // Implement GraphQL client mutation
                        return Promise.resolve({});
                    },
                    subscribe: (operation: GraphQLOperation, callback: (data: any) => void) => {
                        // Implement GraphQL client subscription
                        return () => {};
                    }
                }
            };

            await handler(graphqlContext);
        };

        return this.withState(state, stateHandler);
    }
}

export function createStateMachine<TConfig = any, TViewModel = any>(config: StateMachineConfig<TConfig, TViewModel>): StateMachine<TConfig, TViewModel> {
    return new StateMachine(config);
} 