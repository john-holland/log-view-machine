export class GraphQLClientImpl {
    constructor(endpoint, headers = {}) {
        this.endpoint = endpoint;
        this.headers = {
            'Content-Type': 'application/json',
            ...headers
        };
    }
    async query(operation) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                query: operation.query,
                variables: operation.variables,
                operationName: operation.operationName
            })
        });
        const result = await response.json();
        return result;
    }
    async mutate(operation) {
        return this.query(operation);
    }
    async *subscribe(operation) {
        // Simple implementation - in a real app you'd use WebSockets or Server-Sent Events
        const response = await this.query(operation);
        yield response;
    }
}
