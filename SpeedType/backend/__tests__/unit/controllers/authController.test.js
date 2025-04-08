const { register, login } = require('../../../src/controllers/userController');
const User = require('../../../src/models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../../src/middleware/auth');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('bcryptjs');
jest.mock('../../../src/middleware/auth');

describe('Auth Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = {
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });
  
  describe('register', () => {
    test('should return 400 if email already exists', async () => {
      // Setup
      req.body = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });
      
      // Execute
      await register(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
    });
    
    test('should return 400 if username already exists', async () => {
      // Setup
      req.body = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValueOnce(null); // Email doesn't exist
      User.findOne.mockResolvedValueOnce({ username: 'existinguser' }); // Username exists
      
      // Execute
      await register(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(User.findOne).toHaveBeenCalledWith({ username: 'existinguser' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username already taken' });
    });
    
    test('should create new user and return token', async () => {
      // Setup
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };
      
      const mockUser = { 
        _id: 'user123', 
        username: 'newuser',
        email: 'new@example.com',
        save: jest.fn().mockResolvedValue(true)
      };
      
      User.findOne.mockResolvedValue(null); // User doesn't exist
      User.mockImplementation(() => mockUser);
      generateToken.mockReturnValue('mocktoken');
      
      // Execute
      await register(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveProperty('token', 'mocktoken');
      expect(res.json.mock.calls[0][0]).toHaveProperty('user');
    });
    
    test('should return 500 if server error', async () => {
      // Setup
      req.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };
      
      User.findOne.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Execute
      await register(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error during registration' });
    });
  });
  
  describe('login', () => {
    test('should return 401 if user not found', async () => {
      // Setup
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValue(null);
      
      // Execute
      await login(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
    
    test('should return 401 if password is incorrect', async () => {
      // Setup
      req.body = {
        email: 'user@example.com',
        password: 'wrongpassword'
      };
      
      const mockUser = { 
        _id: 'user123', 
        email: 'user@example.com',
        password: 'hashedpassword',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Execute
      await login(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
    
    test('should return user and token when credentials are valid', async () => {
      // Setup
      req.body = {
        email: 'user@example.com',
        password: 'correctpassword'
      };
      
      const mockUser = { 
        _id: 'user123', 
        username: 'testuser',
        email: 'user@example.com',
        password: 'hashedpassword',
        lastLogin: Date.now(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };
      
      User.findOne.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mocktoken');
      
      // Execute
      await login(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('correctpassword');
      expect(mockUser.save).toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveProperty('token', 'mocktoken');
      expect(res.json.mock.calls[0][0]).toHaveProperty('user');
    });
    
    test('should return 500 if server error', async () => {
      // Setup
      req.body = {
        email: 'user@example.com',
        password: 'password123'
      };
      
      User.findOne.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Execute
      await login(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error during login' });
    });
  });
}); 