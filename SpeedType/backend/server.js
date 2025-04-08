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

// Store race information
let currentRaceText = null; // Store the active race text
let racers = {}; // Store racer data { socketId: { id, name, progress } }
let rooms = {}; // Store room data { roomId: { text, racers: [socketIds], state } }

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'SpeedType Backend is running!',
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development'
  });
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

  // Handle room joining
  socket.on('joinRoom', (roomId) => {
    console.log(`User ${socket.id} joining room ${roomId}`);
    
    // Leave any previous rooms
    if (socket.rooms.size > 1) {
      Array.from(socket.rooms)
        .filter(room => room !== socket.id)
        .forEach(room => {
          console.log(`Leaving previous room: ${room}`);
          socket.leave(room);
          
          // Remove from room data if exists
          if (rooms[room] && rooms[room].racers) {
            rooms[room].racers = rooms[room].racers.filter(id => id !== socket.id);
            
            // Clean up empty rooms
            if (rooms[room].racers.length === 0) {
              delete rooms[room];
            }
          }
        });
    }
    
    // Join the new room
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        text: null,
        racers: [],
        state: 'waiting'
      };
    }
    
    // Add this racer to the room
    if (!rooms[roomId].racers.includes(socket.id)) {
      rooms[roomId].racers.push(socket.id);
    }
    
    // Reset racer state
    if (racers[socket.id]) {
      racers[socket.id].progress = 0;
      racers[socket.id].finished = false;
      racers[socket.id].wpm = 0;
    }
    
    // Notify the user they've joined the room
    socket.emit('roomJoined', { roomId });
    
    // Send current room state
    socket.emit('room_state', { status: rooms[roomId].state });
    
    // If room has text, send it
    if (rooms[roomId].text) {
      socket.emit('race_text', rooms[roomId].text);
    }
    
    // Update everyone in the room about racers
    const roomRacers = rooms[roomId].racers
      .map(id => racers[id])
      .filter(Boolean);
    io.to(roomId).emit('race_update', roomRacers);
  });

  // Handle leaving a room
  socket.on('leaveRoom', (roomId) => {
    console.log(`User ${socket.id} leaving room ${roomId}`);
    socket.leave(roomId);
    
    // Remove from room data
    if (rooms[roomId] && rooms[roomId].racers) {
      rooms[roomId].racers = rooms[roomId].racers.filter(id => id !== socket.id);
      
      // Clean up empty rooms
      if (rooms[roomId].racers.length === 0) {
        delete rooms[roomId];
      } else {
        // Update everyone in the room about racers
        const roomRacers = rooms[roomId].racers
          .map(id => racers[id])
          .filter(Boolean);
        io.to(roomId).emit('race_update', roomRacers);
      }
    }
  });

  // Handle custom text submission to START a race
  socket.on('submit_custom_text', (text) => {
    console.log(`Received custom text from ${socket.id} to start race.`);
    
    // Default to global race if not in any rooms
    const roomIds = Array.from(socket.rooms).filter(room => room !== socket.id);
    
    if (roomIds.length > 0) {
      // Set text for all rooms this socket is in
      roomIds.forEach(roomId => {
        if (rooms[roomId]) {
          rooms[roomId].text = text;
          rooms[roomId].state = 'waiting';
          
          // Reset progress for all racers in this room
          if (rooms[roomId].racers) {
            rooms[roomId].racers.forEach(id => {
              if (racers[id]) {
                racers[id].progress = 0;
                racers[id].finished = false;
                racers[id].wpm = 0;
              }
            });
          }
          
          // Broadcast text to everyone in the room
          io.to(roomId).emit('race_text', text);
          io.to(roomId).emit('room_state', { status: 'waiting' });
          
          // Update racer status
          const roomRacers = rooms[roomId].racers
            .map(id => racers[id])
            .filter(Boolean);
          io.to(roomId).emit('race_update', roomRacers);
        }
      });
    } else {
      // Global race (legacy behavior)
      currentRaceText = text;
      
      // Reset progress for all connected racers
      for (const id in racers) {
        racers[id].progress = 0;
        racers[id].finished = false;
        racers[id].wpm = 0;
      }
      
      // Broadcast to everyone
      io.emit('race_text', currentRaceText);
      io.emit('race_update', Object.values(racers));
    }
  });

  // Handle ready state and start countdown
  socket.on('ready', () => {
    console.log(`Player ${socket.id} is ready to start`);
    
    // Find rooms this socket is in
    const roomIds = Array.from(socket.rooms).filter(room => room !== socket.id);
    
    if (roomIds.length > 0) {
      // Start countdown for all rooms this socket is in
      roomIds.forEach(roomId => {
        if (rooms[roomId]) {
          // Start countdown from 3
          let count = 3;
          io.to(roomId).emit('countdown', count);
          
          const countdownInterval = setInterval(() => {
            count--;
            io.to(roomId).emit('countdown', count);
            
            if (count === 0) {
              clearInterval(countdownInterval);
              rooms[roomId].state = 'racing';
              io.to(roomId).emit('room_state', { status: 'racing' });
            }
          }, 1000);
        }
      });
    } else {
      // Global countdown (legacy behavior)
      let count = 3;
      io.emit('countdown', count);
      
      const countdownInterval = setInterval(() => {
        count--;
        io.emit('countdown', count);
        
        if (count === 0) {
          clearInterval(countdownInterval);
          io.emit('room_state', { status: 'racing' });
        }
      }, 1000);
    }
  });

  // Handle progress update
  socket.on('progress_update', (data) => {
    if (racers[socket.id]) {
      // Update racer's progress
      racers[socket.id].progress = data.progress;
      
      // Find rooms this socket is in
      const roomIds = Array.from(socket.rooms).filter(room => room !== socket.id);
      
      if (roomIds.length > 0) {
        // Broadcast to all rooms this socket is in
        roomIds.forEach(roomId => {
          if (rooms[roomId]) {
            if (data.progress === 100) {
              racers[socket.id].finished = true;
              
              // Update everyone in the room
              const roomRacers = rooms[roomId].racers
                .map(id => racers[id])
                .filter(Boolean);
              io.to(roomId).emit('race_update', roomRacers);
              
              // Check if all racers in the room have finished
              const allFinished = rooms[roomId].racers.every(id => 
                !racers[id] || racers[id].finished || racers[id].progress === 100
              );
              
              if (allFinished) {
                rooms[roomId].state = 'finished';
                io.to(roomId).emit('room_state', { status: 'finished' });
              }
            }
          }
        });
      } else if (data.progress === 100) {
        // Global progress (legacy behavior)
        racers[socket.id].finished = true;
        io.emit('race_update', Object.values(racers));
        
        // Check if all racers finished
        const allFinished = Object.values(racers).every(racer => racer.progress === 100);
        if (allFinished) {
          io.emit('room_state', { status: 'finished' });
        }
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
      
      // Find rooms this socket is in
      const roomIds = Array.from(socket.rooms).filter(room => room !== socket.id);
      
      if (roomIds.length > 0) {
        // Process for each room
        roomIds.forEach(roomId => {
          if (rooms[roomId]) {
            // Update everyone in the room
            const roomRacers = rooms[roomId].racers
              .map(id => racers[id])
              .filter(Boolean);
            io.to(roomId).emit('race_update', roomRacers);
            
            // Check if all racers in the room have finished
            const allFinished = rooms[roomId].racers.every(id => 
              !racers[id] || racers[id].finished || racers[id].progress === 100
            );
            
            if (allFinished) {
              rooms[roomId].state = 'finished';
              io.to(roomId).emit('room_state', { status: 'finished' });
            }
          }
        });
      } else {
        // Global completion (legacy behavior)
        io.emit('race_update', Object.values(racers));
        
        // Check if all racers finished
        const allFinished = Object.values(racers).every(racer => racer.progress === 100);
        if (allFinished) {
          io.emit('room_state', { status: 'finished' });
        }
      }
    }
  });

  // Handle WPM update
  socket.on('wpm_update', (data) => {
    if (racers[socket.id]) {
      racers[socket.id].wpm = data.wpm;
      // WPM updates don't need frequent broadcasting
    } else {
      console.log(`Received WPM from unknown socket: ${socket.id}`);
    }
  });

  // Add periodic update broadcast for each room
  const updateInterval = setInterval(() => {
    // Find rooms this socket is in
    const roomIds = Array.from(socket.rooms).filter(room => room !== socket.id);
    
    if (roomIds.length > 0) {
      // Send updates to each room
      roomIds.forEach(roomId => {
        if (rooms[roomId] && rooms[roomId].racers.length > 0) {
          const roomRacers = rooms[roomId].racers
            .map(id => racers[id])
            .filter(Boolean);
          io.to(roomId).emit('race_update', roomRacers);
        }
      });
    } else if (Object.keys(racers).length > 0) {
      // Global updates (legacy behavior)
      io.emit('race_update', Object.values(racers));
    }
  }, 1000);

  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    clearInterval(updateInterval);
    
    // Get rooms this socket was in before disconnecting
    const socketRooms = Object.keys(rooms).filter(roomId => 
      rooms[roomId].racers.includes(socket.id)
    );
    
    // Remove from all rooms
    socketRooms.forEach(roomId => {
      rooms[roomId].racers = rooms[roomId].racers.filter(id => id !== socket.id);
      
      // Clean up empty rooms
      if (rooms[roomId].racers.length === 0) {
        delete rooms[roomId];
      } else {
        // Update everyone in the room
        const roomRacers = rooms[roomId].racers
          .map(id => racers[id])
          .filter(Boolean);
        io.to(roomId).emit('race_update', roomRacers);
      }
    });
    
    // Clean up racer data
    const wasRacer = !!racers[socket.id];
    delete racers[socket.id];
    
    // Notify global listeners if they were in the global race
    if (wasRacer && socketRooms.length === 0) {
      io.emit('race_update', Object.values(racers));
      
      // If no racers left in global race, clear race text
      if (Object.keys(racers).length === 0) {
        console.log("No racers left, clearing race text.");
        currentRaceText = null;
      }
    }
  });
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