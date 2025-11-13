/**
 * Database Setup and Migration
 *
 * Handles PostgreSQL database initialization and schema management
 */
export declare class DatabaseService {
    private pool;
    constructor(config?: any);
    /**
     * Initialize database schema from SQL file
     */
    initializeSchema(): Promise<void>;
    /**
     * Test database connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Execute a query
     */
    query(text: string, params?: any[]): Promise<any>;
    /**
     * Get user by email
     */
    getUserByEmail(email: string): Promise<any>;
    /**
     * Create or update user
     */
    upsertUser(data: {
        email: string;
        googleId: string;
        premiumStatus?: boolean;
        userType?: string;
    }): Promise<any>;
    /**
     * Grant tokens to user
     */
    grantTokens(userId: number, amount: number, source: string): Promise<void>;
    /**
     * Close database connection pool
     */
    close(): Promise<void>;
}
export declare function initializeDatabase(config?: any): DatabaseService;
export declare function getDatabase(): DatabaseService;
