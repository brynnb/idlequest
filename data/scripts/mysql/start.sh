#!/bin/bash

# Start the server in the background
echo "Starting the server..."
cd server && npm run dev &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Start the client
echo "Starting the client..."
cd .. && npm run dev

# When the client is stopped, also stop the server
echo "Stopping the server..."
kill $SERVER_PID 