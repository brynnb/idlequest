# This script is used to create a SQLite database from a CSV file since relying on JSON files is not practical for large datasets.
import csv
import sqlite3
import sys


def create_table_from_csv(csv_file, db_file):
    # Connect to SQLite database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Read CSV file
    with open(csv_file, "r") as f:
        csv_reader = csv.reader(f)
        headers = next(csv_reader)  # Get column names from the first row

    # Drop the existing table if it exists
    cursor.execute("DROP TABLE IF EXISTS items")

    # Create table
    create_table_sql = (
        f"CREATE TABLE items ({', '.join([f'{header} TEXT' for header in headers])})"
    )
    cursor.execute(create_table_sql)

    # Import data
    with open(csv_file, "r") as f:
        csv_reader = csv.reader(f)
        next(csv_reader)  # Skip the header row
        cursor.executemany(
            f"INSERT INTO items VALUES ({','.join(['?' for _ in headers])})", csv_reader
        )

    # Commit changes and close connection
    conn.commit()
    conn.close()

    print(f"Table created and data imported from {csv_file} to {db_file}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python create_db_from_csv.py <csv_file> <db_file>")
        sys.exit(1)

    csv_file = sys.argv[1]
    db_file = sys.argv[2]
    create_table_from_csv(csv_file, db_file)
