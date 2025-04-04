#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Store the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        echo -e "${RED}Error: $3${NC}"
    fi
}

# Function to check if a port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
    return $?
}

# Function to wait for a port to be available
wait_for_port() {
    local port=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    while check_port $port; do
        if [ $(($(date +%s) - start_time)) -gt $timeout ]; then
            echo "Timeout waiting for port $port to be free"
            return 1
        fi
        sleep 1
    done
    return 0
}

# Function to check if a process is running
check_process() {
    local pattern=$1
    local count=0
    local max_attempts=10
    
    echo -e "${YELLOW}Waiting for process matching: $pattern${NC}"
    while [ $count -lt $max_attempts ]; do
        if ps aux | grep -v grep | grep -q "$pattern"; then
            echo -e "${GREEN}Process found after $count seconds${NC}"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    echo -e "\n${RED}Process not found after $max_attempts seconds${NC}"
    return 1
}

# Function to kill all node processes
cleanup() {
    echo -e "\n${YELLOW}Cleaning up processes...${NC}"
    pkill -f "node" || true
    sleep 2
}

# Function to validate environment files
validate_env_files() {
    local status=0
    
    # Check frontend environment files
    if [ -f "$BASE_DIR/frontend/.env.development" ]; then
        print_status 0 "Frontend development environment file exists"
    else
        print_status 1 "Frontend development environment file check" "Missing .env.development"
        status=1
    fi

    if [ -f "$BASE_DIR/frontend/.env.production" ]; then
        print_status 0 "Frontend production environment file exists"
    else
        print_status 1 "Frontend production environment file check" "Missing .env.production"
        status=1
    fi

    # Check backend configuration
    if [ -f "$BASE_DIR/backend/src/config/env.ts" ]; then
        print_status 0 "Backend environment configuration exists"
    else
        print_status 1 "Backend environment configuration check" "Missing env.ts"
        status=1
    fi

    return $status
}

# Function to test development environment
test_development_env() {
    echo -e "\n${YELLOW}Testing Development Environment${NC}"
    
    # Start backend
    cd "$BASE_DIR/backend"
    echo "Starting backend in development mode..."
    NODE_ENV=development npm run dev > dev.log 2>&1 &
    backend_pid=$!

    # Wait for backend to start
    sleep 5
    if ps -p $backend_pid > /dev/null && grep -q "Server listening" dev.log; then
        print_status 0 "Backend started in development mode"
    else
        print_status 1 "Backend start check" "Backend failed to start"
        cat dev.log
        return 1
    fi

    # Start frontend
    cd "$BASE_DIR/frontend"
    echo "Starting frontend in development mode..."
    npm run dev > dev.log 2>&1 &
    frontend_pid=$!

    # Wait for frontend to start
    sleep 5
    if ps -p $frontend_pid > /dev/null && grep -q "Local:" dev.log; then
        print_status 0 "Frontend started in development mode"
    else
        print_status 1 "Frontend start check" "Frontend failed to start"
        cat dev.log
        return 1
    fi

    # Check if ports are in use
    if check_port 3001; then
        print_status 0 "Backend port 3001 is active"
    else
        print_status 1 "Backend port check" "Port 3001 is not active"
        return 1
    fi

    if check_port 3000; then
        print_status 0 "Frontend port 3000 is active"
    else
        print_status 1 "Frontend port check" "Port 3000 is not active"
        return 1
    fi

    return 0
}

# Function to test production environment
test_production_env() {
    echo -e "\n${YELLOW}Testing Production Environment${NC}"
    
    # Start backend
    cd "$BASE_DIR/backend"
    echo "Starting backend in production mode..."
    NODE_ENV=production npm run dev:prod > prod.log 2>&1 &
    backend_pid=$!

    # Wait for backend to start
    sleep 5
    if ps -p $backend_pid > /dev/null && grep -q "Server listening" prod.log; then
        print_status 0 "Backend started in production mode"
    else
        print_status 1 "Backend start check" "Backend failed to start"
        cat prod.log
        return 1
    fi

    # Start frontend
    cd "$BASE_DIR/frontend"
    echo "Starting frontend in production mode..."
    npm run dev:prod > prod.log 2>&1 &
    frontend_pid=$!

    # Wait for frontend to start
    sleep 5
    if ps -p $frontend_pid > /dev/null && grep -q "Local:" prod.log; then
        print_status 0 "Frontend started in production mode"
    else
        print_status 1 "Frontend start check" "Frontend failed to start"
        cat prod.log
        return 1
    fi

    # Check if ports are in use
    if check_port 3001; then
        print_status 0 "Backend port 3001 is active"
    else
        print_status 1 "Backend port check" "Port 3001 is not active"
        return 1
    fi

    if check_port 3000; then
        print_status 0 "Frontend port 3000 is active"
    else
        print_status 1 "Frontend port check" "Port 3000 is not active"
        return 1
    fi

    return 0
}

# Main test execution
main() {
    echo -e "${YELLOW}Starting Environment Tests${NC}"
    
    # Initial cleanup
    cleanup

    # Validate environment files
    echo -e "\n${YELLOW}Validating Environment Files${NC}"
    validate_env_files
    env_files_status=$?

    # Test development environment
    test_development_env
    dev_status=$?

    # Cleanup between tests
    cleanup

    # Test production environment
    test_production_env
    prod_status=$?

    # Final cleanup
    cleanup

    # Print final results
    echo -e "\n${YELLOW}Test Results:${NC}"
    print_status $env_files_status "Environment Files Validation"
    print_status $dev_status "Development Environment Test"
    print_status $prod_status "Production Environment Test"

    # Return overall status
    if [ $env_files_status -eq 0 ] && [ $dev_status -eq 0 ] && [ $prod_status -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed successfully!${NC}"
        return 0
    else
        echo -e "\n${RED}Some tests failed. Check the output above for details.${NC}"
        return 1
    fi
}

# Run main function
main 