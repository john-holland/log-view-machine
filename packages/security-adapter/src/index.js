/**
 * Security adapter interface for editor auth.
 * Implementations provide getToken() and optionally getUser() for publish and presence.
 */

/** Stub adapter: no auth (client-side). */
export function createStubSecurityAdapter() {
  return {
    async getToken() {
      return null;
    },
    async getUser() {
      return null;
    }
  };
}

/**
 * Stub TokenVerifier: always returns null (server-side). Use when auth is disabled.
 */
export function createStubTokenVerifier() {
  return {
    async verifyToken() {
      return null;
    }
  };
}
