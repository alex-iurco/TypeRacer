# Environment Configuration Guide

This document outlines how to configure and switch between different environments in the SpeedType application.

## Environment Files

### Backend Configuration
Location: `SpeedType/backend/`

1. `.env.development`
```env
# Development Environment
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
CORS_METHODS=GET,POST
CORS_CREDENTIALS=true
SOCKET_TIMEOUT=5000
RETRY_DELAY=1000
```

2. `.env.production`
```env
# Production Environment
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://alex-iurco.github.io,http://localhost:3000
CORS_METHODS=GET,POST
CORS_CREDENTIALS=true
SOCKET_TIMEOUT=8000
RETRY_DELAY=2000
```

### Frontend Configuration
Location: `SpeedType/frontend/`

1. `.env.development`
```env
# Development Environment
VITE_NODE_ENV=development
VITE_BACKEND_URL=http://localhost:3001
VITE_USE_PROD_BACKEND=false
VITE_SOCKET_TIMEOUT=5000
VITE_RETRY_DELAY=1000
VITE_RECONNECTION_ATTEMPTS=5
VITE_SOCKET_TRANSPORTS=websocket,polling
VITE_SOCKET_AUTO_CONNECT=true
VITE_SOCKET_RECONNECTION=true
```

2. `.env.production`
```env
# Production Environment
VITE_NODE_ENV=production
VITE_BACKEND_URL=https://speedtype-backend-production.up.railway.app
VITE_USE_PROD_BACKEND=true
VITE_SOCKET_TIMEOUT=8000
VITE_RETRY_DELAY=2000
VITE_RECONNECTION_ATTEMPTS=5
VITE_SOCKET_TRANSPORTS=websocket,polling
VITE_SOCKET_AUTO_CONNECT=true
VITE_SOCKET_RECONNECTION=true
```

3. `.env.test`
```env
# Test Environment
VITE_NODE_ENV=test
VITE_BACKEND_URL=https://speedtype-backend-production.up.railway.app
VITE_USE_PROD_BACKEND=true
VITE_SOCKET_TIMEOUT=15000
VITE_RETRY_DELAY=2000
VITE_RECONNECTION_ATTEMPTS=5
VITE_SOCKET_TRANSPORTS=websocket,polling
VITE_SOCKET_AUTO_CONNECT=true
VITE_SOCKET_RECONNECTION=true
```

## Environment Initialization

### Backend
The backend environment is initialized in `src/config/loadEnv.ts`:
- Loads environment variables from the appropriate `.env.[mode]` file
- Validates required environment variables
- Sets up configuration based on the current environment

### Frontend
The frontend environment is initialized in `src/config/loadEnv.js`:
- Uses Vite's built-in environment handling
- Validates required environment variables
- Sets up configuration based on the current environment
- Supports three environments: development, production, and test

### Shared Utilities
Both frontend and backend now use shared utilities:
- `envUtils.js/ts` - Common functions for environment handling
- Standardized validation and parsing of environment variables
- Consistent error handling and logging

This approach reduces duplication and makes environment handling more maintainable by:
- Using the same validation logic for both frontend and backend
- Providing consistent defaults and error handling
- Simplifying the addition of new environment variables or environments

## Switching Environments

### Development Mode
```bash
# Terminal 1 - Backend
cd SpeedType/backend
NODE_ENV=development npm run dev

# Terminal 2 - Frontend
cd SpeedType/frontend
npm run dev
```

### Production Mode
```bash
# Terminal 1 - Backend
cd SpeedType/backend
NODE_ENV=production npm run dev:prod

# Terminal 2 - Frontend
cd SpeedType/frontend
npm run dev:prod
```

### Test Mode
```bash
# Terminal 1 - Backend
cd SpeedType/backend
NODE_ENV=production npm run dev:prod

# Terminal 2 - Frontend
cd SpeedType/frontend
npm run dev:test
```

## Troubleshooting

### Common Issues

1. Missing ts-node-dev
```bash
Error: ts-node-dev: command not found
```
Solution:
```bash
cd SpeedType/backend
npm install --save-dev ts-node-dev
```

2. Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3001
```
Solution:
```bash
# Kill existing Node.js processes
pkill -f "node" && sleep 2
```

3. Environment Variables Not Loading
```bash
Error: Missing required environment variables
```
Solution:
- Check if the correct `.env.[mode]` file exists
- Verify all required variables are defined
- Make sure you're using the correct environment mode

## Required Environment Variables

### Backend
- `PORT`: Server port number
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `CORS_METHODS`: Comma-separated list of allowed HTTP methods
- `CORS_CREDENTIALS`: Boolean for CORS credentials

### Frontend
- `VITE_NODE_ENV`: Current environment
- `VITE_BACKEND_URL`: Backend service URL
- `VITE_SOCKET_TIMEOUT`: Socket connection timeout
- `VITE_RETRY_DELAY`: Retry delay for connections
- `VITE_RECONNECTION_ATTEMPTS`: Number of reconnection attempts
- `VITE_SOCKET_TRANSPORTS`: Socket transport methods
- `VITE_SOCKET_AUTO_CONNECT`: Auto-connect socket setting
- `VITE_SOCKET_RECONNECTION`: Socket reconnection setting

## Best Practices

1. Environment Variables
   - Never hardcode environment-specific values
   - Always use environment variables from config files
   - Use the appropriate environment file for each mode

2. Switching Environments
   - Always use npm scripts for running the application
   - Set NODE_ENV explicitly for backend
   - Use Vite's mode flag for frontend

3. Adding New Variables
   - Add to both development and production env files
   - Update validation in loadEnv files
   - Document new variables in this file

4. Shared Utilities
   - Use the shared utility functions in `envUtils.js/ts` for handling environment variables
   - Follow the established patterns for validation and parsing
   - Keep frontend and backend utilities aligned
   - When adding new utility functions, document them and ensure they work in both frontend and backend contexts

5. Error Handling
   - Check environment initialization logs
   - Verify all required variables are present
   - Handle missing or invalid variables gracefully

## Environment Indicators

The application includes several ways to verify the current environment:

1. Console Logs:
   - Backend: "Backend running in environment: [mode]"
   - Frontend: "Environment initialized: [mode]"

2. Visual Indicators:
   - Environment badge in UI
   - Different backend URLs
   - Different socket timeouts

## Testing Environments

### Environment Validation

The application now includes robust environment validation in the test suite that:
- Verifies the correct URLs and configuration are used
- Validates application settings via console logs
- Documents discrepancies between expected and actual settings

### Test Environment

The test environment (`.env.test`) is configured with:
- Longer timeouts for more reliable test execution
- Connection to the production backend for stable testing
- Additional validation steps to ensure proper configuration

For running tests in the test environment:
```bash
# Run end-to-end tests in test environment
cd SpeedType/frontend
npm run test:e2e:test-env
```

For more details about testing, refer to:
- [E2E Testing Guide](docs/testing/E2E_TESTING.md)
- [Frontend README](frontend/README.md)

### Environment Test Script

Use the environment test script to verify configuration:
```bash
cd SpeedType
./scripts/test-environments.sh
```

This will:
1. Validate environment files
2. Test development environment
3. Test production environment
4. Verify all required variables 