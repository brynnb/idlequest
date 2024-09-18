import csv
import sqlite3
import os

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Path to your CSV file and SQLite database
csv_file = os.path.join(current_dir, '', 'spells.csv')
db_file = os.path.join(current_dir, 'eq_data.db')

# Check if the CSV file exists, if not, prompt for the correct path
if not os.path.exists(csv_file):
    print(f"Error: {csv_file} not found.")
    csv_file = input("Please enter the correct path to spells.csv: ")
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found. Exiting.")
        exit(1)

# Connect to the SQLite database
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Read the CSV file to get column names
with open(csv_file, 'r') as file:
    csv_reader = csv.reader(file)
    headers = next(csv_reader)

# Create the spells table
create_table_query = f"""
CREATE TABLE IF NOT EXISTS spells (
    {', '.join([f'"{header}" TEXT' for header in headers])}
)
"""
cursor.execute(create_table_query)

# Prepare the INSERT query
insert_query = f"""
INSERT INTO spells ({', '.join([f'"{header}"' for header in headers])})
VALUES ({', '.join(['?' for _ in headers])})
"""

# Read and insert data from the CSV file
with open(csv_file, 'r') as file:
    csv_reader = csv.reader(file)
    next(csv_reader)  # Skip the header row
    for row in csv_reader:
        cursor.execute(insert_query, row)

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Spells data has been successfully added to the database.")