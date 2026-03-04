/**
 * Origin-bound message tokens for cross-boundary Cave/Tome/VSM traffic (CSRF-style).
 * Token shape: salt + hash of (salt + channelId + payloadSummary + secret). Optional originId, caveId, tomeId, expiresAt.
 * When wave-reader is in scope, align with its popup/background/content channel = (origin, context) and same salt-then-hash idea.
 * Uses Web Crypto (browser) or Node crypto; minimal dependency.
 */
export interface MessageTokenPayload {
    salt: string;
    hash: string;
    originId?: string;
    caveId?: string;
    tomeId?: string;
    expiresAt?: number;
}
export interface MessageTokenOptions {
    /** Channel identifier, e.g. caveId:tomeId or origin:path */
    channelId: string;
    /** Short summary of payload for binding (e.g. action name or hash of body) */
    payloadSummary: string;
    /** Secret for HMAC; must be shared with validator */
    secret: string;
    /** Optional TTL in ms; expiresAt = now + ttlMs */
    ttlMs?: number;
    originId?: string;
    caveId?: string;
    tomeId?: string;
}
/**
 * Generate a message token (sync when Node crypto available, else use generateTokenAsync).
 */
export declare function generateToken(options: MessageTokenOptions): MessageTokenPayload;
/**
 * Generate a message token (async; use in browser or when Web Crypto only).
 */
export declare function generateTokenAsync(options: MessageTokenOptions): Promise<MessageTokenPayload>;
export interface ValidateTokenOptions {
    token: MessageTokenPayload;
    channelId: string;
    payloadSummary: string;
    secret: string;
    /** If true, expired tokens are rejected (default true) */
    checkExpiry?: boolean;
}
/**
 * Validate a message token: recompute hash and compare; optionally check expiry.
 */
export declare function validateToken(options: ValidateTokenOptions): boolean;
/**
 * Serialize token to a string (e.g. for header). Format: base64(JSON).
 */
export declare function serializeToken(token: MessageTokenPayload): string;
/**
 * Parse token from string (e.g. from header).
 */
export declare function parseToken(serialized: string): MessageTokenPayload | null;
//# sourceMappingURL=MessageToken.d.ts.map