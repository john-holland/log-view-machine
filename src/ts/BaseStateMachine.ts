import { Machine, Message, State, Transition } from './state-machine-types';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

export class BaseStateMachine<TData extends any, TState extends State> implements Machine<TData, TState> {
    name: string;
    superMachine: string;
    subMachines: Machine<TData, TState>[];
    location: string;
    currentState: Transition<State>;
    processing: boolean;
    queue: PriorityQueue<Transition<State>>;
    currentModel: TData;
    log: Resolved<TData, TState>[];

    private csrfToken: string;
    private requestTokens: Map<string, string>;

    constructor(name: string, initialData: TData) {
        this.name = name;
        this.superMachine = '';
        this.subMachines = [];
        this.location = 'local';
        this.currentModel = initialData;
        this.processing = false;
        this.queue = new PriorityQueue<Transition<State>>();
        this.log = [];
        this.csrfToken = `csrf:${uuidv4()}`;
        this.requestTokens = new Map();
    }

    protected generateRequestToken(): string {
        const token = `request:${uuidv4()}`;
        this.requestTokens.set(token, new Date().toISOString());
        return token;
    }

    protected generateHash(data: any, salt: string): string {
        return createHash('sha256')
            .update(JSON.stringify(data) + salt)
            .digest('hex');
    }

    async sendMessage(address: string, data: TData): Promise<void> {
        const [machinePath, action] = address.split('/').filter(Boolean);
        const requestToken = this.generateRequestToken();
        
        const message: Message<TData, TState> = {
            from: this.currentState.from,
            to: this.currentState.to,
            send: new Date(),
            received: undefined,
            data,
            csrfToken: this.csrfToken,
            requestId: `request:${uuidv4()}`,
            requestToken,
            id: uuidv4(),
            salt: uuidv4(),
            hash: this.generateHash(data, this.csrfToken)
        };

        // Handle GraphQL sub-queries in the address
        if (machinePath.includes('~')) {
            const [basePath, subQuery] = machinePath.split('~');
            // Process sub-query if needed
            if (subQuery) {
                // Handle GraphQL sub-query resolution
                await this.resolveSubQuery(subQuery, data);
            }
        }

        // Queue the transition
        this.queue.enqueue({
            from: this.currentState.from,
            to: this.currentState.to,
            send: new Date(),
            received: undefined
        });

        // Process the queue if not already processing
        if (!this.processing) {
            await this.processQueue();
        }
    }

    private async resolveSubQuery(subQuery: string, data: TData): Promise<void> {
        // Implement GraphQL sub-query resolution logic
        // This would integrate with your GraphQL schema and resolvers
    }

    private async processQueue(): Promise<void> {
        this.processing = true;
        while (!this.queue.isEmpty()) {
            const transition = this.queue.dequeue();
            if (transition) {
                await this.executeTransition(transition);
            }
        }
        this.processing = false;
    }

    private async executeTransition(transition: Transition<State>): Promise<void> {
        // Implement transition execution logic
        // This would handle state changes and side effects
    }
} 