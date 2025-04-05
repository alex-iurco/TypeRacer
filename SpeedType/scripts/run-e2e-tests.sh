#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Default settings
ENV="development"
TEST_SPEC=""
BROWSER="chromium"
HEADED="false"
START_SERVERS="true"
BACKEND_PID=""
FRONTEND_PID=""

# Function to display usage information
function show_help {
  echo -e "${BLUE}TypeRacer E2E Test Runner${NC}"
  echo "This script automates running end-to-end tests for the TypeRacer application."
  echo
  echo "Usage: ./run-e2e-tests.sh [options]"
  echo
  echo "Options:"
  echo "  -e, --env <env>       Set environment: 'development' or 'production' (default: development)"
  echo "  -t, --test <spec>     Specify test file or grep pattern (default: run all tests)"
  echo "  -b, --browser <name>  Specify browser: 'chromium', 'firefox', or 'webkit' (default: chromium)"
  echo "  --headed              Run browser in headed mode (visible) instead of headless"
  echo "  --no-servers          Don't start servers (assumes they're already running)"
  echo "  -h, --help            Show this help message"
  echo
  echo "Examples:"
  echo "  ./run-e2e-tests.sh                           # Run all tests in development environment"
  echo "  ./run-e2e-tests.sh -e production             # Run all tests in production environment"
  echo "  ./run-e2e-tests.sh -t 'single player'        # Run tests matching 'single player'"
  echo "  ./run-e2e-tests.sh -b firefox --headed       # Run all tests in Firefox with visible browser"
  echo
}

# Function to clean up processes on exit
function cleanup {
  echo -e "\n${YELLOW}Cleaning up...${NC}"
  
  if [ -n "$FRONTEND_PID" ]; then
    echo "Stopping frontend server (PID: $FRONTEND_PID)"
    kill $FRONTEND_PID 2>/dev/null
  fi
  
  if [ -n "$BACKEND_PID" ]; then
    echo "Stopping backend server (PID: $BACKEND_PID)"
    kill $BACKEND_PID 2>/dev/null
  fi
  
  echo -e "${GREEN}Done!${NC}"
  exit 0
}

# Register cleanup function to run on script exit
trap cleanup EXIT INT TERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)
      ENV="$2"
      if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
        echo -e "${RED}Error: Environment must be 'development' or 'production'${NC}"
        exit 1
      fi
      shift 2
      ;;
    -t|--test)
      TEST_SPEC="$2"
      shift 2
      ;;
    -b|--browser)
      BROWSER="$2"
      if [[ "$BROWSER" != "chromium" && "$BROWSER" != "firefox" && "$BROWSER" != "webkit" ]]; then
        echo -e "${RED}Error: Browser must be 'chromium', 'firefox', or 'webkit'${NC}"
        exit 1
      fi
      shift 2
      ;;
    --headed)
      HEADED="true"
      shift
      ;;
    --no-servers)
      START_SERVERS="false"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Display configuration
echo -e "${BLUE}=== TypeRacer E2E Test Runner ===${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo -e "Browser:     ${GREEN}$BROWSER${NC}"
echo -e "Headed mode: ${GREEN}$HEADED${NC}"
if [ -n "$TEST_SPEC" ]; then
  echo -e "Test spec:   ${GREEN}$TEST_SPEC${NC}"
else
  echo -e "Test spec:   ${GREEN}All tests${NC}"
fi
echo -e "Start servers: ${GREEN}$START_SERVERS${NC}"
echo "-------------------------------------"

# Check if required directories exist
if [ ! -d "$BACKEND_DIR" ]; then
  echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
  exit 1
fi

# Start backend server if needed
if [ "$START_SERVERS" = "true" ]; then
  echo -e "\n${YELLOW}Starting backend server...${NC}"
  cd "$BACKEND_DIR"
  
  npm run dev &
  BACKEND_PID=$!
  echo -e "Backend server started with PID: ${GREEN}$BACKEND_PID${NC}"
  
  # Wait for backend to be ready
  echo "Waiting for backend server to be ready..."
  sleep 5
fi

# Start frontend server if needed
if [ "$START_SERVERS" = "true" ]; then
  echo -e "\n${YELLOW}Starting frontend server...${NC}"
  cd "$FRONTEND_DIR"
  
  if [ "$ENV" = "production" ]; then
    VITE_USE_PROD_BACKEND=true npm run dev &
  else
    VITE_USE_PROD_BACKEND=false npm run dev &
  fi
  
  FRONTEND_PID=$!
  echo -e "Frontend server started with PID: ${GREEN}$FRONTEND_PID${NC}"
  
  # Wait for frontend to be ready
  echo "Waiting for frontend server to be ready..."
  sleep 5
fi

# Run the tests
echo -e "\n${YELLOW}Running E2E tests...${NC}"
cd "$FRONTEND_DIR"

# Construct the test command
TEST_CMD="npx playwright test"

# Add test spec if provided
if [ -n "$TEST_SPEC" ]; then
  # Check if TEST_SPEC is a file or a grep pattern
  if [ -f "$TEST_SPEC" ]; then
    TEST_CMD="$TEST_CMD $TEST_SPEC"
  else
    TEST_CMD="$TEST_CMD --grep=\"$TEST_SPEC\""
  fi
fi

# Add browser
TEST_CMD="$TEST_CMD --project=$BROWSER"

# Add headed mode if requested
if [ "$HEADED" = "true" ]; then
  TEST_CMD="$TEST_CMD --headed"
fi

# Run the test command
echo -e "Executing: ${BLUE}$TEST_CMD${NC}\n"
eval $TEST_CMD

# Capture test exit code
TEST_EXIT_CODE=$?

# Display results
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}✅ All tests passed!${NC}"
else
  echo -e "\n${RED}❌ Tests failed with exit code $TEST_EXIT_CODE${NC}"
fi

# Exit with the test command's exit code
exit $TEST_EXIT_CODE 