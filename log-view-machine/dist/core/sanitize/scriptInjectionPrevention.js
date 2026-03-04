/**
 * Script-injection prevention utilities for use in browser, Node, and adapters.
 * Use when handling user or cross-boundary content (message payloads, view state, API bodies).
 * Safe for text nodes and attributes when used as documented.
 */
const ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
};
const REVERSE_ENTITY_MAP = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#96;': '`',
    '&#x60;': '`',
};
const ENTITY_REGEX = /&(?:amp|lt|gt|quot|#39|#x27|#96|#x60);/g;
/**
 * Encode string so that when interpolated into HTML or a script context it is inert.
 * Replaces &, <, >, ", ', ` with HTML entities. Safe for use in text nodes or attributes.
 * Dependency-free; runs in Node and browser.
 */
export function escapeText(str) {
    if (typeof str !== 'string')
        return '';
    return str.replace(/[&<>"'`]/g, (c) => ENTITY_MAP[c] ?? c);
}
/**
 * Reverse the entity encoding produced by escapeText (same entity set).
 * Use when round-tripping stored or transmitted data that was escaped for display.
 */
export function unescapeText(str) {
    if (typeof str !== 'string')
        return '';
    return str.replace(ENTITY_REGEX, (match) => REVERSE_ENTITY_MAP[match] ?? match);
}
const DEFAULT_ALLOWED_TAGS = [
    'a', 'b', 'br', 'em', 'i', 'p', 'span', 'strong', 'u', 'ul', 'ol', 'li', 'div', 'section', 'article', 'header', 'footer', 'nav', 'main',
];
const DEFAULT_ALLOWED_ATTRIBUTES = {
    a: ['href', 'title', 'target'],
    span: ['class'],
    div: ['class'],
    p: ['class'],
    section: ['class'],
    article: ['class'],
    header: ['class'],
    footer: ['class'],
    nav: ['class'],
    main: ['class'],
};
function stripScriptsAndHandlers(html) {
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
}
/**
 * Parse HTML into a safe representation without executing scripts.
 * In browser: uses DOMParser + sanitization. In Node: uses regex-based strip and tag allowlist.
 * Output is safe for insertion into a safe context only; do not assign to innerHTML raw.
 */
export function parseHtml(html, options) {
    const stripScripts = options?.stripScripts !== false;
    const allowedTags = new Set((options?.allowedTags ?? DEFAULT_ALLOWED_TAGS).map((t) => t.toLowerCase()));
    const allowedAttributes = options?.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES;
    const errors = [];
    let input = typeof html === 'string' ? html : '';
    if (stripScripts) {
        input = stripScriptsAndHandlers(input);
    }
    const isBrowser = typeof document !== 'undefined' && typeof DOMParser !== 'undefined';
    if (isBrowser) {
        try {
            const doc = new DOMParser().parseFromString(input, 'text/html');
            const walk = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return escapeText(node.textContent ?? '');
                }
                if (node.nodeType !== Node.ELEMENT_NODE)
                    return '';
                const el = node;
                const tag = el.tagName.toLowerCase();
                if (!allowedTags.has(tag)) {
                    return Array.from(el.childNodes).map(walk).join('');
                }
                const attrs = allowedAttributes[tag];
                let attrStr = '';
                if (attrs?.length) {
                    for (const name of attrs) {
                        const val = el.getAttribute(name);
                        if (val != null)
                            attrStr += ` ${name}="${escapeText(val)}"`;
                    }
                }
                const inner = Array.from(el.childNodes).map(walk).join('');
                if (['br', 'hr', 'img', 'input'].includes(tag)) {
                    return `<${tag}${attrStr}>`;
                }
                return `<${tag}${attrStr}>${inner}</${tag}>`;
            };
            const body = doc.body ?? doc.documentElement;
            const safe = body ? Array.from(body.childNodes).map(walk).join('') : escapeText(input);
            return { safe, errors: errors.length ? errors : undefined };
        }
        catch (e) {
            errors.push(String(e));
            return { safe: escapeText(input), errors };
        }
    }
    // Node / non-DOM: regex-based allowlist
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    let safe = input;
    let match;
    const seenTags = new Set();
    while ((match = tagRegex.exec(input)) !== null) {
        const full = match[0];
        const tag = match[1].toLowerCase();
        seenTags.add(tag);
        if (!allowedTags.has(tag)) {
            safe = safe.replace(full, '');
        }
    }
    // Remove any attribute that looks like an event handler
    safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    safe = safe.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
    return { safe, errors: errors.length ? errors : undefined };
}
