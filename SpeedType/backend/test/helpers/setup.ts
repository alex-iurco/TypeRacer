// Basic setup for tests
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Set default timeout for tests
jest.setTimeout(30000);

// Mock environment variables if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret';
}

if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/speedtype-test';
}

// Global setup and teardown
beforeAll(() => {
  console.log('Test suite starting...');
});

afterAll(() => {
  console.log('Test suite completed.');
}); 