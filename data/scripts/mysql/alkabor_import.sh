#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source the credentials file
source "$SCRIPT_DIR/db_credentials.sh"

PROJECT_ROOT="$( cd "$SCRIPT_DIR/../../.." && pwd )"
IMPORT_DIR="$PROJECT_ROOT/data/db/alkabor-import"

echo "=== Alkabor Database Import Script ==="
echo "Script directory: $SCRIPT_DIR"
echo "Project root: $PROJECT_ROOT"
echo "Import directory: $IMPORT_DIR"

# Check if the import directory exists
if [ ! -d "$IMPORT_DIR" ]; then
  echo "Error: Import directory not found: $IMPORT_DIR"
  exit 1
fi

# Connect to MySQL and drop all tables
echo "Dropping all tables from database..."

# Get table list
TABLES=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SHOW TABLES;" 2>/dev/null | grep -v "Tables_in_")

if [ -n "$TABLES" ]; then
  echo "Found tables to drop: $(echo $TABLES | wc -w) tables"
  
  # Disable foreign key checks and drop all tables
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SET FOREIGN_KEY_CHECKS = 0;"
  
  # Drop each table
  for TABLE in $TABLES; do
    echo "Dropping table: $TABLE"
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "DROP TABLE IF EXISTS \`$TABLE\`;"
  done
  
  # Re-enable foreign key checks
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SET FOREIGN_KEY_CHECKS = 1;"
  
  echo "All tables dropped successfully."
else
  echo "No tables found to drop."
fi

# Import SQL files in the specified order
SQL_FILES=(
  "$IMPORT_DIR/alkabor_2024-08-28-14:15.sql"
  "$IMPORT_DIR/data_tables_2024-08-28-14:15.sql"
  "$IMPORT_DIR/login_tables_2024-08-28-14:15.sql"
  "$IMPORT_DIR/player_tables_2024-08-28-14:15.sql"
)

# Import each SQL file
for SQL_FILE in "${SQL_FILES[@]}"; do
  if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found: $SQL_FILE"
    continue
  fi
  
  echo "Importing data from $SQL_FILE..."
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < "$SQL_FILE"
  
  # Check if the import was successful
  if [ $? -eq 0 ]; then
    echo "Import of $SQL_FILE completed successfully."
  else
    echo "Error importing $SQL_FILE."
    exit 1
  fi
done

# Show tables that were created
echo -e "\nTables in database:"
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SHOW TABLES;" 2>/dev/null

echo "Alkabor database import complete!" 