/**
 * Origin-bound message tokens for cross-boundary Cave/Tome/VSM traffic (CSRF-style).
 * Token shape: salt + hash of (salt + channelId + payloadSummary + secret). Optional originId, caveId, tomeId, expiresAt.
 * When wave-reader is in scope, align with its popup/background/content channel = (origin, context) and same salt-then-hash idea.
 * Uses Web Crypto (browser) or Node crypto; minimal dependency.
 */
function getCrypto() {
    if (typeof process !== 'undefined' && process.versions?.node) {
        try {
            const crypto = require('crypto');
            return {
                hashSync(data) {
                    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
                },
            };
        }
        catch {
            // fall through to Web Crypto
        }
    }
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        return {
            hashSync(_data) {
                throw new Error('MessageToken: sync hash not available in this environment; use generateTokenAsync');
            },
            async hashAsync(data) {
                const buf = new TextEncoder().encode(data);
                const digest = await crypto.subtle.digest('SHA-256', buf);
                return Array.from(new Uint8Array(digest))
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join('');
            },
        };
    }
    throw new Error('MessageToken: no crypto available (need Node crypto or Web Crypto API)');
}
const cryptoImpl = getCrypto();
function computeHash(salt, channelId, payloadSummary, secret) {
    const data = salt + channelId + payloadSummary + secret;
    return cryptoImpl.hashSync(data);
}
async function computeHashAsync(salt, channelId, payloadSummary, secret) {
    if (cryptoImpl.hashAsync) {
        const data = salt + channelId + payloadSummary + secret;
        return cryptoImpl.hashAsync(data);
    }
    return computeHash(salt, channelId, payloadSummary, secret);
}
function randomSalt() {
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    }
    else if (typeof require !== 'undefined') {
        try {
            const nodeCrypto = require('crypto');
            nodeCrypto.randomFillSync(bytes);
        }
        catch {
            for (let i = 0; i < 16; i++)
                bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    else {
        for (let i = 0; i < 16; i++)
            bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Generate a message token (sync when Node crypto available, else use generateTokenAsync).
 */
export function generateToken(options) {
    const salt = randomSalt();
    const hash = computeHash(salt, options.channelId, options.payloadSummary, options.secret);
    const expiresAt = options.ttlMs != null ? Date.now() + options.ttlMs : undefined;
    return {
        salt,
        hash,
        originId: options.originId,
        caveId: options.caveId,
        tomeId: options.tomeId,
        expiresAt,
    };
}
/**
 * Generate a message token (async; use in browser or when Web Crypto only).
 */
export async function generateTokenAsync(options) {
    const salt = randomSalt();
    const hash = await computeHashAsync(salt, options.channelId, options.payloadSummary, options.secret);
    const expiresAt = options.ttlMs != null ? Date.now() + options.ttlMs : undefined;
    return {
        salt,
        hash,
        originId: options.originId,
        caveId: options.caveId,
        tomeId: options.tomeId,
        expiresAt,
    };
}
/**
 * Validate a message token: recompute hash and compare; optionally check expiry.
 */
export function validateToken(options) {
    const { token, channelId, payloadSummary, secret, checkExpiry = true } = options;
    if (!token?.salt || !token?.hash)
        return false;
    if (checkExpiry && token.expiresAt != null && Date.now() > token.expiresAt)
        return false;
    const expected = computeHash(token.salt, channelId, payloadSummary, secret);
    return expected === token.hash;
}
/**
 * Serialize token to a string (e.g. for header). Format: base64(JSON).
 */
export function serializeToken(token) {
    const json = JSON.stringify(token);
    if (typeof Buffer !== 'undefined')
        return Buffer.from(json, 'utf8').toString('base64');
    return btoa(unescape(encodeURIComponent(json)));
}
/**
 * Parse token from string (e.g. from header).
 */
export function parseToken(serialized) {
    try {
        let json;
        if (typeof Buffer !== 'undefined') {
            json = Buffer.from(serialized, 'base64').toString('utf8');
        }
        else {
            json = decodeURIComponent(escape(atob(serialized)));
        }
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
