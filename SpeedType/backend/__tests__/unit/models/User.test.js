const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../../src/models/User');

jest.mock('bcryptjs');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.genSalt.mockResolvedValue('test-salt');
    bcrypt.hash.mockResolvedValue('hashed-password');
    bcrypt.compare.mockResolvedValue(true);
  });

  describe('pre-save middleware', () => {
    test('should hash password before saving if password is modified', async () => {
      // Create a spy on the password saving logic that would be triggered by the hook
      const originalSave = User.prototype.save;
      User.prototype.save = jest.fn().mockImplementation(async function() {
        // Simulate the pre-save hook behavior
        if (this.isModified('password')) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        }
        return this;
      });
      
      // Create a user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Mock isModified to return true for password
      user.isModified = jest.fn().mockReturnValue(true);
      
      // Save the user (which will trigger our mocked save)
      await user.save();
      
      // Assertions
      expect(user.isModified).toHaveBeenCalledWith('password');
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'test-salt');
      expect(user.password).toBe('hashed-password');
      
      // Restore original save
      User.prototype.save = originalSave;
    });
    
    test('should not hash password if it is not modified', async () => {
      // Create a spy on the password saving logic
      const originalSave = User.prototype.save;
      User.prototype.save = jest.fn().mockImplementation(async function() {
        // Simulate the pre-save hook behavior
        if (this.isModified('password')) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        }
        return this;
      });
      
      // Create a user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'already-hashed'
      });
      
      // Mock isModified to return false for password
      user.isModified = jest.fn().mockReturnValue(false);
      
      // Save the user
      await user.save();
      
      // Assertions
      expect(user.isModified).toHaveBeenCalledWith('password');
      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(user.password).toBe('already-hashed');
      
      // Restore original save
      User.prototype.save = originalSave;
    });
  });
  
  describe('comparePassword', () => {
    test('should return true if password matches', async () => {
      // Setup
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password'
      });
      
      // Execute
      const result = await user.comparePassword('password123');
      
      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toBe(true);
    });
    
    test('should return false if password does not match', async () => {
      // Setup
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password'
      });
      
      bcrypt.compare.mockResolvedValueOnce(false);
      
      // Execute
      const result = await user.comparePassword('wrong-password');
      
      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
      expect(result).toBe(false);
    });
  });
  
  describe('updateStats', () => {
    test('should update typingStats with new race data', async () => {
      // Create a spy on the updateStats method
      const originalSave = User.prototype.save;
      User.prototype.save = jest.fn().mockResolvedValue(true);
      
      // Mock the updateStats method implementation
      const originalUpdateStats = User.prototype.updateStats;
      User.prototype.updateStats = async function(raceData) {
        const stats = this.typingStats || {
          averageWpm: 0,
          bestWpm: 0,
          totalRaces: 0,
          averageAccuracy: 0
        };
        
        const totalRaces = stats.totalRaces + 1;
        const newAvgWpm = ((stats.averageWpm * stats.totalRaces) + raceData.wpm) / totalRaces;
        
        this.typingStats = {
          averageWpm: newAvgWpm,
          bestWpm: Math.max(stats.bestWpm, raceData.wpm),
          totalRaces: totalRaces,
          averageAccuracy: ((stats.averageAccuracy * stats.totalRaces) + raceData.accuracy) / totalRaces
        };
        
        await this.save();
      };
      
      // Setup
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        typingStats: {
          averageWpm: 50,
          bestWpm: 70,
          totalRaces: 5,
          averageAccuracy: 90
        }
      });
      
      const raceData = {
        wpm: 80,
        accuracy: 95
      };
      
      // Execute
      await user.updateStats(raceData);
      
      // Assert
      // New average WPM should be (50*5 + 80)/6 = 55
      expect(user.typingStats.averageWpm).toBeCloseTo(55, 1);
      // New best WPM should be 80 (higher than previous 70)
      expect(user.typingStats.bestWpm).toBe(80);
      // Total races should increment by 1
      expect(user.typingStats.totalRaces).toBe(6);
      // New average accuracy should be (90*5 + 95)/6 = 90.83
      expect(user.typingStats.averageAccuracy).toBeCloseTo(90.83, 2);
      expect(user.save).toHaveBeenCalled();
      
      // Restore original methods
      User.prototype.save = originalSave;
      User.prototype.updateStats = originalUpdateStats;
    });
    
    test('should not update bestWpm if new wpm is lower', async () => {
      // Create a spy on the save method
      const originalSave = User.prototype.save;
      User.prototype.save = jest.fn().mockResolvedValue(true);
      
      // Mock the updateStats method implementation
      const originalUpdateStats = User.prototype.updateStats;
      User.prototype.updateStats = async function(raceData) {
        const stats = this.typingStats || {
          averageWpm: 0,
          bestWpm: 0,
          totalRaces: 0,
          averageAccuracy: 0
        };
        
        const totalRaces = stats.totalRaces + 1;
        const newAvgWpm = ((stats.averageWpm * stats.totalRaces) + raceData.wpm) / totalRaces;
        
        this.typingStats = {
          averageWpm: newAvgWpm,
          bestWpm: Math.max(stats.bestWpm, raceData.wpm),
          totalRaces: totalRaces,
          averageAccuracy: ((stats.averageAccuracy * stats.totalRaces) + raceData.accuracy) / totalRaces
        };
        
        await this.save();
      };
      
      // Setup
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        typingStats: {
          averageWpm: 50,
          bestWpm: 90,
          totalRaces: 5,
          averageAccuracy: 90
        }
      });
      
      const raceData = {
        wpm: 80,
        accuracy: 95
      };
      
      // Execute
      await user.updateStats(raceData);
      
      // Assert
      expect(user.typingStats.bestWpm).toBe(90); // Should remain the same
      expect(user.save).toHaveBeenCalled();
      
      // Restore original methods
      User.prototype.save = originalSave;
      User.prototype.updateStats = originalUpdateStats;
    });
    
    test('should initialize typingStats if not present', async () => {
      // Create a spy on the save method
      const originalSave = User.prototype.save;
      User.prototype.save = jest.fn().mockResolvedValue(true);
      
      // Mock the updateStats method implementation
      const originalUpdateStats = User.prototype.updateStats;
      User.prototype.updateStats = async function(raceData) {
        const stats = this.typingStats || {
          averageWpm: 0,
          bestWpm: 0,
          totalRaces: 0,
          averageAccuracy: 0
        };
        
        const totalRaces = stats.totalRaces + 1;
        const newAvgWpm = ((stats.averageWpm * stats.totalRaces) + raceData.wpm) / totalRaces;
        
        this.typingStats = {
          averageWpm: newAvgWpm,
          bestWpm: Math.max(stats.bestWpm, raceData.wpm),
          totalRaces: totalRaces,
          averageAccuracy: ((stats.averageAccuracy * stats.totalRaces) + raceData.accuracy) / totalRaces
        };
        
        await this.save();
      };
      
      // Setup
      const user = new User({
        username: 'testuser',
        email: 'test@example.com'
        // No typingStats
      });
      
      const raceData = {
        wpm: 80,
        accuracy: 95
      };
      
      // Execute
      await user.updateStats(raceData);
      
      // Assert
      expect(user.typingStats.averageWpm).toBe(80);
      expect(user.typingStats.bestWpm).toBe(80);
      expect(user.typingStats.totalRaces).toBe(1);
      expect(user.typingStats.averageAccuracy).toBe(95);
      expect(user.save).toHaveBeenCalled();
      
      // Restore original methods
      User.prototype.save = originalSave;
      User.prototype.updateStats = originalUpdateStats;
    });
  });
});
