const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/leaderboard', userController.getLeaderboard);

// Protected routes (require authentication)
router.get('/profile', auth, userController.profile);
router.put('/profile', auth, userController.updateProfile);
router.get('/history', auth, userController.getRaceHistory);

module.exports = router; 