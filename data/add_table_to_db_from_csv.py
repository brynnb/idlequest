import csv
import sqlite3
import os

current_dir = os.path.dirname(os.path.abspath(__file__))

csv_file = os.path.join(current_dir, '', 'zone.csv')
db_file = os.path.join(current_dir, 'eq_data.db')
table_name = os.path.splitext(os.path.basename(csv_file))[0]

if not os.path.exists(csv_file):
    print(f"Error: {csv_file} not found.")
    csv_file = input(f"Please enter the correct path to {table_name}.csv: ")
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found. Exiting.")
        exit(1)

conn = sqlite3.connect(db_file)
cursor = conn.cursor()

with open(csv_file, 'r') as file:
    csv_reader = csv.reader(file)
    headers = next(csv_reader)

# cursor.execute(f"DROP TABLE IF EXISTS {table_name}")

# create_table_query = f"""
# CREATE TABLE {table_name} (
#     {', '.join([f'"{header}" TEXT' for header in headers])}
# )
# """
# cursor.execute(create_table_query)

insert_query = f"""
INSERT INTO {table_name} ({', '.join([f'"{header}"' for header in headers])})
VALUES ({', '.join(['?' for _ in headers])})
"""

print(f"Number of headers: {len(headers)}")

with open(csv_file, 'r') as file:
    csv_reader = csv.reader(file)
    next(csv_reader)  # Skip header row
    for line_number, row in enumerate(csv_reader, start=2):  # Start at 2 because we skipped the header
        # print(f"Line {line_number}: Number of values in this row: {len(row)}")
        try:
            cursor.execute(insert_query, row)
        except sqlite3.Error as e:
            print(f"Error on line {line_number}: {e}")
            print(f"Problematic row: {row}")
            break  # Stop processing after the first error

conn.commit()
conn.close()

print(f"{table_name} data has been successfully added to the database.")