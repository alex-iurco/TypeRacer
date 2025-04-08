const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    trim: true,
    default: function() { return this.username; }
  },
  avatarColor: {
    type: String,
    default: '#4169e1' // Default color
  },
  joined: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  typingStats: {
    averageWpm: {
      type: Number,
      default: 0
    },
    bestWpm: {
      type: Number,
      default: 0
    },
    totalRaces: {
      type: Number,
      default: 0
    },
    racesWon: {
      type: Number,
      default: 0
    },
    averageAccuracy: {
      type: Number,
      default: 0
    },
    totalTextTyped: {
      type: Number, // Characters
      default: 0
    }
  },
  raceHistory: [
    {
      date: {
        type: Date,
        default: Date.now
      },
      wpm: Number,
      accuracy: Number,
      position: Number,
      textLength: Number,
      isMultiplayer: Boolean,
      raceId: String
    }
  ]
}, {
  timestamps: true
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update typing statistics after a race
UserSchema.methods.updateStats = function(wpm, accuracy, position, textLength, isMultiplayer, raceId) {
  // Add race to history
  this.raceHistory.push({
    date: Date.now(),
    wpm,
    accuracy,
    position,
    textLength,
    isMultiplayer,
    raceId
  });
  
  // Update total races and races won
  this.typingStats.totalRaces += 1;
  if (position === 1) {
    this.typingStats.racesWon += 1;
  }
  
  // Update total text typed
  this.typingStats.totalTextTyped += textLength;
  
  // Update average WPM and best WPM
  const totalWpm = this.typingStats.averageWpm * (this.typingStats.totalRaces - 1) + wpm;
  this.typingStats.averageWpm = totalWpm / this.typingStats.totalRaces;
  
  if (wpm > this.typingStats.bestWpm) {
    this.typingStats.bestWpm = wpm;
  }
  
  // Update average accuracy
  const totalAccuracy = this.typingStats.averageAccuracy * (this.typingStats.totalRaces - 1) + accuracy;
  this.typingStats.averageAccuracy = totalAccuracy / this.typingStats.totalRaces;
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 