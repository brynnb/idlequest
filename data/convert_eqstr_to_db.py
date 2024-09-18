import re
import sqlite3
import os

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Connect to the SQLite database (or create it if it doesn't exist)
db_path = os.path.join(script_dir, 'eq_data.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create the table if it doesn't exist
cursor.execute('''
    CREATE TABLE IF NOT EXISTS eqstr_us (
        id INTEGER PRIMARY KEY,
        text TEXT
    )
''')

# Read the text file
txt_path = os.path.join(script_dir, 'eqstr_us.txt')
try:
    with open(txt_path, 'r') as file:
        content = file.read()
except FileNotFoundError:
    print(f"Error: File not found at {txt_path}")
    print("Current working directory:", os.getcwd())
    print("Script directory:", script_dir)
    conn.close()
    exit(1)

# Regular expression to match the pattern: 3+ digit number followed by a space and text
pattern = r'(\d{3,})\s(.+?)(?=\s\d{3,}\s|\Z)'

# Find all matches
matches = re.findall(pattern, content)

# Insert matches into the database
for match in matches:
    id_num, text = match
    cursor.execute('INSERT OR REPLACE INTO eqstr_us (id, text) VALUES (?, ?)', (int(id_num), text))

# Commit changes and close the connection
conn.commit()
conn.close()

print("Data has been successfully added to the eqstr_us table in the database.")