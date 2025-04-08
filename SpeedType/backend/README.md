# SpeedType Backend

The backend server for SpeedType, a real-time typing race game similar to TypeRacer.

## Technologies

- Node.js with Express
- MongoDB with Mongoose
- Socket.IO for real-time multiplayer
- JWT for authentication
- Jest for testing

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost/speedtype
     MONGO_URI_TEST=mongodb://localhost/speedtype-test
     JWT_SECRET=your_jwt_secret
     ```

3. Run the development server:
   ```
   npm run dev
   ```

## Authentication System

The application uses JWT (JSON Web Tokens) for authentication.

### Registration
- Endpoint: `POST /api/users/register`
- Request body: `{ username, email, password }`
- Success response (201): JWT token and user information
- Error responses: 
  - 400: Email already in use / Username already taken
  - 500: Server error

### Login
- Endpoint: `POST /api/users/login`
- Request body: `{ email, password }`
- Success response (200): JWT token and user information
- Error responses:
  - 401: Invalid credentials
  - 500: Server error

### Protected Routes
- All protected routes require an Authorization header: `Bearer <token>`
- Example: `GET /api/users/profile`
- Error responses:
  - 401: Authentication required / Invalid token / User not found
  - 500: Server error

## Testing

### Running Tests

Run all tests:
```
npm test
```

Run specific test suites:
```
npm run test:unit       # Unit tests
npm run test:integration # Integration tests
npm run test:socket     # Socket.IO tests
```

### Test Coverage
```
npm run test:coverage
```

### Test Structure

- Unit Tests: Located in `__tests__/unit/`
  - Controllers: Test each controller function in isolation
  - Models: Test model methods and validators
  - Middleware: Test authentication middleware

- Integration Tests: Located in `__tests__/integration/`
  - API Tests: Test complete API endpoints with database interaction

- Socket Tests: Located in `__tests__/socket/`
  - Test real-time functionality with Socket.IO

## API Documentation

### User Endpoints
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Log in a user
- `GET /api/users/profile` - Get current user profile (requires auth)

### Leaderboard Endpoints
- `GET /api/leaderboard/:mode/:limit?` - Get leaderboard for specific mode
- `POST /api/leaderboard/scores` - Submit a new score (requires auth)

## Code Structure

- `src/` - Source code
  - `controllers/` - Request handlers
  - `models/` - Database models
  - `middleware/` - Express middleware
  - `routes/` - API routes
  - `utils/` - Utility functions
  - `socket/` - Socket.IO handlers
  - `app.js` - Express app setup
  - `server.js` - Main entry point

- `__tests__/` - Test files
  - `unit/` - Unit tests
  - `integration/` - Integration tests
  - `socket/` - Socket.IO tests 