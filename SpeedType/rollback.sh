#!/bin/bash

# Exit on any error
set -e

# Check if this is a test run
IS_TEST=${ROLLBACK_TEST:-false}
if [ "$IS_TEST" = true ]; then
    echo "Running in TEST mode - no actual changes will be made"
fi

# Log file setup
LOG_FILE="rollback_$(date +%Y%m%d_%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "Starting rollback process at $(date)"

# Function to handle errors
handle_error() {
    local line_no=$1
    echo "Error occurred in script at line: $line_no"
    if [ "$IS_TEST" = true ]; then
        echo "Test failed at line $line_no"
    else
        echo "Rolling back the rollback..."
        git checkout -
    fi
    exit 1
}

trap 'handle_error ${LINENO}' ERR

# Check if we are in git repository
if [ ! -d ".git" ]; then
    echo "Error: Must be run from repository root"
    exit 1
fi

# Create backup of current state
if [ "$IS_TEST" = false ]; then
    BACKUP_BRANCH="backup/$(date +%Y%m%d_%H%M%S)"
    echo "Creating backup branch: $BACKUP_BRANCH"
    git branch $BACKUP_BRANCH
fi

# Check if tag exists
if ! git rev-parse --verify v1.0.0-stable >/dev/null 2>&1; then
    echo "Error: Stable tag v1.0.0-stable not found"
    exit 1
fi

echo "Stopping running processes..."
pkill -f "node" || true  # Don't fail if no processes found

echo "Fetching latest changes..."
if [ "$IS_TEST" = false ]; then
    git fetch --all
    echo "Switching to stable version..."
    git checkout v1.0.0-stable
else
    echo "[TEST] Would fetch and checkout v1.0.0-stable"
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "Error: Port $port is already in use"
        exit 1
    fi
}

# Set ports based on mode
if [ "$IS_TEST" = true ]; then
    FRONTEND_PORT=3004
    BACKEND_PORT=3005
else
    FRONTEND_PORT=3000
    BACKEND_PORT=3001
fi

# Check if required ports are available
echo "Checking if ports are available..."
check_port $FRONTEND_PORT
check_port $BACKEND_PORT

# Function to check if npm install succeeded
check_npm_install() {
    if [ ! -d "node_modules" ]; then
        echo "Error: npm install failed"
        return 1
    fi
}

echo "Starting frontend..."
cd frontend
if [ "$IS_TEST" = false ]; then
    npm install
    check_npm_install
    npm run build
    PORT=$FRONTEND_PORT npm run preview &
else
    echo "[TEST] Would start frontend on port $FRONTEND_PORT"
fi

echo "Starting backend..."
cd ../backend
if [ "$IS_TEST" = false ]; then
    npm install
    check_npm_install
    PORT=$BACKEND_PORT npm run start &
else
    echo "[TEST] Would start backend on port $BACKEND_PORT"
fi

if [ "$IS_TEST" = false ]; then
    echo "Waiting for services to start..."
    sleep 5

    # Check if services are running
    if ! curl -s http://localhost:$FRONTEND_PORT >/dev/null; then
        echo "Error: Frontend service failed to start"
        exit 1
    fi

    if ! curl -s http://localhost:$BACKEND_PORT/health >/dev/null; then
        echo "Error: Backend service failed to start"
        exit 1
    fi

    echo "Rollback completed successfully at $(date)"
    echo "A backup of the previous state was created in branch: $BACKUP_BRANCH"
else
    echo "[TEST] Rollback script validation completed successfully"
fi

echo "Logs available in: $LOG_FILE" 