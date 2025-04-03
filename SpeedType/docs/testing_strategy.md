# SpeedType Testing Strategy

## Table of Contents
1. [Overview](#overview)
2. [Frontend Testing](#frontend-testing)
3. [Backend Testing](#backend-testing)
4. [CI/CD Integration](#ci-cd-integration)
5. [Best Practices](#best-practices)
6. [Test Coverage Requirements](#test-coverage-requirements)

## Overview

This document outlines the testing strategy for the SpeedType application, covering both frontend and backend testing approaches. Our testing pyramid consists of:

- Unit Tests (60% of test coverage)
- Integration Tests (30% of test coverage)
- End-to-End Tests (10% of test coverage)

## Frontend Testing

### Unit Testing (Jest + React Testing Library)

We use Jest and React Testing Library for component-level testing.

#### Key Areas to Test:
- Component rendering
- User interactions
- State management
- Event handling
- Custom hooks
- Redux/Context state changes

#### Example Component Test:
```typescript
import { render, fireEvent, screen } from '@testing-library/react';
import { TypingArea } from '../components/TypingArea';

describe('TypingArea Component', () => {
  const mockText = 'test text';
  const mockOnProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with initial state', () => {
    render(<TypingArea text={mockText} onProgress={mockOnProgress} />);
    
    expect(screen.getByTestId('typing-input')).toBeInTheDocument();
    expect(screen.getByText(mockText)).toBeInTheDocument();
  });

  test('handles user input correctly', () => {
    render(<TypingArea text={mockText} onProgress={mockOnProgress} />);
    const input = screen.getByTestId('typing-input');
    
    fireEvent.change(input, { target: { value: 't' } });
    
    expect(mockOnProgress).toHaveBeenCalledWith({
      accuracy: 100,
      progress: 1/9,
      errors: 0
    });
  });
});
```

### Integration Testing (Cypress)

We use Cypress for testing user flows and component integration.

#### Key Areas to Test:
- Complete user flows
- Navigation
- Socket.IO connections
- Race completion scenarios
- Error handling
- API integration

#### Example Integration Test:
```typescript
describe('Race Flow', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/quotes', { fixture: 'quote.json' }).as('getQuote');
    cy.visit('/race');
  });

  it('completes a single player race', () => {
    cy.wait('@getQuote');
    
    // Start race
    cy.get('[data-testid="start-button"]').click();
    
    // Type the text
    cy.get('[data-testid="typing-input"]')
      .type('test text');
    
    // Verify race completion
    cy.get('[data-testid="race-complete"]')
      .should('be.visible');
    
    // Verify WPM calculation
    cy.get('[data-testid="wpm-display"]')
      .should('exist')
      .and('not.have.text', '0');
  });
});
```

### End-to-End Testing (Playwright)

We use Playwright for cross-browser testing and full user scenarios.

#### Key Areas to Test:
- Cross-browser compatibility
- Performance metrics
- Visual regression
- Full user journeys
- Multi-player scenarios

#### Example E2E Test:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Multiplayer Race', () => {
  test('successfully completes a multiplayer race', async ({ page, browser }) => {
    // First player
    await page.goto('/race/multiplayer');
    
    // Second player (new context)
    const player2Context = await browser.newContext();
    const player2Page = await player2Context.newPage();
    await player2Page.goto('/race/multiplayer');
    
    // Start race
    await page.click('[data-testid="ready-button"]');
    await player2Page.click('[data-testid="ready-button"]');
    
    // Verify both players see the race start
    await expect(page.locator('[data-testid="countdown"]')).toBeVisible();
    await expect(player2Page.locator('[data-testid="countdown"]')).toBeVisible();
    
    // Complete race actions...
  });
});
```

## Backend Testing

### Unit Testing (Jest)

We use Jest for testing individual functions and modules.

#### Key Areas to Test:
- Route handlers
- Game logic
- Utility functions
- Data validation
- Error handling

#### Example Unit Test:
```typescript
import { calculateWPM, validateInput } from '../utils/gameLogic';

describe('Game Logic', () => {
  describe('calculateWPM', () => {
    test('calculates WPM correctly for perfect typing', () => {
      const text = 'the quick brown fox';
      const timeInMs = 12000; // 12 seconds
      
      const wpm = calculateWPM(text, text, timeInMs);
      
      // 4 words in 12 seconds = 20 WPM
      expect(wpm).toBe(20);
    });
    
    test('handles errors in calculation', () => {
      expect(() => calculateWPM('', '', 0)).toThrow();
    });
  });
});
```

### Integration Testing (Supertest)

We use Supertest for testing API endpoints and middleware.

#### Key Areas to Test:
- API endpoints
- Middleware functions
- Database operations
- Error handling
- Authentication/Authorization

#### Example Integration Test:
```typescript
import request from 'supertest';
import app from '../app';
import { createTestUser, cleanupTestUser } from './helpers';

describe('Race API', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestUser(testUser.id);
  });

  describe('POST /api/races', () => {
    test('creates new race successfully', async () => {
      const response = await request(app)
        .post('/api/races')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          type: 'multiplayer',
          maxPlayers: 2
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('raceId');
      expect(response.body).toHaveProperty('quote');
    });
  });
});
```

### Socket.IO Testing

We test real-time communication using Socket.IO-client.

#### Key Areas to Test:
- Connection handling
- Event emission and reception
- Race state management
- Error scenarios
- Reconnection handling

#### Example Socket Test:
```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';

describe('Socket.IO Race Events', () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('handles race progress updates', (done) => {
    clientSocket.on('raceProgress', (data) => {
      expect(data).toHaveProperty('playerId');
      expect(data).toHaveProperty('progress');
      expect(data).toHaveProperty('wpm');
      done();
    });

    serverSocket.emit('updateProgress', {
      playerId: '123',
      progress: 0.5,
      wpm: 60
    });
  });
});
```

## Best Practices

### General Testing Guidelines
1. Follow the AAA pattern (Arrange, Act, Assert)
2. Keep tests focused and atomic
3. Use meaningful test descriptions
4. Avoid test interdependence
5. Clean up test data after each test
6. Mock external dependencies
7. Use fixtures for test data

### Frontend Specific
1. Test user interactions as a user would perform them
2. Avoid testing implementation details
3. Use data-testid attributes for test selectors
4. Test accessibility concerns
5. Include visual regression tests for critical components

### Backend Specific
1. Use separate test database
2. Reset database state between tests
3. Mock external services
4. Test edge cases and error conditions
5. Include performance tests for critical endpoints

## Test Coverage Requirements

### Frontend Coverage Targets
- Components: 90%
- Utilities: 95%
- Store/State Management: 90%
- Custom Hooks: 90%
- Overall: 85%

### Backend Coverage Targets
- Routes: 95%
- Controllers: 90%
- Models: 90%
- Utilities: 95%
- Socket Events: 90%
- Overall: 90%

## CI/CD Integration

Tests are automatically run in our CI/CD pipeline:
- On every pull request
- Before deployment to staging
- Before deployment to production

### Pipeline Steps
1. Install dependencies
2. Run linting
3. Run unit tests
4. Run integration tests
5. Run E2E tests
6. Generate coverage reports
7. Deploy if all tests pass

### Test Environment Setup
```yaml
# Example CI environment variables
TEST_DB_URL=mongodb://localhost:27017/speedtype_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test_secret
API_URL=http://localhost:3000
``` 