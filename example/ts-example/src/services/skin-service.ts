import { Pool } from 'pg';
import { validate } from 'jsonschema';
import skinSchema from '../config/skin-schema.json';
import { ICPClient } from './icp-client';

interface Skin {
    id: number;
    name: string;
    description: string;
    author_id: number;
    type: 'THEME' | 'ANIMATION' | 'SOUND' | 'CUSTOM';
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED';
    price_icp: number;
    downloads: number;
    rating: number;
    config: any;
    preview_url: string;
    created_at: Date;
    updated_at: Date;
}

export class SkinService {
    private pool: Pool;
    private icpClient: ICPClient;

    constructor(pool: Pool, icpClient: ICPClient) {
        this.pool = pool;
        this.icpClient = icpClient;
    }

    async createSkin(skin: Omit<Skin, 'id' | 'created_at' | 'updated_at'>): Promise<Skin> {
        // Validate skin configuration against schema
        const validation = validate(skin.config, skinSchema);
        if (!validation.valid) {
            throw new Error(`Invalid skin configuration: ${validation.errors.join(', ')}`);
        }

        const result = await this.pool.query(
            `INSERT INTO skins (
                name, description, author_id, type, status, price_icp,
                config, preview_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                skin.name,
                skin.description,
                skin.author_id,
                skin.type,
                skin.status,
                skin.price_icp,
                skin.config,
                skin.preview_url
            ]
        );

        return result.rows[0];
    }

    async getSkin(id: number): Promise<Skin | null> {
        const result = await this.pool.query(
            'SELECT * FROM skins WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async listSkins(options: {
        type?: string;
        status?: string;
        author_id?: number;
        limit?: number;
        offset?: number;
    }): Promise<Skin[]> {
        const conditions = [];
        const values = [];
        let paramCount = 1;

        if (options.type) {
            conditions.push(`type = $${paramCount}`);
            values.push(options.type);
            paramCount++;
        }

        if (options.status) {
            conditions.push(`status = $${paramCount}`);
            values.push(options.status);
            paramCount++;
        }

        if (options.author_id) {
            conditions.push(`author_id = $${paramCount}`);
            values.push(options.author_id);
            paramCount++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await this.pool.query(
            `SELECT * FROM skins ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            [...values, options.limit || 10, options.offset || 0]
        );

        return result.rows;
    }

    async purchaseSkin(skinId: number, buyerId: number): Promise<{
        success: boolean;
        transactionId?: string;
        error?: string;
    }> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Get skin details
            const skinResult = await client.query(
                'SELECT * FROM skins WHERE id = $1 AND status = $2',
                [skinId, 'APPROVED']
            );
            const skin = skinResult.rows[0];

            if (!skin) {
                throw new Error('Skin not found or not available for purchase');
            }

            // Check if already purchased
            const purchaseResult = await client.query(
                'SELECT * FROM skin_purchases WHERE skin_id = $1 AND buyer_id = $2',
                [skinId, buyerId]
            );

            if (purchaseResult.rows.length > 0) {
                throw new Error('Skin already purchased');
            }

            // Process ICP payment
            const paymentResult = await this.icpClient.processPayment({
                amount: skin.price_icp,
                from: buyerId.toString(),
                to: skin.author_id.toString(),
                description: `Purchase of skin: ${skin.name}`
            });

            if (!paymentResult.success) {
                throw new Error(`Payment failed: ${paymentResult.error}`);
            }

            // Record purchase
            await client.query(
                `INSERT INTO skin_purchases (
                    skin_id, buyer_id, transaction_id, amount_icp
                ) VALUES ($1, $2, $3, $4)`,
                [skinId, buyerId, paymentResult.transactionId, skin.price_icp]
            );

            // Increment download count
            await client.query(
                'UPDATE skins SET downloads = downloads + 1 WHERE id = $1',
                [skinId]
            );

            await client.query('COMMIT');

            return {
                success: true,
                transactionId: paymentResult.transactionId
            };
        } catch (error) {
            await client.query('ROLLBACK');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        } finally {
            client.release();
        }
    }

    async rateSkin(skinId: number, raterId: number, rating: number, comment?: string): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Check if already rated
            const existingRating = await client.query(
                'SELECT * FROM skin_ratings WHERE skin_id = $1 AND rater_id = $2',
                [skinId, raterId]
            );

            if (existingRating.rows.length > 0) {
                // Update existing rating
                await client.query(
                    `UPDATE skin_ratings
                    SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE skin_id = $3 AND rater_id = $4`,
                    [rating, comment, skinId, raterId]
                );
            } else {
                // Create new rating
                await client.query(
                    `INSERT INTO skin_ratings (
                        skin_id, rater_id, rating, comment
                    ) VALUES ($1, $2, $3, $4)`,
                    [skinId, raterId, rating, comment]
                );
            }

            // Update average rating
            await client.query(
                `UPDATE skins
                SET rating = (
                    SELECT AVG(rating)::numeric(3,2)
                    FROM skin_ratings
                    WHERE skin_id = $1
                )
                WHERE id = $1`,
                [skinId]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async createCollection(name: string, description: string, curatorId: number): Promise<number> {
        const result = await this.pool.query(
            `INSERT INTO skin_collections (
                name, description, curator_id
            ) VALUES ($1, $2, $3)
            RETURNING id`,
            [name, description, curatorId]
        );
        return result.rows[0].id;
    }

    async addSkinToCollection(collectionId: number, skinId: number, position: number): Promise<void> {
        await this.pool.query(
            `INSERT INTO skin_collection_items (
                collection_id, skin_id, position
            ) VALUES ($1, $2, $3)
            ON CONFLICT (collection_id, skin_id)
            DO UPDATE SET position = $3`,
            [collectionId, skinId, position]
        );
    }

    async getCollection(collectionId: number): Promise<{
        id: number;
        name: string;
        description: string;
        curator_id: number;
        is_featured: boolean;
        skins: Skin[];
    }> {
        const result = await this.pool.query(
            `SELECT c.*, 
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'name', s.name,
                        'description', s.description,
                        'type', s.type,
                        'status', s.status,
                        'price_icp', s.price_icp,
                        'downloads', s.downloads,
                        'rating', s.rating,
                        'preview_url', s.preview_url
                    ) ORDER BY sci.position
                ) as skins
            FROM skin_collections c
            LEFT JOIN skin_collection_items sci ON c.id = sci.collection_id
            LEFT JOIN skins s ON sci.skin_id = s.id
            WHERE c.id = $1
            GROUP BY c.id`,
            [collectionId]
        );

        return result.rows[0];
    }
} 