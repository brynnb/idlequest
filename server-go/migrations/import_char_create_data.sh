#!/bin/bash
# Import character creation data from eqstr_us.txt into MySQL char_create_data table

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EQSTR_FILE="$SCRIPT_DIR/../../data/text/eqstr_us.txt"

# Source shared database config
source "$SCRIPT_DIR/db_config.sh"

echo "Importing character creation data..."

# Clear existing data
run_sql "DELETE FROM char_create_data;"

# Use Python to parse and generate SQL (no mysql connector needed)
python3 - "$EQSTR_FILE" << 'PYTHON_SCRIPT' | run_sql_stdin
import sys
import re

filepath = sys.argv[1]

# Deity data: game_id -> (alt_name from 1592-1608, full_name, description_start, description_end)
# Alt names are the titles like "THE PRINCE OF HATE"
# Full names are the deity names like "Innoruuk"
DEITIES = {
    0:   ("AGNOSTIC", "Agnostic", 1609, 1610),
    201: ("THE PLAGUEBRINGER", "Bertoxxulous", 1611, 1627),
    202: ("THE KING OF THIEVES", "Bristlebane", 1628, 1642),
    203: ("THE FACELESS", "Cazic-Thule", 1643, 1656),
    204: ("THE DUKE OF BELOW", "Brell Serilis", 1789, 1807),
    205: ("THE QUEEN OF LOVE", "Erollisi Marr", 1691, 1707),
    206: ("THE PRINCE OF HATE", "Innoruuk", 1657, 1673),
    207: ("THE LIGHTBEARER", "Mithaniel Marr", 1708, 1723),
    208: ("THE PRIME HEALER", "Rodcet Nife", 1724, 1740),
    209: ("THE TRANQUIL", "Quellious", 1756, 1773),
    210: ("THE WARLORD", "Rallos Zek", 1856, 1868),
    211: ("THE OCEANLORD", "Prexus", 1741, 1755),
    212: ("THE RAINKEEPER", "Karana", 1674, 1690),
    213: ("THE BURNING PRINCE", "Solusek Ro", 1774, 1788),
    214: ("THE MOTHER OF ALL", "Tunare", 1824, 1839),
    215: ("THE SIX HAMMERS", "The Tribunal", 1808, 1823),
    217: ("THE WURMQUEEN", "Veeshan", 1840, 1855),
}

# City names
CITY_NAMES = {
    1873: "ERUDIN - CITY OF THE ERUDITES",
    1874: "QEYNOS - CITY OF MEN",
    1875: "HALAS - CITY OF THE BARBARIANS",
    1876: "RIVERVALE - CITY OF THE HALFLINGS",
    1877: "FREEPORT - CITY OF MEN",
    1878: "NERIAK - CITY OF THE DARK ELVES AND TROLLS",
    1879: "GUKTA - CITY OF THE FROGLOKS",
    1880: "OGGOK - CITY OF THE OGRES",
    1881: "KALADIM - CITY OF THE DWARVES",
    1882: "KELETHIN - CITY OF THE ELVES",
    1883: "FELWITHE - CITY OF THE HIGH ELVES",
    1884: "AK\\'ANON - CITY OF THE GNOMES",
    1885: "CABILIS - CITY OF THE IKSAR",
    1886: "SHAR VAHL - CITY OF THE VAH SHIR",
}

# Race descriptions (eqstr_id -> (game_id, name))
RACE_DESCRIPTIONS = {
    3239: (2, "Barbarian"),
    3240: (6, "Dark Elf"),
    3241: (8, "Dwarf"),
    3242: (3, "Erudite"),
    3243: (7, "Half Elf"),
    3244: (11, "Halfling"),
    3245: (5, "High Elf"),
    3246: (1, "Human"),
    3247: (128, "Iksar"),
    3248: (10, "Ogre"),
    3249: (9, "Troll"),
    3273: (130, "Vah Shir"),
    3274: (4, "Wood Elf"),
    3339: (12, "Gnome"),
    3316: (330, "Froglok"),
}

