/**
 * aws-lambda-cave-adapter: Cave server adapter for AWS Lambda.
 * Builds a route table from tomeConfigs and exposes a single Lambda handler that
 * maps API Gateway event -> NormalizedRequest -> route lookup -> TomeManager.sendTomeMessage -> NormalizedResponse -> API Gateway response.
 */
import { type CaveServerAdapter } from 'log-view-machine';
/** API Gateway HTTP event shape (v1 or v2); we support both. */
export interface LambdaHttpEvent {
    httpMethod?: string;
    path?: string;
    pathParameters?: Record<string, string> | null;
    queryStringParameters?: Record<string, string> | null;
    headers?: Record<string, string> | null;
    body?: string | null;
    requestContext?: {
        http?: {
            method?: string;
            path?: string;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
/** API Gateway response shape */
export interface LambdaHttpResponse {
    statusCode: number;
    headers?: Record<string, string>;
    body?: string;
    isBase64Encoded?: boolean;
}
export interface LambdaCaveAdapterOptions {
    /** Optional: add context.getCaveDBAdapter to context (for store routes in Lambda). */
    getCaveDBAdapter?: (tomeId: string) => import('log-view-machine').CaveDBAdapter | Promise<import('log-view-machine').CaveDBAdapter> | undefined;
}
/**
 * Create the Lambda Cave adapter. Implements CaveServerAdapter.
 * apply(context) builds a route table and a Lambda handler; use getLambdaHandler() to get the handler for Lambda entry.
 */
export declare function createLambdaCaveAdapter(_options?: LambdaCaveAdapterOptions): CaveServerAdapter & {
    getLambdaHandler(): (event: LambdaHttpEvent) => Promise<LambdaHttpResponse>;
};
