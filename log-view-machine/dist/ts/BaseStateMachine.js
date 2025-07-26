import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
export class BaseStateMachine {
    constructor(name, initialData) {
        this.name = name;
        this.superMachine = '';
        this.subMachines = [];
        this.location = 'local';
        this.currentModel = initialData;
        this.processing = false;
        this.queue = new PriorityQueue();
        this.log = [];
        this.csrfToken = `csrf:${uuidv4()}`;
        this.requestTokens = new Map();
    }
    generateRequestToken() {
        const token = `request:${uuidv4()}`;
        this.requestTokens.set(token, new Date().toISOString());
        return token;
    }
    generateHash(data, salt) {
        return createHash('sha256')
            .update(JSON.stringify(data) + salt)
            .digest('hex');
    }
    async sendMessage(address, data) {
        const [machinePath, action] = address.split('/').filter(Boolean);
        const requestToken = this.generateRequestToken();
        const message = {
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
    async resolveSubQuery(subQuery, data) {
        // Implement GraphQL sub-query resolution logic
        // This would integrate with your GraphQL schema and resolvers
    }
    async processQueue() {
        this.processing = true;
        while (!this.queue.isEmpty()) {
            const transition = this.queue.dequeue();
            if (transition) {
                await this.executeTransition(transition);
            }
        }
        this.processing = false;
    }
    async executeTransition(transition) {
        // Implement transition execution logic
        // This would handle state changes and side effects
    }
}
