# MySQL Scripts

This directory contains utility scripts for working with the MySQL database.

## Available Scripts

### db_credentials.sh

Contains the database connection details used by all other scripts. If you need to change the database connection settings, modify this file only.

```bash
# Database connection details
export DB_HOST="0.0.0.0"
export DB_PORT="3306"
export DB_USER="user_name"
export DB_PASSWORD="user_password"
export DB_NAME="database_name"
```

### alkabor_import.sh

Drops all existing tables in the database and imports the four SQL files from the `/data/db/alkabor-import` directory in the following order:

1. alkabor_2024-08-28-14:15.sql
2. data_tables_2024-08-28-14:15.sql
3. login_tables_2024-08-28-14:15.sql
4. player_tables_2024-08-28-14:15.sql

Usage:

```bash
./alkabor_import.sh
```

### db_connect.sh

A simple script to connect to the MySQL database.

Usage:

```bash
./db_connect.sh
```

### db_query.sh

Runs various queries to show database information, table structures, and sample data.

Usage:

```bash
./db_query.sh
```

### start.sh

Starts the server in the background and then the client. When the client is stopped, it also stops the server.

Usage:

```bash
./start.sh
```

## Database Connection Details

All scripts source their database connection details from `db_credentials.sh`. To change the connection details for all scripts at once, simply modify the variables in that file.
