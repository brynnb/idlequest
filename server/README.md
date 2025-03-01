# IdleQuest Server

Combat server for IdleQuest game.

## Getting Started

### Prerequisites

- Node.js v18+
- MySQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the server directory with the following variables:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   DB_DIALECT=mysql
   PORT=3000
   CLIENT_URL=http://localhost:5173
   ```

### Running the Server

There are two ways to start the server:

1. Standard start (may fail if port is in use):

   ```
   npm run start
   ```

2. Safe start (automatically kills any process using the port):
   ```
   npm run start:safe
   ```

The safe start option will:

1. Check if port 3000 is already in use
2. If it is, kill the process using that port
3. Build the project
4. Start the server

### Running Tests

Run API tests:

```
npm run test:api
```

Run client tests:

```
npm run test:client
```

Run database tests:

```
npm run test:db
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/zones` - Get all zones
- `GET /api/zones/:id` - Get zone by ID
- `GET /api/zones/name/:shortName` - Get zone by short name
- `GET /api/zones/:id/adjacent` - Get adjacent zones
- `GET /api/zones/:shortName/npcs` - Get NPCs in a zone
- `POST /api/broadcast` - Send a broadcast message
- `POST /api/combat` - Send a combat event
- `POST /api/loot` - Send a loot event

## Error Handling

The server includes robust error handling for:

- Database connection issues
- Missing database tables
- Port already in use (EADDRINUSE errors)

## Troubleshooting

If you encounter the "address already in use" error:

1. Use `npm run start:safe` instead of `npm run start`
2. Or manually kill the process using port 3000:
   ```
   lsof -i :3000 | grep LISTEN
   kill -9 <PID>
   ```
