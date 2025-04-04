#!/bin/bash

# Exit on any error
set -e

# Change to SpeedType directory
cd "$(dirname "$0")"

# Log file setup
LOG_FILE="validation_$(date +%Y%m%d_%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "Starting deployment validation at $(date)"

# Function to handle errors
handle_error() {
    local line_no=$1
    echo "Error occurred in script at line: $line_no"
    echo "Cleaning up test environment..."
    git checkout main
    git branch -D test-deployment 2>/dev/null || true
    exit 1
}

trap 'handle_error ${LINENO}' ERR

# Check if we are in git repository
if [ ! -d "../.git" ]; then
    echo "Error: Must be run from repository root"
    exit 1
fi

# Create test branch
echo "Creating test deployment branch..."
cd ..
git checkout -b test-deployment
cd SpeedType

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "Error: Port $port is already in use"
        exit 1
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local service=$2
    local max_attempts=30
    local attempt=1

    echo "Waiting for $service to start..."
    while ! curl -s "$url" >/dev/null; do
        if [ $attempt -ge $max_attempts ]; then
            echo "Error: $service failed to start after $max_attempts attempts"
            return 1
        fi
        echo "Attempt $attempt: $service not ready, waiting..."
        sleep 2
        ((attempt++))
    done
    echo "$service is up!"
}

echo "=== Phase 1: Testing New Deployment ==="

# Stop any existing processes
echo "Stopping existing processes..."
pkill -f "node" || true

# Check ports
echo "Checking if test ports are available..."
check_port 3002  # Test frontend port
check_port 3003  # Test backend port

# Test frontend build
echo "Testing frontend build..."
cd frontend
npm install
npm run build
if [ ! -d "dist" ]; then
    echo "Error: Frontend build failed"
    exit 1
fi

# Start services on test ports
echo "Starting services on test ports..."
PORT=3002 npm run preview -- --port 3002 &
cd ../backend
npm install
PORT=3003 npm run start &

# Wait for services
wait_for_service "http://localhost:3002" "Frontend"
wait_for_service "http://localhost:3003/health" "Backend"

echo "New deployment validation successful!"

echo "=== Phase 2: Testing Rollback Process ==="

# Test rollback script in dry-run mode
echo "Testing rollback script..."
cd ..
ROLLBACK_TEST=true ../SpeedType/rollback.sh || {
    echo "Rollback script validation failed"
    exit 1
}

# Cleanup
echo "Cleaning up test environment..."
pkill -f "node" || true
cd ..
git checkout main
git branch -D test-deployment

echo "Validation completed successfully at $(date)"
echo "Logs available in: $LOG_FILE"
echo ""
echo "✅ Deployment validation passed"
echo "✅ Rollback script validation passed"
echo ""
echo "Safe to proceed with production deployment" 