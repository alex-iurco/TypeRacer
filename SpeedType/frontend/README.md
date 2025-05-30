# SpeedType Frontend

The frontend application for SpeedType, a real-time multiplayer typing race game.

## Technology Stack
- React 18
- Vite
- Socket.IO Client
- CSS3 for styling

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```
The development server will start at http://localhost:3000

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment

The frontend is automatically deployed to GitHub Pages using GitHub Actions when changes are pushed to the main branch. The deployment workflow:

1. Builds the React application
2. Configures the custom domain (speedtype.robocat.ai)
3. Deploys to GitHub Pages
4. Verifies the deployment

### Custom Domain Setup

The application is served from https://speedtype.robocat.ai with:
- CNAME record pointing to alex-iurco.github.io
- Automatic HTTPS enabled
- GitHub Pages configuration in repository settings

## Environment Configuration

The application connects to the backend service at:
- Production: https://speedtype-backend-production.up.railway.app
- Development: http://localhost:3001

## Available Scripts

- `npm run dev`: Start development server
- `npm run dev:prod`: Start development server with production configuration
- `npm run dev:test`: Start development server with test configuration
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run all end-to-end tests using default configuration
- `npm run test:e2e:test-env`: Run end-to-end tests in test environment
- `npm run test:e2e:prod`: Run end-to-end tests against production environment
- `npm run test:e2e:ui`: Open the Playwright UI for test debugging

## End-to-End Testing

The application has end-to-end tests configured with Playwright. These tests can be run against different environments:

### Test Environment (Default)
```bash
npm run test:e2e:test-env
```
This runs tests using a local development server in test mode, which configures the application to use test-specific settings.

#### Test Environment Configuration
- Frontend URL: http://localhost:3000
- Note: The test environment is configured to use the production backend URL (https://speedtype-backend-production.up.railway.app) instead of localhost:3001 for more reliable testing.

### Production Environment
```bash
npm run test:e2e:prod
```
This runs tests against the deployed production application. It uses the actual production frontend and backend without starting any local servers.

#### Production Environment Configuration
- Frontend URL: https://speedtype.robocat.ai
- Backend URL: https://speedtype-backend-production.up.railway.app

### Environment Validation
The test suite includes an environment validation test that:
- Verifies the correct frontend and backend URLs are used based on the environment
- Checks server connectivity
- Validates application configuration from console logs
- Documents when actual settings differ from expected settings

This environment validation runs at the beginning of all test suites to ensure proper configuration before running functional tests.

### Viewing Test Reports
After running tests, you can view the HTML report:
```bash
npx playwright show-report
```

## Project Structure

```