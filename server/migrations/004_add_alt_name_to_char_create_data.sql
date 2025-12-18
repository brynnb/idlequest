-- Add alt_name column to char_create_data table for deity alternate names (e.g., "THE PRINCE OF HATE")
ALTER TABLE char_create_data
ADD COLUMN alt_name VARCHAR(100)
AFTER name;