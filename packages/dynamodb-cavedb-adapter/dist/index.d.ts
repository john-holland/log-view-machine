/**
 * dynamodb-cavedb-adapter: DynamoDB-backed persistence for Cave/Tome.
 * Implements CaveDBAdapter from log-view-machine. Table: partition key tomeId, sort key key, attribute value (JSON).
 * When @aws-sdk/client-dynamodb is not available, falls back to in-memory.
 */
import type { CaveDBAdapter } from 'log-view-machine';
export type { CaveDBAdapter } from 'log-view-machine';
export interface DynamoDBCaveDBAdapterOptions {
    tomeId: string;
    tableName?: string;
    region?: string;
    client?: unknown;
}
/**
 * Create a DynamoDB Cave DB adapter for the given Tome.
 * Uses @aws-sdk/client-dynamodb when available; otherwise in-memory.
 */
export declare function createDynamoDBCaveDBAdapter(options: DynamoDBCaveDBAdapterOptions | string): Promise<CaveDBAdapter>;
