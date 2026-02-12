/**
 * Server-side: verify Google ID token and return payload (sub, email).
 * Parameterized via createGoogleTokenVerifier({ clientId }); caller passes options (e.g. from env).
 */

import { OAuth2Client } from 'google-auth-library';

/**
 * Create a TokenVerifier that validates Google ID tokens with the given client ID.
 * @param {{ clientId: string }} options - clientId must match the client ID used in the browser
 */
export function createGoogleTokenVerifier({ clientId }) {
  const id = (clientId || '').trim();
  const client = id ? new OAuth2Client(id) : null;

  return {
    async verifyToken(token) {
      if (!client || !token) return null;
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: id
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.sub) return null;
        return {
          sub: payload.sub,
          email: payload.email || undefined,
          name: payload.name || undefined,
          picture: payload.picture || undefined
        };
      } catch {
        return null;
      }
    }
  };
}

const defaultVerifier = createGoogleTokenVerifier({ clientId: process.env.GOOGLE_CLIENT_ID || '' });

/**
 * Verify a Google ID token (from Authorization: Bearer <token>).
 * Uses process.env.GOOGLE_CLIENT_ID when called without a factory.
 */
export async function verifyGoogleIdToken(idToken) {
  return defaultVerifier.verifyToken(idToken);
}

export { verifyGoogleIdToken as getGoogleUserFromToken };
