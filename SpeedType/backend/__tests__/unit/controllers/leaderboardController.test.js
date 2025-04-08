const { getLeaderboard, submitScore } = require('../../../src/controllers/leaderboardController');
const Score = require('../../../src/models/Score');
const User = require('../../../src/models/User');

// Mock dependencies
jest.mock('../../../src/models/Score');
jest.mock('../../../src/models/User');

describe('Leaderboard Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = {
      params: {},
      body: {},
      userId: 'user123'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });
  
  describe('getLeaderboard', () => {
    test('should return top scores when valid parameters are provided', async () => {
      // Setup
      req.params.mode = 'standard';
      req.params.limit = '10';
      
      const mockScores = [
        { 
          _id: 'score1', 
          wpm: 100, 
          accuracy: 98.5, 
          date: new Date(),
          user: { _id: 'user1', username: 'testuser1' }
        },
        { 
          _id: 'score2', 
          wpm: 95, 
          accuracy: 97.2, 
          date: new Date(),
          user: { _id: 'user2', username: 'testuser2' }
        }
      ];
      
      Score.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockScores)
      });
      
      // Execute
      await getLeaderboard(req, res);
      
      // Assert
      expect(Score.find).toHaveBeenCalledWith({ mode: 'standard' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ scores: mockScores });
    });
    
    test('should use default limit if not specified', async () => {
      // Setup
      req.params.mode = 'standard';
      // No limit param
      
      const mockScores = [{ _id: 'score1', wpm: 100 }];
      
      Score.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockScores)
      });
      
      // Execute
      await getLeaderboard(req, res);
      
      // Assert
      expect(Score.find).toHaveBeenCalledWith({ mode: 'standard' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    test('should handle server errors', async () => {
      // Setup
      req.params.mode = 'standard';
      req.params.limit = '10';
      
      Score.find.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Execute
      await getLeaderboard(req, res);
      
      // Assert
      expect(Score.find).toHaveBeenCalledWith({ mode: 'standard' });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Server error', 
        error: expect.any(Error)
      });
    });
  });
  
  describe('submitScore', () => {
    test('should create a new score and return it', async () => {
      // Setup
      req.body = {
        wpm: 85,
        accuracy: 96.5,
        mode: 'standard',
        textId: 'text123'
      };
      
      const mockUser = { _id: 'user123', username: 'testuser' };
      const mockScore = { 
        _id: 'newscore123',
        wpm: 85,
        accuracy: 96.5,
        mode: 'standard',
        textId: 'text123',
        user: 'user123'
      };
      const populatedScore = {
        ...mockScore,
        user: mockUser
      };
      
      User.findById.mockResolvedValue(mockUser);
      Score.create.mockResolvedValue(mockScore);
      Score.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedScore)
      });
      
      // Execute
      await submitScore(req, res);
      
      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Score.create).toHaveBeenCalledWith({
        wpm: 85,
        accuracy: 96.5,
        mode: 'standard',
        textId: 'text123',
        user: 'user123'
      });
      expect(Score.findById).toHaveBeenCalledWith('newscore123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ score: populatedScore });
    });
    
    test('should return 400 if required parameters are missing', async () => {
      // Setup
      req.body = {
        // Missing wpm and accuracy
        mode: 'standard',
        textId: 'text123'
      };
      
      // Execute
      await submitScore(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Please provide all required fields: wpm, accuracy, mode, textId' 
      });
      expect(Score.create).not.toHaveBeenCalled();
    });
    
    test('should return 404 if user is not found', async () => {
      // Setup
      req.body = {
        wpm: 85,
        accuracy: 96.5,
        mode: 'standard',
        textId: 'text123'
      };
      
      User.findById.mockResolvedValue(null);
      
      // Execute
      await submitScore(req, res);
      
      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(Score.create).not.toHaveBeenCalled();
    });
    
    test('should handle server errors', async () => {
      // Setup
      req.body = {
        wpm: 85,
        accuracy: 96.5,
        mode: 'standard',
        textId: 'text123'
      };
      
      User.findById.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Execute
      await submitScore(req, res);
      
      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Server error', 
        error: expect.any(Error)
      });
      expect(Score.create).not.toHaveBeenCalled();
    });
  });
}); 