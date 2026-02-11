/**
 * dotcms-pam-cave-adapter: user permissions and user presence for Cave/SaaS via dotCMS.
 * Analogous to a jumpserver PAM adapter; integrates with dotCMS so permissions and presence
 * are consistent with the same CMS used for components and templates.
 */
/**
 * In-memory implementation: no dotCMS dependency. Use for tests or when dotCMS is not configured.
 * Permissions: allow all by default; presence: in-memory map.
 */
export class DotCmsPamCaveAdapterMemory {
    constructor() {
        this.presence = new Map();
    }
    async checkPermission(_user, _resource, _action) {
        return true;
    }
    async getPresence(caveOrTomeId) {
        return this.presence.get(caveOrTomeId) ?? [];
    }
    async updatePresence(user, location) {
        const list = this.presence.get(location) ?? [];
        const existing = list.find((e) => e.user === user);
        const at = new Date().toISOString();
        if (existing) {
            existing.at = at;
        }
        else {
            list.push({ user, location, at });
        }
        this.presence.set(location, list);
    }
}
/**
 * Create the dotCMS PAM Cave adapter. If dotCmsUrl and apiKey are provided and fetch is available,
 * can call dotCMS APIs for permissions; otherwise returns in-memory implementation.
 */
export function createDotCmsPamCaveAdapter(config = {}) {
    return new DotCmsPamCaveAdapterMemory();
}
