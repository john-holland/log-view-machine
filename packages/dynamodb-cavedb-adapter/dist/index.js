/**
 * dynamodb-cavedb-adapter: DynamoDB-backed persistence for Cave/Tome.
 * Implements CaveDBAdapter from log-view-machine. Table: partition key tomeId, sort key key, attribute value (JSON).
 * When @aws-sdk/client-dynamodb is not available, falls back to in-memory.
 */
function matchesSelector(doc, selector) {
    for (const [k, v] of Object.entries(selector)) {
        if (!(k in doc) || doc[k] !== v)
            return false;
    }
    return true;
}
/** In-memory implementation when DynamoDB SDK is not available. */
class DynamoDBCaveDBAdapterMemory {
    constructor(tomeId) {
        this.store = new Map();
        this.tomeId = tomeId;
    }
    async put(key, value) {
        const doc = typeof value === 'object' && value !== null && !Array.isArray(value)
            ? value
            : { value };
        this.store.set(key, { ...doc, _id: key, _tomeId: this.tomeId });
    }
    async get(key) {
        return this.store.get(key) ?? null;
    }
    async find(selector) {
        const all = Array.from(this.store.values());
        if (!selector || Object.keys(selector).length === 0)
            return all;
        return all.filter((doc) => matchesSelector(doc, selector));
    }
    async findOne(selector) {
        const arr = await this.find(selector);
        return arr[0] ?? null;
    }
    async close() {
        this.store.clear();
    }
}
/**
 * Create a DynamoDB Cave DB adapter for the given Tome.
 * Uses @aws-sdk/client-dynamodb when available; otherwise in-memory.
 */
export async function createDynamoDBCaveDBAdapter(options) {
    const opts = typeof options === 'string' ? { tomeId: options } : options;
    const { tomeId } = opts;
    const tableName = opts.tableName ?? 'cavedb';
    const DynamoDB = await import('@aws-sdk/client-dynamodb').catch(() => null);
    if (!DynamoDB?.DynamoDBClient) {
        return new DynamoDBCaveDBAdapterMemory(tomeId);
    }
    const client = opts.client ?? new DynamoDB.DynamoDBClient({ region: opts.region ?? process.env.AWS_REGION });
    const { PutItemCommand, GetItemCommand, QueryCommand } = await import('@aws-sdk/client-dynamodb');
    return {
        get tomeId() {
            return tomeId;
        },
        async put(key, value) {
            const doc = typeof value === 'object' && value !== null && !Array.isArray(value)
                ? value
                : { value };
            const item = { ...doc, _id: key, _tomeId: tomeId };
            await client.send(new PutItemCommand({
                TableName: tableName,
                Item: {
                    tomeId: { S: tomeId },
                    key: { S: key },
                    value: { S: JSON.stringify(item) },
                },
            }));
        },
        async get(key) {
            const res = await client.send(new GetItemCommand({
                TableName: tableName,
                Key: { tomeId: { S: tomeId }, key: { S: key } },
            }));
            const raw = res.Item?.value?.S;
            if (!raw)
                return null;
            return JSON.parse(raw);
        },
        async find(selector) {
            const res = await client.send(new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: 'tomeId = :tid',
                ExpressionAttributeValues: { ':tid': { S: tomeId } },
            }));
            const items = (res.Items ?? [])
                .map((i) => i.value?.S)
                .filter(Boolean)
                .map((s) => JSON.parse(s));
            if (!selector || Object.keys(selector).length === 0)
                return items;
            return items.filter((doc) => matchesSelector(doc, selector));
        },
        async findOne(selector) {
            const arr = await this.find(selector);
            return arr[0] ?? null;
        },
        async close() {
            // client is not closed by default; caller can dispose if they created it
        },
    };
}
