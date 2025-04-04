# Test Coverage Documentation

## Overview
The test suite is organized into three main categories:
1. Unit Tests
2. Integration Tests
3. Socket Tests

## Test Structure
```
SpeedType/backend/
├── __tests__/
│   ├── unit/
│   │   └── gameLogic.test.ts
│   ├── integration/
│   │   └── raceAPI.test.ts
│   └── socket/
│       └── raceSocket.test.ts
└── test/
    └── helpers/
        ├── setup.ts
        └── userHelper.ts
```

## 1. Unit Tests (`gameLogic.test.ts`)
Tests the core game logic utilities:

### WPM Calculation
- ✅ Calculates WPM correctly for given input
- ✅ Handles edge case: zero time
- ✅ Tests with standard typing scenarios

### Accuracy Calculation
- ✅ Calculates 100% accuracy for perfect matches
- ✅ Calculates 50% accuracy for half-correct input
- ✅ Calculates 0% accuracy for no correct characters
- ✅ Handles edge case: zero total characters

## 2. Integration Tests (`raceAPI.test.ts`)
Tests the REST API endpoints:

### Health Check Endpoint (`GET /health`)
- ✅ Returns ok status
- ✅ Returns correct response format

## 3. Socket Tests (`raceSocket.test.ts`)
Tests real-time racing functionality:

### Room Management
- ✅ Joins room successfully
- ✅ Handles room state
- ✅ Manages player connections

### Race Progress
- ✅ Broadcasts race progress to other players
- ✅ Handles multiple progress updates
- ✅ Maintains correct player state

### Race Start Conditions
- ✅ Prevents race start with single player
- ✅ Starts race when multiple players are ready
- ✅ Handles player readiness state

## Test Configuration
- Jest configuration for different test types
- Socket.IO client for socket tests

## Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit      # Unit tests only
npm run test:integration  # Integration tests only
npm run test:socket    # Socket tests only

# Run with coverage
npm run test:coverage
```

## Test Helpers
- `setup.ts`: Test setup and teardown
- `userHelper.ts`: Mock user creation for tests

## Coverage Areas
- Core game logic (WPM, accuracy)
- API endpoints
- Real-time socket communication
- Room management
- Race progress tracking 