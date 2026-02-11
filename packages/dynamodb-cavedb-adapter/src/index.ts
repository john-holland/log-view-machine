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

function matchesSelector(doc: Record<string, unknown>, selector: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(selector)) {
    if (!(k in doc) || doc[k] !== v) return false;
  }
  return true;
}

/** In-memory implementation when DynamoDB SDK is not available. */
class DynamoDBCaveDBAdapterMemory implements CaveDBAdapter {
  readonly tomeId: string;
  private store = new Map<string, Record<string, unknown>>();

  constructor(tomeId: string) {
    this.tomeId = tomeId;
  }

  async put(key: string, value: Record<string, unknown> | unknown): Promise<void> {
    const doc =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : { value };
    this.store.set(key, { ...doc, _id: key, _tomeId: this.tomeId });
  }

  async get(key: string): Promise<Record<string, unknown> | null> {
    return this.store.get(key) ?? null;
  }

  async find(selector?: Record<string, unknown>): Promise<Array<Record<string, unknown>>> {
    const all = Array.from(this.store.values());
    if (!selector || Object.keys(selector).length === 0) return all;
    return all.filter((doc) => matchesSelector(doc, selector));
  }

  async findOne(selector?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const arr = await this.find(selector);
    return arr[0] ?? null;
  }

  async close(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Create a DynamoDB Cave DB adapter for the given Tome.
 * Uses @aws-sdk/client-dynamodb when available; otherwise in-memory.
 */
export async function createDynamoDBCaveDBAdapter(
  options: DynamoDBCaveDBAdapterOptions | string
): Promise<CaveDBAdapter> {
  const opts = typeof options === 'string' ? { tomeId: options } : options;
  const { tomeId } = opts;
  const tableName = opts.tableName ?? 'cavedb';

  const DynamoDB = await import('@aws-sdk/client-dynamodb').catch(() => null);
  if (!DynamoDB?.DynamoDBClient) {
    return new DynamoDBCaveDBAdapterMemory(tomeId);
  }

  const client = (opts.client as InstanceType<typeof DynamoDB.DynamoDBClient>) ?? new DynamoDB.DynamoDBClient({ region: opts.region ?? process.env.AWS_REGION });
  const { PutItemCommand, GetItemCommand, QueryCommand } = await import('@aws-sdk/client-dynamodb');

  return {
    get tomeId() {
      return tomeId;
    },
    async put(key: string, value: Record<string, unknown> | unknown): Promise<void> {
      const doc =
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : { value };
      const item = { ...doc, _id: key, _tomeId: tomeId };
      await client.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            tomeId: { S: tomeId },
            key: { S: key },
            value: { S: JSON.stringify(item) },
          },
        })
      );
    },
    async get(key: string): Promise<Record<string, unknown> | null> {
      const res = await client.send(
        new GetItemCommand({
          TableName: tableName,
          Key: { tomeId: { S: tomeId }, key: { S: key } },
        })
      );
      const raw = res.Item?.value?.S;
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, unknown>;
    },
    async find(selector?: Record<string, unknown>): Promise<Array<Record<string, unknown>>> {
      const res = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'tomeId = :tid',
          ExpressionAttributeValues: { ':tid': { S: tomeId } },
        })
      );
      const items = (res.Items ?? [])
        .map((i) => i.value?.S)
        .filter(Boolean)
        .map((s) => JSON.parse(s!) as Record<string, unknown>);
      if (!selector || Object.keys(selector).length === 0) return items;
      return items.filter((doc) => matchesSelector(doc, selector));
    },
    async findOne(selector?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
      const arr = await this.find(selector);
      return arr[0] ?? null;
    },
    async close(): Promise<void> {
      // client is not closed by default; caller can dispose if they created it
    },
  };
}
