#!/bin/bash
# Import quest data from SQLite to MySQL using CSV format

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared database config
source "$SCRIPT_DIR/db_config.sh"

echo "Exporting quests from SQLite to CSV..."
sqlite3 "$SCRIPT_DIR/../data/db/eq_data.db" <<EOF > /tmp/quests_export.csv
.mode csv
.headers off
SELECT zone, name, REPLACE(REPLACE(lua_content, CHAR(13), ''), CHAR(10), '\n') FROM quests;
EOF

echo "Creating MySQL LOAD DATA script..."
cat > /tmp/load_quests.sql <<SQLEOF
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
$MYSQL_CMD --local-infile=1 < /tmp/load_quests.sql 2>&1

# If LOAD DATA LOCAL doesn't work, fall back to Python
if [ $? -ne 0 ]; then
    echo "LOAD DATA LOCAL failed, using Python fallback..."
    
    # Export DB vars for Python subprocess
    export DB_USER DB_PASS DB_NAME DB_HOST
    
    python3 - "$SCRIPT_DIR" <<'PYEOF'
import sqlite3
import subprocess
import sys
import os

script_dir = sys.argv[1]

# Get DB config from environment
db_user = os.environ.get('DB_USER', 'root')
db_pass = os.environ.get('DB_PASS', '')
db_name = os.environ.get('DB_NAME', 'eqgo')
db_host = os.environ.get('DB_HOST', '127.0.0.1')

def run_mysql(sql):
    cmd = ['mysql', '-u', db_user, '-h', db_host, db_name, '-e', sql]
    if db_pass:
        cmd.insert(2, f'-p{db_pass}')
    return subprocess.run(cmd, capture_output=True, text=True)

# Connect to SQLite
sqlite_conn = sqlite3.connect(f'{script_dir}/../data/db/eq_data.db')
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
    
    result = run_mysql(sql)
    
    if result.returncode != 0:
        print(f"Error at row {i}: {result.stderr}", file=sys.stderr)
        sys.exit(1)

print(f"Imported all {len(quests)} quests")
sqlite_conn.close()
PYEOF
fi

echo ""
echo "Verifying import..."
run_sql "SELECT COUNT(*) as quest_count FROM quests;"
echo "Done!"
