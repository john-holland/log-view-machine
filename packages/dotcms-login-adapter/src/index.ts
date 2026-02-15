/**
 * dotcms-login-adapter: abstract login and standardize CaveUser + permission level at Cave/Tome/LVM level.
 * Optional tenant name provider for PAM/routing policy; evaluatePermission for list, single, or comparison spec.
 */

/** Standardized user for Cave/Tome/ViewStateMachine. permissionLevel is an ordered label (e.g. anonymous, user, admin). */
export interface CaveUser {
  id: string;
  username?: string;
  email?: string;
  permissionLevel: string;
  /** Optional tenant (e.g. from URL origin/basePath or custom id). */
  tenantId?: string;
}

/** Permission spec: ">anonymous", "=user", ">=admin", "user,admin", or single "admin". Default ">anonymous". */
export type PermissionSpec = string;

/** Adapter that performs login and resolves current user from request (session/cookie/JWT). */
export interface LoginAdapter {
  login(credentials: { username?: string; password?: string }): Promise<CaveUser | null>;
  getCurrentUser(req: unknown): CaveUser | Promise<CaveUser>;
}

/**
 * Evaluate whether a user satisfies a permission spec.
 * levelOrder: e.g. ['anonymous', 'user', 'admin'] (index = rank for comparison).
 * Spec: ">anonymous", ">=user", "=anonymous", "<admin", "user,admin", or "admin".
 */
export function evaluatePermission(
  user: CaveUser,
  spec: PermissionSpec,
  levelOrder: string[] = ['anonymous', 'user', 'admin']
): boolean {
  const level = (user?.permissionLevel ?? 'anonymous').trim();
  const s = (spec ?? '>anonymous').trim();
  if (!s) return true;

  const rank = (l: string) => {
    const i = levelOrder.indexOf(l);
    return i >= 0 ? i : -1;
  };
  const userRank = rank(level);

  if (s.startsWith('>=')) {
    const target = s.slice(2).trim();
    return userRank >= rank(target);
  }
  if (s.startsWith('<=')) {
    const target = s.slice(2).trim();
    return userRank <= rank(target);
  }
  if (s.startsWith('>')) {
    const target = s.slice(1).trim();
    return userRank > rank(target);
  }
  if (s.startsWith('<')) {
    const target = s.slice(1).trim();
    return userRank < rank(target);
  }
  if (s.startsWith('=')) {
    const target = s.slice(1).trim();
    return level === target;
  }
  if (s.includes(',')) {
    const allowed = s.split(',').map((x) => x.trim());
    return allowed.includes(level);
  }
  return level === s;
}

/** Options for createDotcmsLoginAdapter. */
export interface DotcmsLoginAdapterOptions {
  /** Credential validator (e.g. createStubLoginHandler from login-handler-adapter). */
  loginHandler?: { login(credentials: unknown): Promise<{ user?: { id?: string; username?: string; email?: string } } | null> };
  /** Ordered permission levels for evaluatePermission. Default ['anonymous', 'user', 'admin']. */
  levelOrder?: string[];
  /** Level to assign when logged in (when loginHandler returns a user). Default 'user'. */
  loggedInLevel?: string;
  /** Extract user from request after login (e.g. from session). Return null for anonymous. */
  getSessionUser?: (req: unknown) => { id: string; username?: string; email?: string } | null | Promise<{ id: string; username?: string; email?: string } | null>;
  /** Optional tenant name provider: (cave, req?) => tenant string. Used by PAM/routing policy. */
  getTenantName?: (cave: unknown, req?: unknown) => string | Promise<string>;
}

const DEFAULT_LEVEL_ORDER = ['anonymous', 'user', 'admin'];

function toCaveUser(
  raw: { id: string; username?: string; email?: string },
  permissionLevel: string,
  tenantId?: string
): CaveUser {
  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    permissionLevel,
    ...(tenantId !== undefined && { tenantId }),
  };
}

const ANONYMOUS_USER: CaveUser = {
  id: 'anonymous',
  permissionLevel: 'anonymous',
};

/**
 * Create the dotCMS login adapter. Uses loginHandler for credentials; getSessionUser to read current user from request.
 * When getSessionUser is not provided, getCurrentUser always returns anonymous CaveUser.
 */
export function createDotcmsLoginAdapter(options: DotcmsLoginAdapterOptions = {}): LoginAdapter {
  const {
    loginHandler,
    levelOrder = DEFAULT_LEVEL_ORDER,
    loggedInLevel = 'user',
    getSessionUser,
    getTenantName,
  } = options;

  return {
    async login(credentials: { username?: string; password?: string }): Promise<CaveUser | null> {
      if (!loginHandler) return null;
      const result = await loginHandler.login(credentials);
      if (!result?.user) return null;
      const u = result.user;
      if (!u?.id) return null;
      return toCaveUser(
        { id: u.id, username: u.username, email: u.email },
        loggedInLevel
      );
    },

    async getCurrentUser(req: unknown): Promise<CaveUser> {
      if (!getSessionUser) return ANONYMOUS_USER;
      const raw = await Promise.resolve(getSessionUser(req));
      if (!raw?.id) return ANONYMOUS_USER;
      return toCaveUser(raw, loggedInLevel);
    },
  };
}

/** Export getTenantName from options for use by express/permission middleware (optional). */
export type TenantNameProvider = (cave: unknown, req?: unknown) => string | Promise<string>;

/**
 * Derive tenant from request URL (origin or basePath). Use when no custom tenant id (header/session) is set.
 * req may be Express req: .get('host'), .protocol, .baseUrl, .path; or NormalizedRequest with .url, .headers.
 */
export function deriveTenantFromRequest(req: unknown): string {
  if (!req || typeof req !== 'object') return 'default';
  const r = req as Record<string, unknown>;
  const host = typeof r.get === 'function' ? (r.get as (n: string) => string)('host') : (r.headers as Record<string, string>)?.['host'];
  const protocol = typeof r.protocol === 'string' ? r.protocol : 'http';
  const baseUrl = typeof r.baseUrl === 'string' ? r.baseUrl : (typeof r.url === 'string' ? (r.url as string).split('?')[0] : '');
  if (host) {
    const origin = `${protocol}://${host}`;
    if (baseUrl && baseUrl !== '/') return `${origin}${baseUrl}`;
    return origin;
  }
  if (typeof baseUrl === 'string' && baseUrl) return baseUrl;
  return 'default';
}
