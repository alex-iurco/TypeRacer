const mongoose = require('mongoose');

/**
 * Score schema for storing typing test results
 */
const scoreSchema = new mongoose.Schema({
  wpm: {
    type: Number,
    required: true,
    min: 0
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  mode: {
    type: String,
    required: true,
    enum: ['standard', 'practice', 'multiplayer']
  },
  textId: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for faster leaderboard retrieval
scoreSchema.index({ mode: 1, wpm: -1 });

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score; 