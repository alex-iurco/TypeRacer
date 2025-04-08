const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const app = require('../../src/app');

// Helper function to get JWT secret
const getJwtSecret = () => process.env.JWT_SECRET || 'speedtype_jwt_secret_dev_only';

describe('Authentication API', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoURI = process.env.MONGO_URI_TEST || 'mongodb://localhost/speedtype-test';
    await mongoose.connect(mongoURI);
    
    // Clear users collection before tests
    await User.deleteMany({});
  });
  
  afterAll(async () => {
    // Disconnect from database
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });
  
  describe('POST /api/users/register', () => {
    test('should register a new user and return token', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);
      
      // Check response structure
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verify token
      const decoded = jwt.verify(response.body.token, getJwtSecret());
      expect(decoded).toHaveProperty('userId');
      
      // Check that user was saved to database
      const savedUser = await User.findById(decoded.userId);
      expect(savedUser).not.toBeNull();
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe('test@example.com');
      
      // Check password was hashed (not stored as plaintext)
      expect(savedUser.password).not.toBe('password123');
    });
    
    test('should return 400 if email already exists', async () => {
      // Create a user first
      const existingUser = new User({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      });
      await existingUser.save();
      
      // Try to register with same email
      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);
      
      expect(response.body).toHaveProperty('message', 'Email already in use');
    });
    
    test('should return 400 if username already exists', async () => {
      // Create a user first
      const existingUser = new User({
        username: 'existinguser',
        email: 'user1@example.com',
        password: 'password123'
      });
      await existingUser.save();
      
      // Try to register with same username
      const userData = {
        username: 'existinguser',
        email: 'user2@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);
      
      expect(response.body).toHaveProperty('message', 'Username already taken');
    });
  });
  
  describe('POST /api/users/login', () => {
    test('should login user and return token', async () => {
      // Create a user
      const user = new User({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123'
      });
      await user.save();
      
      // Login with credentials
      const loginData = {
        email: 'login@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);
      
      // Check response structure
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'loginuser');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verify token
      const decoded = jwt.verify(response.body.token, getJwtSecret());
      expect(decoded).toHaveProperty('userId');
      expect(decoded.userId).toBe(user._id.toString());
      
      // Check that lastLogin was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLogin).not.toEqual(user.lastLogin);
    });
    
    test('should return 401 if user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
    
    test('should return 401 if password is incorrect', async () => {
      // Create a user
      const user = new User({
        username: 'wrongpassword',
        email: 'wrong@example.com',
        password: 'password123'
      });
      await user.save();
      
      // Login with wrong password
      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
  
  describe('GET /api/users/profile', () => {
    test('should return user profile when authenticated', async () => {
      // Create a user
      const user = new User({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'password123'
      });
      await user.save();
      
      // Generate token
      const token = jwt.sign(
        { userId: user._id.toString() },
        getJwtSecret(),
        { expiresIn: '1h' }
      );
      
      // Request profile with token
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'profileuser');
      expect(response.body.user).toHaveProperty('email', 'profile@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });
    
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
    
    test('should return 401 if token is invalid', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
  });
}); 