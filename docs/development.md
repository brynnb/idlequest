# Development

This project is built using React/TypeScript and Zustand for the client. The server is a Go implementation derived from the EQEmu server, as partially converted to Go by the EQ:Requiem project, and customized for IdleQuest. Communication between the client and server uses WebTransport over HTTP/3 with Cap'n Proto for message serialization.

## Quick Start

### Prerequisites

- **Node.js 18+** with pnpm
- **Go 1.24+**
- **MySQL/MariaDB**
- Port 443 available for WebTransport

### Installation

```bash
# Install client dependencies
pnpm install

# The server uses Go modules (no npm install needed for server)
```

## Server Setup

The server is located in the `server/` directory and is written in Go. See `server/readme.md` for detailed setup instructions.

### Quick Server Setup

1. **Database Setup**: Import the EQ database dump
   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS eqgo"
   mysql -u root eqgo < dumpfile.sql
   ```

2. **Configuration**: Copy and configure the config file
   ```bash
   cp server/internal/config/eqgo_config_template.json server/eqgo_config.json
   ```
   Edit `eqgo_config.json` with your MySQL credentials.

3. **Generate SSL key** (for WebTransport):
   ```bash
   cd server/internal/config
   openssl genpkey -algorithm RSA -out key.pem -pkeyopt rsa_keygen_bits:2048
   ```

4. **Run migrations** (see `server/readme.md` for details):
   ```bash
   cd server/migrations
   mysql -u root eqgo < 002_create_eqstr_us_table.sql
   ./import_eqstr_us.sh
   ```

## Running the Dev Environment

**Run client only (Vite dev server):**

```bash
pnpm run dev
```

The client runs on `http://localhost:5173` by default.

**Run server only:**

```bash
cd server

# Using Make
make s

# Or directly with Go
go run ./cmd/server
```

The server listens on port 443 for WebTransport and port 7100 for the certificate hash API.

**Hot reload for server** (using [Air](https://github.com/cosmtrek/air)):

```bash
cd server && air
```

## Database Setup (EQ Game Data)

1. Clone or download the ProjectEQ quests repository from https://github.com/ProjectEQ/projecteqquests and place the `projecteqquests-master` folder in the `/data` directory.

2. Get the required CSV files:
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

3. Run the database setup scripts in order:

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

## Architecture Overview

### Client (React/TypeScript)
- **State Management**: Zustand stores in `src/stores/`
- **Networking**: WebTransport via `src/net/eq-socket.ts`
- **Cap'n Proto**: Message serialization in `src/net/capnp/`
- **Build Tool**: Vite

### Server (Go)
- **Location**: `server/`
- **Protocol**: WebTransport over HTTP/3
- **Serialization**: Cap'n Proto (`server/internal/api/capnp/`)
- **Database**: MySQL with Jet-generated models (`server/internal/db/jetgen/`)
- **Game Logic**: 
  - Combat: `server/internal/combat/`
  - Mechanics (stats, spells): `server/internal/mechanics/`
  - World/Zone handlers: `server/internal/world/`

### Communication Flow
1. Client connects via WebTransport to `https://127.0.0.1/eq`
2. Messages are serialized with Cap'n Proto
3. Opcodes route messages to appropriate handlers
4. Server responds with Cap'n Proto-serialized data

## Testing

**Client tests (Vitest):**

```bash
pnpm test --run

# Run specific test
pnpm test --run <test-name>
```

**Server tests (Go):**

```bash
cd server && go test ./...
```

## WebTransport Local Development

For WebTransport HTTPS requirements in local development, see `docs/webtransport-local-dev.md` for the detailed setup involving:
- Dynamic certificate generation
- Certificate hash API on port 7100
- Vite proxy configuration
