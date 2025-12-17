#!/bin/bash
# Import eqstr_us data from text file to MySQL
# Usage: ./import_eqstr_us.sh
# Requires: Python 3, MySQL client

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../../data"
EQSTR_FILE="$DATA_DIR/text/eqstr_us.txt"

# Source shared database config
source "$SCRIPT_DIR/db_config.sh"

if [ ! -f "$EQSTR_FILE" ]; then
    echo "Error: eqstr_us.txt not found at $EQSTR_FILE"
    exit 1
fi

echo "Parsing eqstr_us.txt and importing to MySQL..."

# Export DB vars for Python subprocess
export DB_USER DB_PASS DB_NAME DB_HOST

python3 - "$EQSTR_FILE" <<'PYEOF'
import re
import subprocess
import sys
import os

eqstr_file = sys.argv[1]

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

# Read the text file
with open(eqstr_file, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Regular expression to match the pattern: 3+ digit number followed by a space and text
pattern = r'(\d{3,})\s(.+?)(?=\s\d{3,}\s|\Z)'

matches = re.findall(pattern, content, re.DOTALL)
print(f"Found {len(matches)} entries")

# Build batch insert
batch_size = 500
total = len(matches)

for batch_start in range(0, total, batch_size):
    batch_end = min(batch_start + batch_size, total)
    batch = matches[batch_start:batch_end]
    
    values = []
    for id_num, text in batch:
        text_clean = text.strip().replace("\\", "\\\\").replace("'", "''")
        if len(text_clean) > 65000:
            text_clean = text_clean[:65000]
        values.append(f"({int(id_num)}, '{text_clean}')")
    
    sql = f"INSERT INTO eqstr_us (id, text) VALUES {','.join(values)} ON DUPLICATE KEY UPDATE text=VALUES(text);"
    
    result = run_mysql(sql)
    
    if result.returncode != 0:
        print(f"Error at batch {batch_start}-{batch_end}: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    
    print(f"Progress: {batch_end}/{total}")

print(f"Successfully imported {total} entries")
PYEOF

echo ""
echo "Verifying import..."
run_sql "SELECT COUNT(*) as eqstr_count FROM eqstr_us;"
echo "Done!"
