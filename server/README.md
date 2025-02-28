# IdleQuest Combat Server

A Node.js/TypeScript WebSocket server for handling combat calculations and real-time messaging for the IdleQuest game.

## Features

- Real-time WebSocket communication using Socket.IO
- Scalable architecture designed to handle hundreds of concurrent users
- Efficient message broadcasting system
- Structured logging with Winston
- TypeScript for type safety and better developer experience

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on the example:

```
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Development

Start the development server with hot reloading:

```bash
npm run dev
```

### Production

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Architecture

The server is designed with scalability in mind:

- **Socket Management**: Efficient tracking of connected clients
- **Message Broadcasting**: Optimized for high-throughput messaging
- **Error Handling**: Comprehensive error catching and logging
- **Graceful Shutdown**: Proper cleanup of resources on server shutdown

## Future Enhancements

- Combat calculation engine
- User authentication and authorization
- Horizontal scaling with Redis adapter
- Metrics and monitoring
- Load testing and performance optimization
