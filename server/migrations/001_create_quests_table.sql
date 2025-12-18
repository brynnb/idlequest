-- Migration: Create quests table for NPC dialogue LUA scripts
-- Run this against your MySQL database: mysql -u root eqgo < migrations/001_create_quests_table.sql

CREATE TABLE IF NOT EXISTS quests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    zone VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    lua_content MEDIUMTEXT,
    UNIQUE KEY unique_zone_name (zone, name),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- To import data from the SQLite eq_data.db quests table, you can use a tool like:
-- sqlite3 data/db/eq_data.db ".mode csv" ".headers on" "SELECT zone, name, lua_content FROM quests;" > quests_export.csv
-- Then use LOAD DATA INFILE or a script to import into MySQL
