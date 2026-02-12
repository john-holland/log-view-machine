# Cave adapter examples

One small runnable example per adapter from the [Cave adapters plan](../../.cursor/plans/cave_adapters_aws_gcp_cavedb_c5627cdc.plan.md).

- **Server adapters**: minimal app using the adapter, `createCaveServer`, then listen on `PORT` (or export Lambda handler).
- **Cavedb adapters**: minimal app with a Tome that uses `persistence.adapter` (e.g. `redis`) and the store API (`/api/editor/store/:tomeId/:key`), using `buildPersistenceRegistry`.

## Layout

| Folder | Adapter | Run |
|--------|---------|-----|
| aws-node | aws-node-cave-adapter | `node index.js` → http://localhost:8080 |
| redis-cavedb | redis-cavedb-adapter (persistence override) | `node index.js` → store API backed by Redis |
| lambda | aws-lambda-cave-adapter | Export handler for Lambda; or use Lambda emulator |
| dynamodb-cavedb | dynamodb-cavedb-adapter | Tome with persistence.adapter: 'dynamodb' |
| memcache-cavedb | memcache-cavedb-adapter | Tome with persistence.adapter: 'memcache' |
| app-engine | app-engine-cave-adapter | `app.listen(process.env.PORT)` for GAE |
| cloud-run | cloud-run-cave-adapter | Same for Cloud Run |
| compute-engine | compute-engine-cave-adapter | Same for GCE; optional getGceMetadata() |

Each example depends on `log-view-machine`, the corresponding adapter package(s), and (for server examples) `express`.
