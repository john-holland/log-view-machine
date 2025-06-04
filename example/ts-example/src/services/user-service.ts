import { Pool } from 'pg';
import { User } from '../types/context';

export class UserService {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async getUser(id: number): Promise<User | null> {
        const result = await this.pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const result = await this.pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    async createUser(username: string, email: string, passwordHash: string): Promise<User> {
        const result = await this.pool.query(
            `INSERT INTO users (
                username, email, password_hash
            ) VALUES ($1, $2, $3)
            RETURNING *`,
            [username, email, passwordHash]
        );
        return result.rows[0];
    }

    async updateUser(id: number, updates: Partial<User>): Promise<User> {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields
            .map((field, index) => `${field} = $${index + 2}`)
            .join(', ');

        const result = await this.pool.query(
            `UPDATE users
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *`,
            [id, ...values]
        );
        return result.rows[0];
    }

    async deleteUser(id: number): Promise<void> {
        await this.pool.query(
            'DELETE FROM users WHERE id = $1',
            [id]
        );
    }

    async listUsers(options: {
        limit?: number;
        offset?: number;
        search?: string;
    }): Promise<User[]> {
        const conditions = [];
        const values = [];
        let paramCount = 1;

        if (options.search) {
            conditions.push(`(username ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
            values.push(`%${options.search}%`);
            paramCount++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await this.pool.query(
            `SELECT * FROM users ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            [...values, options.limit || 10, options.offset || 0]
        );

        return result.rows;
    }
} 