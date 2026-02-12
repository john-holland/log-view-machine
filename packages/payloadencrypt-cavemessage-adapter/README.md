# payloadencrypt-cavemessage-adapter

Payload encryption adapter for Cave messages. Encrypts message payloads for confidentiality using AES-256-GCM authenticated encryption.

## Features

- Encrypts payloads before sending messages
- Decrypts payloads on responses
- Uses AES-256-GCM (authenticated encryption) by default
- Works at RobotCopy.sendMessage level
- Optional HTTP middleware support
- Factory function pattern for easy customization
- Works in both Node.js and browser environments

## Installation

```bash
npm install payloadencrypt-cavemessage-adapter
```

## Usage

### RobotCopy Wrapper

Wrap an existing RobotCopy instance to add payload encryption:

```typescript
import { createRobotCopy } from 'log-view-machine';
import { createPayloadEncryptRobotCopy } from 'payloadencrypt-cavemessage-adapter';

const robotCopy = createRobotCopy({ ... });
const secureRobotCopy = createPayloadEncryptRobotCopy(robotCopy, {
  secret: process.env.ENCRYPT_SECRET || 'your-secret-key',
  encryptedField: '_encryptedPayload', // optional, default
  headerName: 'X-Encrypted-Payload', // optional
  enabled: true, // optional, can be function
});
```

### HTTP Middleware

Use as middleware in server adapters:

```typescript
import { expressCaveAdapter } from 'express-cave-adapter';
import { createPayloadEncryptMiddleware } from 'payloadencrypt-cavemessage-adapter';

const adapter = expressCaveAdapter({ ... });
adapter.use(createPayloadEncryptMiddleware({
  secret: process.env.ENCRYPT_SECRET || 'your-secret-key',
}));
```

### Custom Encryption Factory

Provide your own encryption factory for custom algorithms:

```typescript
import { createPayloadEncryptRobotCopy, type EncryptFactory } from 'payloadencrypt-cavemessage-adapter';

const customFactory: EncryptFactory = {
  async encrypt(payload, secret) {
    // Your custom encryption logic
    return {
      data: encryptData(JSON.stringify(payload), secret),
      iv: generateIV(),
      algorithm: 'custom-algo',
    };
  },
  async decrypt(encrypted, secret) {
    // Your custom decryption logic
    const decrypted = decryptData(encrypted.data, secret, encrypted.iv);
    return JSON.parse(decrypted);
  },
};

const secureRobotCopy = createPayloadEncryptRobotCopy(robotCopy, {
  secret: 'your-secret',
  encryptFactory: customFactory,
});
```

## Options

- `secret`: Secret key for encryption (string or function that returns string)
- `encryptFactory`: Optional custom encryption factory (defaults to AES-256-GCM)
- `encryptedField`: Field name in message body for encrypted payload (default: `'_encryptedPayload'`)
- `headerName`: Optional header name for encrypted payload metadata
- `enabled`: Enable/disable adapter (boolean or function that checks action/data)

## Encryption Format

The encrypted payload structure:

```typescript
{
  data: string;      // Base64 encoded ciphertext
  iv: string;        // Base64 encoded initialization vector
  tag?: string;       // Base64 encoded authentication tag (GCM)
  algorithm?: string; // Algorithm identifier (e.g., 'aes-256-gcm')
}
```

## Security

- Uses AES-256-GCM for authenticated encryption
- Generates random IV for each encryption
- Includes authentication tag to prevent tampering
- Secrets should come from environment variables
- Factory functions allow patching vulnerabilities
- Default implementation uses PBKDF2 for key derivation in browser

## Notes

- The default factory uses SHA-256 key derivation in Node.js and PBKDF2 in browsers
- For production, consider using a key derivation function with higher iteration count
- The encrypted payload replaces the original payload in the message body
- Both client and server must use the same secret and factory for successful encryption/decryption
