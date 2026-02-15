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
    login(credentials: {
        username?: string;
        password?: string;
    }): Promise<CaveUser | null>;
    getCurrentUser(req: unknown): CaveUser | Promise<CaveUser>;
}
/**
 * Evaluate whether a user satisfies a permission spec.
 * levelOrder: e.g. ['anonymous', 'user', 'admin'] (index = rank for comparison).
 * Spec: ">anonymous", ">=user", "=anonymous", "<admin", "user,admin", or "admin".
 */
export declare function evaluatePermission(user: CaveUser, spec: PermissionSpec, levelOrder?: string[]): boolean;
/** Options for createDotcmsLoginAdapter. */
export interface DotcmsLoginAdapterOptions {
    /** Credential validator (e.g. createStubLoginHandler from login-handler-adapter). */
    loginHandler?: {
        login(credentials: unknown): Promise<{
            user?: {
                id?: string;
                username?: string;
                email?: string;
            };
        } | null>;
    };
    /** Ordered permission levels for evaluatePermission. Default ['anonymous', 'user', 'admin']. */
    levelOrder?: string[];
    /** Level to assign when logged in (when loginHandler returns a user). Default 'user'. */
    loggedInLevel?: string;
    /** Extract user from request after login (e.g. from session). Return null for anonymous. */
    getSessionUser?: (req: unknown) => {
        id: string;
        username?: string;
        email?: string;
    } | null | Promise<{
        id: string;
        username?: string;
        email?: string;
    } | null>;
    /** Optional tenant name provider: (cave, req?) => tenant string. Used by PAM/routing policy. */
    getTenantName?: (cave: unknown, req?: unknown) => string | Promise<string>;
}
/**
 * Create the dotCMS login adapter. Uses loginHandler for credentials; getSessionUser to read current user from request.
 * When getSessionUser is not provided, getCurrentUser always returns anonymous CaveUser.
 */
export declare function createDotcmsLoginAdapter(options?: DotcmsLoginAdapterOptions): LoginAdapter;
/** Export getTenantName from options for use by express/permission middleware (optional). */
export type TenantNameProvider = (cave: unknown, req?: unknown) => string | Promise<string>;
/**
 * Derive tenant from request URL (origin or basePath). Use when no custom tenant id (header/session) is set.
 * req may be Express req: .get('host'), .protocol, .baseUrl, .path; or NormalizedRequest with .url, .headers.
 */
export declare function deriveTenantFromRequest(req: unknown): string;
