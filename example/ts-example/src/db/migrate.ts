import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'fishburger'
});

async function runMigrations() {
    const client = await pool.connect();
    try {
        // Create migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Get list of migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        // Get executed migrations
        const { rows: executedMigrations } = await client.query(
            'SELECT name FROM migrations'
        );
        const executedNames = new Set(executedMigrations.map(m => m.name));

        // Run pending migrations
        for (const file of files) {
            if (!executedNames.has(file)) {
                console.log(`Running migration: ${file}`);
                const sql = fs.readFileSync(
                    path.join(migrationsDir, file),
                    'utf8'
                );

                await client.query('BEGIN');
                try {
                    await client.query(sql);
                    await client.query(
                        'INSERT INTO migrations (name) VALUES ($1)',
                        [file]
                    );
                    await client.query('COMMIT');
                    console.log(`Completed migration: ${file}`);
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                }
            }
        }

        console.log('All migrations completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    runMigrations();
}

export { runMigrations }; 