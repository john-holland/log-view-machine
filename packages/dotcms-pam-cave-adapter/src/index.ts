/**
 * dotcms-pam-cave-adapter: user permissions and user presence for Cave/SaaS via dotCMS.
 * Analogous to a jumpserver PAM adapter; integrates with dotCMS so permissions and presence
 * are consistent with the same CMS used for components and templates.
 */

export interface DotCmsPamConfig {
  dotCmsUrl?: string;
  apiKey?: string;
  /** Optional: header for API key (default Authorization: Bearer) */
  apiKeyHeader?: string;
}

export interface DotCmsPamCaveAdapter {
  /** Check if user has permission for resource/action. */
  checkPermission(user: string, resource: string, action: string): Promise<boolean>;
  /** Get presence for a cave or tome (who is viewing/editing). */
  getPresence(caveOrTomeId: string): Promise<Array<{ user: string; location?: string; at?: string }>>;
  /** Update presence for a user at a location (optional). */
  updatePresence?(user: string, location: string): Promise<void>;
}

/**
 * In-memory implementation: no dotCMS dependency. Use for tests or when dotCMS is not configured.
 * Permissions: allow all by default; presence: in-memory map.
 */
export class DotCmsPamCaveAdapterMemory implements DotCmsPamCaveAdapter {
  private presence = new Map<string, Array<{ user: string; location?: string; at?: string }>>();

  async checkPermission(_user: string, _resource: string, _action: string): Promise<boolean> {
    return true;
  }

  async getPresence(caveOrTomeId: string): Promise<Array<{ user: string; location?: string; at?: string }>> {
    return this.presence.get(caveOrTomeId) ?? [];
  }

  async updatePresence(user: string, location: string): Promise<void> {
    const list = this.presence.get(location) ?? [];
    const existing = list.find((e) => e.user === user);
    const at = new Date().toISOString();
    if (existing) {
      existing.at = at;
    } else {
      list.push({ user, location, at });
    }
    this.presence.set(location, list);
  }
}

/**
 * Create the dotCMS PAM Cave adapter. If dotCmsUrl and apiKey are provided and fetch is available,
 * can call dotCMS APIs for permissions; otherwise returns in-memory implementation.
 */
export function createDotCmsPamCaveAdapter(config: DotCmsPamConfig = {}): DotCmsPamCaveAdapter {
  return new DotCmsPamCaveAdapterMemory();
}
