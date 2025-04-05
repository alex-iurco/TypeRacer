# End-to-End Testing Guide

This guide explains how to run end-to-end (E2E) tests for the TypeRacer application.

## Automated Testing Script

We've created a convenient script `run-e2e-tests.sh` that automates the setup and execution of E2E tests. This script:

- Starts the backend and frontend servers (if needed)
- Runs tests in your chosen environment (development or production)
- Supports different browsers (Chrome, Firefox, or WebKit)
- Cleans up server processes when finished

### Prerequisites

- Node.js and npm installed
- Playwright installed (`npm install -g playwright`)
- Browser dependencies installed (`npx playwright install`)

### Basic Usage

```bash
# From the SpeedType root directory
./run-e2e-tests.sh
```

This will:
1. Start the backend server
2. Start the frontend in development mode (using local backend)
3. Run all E2E tests in Chrome (headless)
4. Shut down all servers when finished

### Command Options

The script supports several options:

| Option | Description |
| ------ | ----------- |
| `-e, --env <env>` | Set environment: 'development' or 'production' |
| `-t, --test <spec>` | Specify test file or grep pattern |
| `-b, --browser <name>` | Specify browser: 'chromium', 'firefox', or 'webkit' |
| `--headed` | Run browser in headed mode (visible) |
| `--no-servers` | Don't start servers (assumes they're already running) |
| `-h, --help` | Show help message |

### Examples

```bash
# Run all tests in production environment
./run-e2e-tests.sh -e production

# Run tests matching 'single player' pattern
./run-e2e-tests.sh -t 'single player'

# Run tests in Firefox with visible browser
./run-e2e-tests.sh -b firefox --headed

# Run specific test file
./run-e2e-tests.sh -t frontend/e2e/race.spec.ts
```

## Manual E2E Testing

If you prefer to run tests manually:

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   # For local backend:
   VITE_USE_PROD_BACKEND=false npm run dev
   # For production backend:
   VITE_USE_PROD_BACKEND=true npm run dev
   ```

3. In a third terminal, run the tests:
   ```bash
   cd frontend
   npx playwright test
   ```

## Viewing Test Reports

Playwright generates HTML reports for test runs. After running tests:

```bash
npx playwright show-report
```

## Troubleshooting

If tests fail:

1. Check that both backend and frontend servers are running
2. Verify you're using the correct environment setting
3. Look at the test report for specific error details
4. Try running a specific test with `--headed` to see what's happening
5. Increase verbosity with `--debug` flag 