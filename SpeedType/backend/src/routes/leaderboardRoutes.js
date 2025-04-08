const express = require('express');
const { getLeaderboard, submitScore } = require('../controllers/leaderboardController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:mode/:limit?', getLeaderboard);

// Protected routes
router.post('/scores', auth, submitScore);

module.exports = router; 