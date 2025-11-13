/**
 * Database Setup and Migration
 * 
 * Handles PostgreSQL database initialization and schema management
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export class DatabaseService {
    private pool: Pool;

    constructor(config?: any) {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'wave_reader_premium',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ...config
        });

        console.log('🗄️ DatabaseService: PostgreSQL pool created');
    }

    /**
     * Initialize database schema from SQL file
     */
    async initializeSchema(): Promise<void> {
        try {
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf-8');

            await this.pool.query(schema);
            console.log('🗄️ DatabaseService: Schema initialized successfully');
        } catch (error) {
            console.error('🗄️ DatabaseService: Schema initialization failed', error);
            throw error;
        }
    }

    /**
     * Test database connection
     */
    async testConnection(): Promise<boolean> {
        try {
            const result = await this.pool.query('SELECT NOW()');
            console.log('🗄️ DatabaseService: Connection test successful', result.rows[0]);
            return true;
        } catch (error) {
            console.error('🗄️ DatabaseService: Connection test failed', error);
            return false;
        }
    }

    /**
     * Execute a query
     */
    async query(text: string, params?: any[]): Promise<any> {
        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            console.error('🗄️ DatabaseService: Query failed', error);
            throw error;
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<any> {
        const result = await this.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    /**
     * Create or update user
     */
    async upsertUser(data: {
        email: string;
        googleId: string;
        premiumStatus?: boolean;
        userType?: string;
    }): Promise<any> {
        const result = await this.query(
            `INSERT INTO users (email, google_id, premium_status, user_type)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) 
             DO UPDATE SET 
                google_id = EXCLUDED.google_id,
                last_login_at = NOW()
             RETURNING *`,
            [
                data.email,
                data.googleId,
                data.premiumStatus || false,
                data.userType || 'free'
            ]
        );
        return result.rows[0];
    }

    /**
     * Grant tokens to user
     */
    async grantTokens(userId: number, amount: number, source: string): Promise<void> {
        await this.query('BEGIN');
        
        try {
            // Update user balance
            await this.query(
                'UPDATE users SET token_balance = token_balance + $1 WHERE id = $2',
                [amount, userId]
            );

            // Record in ledger
            await this.query(
                `INSERT INTO token_ledger (to_user_id, amount, transaction_type, reason)
                 VALUES ($1, $2, $3, $4)`,
                [userId, amount, 'admin_grant', source]
            );

            await this.query('COMMIT');
            console.log(`🗄️ DatabaseService: Granted ${amount} tokens to user ${userId}`);
        } catch (error) {
            await this.query('ROLLBACK');
            throw error;
        }
    }

    /**
     * Close database connection pool
     */
    async close(): Promise<void> {
        await this.pool.end();
        console.log('🗄️ DatabaseService: Connection pool closed');
    }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export function initializeDatabase(config?: any): DatabaseService {
    if (!dbInstance) {
        dbInstance = new DatabaseService(config);
    }
    return dbInstance;
}

export function getDatabase(): DatabaseService {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initializeDatabase first.');
    }
    return dbInstance;
}

