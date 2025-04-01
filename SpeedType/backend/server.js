const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

// Allow requests from GitHub Pages and local development
const io = new Server(server, {
  cors: {
    origin: ["https://alex-iurco.github.io", "http://localhost:5173", "http://localhost:3000"],
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

// Basic route
app.get('/', (req, res) => {
  res.send('SpeedType Backend is running!');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Add new racer with default state
  racers[socket.id] = { id: socket.id, name: `Guest_${socket.id.substring(0, 4)}`, progress: 0 };
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
          racers[socket.id].wpm = data.wpm; // Add WPM to racer data
          io.emit('race_update', Object.values(racers));
      } else {
          console.log(`Progress update from ${socket.id} ignored, no active race.`);
      }
    } else {
      console.log(`Received progress from unknown socket: ${socket.id}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
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

server.listen(PORT, () => {
  console.log(`Server listening on *:${PORT}`);
}); 