const Score = require('../models/Score');
const User = require('../models/User');

/**
 * Get leaderboard scores for a specific mode
 * @route GET /api/leaderboard/:mode/:limit?
 */
const getLeaderboard = async (req, res) => {
  try {
    const { mode, limit = 10 } = req.params;
    
    const scores = await Score.find({ mode })
      .sort({ wpm: -1 })
      .limit(parseInt(limit, 10))
      .populate('user', 'username displayName avatarColor');
    
    res.status(200).json({ scores });
  } catch (error) {
    console.error('Leaderboard retrieval error:', error);
    res.status(500).json({
      message: 'Server error',
      error
    });
  }
};

/**
 * Submit a new score
 * @route POST /api/scores
 */
const submitScore = async (req, res) => {
  try {
    const { wpm, accuracy, mode, textId } = req.body;
    const userId = req.userId;
    
    // Validate required fields
    if (!wpm || !accuracy || !mode || !textId) {
      return res.status(400).json({
        message: 'Please provide all required fields: wpm, accuracy, mode, textId'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create new score
    const newScore = await Score.create({
      wpm,
      accuracy,
      mode,
      textId,
      user: userId
    });
    
    // Return populated score
    const populatedScore = await Score.findById(newScore._id)
      .populate('user', 'username displayName avatarColor');
    
    res.status(201).json({ score: populatedScore });
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({
      message: 'Server error',
      error
    });
  }
};

module.exports = {
  getLeaderboard,
  submitScore
}; 