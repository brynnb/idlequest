# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IdleQuest is an idle/incremental game based on EverQuest (1999 MMORPG). It's a full-stack TypeScript application with a React frontend and Node.js/Express backend.

## Essential Commands

### Development
```bash
# Full stack development (recommended)
npm run dev:all

# Frontend only
pnpm run dev

# Backend only
cd server && npm run dev
```

### Testing
```bash
# Frontend tests
pnpm test --run

# Run specific test
pnpm test --run <test-name>

# Backend tests
cd server && npm test
```

### Linting & Type Checking
```bash
# Frontend
pnpm run lint
pnpm run type-check

# Backend
cd server && npm run lint
```

### Building
```bash
# Frontend
pnpm run build

# Backend
cd server && npm run build
```

## Architecture Overview

### Frontend Architecture
- **State Management**: Uses Zustand stores in `src/stores/`. Key stores:
  - `gameStore.ts`: Core game state (character, inventory, combat)
  - `socketStore.ts`: Socket.IO connection management
  - `chatStore.ts`: Chat messages and online users
  
- **Game Engine**: Located in `src/scripts/gameEngine/`. Core modules:
  - `characterProgression.ts`: Level up and stat calculations
  - `combatEngine.ts`: Combat mechanics and loot drops
  - `questEngine.ts`: Quest management and progression
  
- **Database**: Uses SQL.js (SQLite in browser) for game data. Access via `src/utils/databaseOperations.ts`

### Backend Architecture
- **API Routes**: Express routes in `server/src/routes/`
  - `/api/eq-data/*`: EverQuest database queries
  - Socket.IO events for real-time features
  
- **Services**: Business logic in `server/src/services/`
  - `eqDatabaseService.ts`: EverQuest data queries
  - `ZoneService.ts`: Zone and spawn management
  
- **Database**: MySQL with Sequelize ORM
  - Models in `server/src/database/models/`
  - Configuration in `server/src/database/config.ts`

### Data Flow
1. **Game Data**: Static EverQuest data loaded from SQLite on client
2. **Character Data**: Persisted to MySQL via API calls
3. **Real-time Updates**: Socket.IO for chat and multiplayer events
4. **AI Integration**: OpenAI API for dynamic NPC dialogue

## Key Conventions

### TypeScript
- Strict mode enabled
- Use path aliases (`@/` for src)
- Define types in `entities/` or `types/` directories

### React Components
- Functional components with TypeScript
- Styled Components for styling
- Custom hooks in `src/hooks/`

### Navigation
- **Single-Page App**: No URL-based routing - the app works like a video game
- **Screen Navigation**: Use `GameScreenStore.setScreen()` to change screens (login, characterSelect, characterCreate, game)
- **Component**: `ScreenRouter` in `src/components/` renders the appropriate page based on current screen state

### API Communication
- Client API service: `src/utils/eqApiService.ts`
- All API responses typed with interfaces
- Error handling with try-catch blocks

### Database Operations
- Client DB queries through `databaseOperations.ts`
- Server DB queries through Sequelize models
- Always use parameterized queries

## Important Notes

- **Database Migration**: Recently migrated from MongoDB to MySQL - ensure MySQL is running
- **Environment Variables**: Required for both client (.env) and server (.env)
- **Port Configuration**: Frontend on 5173, Backend on 3001
- **Socket.IO**: Used for real-time features - maintain connection state
- **EverQuest Data**: Large dataset (~100MB) - optimize queries carefully