/**
 * Payload encrypt message adapter for Cave messages.
 * Wraps RobotCopy to encrypt payloads before sending and decrypt payloads on responses.
 * Can also be used as HTTP middleware.
 */

import type { RobotCopy } from 'log-view-machine';
import type { NormalizedMiddleware, NormalizedRequest, NormalizedResponse } from 'log-view-machine';
import type { EncryptFactory, PayloadEncryptAdapterOptions } from './types';
import { createDefaultEncryptFactory } from './encryptFactories';

// Re-export types for convenience
export type { EncryptFactory, PayloadEncryptAdapterOptions, EncryptedPayload } from './types';
export { createDefaultEncryptFactory } from './encryptFactories';

/**
 * Resolve secret from options (string or function).
 */
async function resolveSecret(secret: string | (() => string | Promise<string>)): Promise<string> {
  if (typeof secret === 'string') return secret;
  return await Promise.resolve(secret());
}

/**
 * Check if adapter is enabled for this message.
 */
function isEnabled(
  enabled: boolean | ((action: string, data: unknown) => boolean) | undefined,
  action: string,
  data: unknown
): boolean {
  if (enabled === undefined) return true;
  if (typeof enabled === 'boolean') return enabled;
  return enabled(action, data);
}

/**
 * Create a RobotCopy wrapper that encrypts payloads before sending and decrypts payloads on responses.
 */
export function createPayloadEncryptRobotCopy(
  robotCopy: RobotCopy,
  options: PayloadEncryptAdapterOptions
): RobotCopy {
  const encryptFactory: EncryptFactory = options.encryptFactory ?? createDefaultEncryptFactory();
  const encryptedField = options.encryptedField ?? '_encryptedPayload';
  const headerName = options.headerName;

  // Create wrapper using Proxy to intercept sendMessage and delegate everything else
  return new Proxy(robotCopy, {
    get(target, prop) {
      if (prop === 'sendMessage') {
        return async (action: string, data: any = {}): Promise<any> => {
          // Check if enabled
          if (!isEnabled(options.enabled, action, data)) {
            return target.sendMessage(action, data);
          }

          // Resolve secret
          const secret = await resolveSecret(options.secret);
          if (!secret) {
            throw new Error('PayloadEncrypt: secret is required');
          }

          // Encrypt the payload
          const encrypted = await Promise.resolve(encryptFactory.encrypt(data, secret));

          // Prepare transformed data - replace payload with encrypted version
          const transformedData: Record<string, unknown> = {
            [encryptedField]: encrypted,
          };

          // Call wrapped sendMessage
          const response = await target.sendMessage(action, transformedData);

          // Decrypt response if it contains encrypted payload
          if (response && typeof response === 'object' && encryptedField in response) {
            const encryptedResponse = response[encryptedField] as any;
            try {
              const decrypted = await Promise.resolve(encryptFactory.decrypt(encryptedResponse, secret));
              // Return decrypted response
              return decrypted;
            } catch (error) {
              throw new Error(`PayloadEncrypt: decryption failed - ${String(error)}`);
            }
          }

          return response;
        };
      }
      // Delegate all other properties/methods to original RobotCopy
      const value = (target as any)[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
  }) as RobotCopy;
}

/**
 * Create HTTP middleware that encrypts request payloads and decrypts response payloads.
 */
export function createPayloadEncryptMiddleware(options: PayloadEncryptAdapterOptions): NormalizedMiddleware {
  const encryptFactory: EncryptFactory = options.encryptFactory ?? createDefaultEncryptFactory();
  const encryptedField = options.encryptedField ?? '_encryptedPayload';
  const headerName = options.headerName;

  return async (req: NormalizedRequest, next: () => Promise<NormalizedResponse>): Promise<NormalizedResponse> => {
    // Only process POST/PUT/PATCH requests with body
    if (!['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) || !req.body) {
      return next();
    }

    // Check if enabled
    const action = req.path.split('/').pop() || '';
    if (!isEnabled(options.enabled, action, req.body)) {
      return next();
    }

    // Resolve secret
    const secret = await resolveSecret(options.secret);
    if (!secret) {
      return { status: 500, body: { error: 'PayloadEncrypt: secret is required' } };
    }

    // Encrypt request body
    const encrypted = await Promise.resolve(encryptFactory.encrypt(req.body, secret));

    // Replace body with encrypted payload
    const transformedBody: Record<string, unknown> = {
      [encryptedField]: encrypted,
    };

    // Modify request in place (adapter should preserve modifications)
    (req as any).body = transformedBody;
    if (headerName) {
      req.headers[headerName] = JSON.stringify(encrypted);
    }

    // Call next middleware/handler
    const response = await next();

    // Decrypt response if it contains encrypted payload
    if (response.body && typeof response.body === 'object' && encryptedField in response.body) {
      const encryptedResponse = (response.body as Record<string, unknown>)[encryptedField] as any;
      try {
        const decrypted = await Promise.resolve(encryptFactory.decrypt(encryptedResponse, secret));
        return {
          ...response,
          body: decrypted,
        };
      } catch (error) {
        return { status: 500, body: { error: 'PayloadEncrypt: decryption failed', details: String(error) } };
      }
    }

    return response;
  };
}
