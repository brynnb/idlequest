# Development

This project is built using React/TypeScript and Zustand for the client, and started as an entirely local offline project. It evolved to a Node.js/Express server using Socket.IO for real-time multiplayer features, and then finally adopted the EQEmu server, as partially coverted to Go by the EQ:Requiem project, as the foundation for IdleQuest's custom server it now uses.

TODO: Info below is very out of date and needs updating.

## Installation

```bash
pnpm install
```

## Server Setup

1. Install server dependencies:

   ```bash
   cd server && npm install
   ```
2. Create a `.env` file in the `server/` directory:

   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=idlequest
   DB_DIALECT=mysql
   PORT=3000
   CLIENT_URL=http://localhost:5173
   ```
3. Ensure MySQL is running:

   ```bash
   brew services start mysql
   ```
4. Create the database:

   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS idlequest;"
   ```

## Database Setup

1. Clone or download the ProjectEQ quests repository from https://github.com/ProjectEQ/projecteqquests and place the `projecteqquests-master` folder in the `/data` directory.
2. If for some reason you want to pre-process map images, download "EverQuest Atlas: The Maps Of Myrist" from https://archive.org/details/ever-uest-atlas-the-maps-of-myrist/mode/2up and take screenshots of the maps. Place these screenshots in the `/data/rawatlasart` directory. This is probably not needed since this repo is already tracking all the optimized versions of these images, though it doesn't include all zones as of right now since the screenshotting process is a little tedious and I just did the first ~100 zones from the first expansions.
3. Get the required CSV files:

   - Download the SQL dumps from The Al'Kabor Project (EQMacEmu): https://github.com/EQMacEmu/Server/tree/main/utils/sql/database_full
   - Convert the SQL dumps to CSV format
   - Place the following CSV files in the `/data/csv` directory:
     - items.csv
     - zone.csv
     - loottable_entries.csv
     - lootdrop_entries.csv
     - lootdrop.csv
     - loottable.csv
     - spawngroup.csv
     - spawnentry.csv
     - npc_types.csv
     - spawnlocation.csv
     - spells.csv
     - zone_points.csv

   The Al'Kabor Project is an EverQuest emulator specifically for MacOS that maintains the most accessible and comprehensive public database of the original game data that I was able to find.
4. Run the database setup scripts in order:

```bash
# Build the main database from CSV files
python3 data/scripts/rebuild_database.py

# Process quest data from ProjectEQ
python3 data/scripts/process_quests.py

# Convert game strings to database entries
python3 data/scripts/convert_eqstr_to_db.py

# Process atlas images (requires PIL/Pillow)
python3 data/scripts/convert_atlas_images.py
```

## Running the Dev Environment

**Run both client and server (recommended):**

```bash
npm run dev:all
```

**Run client only:**

```bash
pnpm run dev
```

**Run server only:**

```bash
cd server && npm run dev
```

The `dev:all` command runs both the React client (Vite) and the Node.js server with Socket.IO for real-time multiplayer features.

## Testing

The test suite currently has limited coverage and isn't very maintained but can be run with:

```bash
pnpm test --run
```
