-- Create enum types
CREATE TYPE burger_state AS ENUM (
    'INITIAL',
    'PREPARING',
    'COOKING',
    'READY',
    'TRASH',
    'EAT',
    'FIREEXTINGUISH'
);

CREATE TYPE cohort_type AS ENUM (
    'REGULAR',
    'GHOST',
    'EVENT'
);

-- Create tables
CREATE TABLE burgers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state burger_state NOT NULL DEFAULT 'INITIAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE burger_ingredients (
    burger_id INTEGER REFERENCES burgers(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (burger_id, ingredient_id)
);

CREATE TABLE cohorts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type cohort_type NOT NULL DEFAULT 'REGULAR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hosts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    cohort_id INTEGER REFERENCES cohorts(id) ON DELETE SET NULL,
    is_ghost BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ban_appeals (
    id SERIAL PRIMARY KEY,
    host_id INTEGER REFERENCES hosts(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    expected_attendees INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_burgers_state ON burgers(state);
CREATE INDEX idx_hosts_ip ON hosts(ip_address);
CREATE INDEX idx_hosts_cohort ON hosts(cohort_id);
CREATE INDEX idx_ban_appeals_status ON ban_appeals(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_burgers_updated_at
    BEFORE UPDATE ON burgers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosts_updated_at
    BEFORE UPDATE ON hosts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at
    BEFORE UPDATE ON cohorts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ban_appeals_updated_at
    BEFORE UPDATE ON ban_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 