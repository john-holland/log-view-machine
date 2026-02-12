# payloadhash-cavemessage-adapter

Payload hash adapter for Cave messages. Hashes message payloads for integrity verification using SHA-256 HMAC.

## Features

- Hashes payloads before sending messages
- Verifies hash on responses to detect tampering
- Works at RobotCopy.sendMessage level
- Optional HTTP middleware support
- Factory function pattern for easy customization
- Works in both Node.js and browser environments

## Installation

```bash
npm install payloadhash-cavemessage-adapter
```

## Usage

### RobotCopy Wrapper

Wrap an existing RobotCopy instance to add payload hashing:

```typescript
import { createRobotCopy } from 'log-view-machine';
import { createPayloadHashRobotCopy } from 'payloadhash-cavemessage-adapter';

const robotCopy = createRobotCopy({ ... });
const secureRobotCopy = createPayloadHashRobotCopy(robotCopy, {
  secret: process.env.HASH_SECRET || 'your-secret-key',
  hashField: '_payloadHash', // optional, default
  headerName: 'X-Payload-Hash', // optional
  enabled: true, // optional, can be function
});
```

### HTTP Middleware

Use as middleware in server adapters:

```typescript
import { expressCaveAdapter } from 'express-cave-adapter';
import { createPayloadHashMiddleware } from 'payloadhash-cavemessage-adapter';

const adapter = expressCaveAdapter({ ... });
adapter.use(createPayloadHashMiddleware({
  secret: process.env.HASH_SECRET || 'your-secret-key',
}));
```

### Custom Hash Factory

Provide your own hash factory for custom algorithms:

```typescript
import { createPayloadHashRobotCopy, type HashFactory } from 'payloadhash-cavemessage-adapter';

const customFactory: HashFactory = {
  async hash(payload, secret) {
    // Your custom hashing logic
    return hashString(JSON.stringify(payload) + secret);
  },
  async verify(payload, hash, secret) {
    const computed = await this.hash(payload, secret);
    return computed === hash;
  },
};

const secureRobotCopy = createPayloadHashRobotCopy(robotCopy, {
  secret: 'your-secret',
  hashFactory: customFactory,
});
```

## Options

- `secret`: Secret key for hashing (string or function that returns string)
- `hashFactory`: Optional custom hash factory (defaults to SHA-256 HMAC)
- `hashField`: Field name in message body for hash (default: `'_payloadHash'`)
- `headerName`: Optional header name for hash
- `enabled`: Enable/disable adapter (boolean or function that checks action/data)

## Security

- Uses SHA-256 HMAC for secure hashing
- Constant-time comparison to prevent timing attacks
- Secrets should come from environment variables
- Factory functions allow patching vulnerabilities
