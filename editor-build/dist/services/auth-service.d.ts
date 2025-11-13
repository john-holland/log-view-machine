/**
 * Authentication Service
 *
 * Handles Google OAuth2 authentication and JWT token management
 * Supports both web app and Chrome extension authentication
 */
export interface UserSession {
    id: number;
    email: string;
    googleId: string;
    premiumStatus: boolean;
    userType: 'free' | 'premium' | 'moderator' | 'admin';
    tokenBalance: number;
}
export interface AuthToken {
    token: string;
    expiresAt: number;
    user: UserSession;
}
export declare class AuthService {
    private jwtSecret;
    private googleClientId;
    private googleClientSecret;
    constructor(config: {
        jwtSecret: string;
        googleClientId: string;
        googleClientSecret: string;
    });
    /**
     * Verify Google OAuth2 token
     */
    verifyGoogleToken(idToken: string): Promise<any>;
    /**
     * Create JWT token for user session
     */
    createJWT(user: UserSession, expiresIn?: string): string;
    /**
     * Verify JWT token
     */
    verifyJWT(token: string): any;
    /**
     * Authenticate with Google OAuth2 (web app)
     */
    authenticateWithGoogle(idToken: string): Promise<AuthToken | null>;
    /**
     * Authenticate with Chrome Identity API (extension)
     */
    authenticateWithChromeIdentity(): Promise<AuthToken | null>;
    /**
     * Refresh authentication token
     */
    refreshToken(oldToken: string): Promise<AuthToken | null>;
    /**
     * Developer mode: Switch user type (session only, not persisted)
     */
    switchUserType(token: string, newUserType: 'free' | 'premium' | 'moderator' | 'admin'): string;
}
export declare function initializeAuthService(config: {
    jwtSecret: string;
    googleClientId: string;
    googleClientSecret: string;
}): AuthService;
export declare function getAuthService(): AuthService;
