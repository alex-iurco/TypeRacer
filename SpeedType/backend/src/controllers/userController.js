const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Create random avatar color from available palette
    const colorPalette = ['#4169e1', '#dc143c', '#8b0000', '#4682b4', '#32cd32', '#ffd700'];
    const avatarColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      avatarColor
    });
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Return user info and token (exclude password)
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        joined: user.joined,
        typingStats: user.typingStats
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login a user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Return user info and token (exclude password)
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        joined: user.joined,
        lastLogin: user.lastLogin,
        typingStats: user.typingStats
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Get current user profile
 */
const profile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = req.user;
    
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        joined: user.joined,
        lastLogin: user.lastLogin,
        typingStats: user.typingStats
      }
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { displayName, avatarColor } = req.body;
    const user = req.user;
    
    // Update allowed fields
    if (displayName) user.displayName = displayName;
    if (avatarColor) user.avatarColor = avatarColor;
    
    await user.save();
    
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        joined: user.joined,
        lastLogin: user.lastLogin,
        typingStats: user.typingStats
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

/**
 * Get user race history
 */
const getRaceHistory = async (req, res) => {
  try {
    const user = req.user;
    
    // Get race history (limit to 20 most recent)
    const raceHistory = user.raceHistory
      .sort((a, b) => b.date - a.date)
      .slice(0, 20);
    
    res.status(200).json({ raceHistory });
  } catch (error) {
    console.error('Race history retrieval error:', error);
    res.status(500).json({ message: 'Server error retrieving race history' });
  }
};

/**
 * Get user leaderboard (top users by WPM)
 */
const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({})
      .sort({ 'typingStats.bestWpm': -1 })
      .select('username displayName avatarColor typingStats.bestWpm typingStats.averageWpm typingStats.totalRaces')
      .limit(20);
    
    res.status(200).json({ leaderboard: topUsers });
  } catch (error) {
    console.error('Leaderboard retrieval error:', error);
    res.status(500).json({ message: 'Server error retrieving leaderboard' });
  }
};

module.exports = {
  register,
  login,
  profile,
  updateProfile,
  getRaceHistory,
  getLeaderboard
}; 