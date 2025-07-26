import { GraphQLOperation, GraphQLResponse } from '../core/types';
export interface GraphQLClient {
    query<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>>;
    mutate<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>>;
    subscribe<T>(operation: GraphQLOperation): AsyncIterable<GraphQLResponse<T>>;
}
export declare class GraphQLClientImpl implements GraphQLClient {
    private endpoint;
    private headers;
    constructor(endpoint: string, headers?: Record<string, string>);
    query<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>>;
    mutate<T>(operation: GraphQLOperation): Promise<GraphQLResponse<T>>;
    subscribe<T>(operation: GraphQLOperation): AsyncIterable<GraphQLResponse<T>>;
}
