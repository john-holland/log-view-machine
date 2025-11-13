/**
 * Authentication Service
 * 
 * Handles Google OAuth2 authentication and JWT token management
 * Supports both web app and Chrome extension authentication
 */

import jwt from 'jsonwebtoken';

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

export class AuthService {
    private jwtSecret: string;
    private googleClientId: string;
    private googleClientSecret: string;

    constructor(config: {
        jwtSecret: string;
        googleClientId: string;
        googleClientSecret: string;
    }) {
        this.jwtSecret = config.jwtSecret;
        this.googleClientId = config.googleClientId;
        this.googleClientSecret = config.googleClientSecret;
    }

    /**
     * Verify Google OAuth2 token
     */
    async verifyGoogleToken(idToken: string): Promise<any> {
        // TODO: Implement Google token verification
        // Use google-auth-library
        console.log('🔐 AuthService: Verifying Google token');
        
        // Mock for now
        return {
            email: 'user@example.com',
            sub: 'google-id-123',
            name: 'Test User'
        };
    }

    /**
     * Create JWT token for user session
     */
    createJWT(user: UserSession, expiresIn: string = '7d'): string {
        const payload = {
            userId: user.id,
            email: user.email,
            userType: user.userType,
            premiumStatus: user.premiumStatus
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn,
            issuer: 'wave-reader',
            subject: user.id.toString()
        });
    }

    /**
     * Verify JWT token
     */
    verifyJWT(token: string): any {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            console.error('🔐 AuthService: JWT verification failed', error);
            return null;
        }
    }

    /**
     * Authenticate with Google OAuth2 (web app)
     */
    async authenticateWithGoogle(idToken: string): Promise<AuthToken | null> {
        try {
            const googleUser = await this.verifyGoogleToken(idToken);
            
            // TODO: Look up or create user in database
            const user: UserSession = {
                id: 1,
                email: googleUser.email,
                googleId: googleUser.sub,
                premiumStatus: false,
                userType: 'free',
                tokenBalance: 0
            };

            const token = this.createJWT(user);
            const decoded = this.verifyJWT(token);

            return {
                token,
                expiresAt: decoded.exp * 1000,
                user
            };
        } catch (error) {
            console.error('🔐 AuthService: Google authentication failed', error);
            return null;
        }
    }

    /**
     * Authenticate with Chrome Identity API (extension)
     */
    async authenticateWithChromeIdentity(): Promise<AuthToken | null> {
        // This will be called from the extension context
        console.log('🔐 AuthService: Chrome Identity authentication');
        
        // Mock for now - will integrate with Chrome Identity API
        return null;
    }

    /**
     * Refresh authentication token
     */
    async refreshToken(oldToken: string): Promise<AuthToken | null> {
        const decoded = this.verifyJWT(oldToken);
        
        if (!decoded) {
            return null;
        }

        // TODO: Look up user from database
        const user: UserSession = {
            id: decoded.userId,
            email: decoded.email,
            googleId: '',
            premiumStatus: decoded.premiumStatus,
            userType: decoded.userType,
            tokenBalance: 0
        };

        const newToken = this.createJWT(user);
        const newDecoded = this.verifyJWT(newToken);

        return {
            token: newToken,
            expiresAt: newDecoded.exp * 1000,
            user
        };
    }

    /**
     * Developer mode: Switch user type (session only, not persisted)
     */
    switchUserType(token: string, newUserType: 'free' | 'premium' | 'moderator' | 'admin'): string {
        const decoded = this.verifyJWT(token);
        
        if (!decoded) {
            throw new Error('Invalid token');
        }

        const payload = {
            ...decoded,
            userType: newUserType,
            devModeSwitch: true // Flag to indicate this is a dev mode switch
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: '7d',
            issuer: 'wave-reader',
            subject: decoded.sub
        });
    }
}

// Export singleton (will be initialized in server startup)
let authServiceInstance: AuthService | null = null;

export function initializeAuthService(config: {
    jwtSecret: string;
    googleClientId: string;
    googleClientSecret: string;
}): AuthService {
    authServiceInstance = new AuthService(config);
    return authServiceInstance;
}

export function getAuthService(): AuthService {
    if (!authServiceInstance) {
        throw new Error('AuthService not initialized. Call initializeAuthService first.');
    }
    return authServiceInstance;
}

