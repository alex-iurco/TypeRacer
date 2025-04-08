const { verifyToken } = require('./auth');
const User = require('../models/User');

/**
 * Socket authentication middleware
 * Authenticates a socket connection using a token in a query parameter or handshake headers
 */
const socketAuth = async (socket, next) => {
  try {
    // Check for token in handshake query or auth header
    const token = 
      socket.handshake.query?.token ||
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // Allow connection without authentication for backward compatibility
      // But mark the socket as unauthenticated
      socket.user = null;
      socket.isAuthenticated = false;
      return next();
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      // Invalid token but still allow connection for compatibility
      socket.user = null;
      socket.isAuthenticated = false;
      return next();
    }
    
    // Find user by ID
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      // User not found but still allow connection for compatibility
      socket.user = null;
      socket.isAuthenticated = false;
      return next();
    }
    
    // Attach user to socket
    socket.user = {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor
    };
    socket.isAuthenticated = true;
    
    return next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    // Allow connection without authentication for backward compatibility
    socket.user = null;
    socket.isAuthenticated = false;
    return next();
  }
};

module.exports = socketAuth; 