# proxygen-cave-adapter

Cave server adapter that uses [Proxygen](https://github.com/facebook/proxygen) (C++ HTTP) with a Node C++ addon (N-API). HTTP is handled in C++; route handlers run in JavaScript in the same process.

Same contract as `express-cave-adapter`: works with `createCaveServer({ plugins: [proxygenCaveAdapter({ port: 8080 })] })`.

## Requirements

- **Node.js** 18+ (LTS 20 recommended)
- **Build tools** (for the native addon):
  - **Linux**: `build-essential`, Python 3
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio 2017+ with "Desktop development with C++" and **Windows SDK** (node-gyp requirement)

## Install

From the repo root:

```bash
npm install
```

The native addon is built automatically when possible. If the build is skipped (e.g. missing Windows SDK), run in this package:

```bash
npm run rebuild
```

## Usage

```ts
import { createCaveServer } from 'log-view-machine';
import { proxygenCaveAdapter } from 'proxygen-cave-adapter';

const cave = /* your Cave instance */;
const tomeConfigs = [ /* your TomeConfig[] */ ];

await createCaveServer({
  cave,
  tomeConfigs,
  sections: { registry: true },
  plugins: [
    proxygenCaveAdapter({
      port: 8080,
      healthPath: '/health',
      registryPath: '/registry',
    }),
  ],
});
```

Optional health check and interval:

```ts
const adapter = proxygenCaveAdapter({ port: 8080 });
adapter.healthCheck?.('/health', 10_000); // GET /health, ping every 10s
// then pass adapter in plugins
```

## Proxygen (optional)

The addon builds and runs **without** Proxygen: it uses a stub HTTP layer. To use real Proxygen:

1. Build and install Proxygen (and dependencies: folly, wangle, etc.) e.g. via CMake and install to a prefix, or vcpkg / Homebrew.
2. Build the addon with Proxygen: set `proxygen_prefix` (or equivalent) in `binding.gyp` and define `USE_PROXYGEN`, then `npm run rebuild`.

Proxygen and its dependencies are large; building on Windows is best-effort. See [Proxygen](https://github.com/facebook/proxygen) and [node-gyp](https://github.com/nodejs/node-gyp) for platform notes.

## API

- **`proxygenCaveAdapter(options?)`** – Returns a `CaveServerAdapter` (same interface as Express adapter).
- **`getVersion()`** – Returns the native addon version string.

Options: `port`, `host`, `healthPath`, `registryPath`.

## License

MIT
