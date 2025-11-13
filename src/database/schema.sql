-- Wave Reader Premium Modding Platform Database Schema
-- PostgreSQL 14+

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    premium_status BOOLEAN DEFAULT false,
    user_type VARCHAR(20) DEFAULT 'free' CHECK (user_type IN ('free', 'premium', 'moderator', 'admin')),
    token_balance INTEGER DEFAULT 0 CHECK (token_balance >= 0),
    wallet_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_premium_status ON users(premium_status);

-- Mods table
CREATE TABLE IF NOT EXISTS mods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    component_name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    install_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    token_price INTEGER DEFAULT 0,
    is_whitelisted BOOLEAN DEFAULT false,
    dotcms_content_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_mods_author ON mods(author_id);
CREATE INDEX idx_mods_status ON mods(status);
CREATE INDEX idx_mods_component ON mods(component_name);
CREATE INDEX idx_mods_whitelisted ON mods(is_whitelisted);

-- Token Ledger (with warehousing for all transactions)
CREATE TABLE IF NOT EXISTS token_ledger (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'donation', 'mod_install', 'mod_uninstall', 
        'admin_grant', 'payout', 'charity_donation'
    )),
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    blockchain_tx_hash VARCHAR(255),
    locked_until TIMESTAMP,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_from_user ON token_ledger(from_user_id);
CREATE INDEX idx_ledger_to_user ON token_ledger(to_user_id);
CREATE INDEX idx_ledger_type ON token_ledger(transaction_type);
CREATE INDEX idx_ledger_locked ON token_ledger(is_locked, locked_until);

-- Mod Installs tracking
CREATE TABLE IF NOT EXISTS mod_installs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mod_id INTEGER NOT NULL REFERENCES mods(id) ON DELETE CASCADE,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uninstalled_at TIMESTAMP,
    token_lock_release_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, mod_id, installed_at)
);

CREATE INDEX idx_mod_installs_user ON mod_installs(user_id);
CREATE INDEX idx_mod_installs_mod ON mod_installs(mod_id);
CREATE INDEX idx_mod_installs_active ON mod_installs(is_active);
CREATE INDEX idx_mod_installs_lock_date ON mod_installs(token_lock_release_date);

-- Blockchain Mirror (for multi-chain support)
CREATE TABLE IF NOT EXISTS blockchain_mirror (
    id SERIAL PRIMARY KEY,
    ledger_id INTEGER NOT NULL REFERENCES token_ledger(id) ON DELETE CASCADE,
    blockchain VARCHAR(50) NOT NULL CHECK (blockchain IN ('solana', 'ethereum', 'polygon', 'bitcoin', 'golem')),
    tx_hash VARCHAR(255) NOT NULL,
    block_number BIGINT,
    confirmation_count INTEGER DEFAULT 0,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'confirmed', 'failed')),
    UNIQUE(ledger_id, blockchain)
);

CREATE INDEX idx_blockchain_ledger ON blockchain_mirror(ledger_id);
CREATE INDEX idx_blockchain_type ON blockchain_mirror(blockchain);
CREATE INDEX idx_blockchain_tx ON blockchain_mirror(tx_hash);

-- Content Warehouse (dotCMS backup + versioning)
CREATE TABLE IF NOT EXISTS content_warehouse (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mod_id INTEGER REFERENCES mods(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    parent_version_id INTEGER REFERENCES content_warehouse(id),
    dotcms_version_id VARCHAR(255),
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_warehouse_user ON content_warehouse(user_id);
CREATE INDEX idx_warehouse_mod ON content_warehouse(mod_id);
CREATE INDEX idx_warehouse_type ON content_warehouse(content_type);
CREATE INDEX idx_warehouse_current ON content_warehouse(is_current);

-- Component Whitelist (moddable components)
CREATE TABLE IF NOT EXISTS component_whitelist (
    id SERIAL PRIMARY KEY,
    component_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_whitelist_enabled ON component_whitelist(is_enabled);

-- Charity Donations tracking (individual portfolios)
CREATE TABLE IF NOT EXISTS charity_donations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio VARCHAR(50) NOT NULL CHECK (portfolio IN ('developer', 'w3c_wai', 'aspca', 'audubon')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    tokens_granted INTEGER DEFAULT 0,
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50), -- solana, paypal, thegivingblock, etc
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_donations_user ON charity_donations(user_id);
CREATE INDEX idx_donations_created ON charity_donations(created_at);

-- Mod Reviews (dev team approval)
CREATE TABLE IF NOT EXISTS mod_reviews (
    id SERIAL PRIMARY KEY,
    mod_id INTEGER NOT NULL REFERENCES mods(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    comments TEXT,
    pii_scan_results JSONB,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_mod ON mod_reviews(mod_id);
CREATE INDEX idx_reviews_status ON mod_reviews(status);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mods_updated_at BEFORE UPDATE ON mods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data for component whitelist
INSERT INTO component_whitelist (component_name, description, is_enabled) VALUES
    ('wave-tabs', 'Tab navigation component', true),
    ('settings', 'Settings panel component', true),
    ('selector-input', 'Selector input component', true),
    ('scan-for-input', 'Input scanning component', true)
ON CONFLICT (component_name) DO NOTHING;

