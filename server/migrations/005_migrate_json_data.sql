-- Migration to move static JSON data into MySQL
-- Created: 2026-01-03

-- 1. Races Table
CREATE TABLE IF NOT EXISTS races (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(10),
    bitmask INT,
    no_coin TINYINT DEFAULT 0,
    is_playable TINYINT DEFAULT 0
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(10),
    bitmask INT,
    create_points INT DEFAULT 0
);

-- 3. Combination Descriptions Table
CREATE TABLE IF NOT EXISTS combination_descriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    race_id INT NOT NULL,
    deity_id INT NOT NULL,
    description TEXT
);

-- 4. Zone Descriptions Table
CREATE TABLE IF NOT EXISTS zone_descriptions (
    zone_id INT PRIMARY KEY,
    description TEXT,
    welcome TEXT
);
