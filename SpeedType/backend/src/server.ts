import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import socketAuth from './middleware/socketAuth';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["https://alex-iurco.github.io", "https://speedtype.robocat.ai", "http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["https://alex-iurco.github.io", "https://speedtype.robocat.ai", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true
});

// Port configuration
const PORT = process.env.PORT || 3001;

// Store race information
let currentRaceText: string | null = null; // Store the active race text
let racers: { [key: string]: any } = {}; // Store racer data { socketId: { id, name, progress } }
let rooms: { [key: string]: any } = {}; // Store room data { roomId: { text, racers: [socketIds], state } }

// API Routes
app.use('/api/users', userRoutes);

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'SpeedType Backend is running!',
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Apply socket authentication middleware
io.use(socketAuth);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Use authenticated user info if available, otherwise create guest
  let username = 'Guest';
  let avatarColor = '#4169e1';
  
  if (socket.isAuthenticated && socket.user) {
    username = socket.user.displayName || socket.user.username;
    avatarColor = socket.user.avatarColor;
    console.log(`Authenticated user connected: ${username} (${socket.user.id})`);
  } else {
    username = `Guest_${socket.id.substring(0, 4)}`;
    console.log(`Guest user connected: ${username}`);
  }

  // Add new racer with default state
  racers[socket.id] = { 
    id: socket.id, 
    name: username,
    avatarColor: avatarColor,
    isAuthenticated: socket.isAuthenticated || false,
    userId: socket.user?.id || null,
    progress: 0,
    wpm: 0,
    finished: false 
  };
  
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
            rooms[room].racers = rooms[room].racers.filter((id: string) => id !== socket.id);
            
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
      .map((id: string) => racers[id])
      .filter(Boolean);
    io.to(roomId).emit('race_update', roomRacers);
  });

  // Handle race progress updates
  socket.on('update_progress', (data) => {
    if (racers[socket.id]) {
      racers[socket.id].progress = data.progress;
      racers[socket.id].wpm = data.wpm || 0;
      
      // Check if racer has completed the race
      if (data.progress >= 100 && !racers[socket.id].finished) {
        racers[socket.id].finished = true;
        
        // Update race stats for authenticated users
        if (socket.isAuthenticated && socket.user && socket.user.id) {
          const roomIds = Array.from(socket.rooms).filter(room => room !== socket.id);
          if (roomIds.length > 0) {
            const roomId = roomIds[0];
            const room = rooms[roomId];
            
            // Find position (ranking) in the race
            const racersInRoom = room.racers
              .map((id: string) => racers[id])
              .filter(Boolean);
            
            const position = racersInRoom
              .filter(r => r.finished)
              .sort((a: any, b: any) => 
                // Sort by finished first, then by progress
                (a.finished === b.finished) ? b.progress - a.progress : a.finished ? -1 : 1
              )
              .findIndex((r: any) => r.id === socket.id) + 1;
            
            // Emit an event to trigger stats update
            socket.emit('stats_update_needed', {
              wpm: data.wpm,
              accuracy: data.accuracy || 100,
              position,
              textLength: room.text ? room.text.length : 0,
              isMultiplayer: true,
              raceId: roomId
            });
          }
        }
      }
      
      // Broadcast updates to everyone
      const roomIds = Array.from(socket.rooms).filter(room => room !== socket.id);
      
      if (roomIds.length > 0) {
        // Send updates to relevant rooms
        roomIds.forEach(roomId => {
          const roomRacers = rooms[roomId]?.racers
            .map((id: string) => racers[id])
            .filter(Boolean) || [];
          io.to(roomId).emit('race_update', roomRacers);
        });
      } else {
        // Global update
        socket.broadcast.emit('race_update', Object.values(racers));
      }
    }
  });

  // Handle updating user stats after a race
  socket.on('update_user_stats', async (data) => {
    if (!socket.isAuthenticated || !socket.user || !socket.user.id) {
      return; // Only authenticated users can update stats
    }
    
    try {
      const User = require('./models/User');
      const user = await User.findById(socket.user.id);
      
      if (user) {
        user.updateStats(
          data.wpm, 
          data.accuracy, 
          data.position, 
          data.textLength,
          data.isMultiplayer,
          data.raceId
        );
        
        await user.save();
        console.log(`Updated stats for user ${user.username}`);
        
        // Send updated user stats
        socket.emit('user_stats_updated', {
          typingStats: user.typingStats
        });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    
    // Remove from all rooms
    if (socket.rooms) {
      Array.from(socket.rooms).forEach(roomId => {
        if (rooms[roomId] && rooms[roomId].racers) {
          rooms[roomId].racers = rooms[roomId].racers.filter((id: string) => id !== socket.id);
          
          // Clean up empty rooms
          if (rooms[roomId].racers.length === 0) {
            delete rooms[roomId];
          } else {
            // Update everyone in the room about racers
            const roomRacers = rooms[roomId].racers
              .map((id: string) => racers[id])
              .filter(Boolean);
            io.to(roomId).emit('race_update', roomRacers);
          }
        }
      });
    }
    
    // Remove from racers
    delete racers[socket.id];
    
    // Broadcast to everyone else
    socket.broadcast.emit('race_update', Object.values(racers));
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server; 