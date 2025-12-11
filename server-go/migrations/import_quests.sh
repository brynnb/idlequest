#!/bin/bash
# Import quest data from SQLite to MySQL

echo "Exporting quests from SQLite..."
sqlite3 ../data/db/eq_data.db <<EOF > /tmp/quests_export.sql
.mode insert quests
SELECT zone, name, lua_content FROM quests;
EOF

echo "Converting SQLite INSERT syntax to MySQL syntax..."
# SQLite uses INSERT INTO "quests" VALUES(...) 
# MySQL needs INSERT INTO quests VALUES(...) with proper escaping
sed -i '' 's/INSERT INTO "quests"/INSERT INTO quests/g' /tmp/quests_export.sql

echo "Importing into MySQL..."
mysql -u root eqgo < /tmp/quests_export.sql

echo "Verifying import..."
mysql -u root eqgo -e "SELECT COUNT(*) as quest_count FROM quests;"

echo "Done!"
