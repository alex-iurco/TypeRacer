const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

// Load environment variables from .env file
require('dotenv').config();

// --- Anthropic Client Setup ---
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey && process.env.ENABLE_AI_QUOTES?.toLowerCase() === 'true') {
  // Only throw error if AI quotes are explicitly enabled but no key is found
  throw new Error("ANTHROPIC_API_KEY is required because ENABLE_AI_QUOTES is true, but it was not found in environment variables.");
} else if (!anthropicApiKey) {
    console.warn("ANTHROPIC_API_KEY not found. AI quote generation is disabled.");
}

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
const enableAiQuotes = process.env.ENABLE_AI_QUOTES?.toLowerCase() === 'true' && !!anthropic; // Ensure key exists if enabled

console.log(`AI Quote Generation Enabled: ${enableAiQuotes}`);
// --- End Anthropic Client Setup ---


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
    version: '1.0.1', // Consider updating this based on package.json or dynamically
    environment: process.env.NODE_ENV || 'development',
    ai_quotes_enabled: enableAiQuotes // Add status flag
  });
});

// --- New AI Quotes Endpoint ---
app.get('/api/quotes', async (req, res) => {
  console.log("Received request for /api/quotes");

  if (!enableAiQuotes) {
    console.log("AI Quotes disabled (either by config or missing API key).");
    // 503 Service Unavailable is appropriate if the feature is configured off
    // 500 Internal Server Error might be better if it's off due to missing key, but 503 is simpler for frontend
    return res.status(503).json({ error: 'AI quote generation is disabled.' });
  }

  // We already checked if anthropic is null when setting enableAiQuotes, but double-check for safety
  if (!anthropic) {
      console.error("Programming Error: AI Quotes enabled but Anthropic client is not initialized.");
      return res.status(500).json({ error: 'AI service configuration error.' });
  }

  const prompt = `Generate 6 distinct paragraphs suitable for a typing speed test.
Each paragraph should be between 150 and 300 characters long.
The tone should be generally neutral or inspirational.
Avoid complex jargon or proper nouns where possible.
IMPORTANT: Respond ONLY with a valid JSON array containing exactly 6 strings, where each string is one paragraph. Do not include any other text, explanation, or markdown formatting before or after the JSON array.
Example format: ["paragraph 1...", "paragraph 2...", "paragraph 3...", "paragraph 4...", "paragraph 5...", "paragraph 6..."]`;

  try {
    console.log("Sending request to Claude API...");
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1800, // Estimate: 6 paras * 300 chars/para = 1800 chars. Allow some buffer. Adjust if needed.
      messages: [{ role: "user", content: prompt }],
    });

    // Check if content is potentially blocked
     if (msg.stop_reason === 'max_tokens') {
        console.warn("Claude response stopped due to max_tokens. Result might be incomplete.");
     }
     if (!msg.content || msg.content.length === 0 || !msg.content[0].text) {
        console.error("Received empty or invalid content block from Claude:", msg);
        throw new Error("Empty or invalid content received from AI service");
     }


    const generatedText = msg.content[0].text.trim(); // Trim whitespace
    console.log("Received response from Claude API.");
    // console.log("Raw Claude response:", generatedText); // Uncomment for debugging

    let quotes = [];
    try {
      // Attempt to parse the potentially messy response as JSON
      // First, try to find the JSON array within the response in case Claude added extra text
      const jsonMatch = generatedText.match(/(\[.*\])/s);
      let textToParse = generatedText;
      if (jsonMatch && jsonMatch[1]) {
          console.log("Attempting to parse extracted JSON array from Claude response.");
          textToParse = jsonMatch[1];
      } else {
          console.log("No JSON array brackets found, attempting to parse entire Claude response.");
      }

      quotes = JSON.parse(textToParse);

      // Validate the parsed structure
      if (!Array.isArray(quotes) || quotes.length !== 6 || quotes.some(q => typeof q !== 'string' || q.trim() === '')) {
        console.error('Invalid JSON structure after parsing Claude response:', quotes);
        throw new Error('Invalid JSON format received from Claude API.');
      }
      console.log(`Successfully parsed ${quotes.length} quotes.`);
      res.json(quotes);

    } catch (parseError) {
      console.error("Failed to parse or validate Claude response:", parseError.message);
      console.error("Raw response was:", generatedText); // Log the raw response on parsing failure
      // Send 500 Internal Server Error as the backend failed to process the AI response
      res.status(500).json({ error: 'Failed to process response from AI service.' });
    }

  } catch (error) {
    // Handle potential API errors from Anthropic SDK
    console.error("Error calling Claude API:", error);
     if (error instanceof Anthropic.APIError) {
        console.error("Anthropic API Error Details:", { status: error.status, headers: error.headers, error: error.error });
        // Map specific Anthropic errors to appropriate HTTP status codes if needed
        res.status(error.status || 500).json({ error: `AI service error: ${error.message}` });
    } else {
        // Generic internal server error for other unexpected issues
        res.status(500).json({ error: 'Failed to fetch quotes from AI service.' });
    }
  }
});
// --- End New AI Quotes Endpoint ---


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