const jwt = require('jsonwebtoken');
const { generateToken, verifyToken, auth } = require('../../../src/middleware/auth');
const User = require('../../../src/models/User');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../src/models/User');

describe('Auth Middleware', () => {
  
  describe('generateToken', () => {
    test('should generate a token with the provided user ID', () => {
      // Setup
      const userId = 'user123';
      const mockToken = 'generated_token';
      jwt.sign.mockReturnValue(mockToken);
      
      // Execute
      const token = generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId },
        expect.any(String), // JWT_SECRET is defined with a fallback in the implementation
        { expiresIn: '7d' }
      );
      expect(token).toBe(mockToken);
    });
  });
  
  describe('verifyToken', () => {
    test('should verify a valid token and return decoded payload', () => {
      // Setup
      const token = 'valid_token';
      const decoded = { userId: 'user123' };
      jwt.verify.mockReturnValue(decoded);
      
      // Execute
      const result = verifyToken(token);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(result).toBe(decoded);
    });
    
    test('should return null if token verification fails', () => {
      // Setup
      const token = 'invalid_token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Execute
      const result = verifyToken(token);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(result).toBeNull();
    });
  });
  
  describe('auth', () => {
    let req, res, next;
    
    beforeEach(() => {
      req = {
        header: jest.fn(),
        user: null,
        token: null
      };
      
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      next = jest.fn();
      
      jest.clearAllMocks();
    });
    
    test('should return 401 if no token is provided', async () => {
      // Setup
      req.header.mockReturnValue(undefined);
      
      // Execute
      await auth(req, res, next);
      
      // Assert
      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required. No token provided.' });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should return 401 if token does not start with "Bearer "', async () => {
      // Setup
      req.header.mockReturnValue('invalid-format-token');
      
      // Execute
      await auth(req, res, next);
      
      // Assert
      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required. No token provided.' });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should return 401 if token is invalid', async () => {
      // Setup
      req.header.mockReturnValue('Bearer invalid_token');
      jwt.verify.mockImplementation(() => {
        throw { name: 'JsonWebTokenError' };
      });
      
      // Execute
      await auth(req, res, next);
      
      // Assert
      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token.' });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should return 401 if token is expired', async () => {
      // Setup
      req.header.mockReturnValue('Bearer expired_token');
      jwt.verify.mockImplementation(() => {
        throw { name: 'TokenExpiredError' };
      });
      
      // Execute
      await auth(req, res, next);
      
      // Assert
      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token expired.' });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should return 401 if user is not found', async () => {
      // Setup
      req.header.mockReturnValue('Bearer valid_token');
      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockResolvedValue(null);
      
      // Execute
      await auth(req, res, next);
      
      // Assert
      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should set req.user, req.token and call next() for valid token and user', async () => {
      // Setup
      const mockUser = { _id: 'user123', username: 'testuser' };
      req.header.mockReturnValue('Bearer valid_token');
      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockResolvedValue(mockUser);
      
      // Execute
      await auth(req, res, next);
      
      // Assert
      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toBe(mockUser);
      expect(req.token).toBe('valid_token');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('should handle server errors during authentication', async () => {
      // Setup
      req.header.mockReturnValue('Bearer valid_token');
      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockRejectedValue(new Error('Database error'));
      
      // Execute
      await auth(req, res, next);
      
      // Assert
      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error during authentication.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 