-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Create trigger for updating timestamps
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Add foreign key constraints to existing tables
ALTER TABLE skins
    ADD CONSTRAINT fk_skins_author
    FOREIGN KEY (author_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE skin_collections
    ADD CONSTRAINT fk_collections_curator
    FOREIGN KEY (curator_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE skin_purchases
    ADD CONSTRAINT fk_purchases_buyer
    FOREIGN KEY (buyer_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE skin_ratings
    ADD CONSTRAINT fk_ratings_rater
    FOREIGN KEY (rater_id)
    REFERENCES users(id)
    ON DELETE CASCADE; 