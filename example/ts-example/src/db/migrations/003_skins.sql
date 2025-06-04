-- Create enum for skin status
CREATE TYPE skin_status AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'FEATURED'
);

-- Create enum for skin type
CREATE TYPE skin_type AS ENUM (
    'THEME',
    'ANIMATION',
    'SOUND',
    'CUSTOM'
);

-- Create skins table
CREATE TABLE skins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    author_id INTEGER REFERENCES hosts(id) ON DELETE SET NULL,
    type skin_type NOT NULL,
    status skin_status NOT NULL DEFAULT 'DRAFT',
    price_icp DECIMAL(18,8) DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    config JSONB NOT NULL,
    preview_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create skin purchases table
CREATE TABLE skin_purchases (
    id SERIAL PRIMARY KEY,
    skin_id INTEGER REFERENCES skins(id) ON DELETE CASCADE,
    buyer_id INTEGER REFERENCES hosts(id) ON DELETE SET NULL,
    transaction_id VARCHAR(255),
    amount_icp DECIMAL(18,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create skin ratings table
CREATE TABLE skin_ratings (
    id SERIAL PRIMARY KEY,
    skin_id INTEGER REFERENCES skins(id) ON DELETE CASCADE,
    rater_id INTEGER REFERENCES hosts(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create skin collections table
CREATE TABLE skin_collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    curator_id INTEGER REFERENCES hosts(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create skin collection items table
CREATE TABLE skin_collection_items (
    collection_id INTEGER REFERENCES skin_collections(id) ON DELETE CASCADE,
    skin_id INTEGER REFERENCES skins(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, skin_id)
);

-- Create indexes
CREATE INDEX idx_skins_status ON skins(status);
CREATE INDEX idx_skins_type ON skins(type);
CREATE INDEX idx_skins_author ON skins(author_id);
CREATE INDEX idx_skin_purchases_skin ON skin_purchases(skin_id);
CREATE INDEX idx_skin_purchases_buyer ON skin_purchases(buyer_id);
CREATE INDEX idx_skin_ratings_skin ON skin_ratings(skin_id);
CREATE INDEX idx_skin_collections_curator ON skin_collections(curator_id);

-- Create updated_at triggers
CREATE TRIGGER update_skins_updated_at
    BEFORE UPDATE ON skins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skin_ratings_updated_at
    BEFORE UPDATE ON skin_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skin_collections_updated_at
    BEFORE UPDATE ON skin_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 