# pact-cavemod-adapter

PACT contract and test runner for mod APIs. Declares the Mod Index API contract (consumer: ModApiConsumer, provider: ModIndexProvider), and writes `pact-results.json` after running consumer Pact tests so build/CI can record status as "good" or "fail" in the mod index.

## Contract

- **Consumer:** `ModApiConsumer` (e.g. node-mod-editor mod-api-client)
- **Provider:** `ModIndexProvider` (e.g. kotlin-mod-index)
- **Endpoints:** GET /api/mods, GET /api/mods/:modId

## Mod index contract extension

A mod entry in the index may include:

- **pactStatus** (optional): `"good"` | `"fail"` | `"unknown"` — set when PACT consumer tests are run and verified in build/CI.
- **pactVerifiedAt** (optional): ISO timestamp of last PACT verification.

The mod index (e.g. kotlin-mod-index) may read `pact-results.json` or receive status via API and include these fields in GET /api/mods and GET /api/mods/:id responses.

## Writing results

After running consumer Pact tests (e.g. `npm run test:pact` in node-mod-editor):

```bash
npx pact-cavemod-write-results pass
# or
npx pact-cavemod-write-results fail
```

Or programmatically:

```js
import { writePactResults } from 'pact-cavemod-adapter';
writePactResults({ status: 'pass', outputPath: 'pact-results.json' });
```

Output format: `{ "consumer": "ModApiConsumer", "provider": "ModIndexProvider", "status": "pass"|"fail", "timestamp": "..." }`.

## Build and CI

- **Mod build:** Run `test:pact` then `pact-cavemod-write-results <pass|fail>` so `pact-results.json` is produced.
- **CI:** Run mod build (including pact step); optionally run provider verification and publish pact status to the mod index.
