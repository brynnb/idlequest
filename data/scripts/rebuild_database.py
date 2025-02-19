# The CSV files processed by this script come from SQL table dumps from The Al'Kabor Project:
# https://github.com/EQMacEmu/Server/tree/main/utils/sql/database_full
# This is an EverQuest emulator specifically for MacOS that maintains a comprehensive public database
# of the original game data. The SQL dumps should be converted to CSV format before using this script.

import csv
import sqlite3
import os
import json


def create_table_from_csv(cursor, csv_file, table_name):
    with open(csv_file, "r", encoding="utf-8") as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)  # Get column names from first row
        first_row = next(csv_reader)  # Get first row for type inference

        # Determine column types based on first row
        column_defs = []
        for i, (header, value) in enumerate(zip(headers, first_row)):
            # Try to determine if the value is numeric
            try:
                float(value)
                col_type = "INTEGER" if value.isdigit() else "REAL"
            except ValueError:
                col_type = "TEXT"

            # Special cases for known columns
            if header.lower() in ["id", "itemid", "zoneidnumber"]:
                col_type = "INTEGER PRIMARY KEY" if i == 0 else "INTEGER"
            elif header.lower() in [
                "name",
                "lore",
                "file",
                "filename",
                "short_name",
                "long_name",
            ]:
                col_type = "TEXT"

            column_defs.append(f'"{header}" {col_type}')

        # Create table
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {', '.join(column_defs)}
        )
        """
        cursor.execute(create_table_query)

        # Insert data
        placeholders = ",".join(["?" for _ in headers])
        insert_query = f"""
        INSERT INTO {table_name} ({', '.join([f'"{header}"' for header in headers])})
        VALUES ({placeholders})
        """

        # Insert the first row we used for type inference
        try:
            cursor.execute(insert_query, first_row)
        except sqlite3.Error as e:
            print(f"Error inserting first row in {table_name}: {e}")
            print(f"Problematic row: {first_row}")

        # Insert remaining rows
        for row in csv_reader:
            try:
                if len(row) == len(headers):  # Only insert if column count matches
                    cursor.execute(insert_query, row)
            except sqlite3.Error as e:
                print(f"Error inserting row in {table_name}: {e}")
                print(f"Problematic row: {row}")


def create_indices(cursor):
    # Create indices for commonly queried columns
    print("Creating indices...")
    indices = [
        "CREATE INDEX IF NOT EXISTS idx_items_id ON items(id)",
        "CREATE INDEX IF NOT EXISTS idx_items_name ON items(name)",
        "CREATE INDEX IF NOT EXISTS idx_lootdrop_entries_lootdrop_id ON lootdrop_entries(lootdrop_id)",
        "CREATE INDEX IF NOT EXISTS idx_lootdrop_entries_item_id ON lootdrop_entries(item_id)",
        "CREATE INDEX IF NOT EXISTS idx_loottable_entries_loottable_id ON loottable_entries(loottable_id)",
        "CREATE INDEX IF NOT EXISTS idx_loottable_entries_lootdrop_id ON loottable_entries(lootdrop_id)",
        "CREATE INDEX IF NOT EXISTS idx_npc_types_id ON npc_types(id)",
        "CREATE INDEX IF NOT EXISTS idx_npc_types_loottable_id ON npc_types(loottable_id)",
        "CREATE INDEX IF NOT EXISTS idx_zone_short_name ON zone(short_name)",
        "CREATE INDEX IF NOT EXISTS idx_zone_zoneidnumber ON zone(zoneidnumber)",
        "CREATE INDEX IF NOT EXISTS idx_zone_points_zone ON zone_points(zone)",
        "CREATE INDEX IF NOT EXISTS idx_zone_points_target_zone_id ON zone_points(target_zone_id)",
    ]

    for index_sql in indices:
        try:
            cursor.execute(index_sql)
        except sqlite3.Error as e:
            print(f"Error creating index: {e}")
            print(f"Problematic index: {index_sql}")


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.dirname(current_dir)
    db_file = os.path.join(data_dir, "db/eq_data.db")

    # Remove existing database if it exists
    if os.path.exists(db_file):
        os.remove(db_file)

    # Create new database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Process CSV files
    csv_files = {
        "items": "items.csv",
        "zone": "zone.csv",
        "loottable_entries": "loottable_entries.csv",
        "lootdrop_entries": "lootdrop_entries.csv",
        "lootdrop": "lootdrop.csv",
        "loottable": "loottable.csv",
        "spawngroup": "spawngroup.csv",
        "spawnentry": "spawnentry.csv",
        "npc_types": "npc_types.csv",
        "spawnlocation": "spawnlocation.csv",
        "spells": "spells.csv",
        "zone_points": "zone_points.csv",
    }

    for table_name, csv_filename in csv_files.items():
        csv_path = os.path.join(data_dir, "csv", csv_filename)
        if os.path.exists(csv_path):
            print(f"Processing {csv_filename}...")
            create_table_from_csv(cursor, csv_path, table_name)
        else:
            print(f"Warning: {csv_filename} not found")

    # Create eqstr_us table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS eqstr_us (
            id INTEGER PRIMARY KEY,
            text TEXT
        )
    """
    )

    # Process eqstr_us.txt
    eqstr_path = os.path.join(data_dir, "text/eqstr_us.txt")
    if os.path.exists(eqstr_path):
        print("Processing eqstr_us.txt...")
        with open(eqstr_path, "r") as file:
            content = file.read()
            import re

            pattern = r"(\d{3,})\s(.+?)(?=\s\d{3,}\s|\Z)"
            matches = re.findall(pattern, content)
            for id_num, text in matches:
                cursor.execute(
                    "INSERT OR REPLACE INTO eqstr_us (id, text) VALUES (?, ?)",
                    (int(id_num), text),
                )

    # Create zone_points table for adjacent zones with the correct schema
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS zone_points (
            id INTEGER PRIMARY KEY,
            zone TEXT,
            target_zone_id INTEGER,
            target_x REAL,
            target_y REAL,
            target_z REAL,
            target_heading INTEGER,
            number INTEGER,
            x REAL,
            y REAL,
            z REAL,
            heading INTEGER,
            min_expansion INTEGER DEFAULT -1,
            max_expansion INTEGER DEFAULT -1,
            content_flags TEXT,
            content_flags_disabled TEXT,
            is_virtual INTEGER DEFAULT 0,
            height INTEGER DEFAULT 0,
            width INTEGER DEFAULT 0
        )
    """
    )

    # Create indices for better query performance
    create_indices(cursor)

    conn.commit()
    conn.close()
    print("Database rebuild complete!")


if __name__ == "__main__":
    main()
