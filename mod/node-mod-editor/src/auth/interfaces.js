/**
 * Auth abstraction interfaces (contracts). JSDoc-only; no runtime code.
 * All auth behavior is replaceable behind these named contracts.
 */

/**
 * Server: validate Bearer token (publish, optional login).
 * @typedef {Object} TokenVerifier
 * @property {(token: string) => Promise<{ sub: string, email?: string } | null>} verifyToken
 */

/**
 * Server: validate username/password for /api/login.
 * @typedef {Object} LoginHandler
 * @property {(credentials: { username: string, password: string }) => Promise<{ user: { id: string, username?: string, email?: string } } | null>} login
 */

/**
 * Client: getToken / getUser for editor (publish, presence).
 * @typedef {{ id: string, email?: string }} SecurityAdapterUser
 * @typedef {Object} SecurityAdapter
 * @property {() => Promise<string|null>} getToken
 * @property {() => Promise<SecurityAdapterUser|null>} [getUser]
 */

/**
 * Server: send magic link / verification email.
 * @typedef {Object} SendEmailOptions
 * @property {string} to
 * @property {string} subject
 * @property {string} html
 */
/**
 * @typedef {(options: SendEmailOptions) => Promise<void>} EmailSendAdapter
 */

export const __interfacesDocOnly = true;
