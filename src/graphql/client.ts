import { GraphQLOperation, GraphQLResponse, GraphQLError } from '../core/types';

export interface GraphQLClient {
  query<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>>;
  mutate<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>>;
  subscribe<T>(operation: GraphQLOperation): AsyncIterable<GraphQLResponse<T>>;
}

export class GraphQLClientImpl implements GraphQLClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(endpoint: string, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  async query<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>> {
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

  async mutate<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>> {
    return this.query<T>(operation);
  }

  async *subscribe<T>(operation: GraphQLOperation): AsyncIterable<GraphQLResponse<T>> {
    // Simple implementation - in a real app you'd use WebSockets or Server-Sent Events
    const response = await this.query<T>(operation);
    yield response;
  }
} 