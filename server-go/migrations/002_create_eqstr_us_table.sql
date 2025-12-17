-- Migration: Create eqstr_us table for localized strings (spell descriptions, etc.)
-- Run this against your MySQL database: mysql -u root eqgo < migrations/002_create_eqstr_us_table.sql
CREATE TABLE IF NOT EXISTS eqstr_us (
    id INT PRIMARY KEY,
    text TEXT,
    INDEX idx_id (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- This table stores localized strings from the EQ client's eqstr_us.txt file.
-- These strings include spell descriptions, UI text, and other client-side text.
-- To import data, use the import_eqstr_us.sh script in this directory.