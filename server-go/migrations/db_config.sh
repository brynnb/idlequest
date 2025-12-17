#!/bin/bash
# Shared database configuration for migration scripts
# Source this file in other scripts: source "$(dirname "$0")/db_config.sh"

DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_NAME="${DB_NAME:-eqgo}"
DB_HOST="${DB_HOST:-127.0.0.1}"

# Build mysql command with or without password
if [ -n "$DB_PASS" ]; then
    MYSQL_CMD="mysql -u $DB_USER -p$DB_PASS -h $DB_HOST $DB_NAME"
else
    MYSQL_CMD="mysql -u $DB_USER -h $DB_HOST $DB_NAME"
fi

# Function to run a SQL command
run_sql() {
    $MYSQL_CMD -e "$1"
}

# Function to run SQL from stdin (for piped content)
run_sql_stdin() {
    $MYSQL_CMD
}
