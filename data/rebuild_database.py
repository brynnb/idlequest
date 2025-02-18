import csv
import sqlite3
import os
import json


def create_table_from_csv(cursor, csv_file, table_name):
    with open(csv_file, "r") as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)

        # Create table
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {', '.join([f'"{header}" TEXT' for header in headers])}
        )
        """
        cursor.execute(create_table_query)

        # Insert data
        insert_query = f"""
        INSERT INTO {table_name} ({', '.join([f'"{header}"' for header in headers])})
        VALUES ({', '.join(['?' for _ in headers])})
        """

        for row in csv_reader:
            try:
                cursor.execute(insert_query, row)
            except sqlite3.Error as e:
                print(f"Error inserting row in {table_name}: {e}")
                print(f"Problematic row: {row}")


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_file = os.path.join(current_dir, "eq_data.db")

    # Remove existing database if it exists
    if os.path.exists(db_file):
        os.remove(db_file)

    # Create new database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Process CSV files
    csv_files = {
        "zone": "zone.csv",
        "loottable_entries": "loottable_entries.csv",
        "lootdrop": "lootdrop.csv",
        "loottable": "loottable.csv",
        "spawngroup": "spawngroup.csv",
        "spawnentry": "spawnentry.csv",
        "npc_types": "npc_types.csv",
        "spawnlocation": "spawnlocation.csv",
        "spells": "spells.csv",
    }

    for table_name, csv_filename in csv_files.items():
        csv_path = os.path.join(current_dir, csv_filename)
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
    eqstr_path = os.path.join(current_dir, "eqstr_us.txt")
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

    conn.commit()
    conn.close()
    print("Database rebuild complete!")


if __name__ == "__main__":
    main()
