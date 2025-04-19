# SpeedType E2E Testing

This directory contains the end-to-end tests for the SpeedType application using Playwright.

## Test Consolidation

We've consolidated the previously separate test approaches into a more consistent and maintainable structure:

### Old Approach (Deprecated)
- `race.spec.js` - JavaScript-based test focusing on race initialization
- `race.spec.ts` - TypeScript-based test covering complete race functionality

### New Consolidated Approach
- `singlePlayer.spec.ts` - Comprehensive TypeScript tests for single player mode
- `environment.spec.js` - Environment configuration tests

## Running Tests

### Single Player Tests

```bash
# Run all single player tests
npm run test:e2e:single

# Run with UI for debugging
npm run test:e2e:single:ui

# Run in test environment 
npm run test:e2e:single:test-env

# Run in production environment
npm run test:e2e:single:prod
```

### All Tests

```bash
# Run all tests
npm run test:e2e

# Run all tests with UI
npm run test:e2e:ui

# Run all tests in test environment
npm run test:e2e:test-env

# Run all tests in production environment
npm run test:e2e:prod
```

## Test Structure

The single player tests consist of three main test cases:

1. **Race Initialization Test**
   - Verifies the countdown and race start mechanics
   - Tests component mounting and initialization
   - Monitors state transitions

2. **Complete Race Test**
   - Tests the full race flow from start to finish
   - Verifies text input and completion
   - Checks race status updates and WPM display

3. **Custom Text Test**
   - Tests the ability to use custom text input
   - Verifies text appears and can be typed

## Troubleshooting

If tests fail, look for screenshots in the `test-results` directory:
- `initialization-*.png` - Screenshots from initialization test
- `complete-*.png` - Screenshots from complete race test
- `connection-failure.png` - Generated if connection issues occur

## Best Practices

1. **Test Files**
   - Use TypeScript for new tests
   - Follow the existing pattern with descriptive test names
   - Group related tests with `test.describe()`

2. **Selectors**
   - Prefer data attributes for test selectors
   - Fall back to class names when necessary
   - Avoid using text content for selection when possible
   - Use specific selectors to avoid ambiguity (e.g., '.race-complete .wpm-display' instead of just '.wpm-display')

3. **Assertions**
   - Use explicit assertions with `expect()`
   - Include descriptive error messages
   - Verify both UI state and application behavior 