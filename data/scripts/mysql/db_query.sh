#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source the credentials file
source "$SCRIPT_DIR/db_credentials.sh"

# Show databases
echo "=== DATABASES ==="
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null

# Show tables in the specified database
echo -e "\n=== TABLES IN $DB_NAME ==="
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SHOW TABLES;" 2>/dev/null

# Show launcher table if it exists
echo -e "\n=== LAUNCHER TABLE STRUCTURE ==="
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "DESCRIBE launcher;" 2>/dev/null

# Show launcher_zones table if it exists
echo -e "\n=== LAUNCHER_ZONES TABLE STRUCTURE ==="
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "DESCRIBE launcher_zones;" 2>/dev/null

# Sample data from launcher table if it exists
echo -e "\n=== LAUNCHER SAMPLE DATA ==="
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SELECT * FROM launcher LIMIT 5;" 2>/dev/null

# Sample data from launcher_zones table if it exists
echo -e "\n=== LAUNCHER_ZONES SAMPLE DATA ==="
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SELECT * FROM launcher_zones LIMIT 5;" 2>/dev/null 