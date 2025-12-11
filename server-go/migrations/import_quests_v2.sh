#!/bin/bash
# Import quest data from SQLite to MySQL using CSV format

echo "Exporting quests from SQLite to CSV..."
sqlite3 ../data/db/eq_data.db <<EOF > /tmp/quests_export.csv
.mode csv
.headers off
SELECT zone, name, REPLACE(REPLACE(lua_content, CHAR(13), ''), CHAR(10), '\n') FROM quests;
EOF

echo "Creating MySQL LOAD DATA script..."
cat > /tmp/load_quests.sql <<'SQLEOF'
SET FOREIGN_KEY_CHECKS=0;
LOAD DATA LOCAL INFILE '/tmp/quests_export.csv'
INTO TABLE quests
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
(zone, name, lua_content);
SET FOREIGN_KEY_CHECKS=1;
SQLEOF

echo "Importing into MySQL..."
mysql --local-infile=1 -u root eqgo < /tmp/load_quests.sql 2>&1

# If LOAD DATA LOCAL doesn't work, fall back to Python
if [ $? -ne 0 ]; then
    echo "LOAD DATA LOCAL failed, using Python fallback..."
    python3 - <<'PYEOF'
import sqlite3
import subprocess
import sys

# Connect to SQLite
sqlite_conn = sqlite3.connect('../data/db/eq_data.db')
cursor = sqlite_conn.cursor()

# Fetch all quests
cursor.execute("SELECT zone, name, lua_content FROM quests")
quests = cursor.fetchall()
print(f"Found {len(quests)} quests")

# Import via mysql command line
for i, (zone, name, lua_content) in enumerate(quests):
    if i % 100 == 0:
        print(f"Progress: {i}/{len(quests)}")
    
    # Escape for SQL
    zone_esc = zone.replace("'", "''").replace("\\", "\\\\")
    name_esc = name.replace("'", "''").replace("\\", "\\\\")
    lua_esc = (lua_content or '').replace("'", "''").replace("\\", "\\\\")
    
    sql = f"INSERT INTO quests (zone, name, lua_content) VALUES ('{zone_esc}', '{name_esc}', '{lua_esc}') ON DUPLICATE KEY UPDATE lua_content=VALUES(lua_content);"
    
    result = subprocess.run(
        ['mysql', '-u', 'root', 'eqgo', '-e', sql],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"Error at row {i}: {result.stderr}", file=sys.stderr)
        sys.exit(1)

print(f"Imported all {len(quests)} quests")
sqlite_conn.close()
PYEOF
fi

echo ""
echo "Verifying import..."
mysql -u root eqgo -e "SELECT COUNT(*) as quest_count FROM quests;"
echo "Done!"
