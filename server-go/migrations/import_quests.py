#!/usr/bin/env python3
"""Import quest data from SQLite to MySQL"""

import sqlite3
import mysql.connector
import sys

def main():
    # Connect to SQLite
    sqlite_path = '../data/db/eq_data.db'
    print(f"Connecting to SQLite database: {sqlite_path}")
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to MySQL
    print("Connecting to MySQL database...")
    mysql_conn = mysql.connector.connect(
        host='127.0.0.1',
        user='root',
        password='',
        database='eqgo'
    )
    mysql_cursor = mysql_conn.cursor()
    
    # Fetch all quests from SQLite
    print("Fetching quests from SQLite...")
    sqlite_cursor.execute("SELECT zone, name, lua_content FROM quests")
    quests = sqlite_cursor.fetchall()
    print(f"Found {len(quests)} quests to import")
    
    # Insert into MySQL
    print("Importing into MySQL...")
    insert_query = """
        INSERT INTO quests (zone, name, lua_content)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE lua_content = VALUES(lua_content)
    """
    
    batch_size = 100
    for i in range(0, len(quests), batch_size):
        batch = quests[i:i+batch_size]
        mysql_cursor.executemany(insert_query, batch)
        mysql_conn.commit()
        print(f"Imported {min(i+batch_size, len(quests))}/{len(quests)} quests...")
    
    # Verify import
    mysql_cursor.execute("SELECT COUNT(*) FROM quests")
    count = mysql_cursor.fetchone()[0]
    print(f"\nImport complete! Total quests in MySQL: {count}")
    
    # Close connections
    sqlite_conn.close()
    mysql_conn.close()

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
