import os
import sqlite3

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Connect to the SQLite database (or create it if it doesn't exist)
db_path = os.path.join(script_dir, 'eq_data.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create the table if it doesn't exist
cursor.execute('''
    CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone TEXT,
        name TEXT,
        lua_content TEXT,
        UNIQUE(zone, name)
    )
''')

# Path to the quests directory
quests_dir = os.path.join(script_dir, 'quests')

def read_file(file_path):
    encodings = ['utf-8', 'latin-1', 'ascii']
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as file:
                return file.read()
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Unable to read file {file_path} with any of the attempted encodings")

# Iterate over all folders in the quests directory
for zone in os.listdir(quests_dir):
    zone_path = os.path.join(quests_dir, zone)
    if os.path.isdir(zone_path):
        # Iterate over all .lua files in the zone folder
        for lua_file in os.listdir(zone_path):
            if lua_file.endswith('.lua'):
                name = os.path.splitext(lua_file)[0]
                file_path = os.path.join(zone_path, lua_file)
                
                # Read the content of the .lua file
                lua_content = read_file(file_path)
                
                # Insert or replace the data in the database
                cursor.execute('''
                    INSERT OR REPLACE INTO quests (zone, name, lua_content)
                    VALUES (?, ?, ?)
                ''', (zone, name, lua_content))

# Commit changes and close the connection
conn.commit()
conn.close()

print("LUA scripts have been successfully added to the quests table in the database.")
