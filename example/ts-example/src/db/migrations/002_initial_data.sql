-- Insert initial ingredients
INSERT INTO ingredients (name, price) VALUES
    ('Fish Patty', 5.99),
    ('Bun', 1.99),
    ('Lettuce', 0.99),
    ('Tomato', 0.99),
    ('Cheese', 1.49),
    ('Special Sauce', 0.99),
    ('Pickles', 0.99),
    ('Onions', 0.99),
    ('Bacon', 2.49),
    ('Avocado', 1.99);

-- Insert initial cohorts
INSERT INTO cohorts (name, type) VALUES
    ('Regular Players', 'REGULAR'),
    ('Ghost Players', 'GHOST'),
    ('PAX East 2024', 'EVENT'),
    ('Otakon 2024', 'EVENT'),
    ('Comic-Con 2024', 'EVENT');

-- Insert some sample burgers
INSERT INTO burgers (name, state) VALUES
    ('Classic Fish Burger', 'INITIAL'),
    ('Deluxe Fish Burger', 'INITIAL'),
    ('Spicy Fish Burger', 'INITIAL');

-- Add ingredients to burgers
INSERT INTO burger_ingredients (burger_id, ingredient_id, quantity) VALUES
    -- Classic Fish Burger
    (1, 1, 1), -- Fish Patty
    (1, 2, 1), -- Bun
    (1, 3, 1), -- Lettuce
    (1, 4, 1), -- Tomato
    (1, 5, 1), -- Cheese
    (1, 6, 1), -- Special Sauce
    
    -- Deluxe Fish Burger
    (2, 1, 1), -- Fish Patty
    (2, 2, 1), -- Bun
    (2, 3, 2), -- Double Lettuce
    (2, 4, 2), -- Double Tomato
    (2, 5, 2), -- Double Cheese
    (2, 6, 1), -- Special Sauce
    (2, 9, 2), -- Double Bacon
    (2, 10, 1), -- Avocado
    
    -- Spicy Fish Burger
    (3, 1, 1), -- Fish Patty
    (3, 2, 1), -- Bun
    (3, 3, 1), -- Lettuce
    (3, 4, 1), -- Tomato
    (3, 5, 1), -- Cheese
    (3, 6, 2), -- Double Special Sauce
    (3, 7, 2); -- Double Pickles 