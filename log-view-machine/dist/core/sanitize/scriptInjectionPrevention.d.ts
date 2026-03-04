/**
 * Script-injection prevention utilities for use in browser, Node, and adapters.
 * Use when handling user or cross-boundary content (message payloads, view state, API bodies).
 * Safe for text nodes and attributes when used as documented.
 */
/**
 * Encode string so that when interpolated into HTML or a script context it is inert.
 * Replaces &, <, >, ", ', ` with HTML entities. Safe for use in text nodes or attributes.
 * Dependency-free; runs in Node and browser.
 */
export declare function escapeText(str: string): string;
/**
 * Reverse the entity encoding produced by escapeText (same entity set).
 * Use when round-tripping stored or transmitted data that was escaped for display.
 */
export declare function unescapeText(str: string): string;
/**
 * Result of safe HTML parsing. Use safe string only in sanitized insertion (e.g. text nodes),
 * never as raw innerHTML.
 */
export interface SafeResult {
    /** Safe string for insertion (allowed tags only, scripts stripped). */
    safe: string;
    /** Parse or sanitization errors, if any. */
    errors?: string[];
}
/**
 * Options for parseHtml.
 */
export interface ParseHtmlOptions {
    /** Allowed tag names (lowercase). If omitted, default allowlist is used. */
    allowedTags?: string[];
    /** Allowed attributes per tag. If omitted, default allowlist. */
    allowedAttributes?: Record<string, string[]>;
    /** Strip script tags and event handlers (default true). */
    stripScripts?: boolean;
}
/**
 * Parse HTML into a safe representation without executing scripts.
 * In browser: uses DOMParser + sanitization. In Node: uses regex-based strip and tag allowlist.
 * Output is safe for insertion into a safe context only; do not assign to innerHTML raw.
 */
export declare function parseHtml(html: string, options?: ParseHtmlOptions): SafeResult;
//# sourceMappingURL=scriptInjectionPrevention.d.ts.map