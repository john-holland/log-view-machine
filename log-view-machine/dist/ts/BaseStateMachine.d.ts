import { Machine, State, Transition } from './state-machine-types';
export declare class BaseStateMachine<TData extends any, TState extends State> implements Machine<TData, TState> {
    name: string;
    superMachine: string;
    subMachines: Machine<TData, TState>[];
    location: string;
    currentState: Transition<State>;
    processing: boolean;
    queue: PriorityQueue<Transition<State>>;
    currentModel: TData;
    log: Resolved<TData, TState>[];
    private csrfToken;
    private requestTokens;
    constructor(name: string, initialData: TData);
    protected generateRequestToken(): string;
    protected generateHash(data: any, salt: string): string;
    sendMessage(address: string, data: TData): Promise<void>;
    private resolveSubQuery;
    private processQueue;
    private executeTransition;
}
