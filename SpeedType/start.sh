#!/bin/bash

# Store the base directory
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing Node.js processes
echo "Killing existing Node.js processes..."
pkill -f "node"

# Wait a moment to ensure ports are freed
sleep 2

# Start backend server
echo "Starting backend server on port 3001..."
cd "$BASE_DIR/backend" && npm run dev &

# Wait for backend to start
sleep 5

# Start frontend server
echo "Starting frontend server on port 3000..."
cd "$BASE_DIR/frontend" && npm run dev &

# Wait for both servers to be ready
echo "Waiting for servers to start..."
sleep 5

echo "Servers should now be running:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:3001"
echo ""
echo "To view server logs, check the terminal windows that opened."
echo "Use 'pkill -f \"node\"' to stop all servers" 