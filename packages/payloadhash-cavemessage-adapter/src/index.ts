/**
 * Payload hash message adapter for Cave messages.
 * Wraps RobotCopy to hash payloads before sending and verify hashes on responses.
 * Can also be used as HTTP middleware.
 */

import type { RobotCopy } from 'log-view-machine';
import type { NormalizedMiddleware, NormalizedRequest, NormalizedResponse } from 'log-view-machine';
import type { HashFactory, PayloadHashAdapterOptions } from './types';
import { createDefaultHashFactory } from './hashFactories';

// Re-export types for convenience
export type { HashFactory, PayloadHashAdapterOptions } from './types';
export { createDefaultHashFactory } from './hashFactories';

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
 * Create a RobotCopy wrapper that hashes payloads before sending and verifies hashes on responses.
 */
export function createPayloadHashRobotCopy(
  robotCopy: RobotCopy,
  options: PayloadHashAdapterOptions
): RobotCopy {
  const hashFactory: HashFactory = options.hashFactory ?? createDefaultHashFactory();
  const hashField = options.hashField ?? '_payloadHash';
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
            throw new Error('PayloadHash: secret is required');
          }

          // Hash the payload
          const payloadHash = await Promise.resolve(hashFactory.hash(data, secret));

          // Prepare transformed data
          const transformedData: Record<string, unknown> = {
            ...data,
            [hashField]: payloadHash,
          };

          // Add hash to headers if headerName is provided
          // Note: RobotCopy doesn't expose headers directly, so we add it to body
          // If header support is needed, it would require modifying RobotCopy.sendMessage

          // Call wrapped sendMessage
          const response = await target.sendMessage(action, transformedData);

          // Verify response hash if present
          if (response && typeof response === 'object' && hashField in response) {
            const responseHash = response[hashField] as string;
            const responseData = { ...response };
            delete responseData[hashField];

            const isValid = await Promise.resolve(hashFactory.verify(responseData, responseHash, secret));
            if (!isValid) {
              throw new Error('PayloadHash: response hash verification failed');
            }

            // Return response without hash field
            return responseData;
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
 * Create HTTP middleware that hashes request payloads and verifies response hashes.
 */
export function createPayloadHashMiddleware(options: PayloadHashAdapterOptions): NormalizedMiddleware {
  const hashFactory: HashFactory = options.hashFactory ?? createDefaultHashFactory();
  const hashField = options.hashField ?? '_payloadHash';
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
      return { status: 500, body: { error: 'PayloadHash: secret is required' } };
    }

    // Hash request body
    const bodyHash = await Promise.resolve(hashFactory.hash(req.body, secret));

    // Add hash to body
    const transformedBody: Record<string, unknown> =
      typeof req.body === 'object' && req.body !== null
        ? { ...(req.body as Record<string, unknown>), [hashField]: bodyHash }
        : { data: req.body, [hashField]: bodyHash };

    // Modify request in place (adapter should preserve modifications)
    (req as any).body = transformedBody;
    if (headerName) {
      req.headers[headerName] = bodyHash;
    }

    // Call next middleware/handler
    const response = await next();

    // Verify response hash if present
    if (response.body && typeof response.body === 'object' && hashField in response.body) {
      const responseHash = (response.body as Record<string, unknown>)[hashField] as string;
      const responseData = { ...(response.body as Record<string, unknown>) };
      delete responseData[hashField];

      const isValid = await Promise.resolve(hashFactory.verify(responseData, responseHash, secret));
      if (!isValid) {
        return { status: 403, body: { error: 'PayloadHash: response hash verification failed' } };
      }

      return {
        ...response,
        body: responseData,
      };
    }

    return response;
  };
}
