const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

// Updated server configuration with improved error handling
const app = express();
app.use(cors({
  origin: ["https://alex-iurco.github.io", "https://speedtype.robocat.ai", "http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
const server = http.createServer(app);

// Allow requests from GitHub Pages, custom domain, and local development
const io = new Server(server, {
  cors: {
    origin: ["https://alex-iurco.github.io", "https://speedtype.robocat.ai", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true
});

const PORT = process.env.PORT || 3001;

// Remove sample text, it will be provided by users
// const sampleText = "...";

let currentRaceText = null; // Store the active race text
let racers = {}; // Store racer data { socketId: { id, name, progress } }

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ status: 'healthy', message: 'SpeedType Backend is running!' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Add new racer with default state
  racers[socket.id] = { 
    id: socket.id, 
    name: `Guest_${socket.id.substring(0, 4)}`, 
    progress: 0,
    wpm: 0,
    finished: false 
  };
  console.log('Current racers:', racers);

  // Notify others about the new racer
  socket.broadcast.emit('race_update', Object.values(racers));

  // Send current race text (if any) and all racers to the new user
  if (currentRaceText) {
    socket.emit('race_text', currentRaceText);
  }
  socket.emit('race_update', Object.values(racers));

  // Handle custom text submission to START a race
  socket.on('submit_custom_text', (text) => {
    console.log(`Received custom text from ${socket.id} to start race.`);
    currentRaceText = text; // Set the new text for the race

    // Reset progress for all connected racers
    for (const id in racers) {
      racers[id].progress = 0;
    }
    console.log('Resetting progress for all racers.');

    // Broadcast the new text and the reset racer state to everyone
    io.emit('race_text', currentRaceText);
    io.emit('race_update', Object.values(racers));
  });

  // Handle progress update
  socket.on('progress_update', (data) => {
    if (racers[socket.id]) {
      // Only update progress if there is an active race text
      if (currentRaceText !== null) {
        racers[socket.id].progress = data.progress;
        // Don't broadcast on every progress update
        if (data.progress === 100) {
          racers[socket.id].finished = true;
          io.emit('race_update', Object.values(racers));
          
          // Check if all racers finished
          const allFinished = Object.values(racers).every(racer => racer.progress === 100);
          if (allFinished) {
            io.emit('room_state', { status: 'finished' });
          }
        }
      } else {
        console.log(`Progress update from ${socket.id} ignored, no active race.`);
      }
    } else {
      console.log(`Received progress from unknown socket: ${socket.id}`);
    }
  });

  // Handle race completion
  socket.on('race_complete', () => {
    if (racers[socket.id]) {
      racers[socket.id].finished = true;
      racers[socket.id].progress = 100;
      io.emit('race_update', Object.values(racers));
      
      // Check if all racers finished
      const allFinished = Object.values(racers).every(racer => racer.progress === 100);
      if (allFinished) {
        io.emit('room_state', { status: 'finished' });
      }
    }
  });

  // Handle WPM update
  socket.on('wpm_update', (data) => {
    if (racers[socket.id]) {
      racers[socket.id].wpm = data.wpm;
      // Don't broadcast on every WPM update
    } else {
      console.log(`Received WPM from unknown socket: ${socket.id}`);
    }
  });

  // Add periodic update broadcast
  const updateInterval = setInterval(() => {
    if (Object.keys(racers).length > 0) {
      io.emit('race_update', Object.values(racers));
    }
  }, 1000); // Send updates every second

  // Clean up interval on disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    clearInterval(updateInterval);
    const wasRacer = !!racers[socket.id];
    delete racers[socket.id];
    console.log('Current racers:', racers);
    // Only notify if they were actually part of the race state
    if (wasRacer) {
      io.emit('race_update', Object.values(racers));
    }
    // If no racers left, maybe clear the race text?
    if (Object.keys(racers).length === 0) {
      console.log("No racers left, clearing race text.");
      currentRaceText = null;
    }
  });

  // More event handlers can be added later
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on *:${PORT}`);
});

// Deployment test - Railway GitHub Actions 

// SpeedType Backend Server - Deployed on Railway
// Testing deployment with new Railway token
// ... existing code ... 