# Class descriptions (eqstr_id -> (game_id, name))
# Class IDs match the game's class constants
CLASS_DESCRIPTIONS = {
    3317: (8, "Bard"),
    3318: (15, "Beastlord"),
    3319: (2, "Cleric"),
    3320: (6, "Druid"),
    3321: (14, "Enchanter"),
    3322: (13, "Magician"),
    3323: (7, "Monk"),
    3324: (11, "Necromancer"),
    3325: (3, "Paladin"),
    3326: (4, "Ranger"),
    3327: (9, "Rogue"),
    3328: (5, "Shadowknight"),
    3329: (10, "Shaman"),
    3330: (1, "Warrior"),
    3331: (12, "Wizard"),
}

# Stat descriptions (eqstr_id -> stat_name)
STAT_DESCRIPTIONS = {
    3332: "Strength",
    3333: "Stamina",
    3334: "Agility",
    3335: "Dexterity",
    3336: "Wisdom",
    3337: "Intelligence",
    3338: "Charisma",
}

def parse_eqstr_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    entries = {}
    pattern = r'\b(\d+)\s+'
    matches = list(re.finditer(pattern, content))
    
    for i, match in enumerate(matches):
        str_id = int(match.group(1))
        start = match.end()
        
        if i + 1 < len(matches):
            end = matches[i + 1].start()
        else:
            end = len(content)
        
        text = content[start:end].strip()
        if text and str_id >= 100:
            entries[str_id] = text
    
    return entries

def extract_text_range(entries, start_id, end_id):
    texts = []
    for i in range(start_id, end_id + 1):
        if i in entries:
            texts.append(entries[i])
    return ' '.join(texts)

def extract_deity_description(full_text):
    """Extract just the description part, removing the 'DEITY_NAME - TITLE' header."""
    # Pattern: "DEITY NAME - TITLE Followers of..." -> "Followers of..."
    # The description starts with "Followers of" or similar
    match = re.search(r'(Followers of|Agnostics will|Non-dragon followers)', full_text)
    if match:
        return full_text[match.start():]
    return full_text

def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ").replace("\r", "") + "'"

entries = parse_eqstr_file(filepath)

# Generate SQL
print("SET NAMES utf8mb4;")

# Deities (combined: name, alt_name, and description in one entry)
for game_id, (alt_name, name, desc_start, desc_end) in DEITIES.items():
    full_text = extract_text_range(entries, desc_start, desc_end)
    description = extract_deity_description(full_text)
    print(f"INSERT INTO char_create_data (category, name, alt_name, description, eqstr_id_start, eqstr_id_end, game_id) VALUES ('deity', {escape_sql(name)}, {escape_sql(alt_name)}, {escape_sql(description)}, {desc_start}, {desc_end}, {game_id});")

# City names
for eqstr_id, name in CITY_NAMES.items():
    print(f"INSERT INTO char_create_data (category, name, alt_name, description, eqstr_id_start, eqstr_id_end, game_id) VALUES ('city', {escape_sql(name)}, NULL, NULL, {eqstr_id}, {eqstr_id}, NULL);")

# Race descriptions
for eqstr_id, (game_id, name) in RACE_DESCRIPTIONS.items():
    if eqstr_id in entries:
        description = entries[eqstr_id]
        print(f"INSERT INTO char_create_data (category, name, alt_name, description, eqstr_id_start, eqstr_id_end, game_id) VALUES ('race', {escape_sql(name)}, NULL, {escape_sql(description)}, {eqstr_id}, {eqstr_id}, {game_id});")

# Class descriptions
for eqstr_id, (game_id, name) in CLASS_DESCRIPTIONS.items():
    if eqstr_id in entries:
        description = entries[eqstr_id]
        print(f"INSERT INTO char_create_data (category, name, alt_name, description, eqstr_id_start, eqstr_id_end, game_id) VALUES ('class', {escape_sql(name)}, NULL, {escape_sql(description)}, {eqstr_id}, {eqstr_id}, {game_id});")

# Stat descriptions
for eqstr_id, name in STAT_DESCRIPTIONS.items():
    if eqstr_id in entries:
        description = entries[eqstr_id]
        print(f"INSERT INTO char_create_data (category, name, alt_name, description, eqstr_id_start, eqstr_id_end, game_id) VALUES ('stat', {escape_sql(name)}, NULL, {escape_sql(description)}, {eqstr_id}, {eqstr_id}, NULL);")

PYTHON_SCRIPT

echo "Verifying import..."
run_sql "SELECT category, COUNT(*) as count FROM char_create_data GROUP BY category;"

echo "Done!"
