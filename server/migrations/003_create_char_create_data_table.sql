-- Migration: Create char_create_data table for character creation screen text
-- This stores deity names/descriptions, city names, and race/class descriptions
CREATE TABLE IF NOT EXISTS char_create_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    -- 'deity', 'city', 'race', 'class', 'race_class_combo'
    name VARCHAR(100) NOT NULL,
    -- Display name (e.g., "AGNOSTIC", "ERUDIN")
    description TEXT,
    -- Full description text
    eqstr_id_start INT,
    -- Starting eqstr_us ID (for reference)
    eqstr_id_end INT,
    -- Ending eqstr_us ID (for reference)
    game_id INT,
    -- Game ID if applicable (deity ID, race ID, etc.)
    INDEX idx_category (category),
    INDEX idx_game_id (game_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;