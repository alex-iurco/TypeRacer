import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk'; // Import Anthropic SDK
import { setupRaceSocket } from './socket/raceSocket';

// Load environment variables
dotenv.config();

// --- Anthropic Client Setup ---
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey && process.env.ENABLE_AI_QUOTES?.toLowerCase() === 'true') {
  // Only throw error if AI quotes are explicitly enabled but no key is found
  throw new Error("ANTHROPIC_API_KEY is required because ENABLE_AI_QUOTES is true, but it was not found in environment variables.");
} else if (!anthropicApiKey) {
    console.warn("ANTHROPIC_API_KEY not found. AI quote generation is disabled.");
}

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
// Enable AI quotes only if the flag is true AND the API key/client exists
const enableAiQuotes = process.env.ENABLE_AI_QUOTES?.toLowerCase() === 'true' && !!anthropic;

console.log(`AI Quote Generation Enabled: ${enableAiQuotes}`);
// --- End Anthropic Client Setup ---

const PORT = process.env.PORT || 3001;

// Get allowed origins from environment with more permissive defaults
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (!origins) {
    console.warn('No ALLOWED_ORIGINS specified, allowing all origins in development');
    // Default allowed origins for development and production
    return ['http://localhost:5173', 'http://localhost:3000', 'https://speedtype.robocat.ai', '*'];
  }
  // Ensure origins are trimmed
  return origins.split(',').map(origin => origin.trim());
};

// Create and configure the app
const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Use allowed origins from environment with more detailed logging
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();
    
    // In development or if no origin is set, allow all origins
    if (process.env.NODE_ENV !== 'production' || !origin) {
      callback(null, true);
      return;
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS: Origin rejected:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Version'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.use(express.json());

// Create router for all API routes
const router = express.Router();

// Root route - updated to show AI status
router.get('/', (req, res) => {
  console.log('Root endpoint called');
  res.json({
    status: 'healthy',
    message: 'SpeedType Backend is running!',
    version: '1.0.1', // Consider updating this
    environment: process.env.NODE_ENV || 'development',
    ai_quotes_enabled: enableAiQuotes // Include the status flag
    // allowedOrigins: getAllowedOrigins(), // Removed for brevity, available via logs
    // corsMethods: corsOptions.methods
  });
});

// Health check route
router.get('/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Quotes route - REPLACED with Claude AI logic
router.get('/quotes', async (req, res) => {
  console.log("Received request for /api/quotes (implemented in src/server.ts)"); // Updated log

  if (!enableAiQuotes) {
    console.log("AI Quotes disabled (either by config or missing API key).");
    return res.status(503).json({ error: 'AI quote generation is disabled.' });
  }

  // Should not happen if enableAiQuotes is true, but safeguard
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
      max_tokens: 1800, // Estimate: 6 paras * 300 chars/para = 1800 chars. Allow buffer.
      messages: [{ role: "user", content: prompt }],
    });

     // Check for potential issues in the response structure
     if (msg.stop_reason === 'max_tokens') {
        console.warn("Claude response stopped due to max_tokens. Result might be incomplete.");
     }
     // Ensure content exists and the first block is text
     const firstContentBlock = msg.content?.[0];
     if (!firstContentBlock || firstContentBlock.type !== 'text') {
        console.error("Received empty, non-text, or invalid content block from Claude:", msg);
        throw new Error("Empty or invalid content received from AI service");
     }

    const generatedText = firstContentBlock.text.trim();
    console.log("Received response from Claude API.");

    let quotes = [];
    try {
      // Attempt to parse the potentially messy response as JSON
      const jsonMatch = generatedText.match(/(\[.*\])/s); // Look for [...]
      let textToParse = generatedText;
      if (jsonMatch && jsonMatch[1]) {
          console.log("Attempting to parse extracted JSON array from Claude response.");
          textToParse = jsonMatch[1];
      } else {
          console.warn("No JSON array brackets found in Claude response, attempting to parse entire response. This might fail.");
          console.warn("Raw response was:", generatedText);
      }

      quotes = JSON.parse(textToParse);

      // Validate the parsed structure
      if (!Array.isArray(quotes) || quotes.length !== 6 || quotes.some(q => typeof q !== 'string' || q.trim() === '')) {
        console.error('Invalid JSON structure after parsing Claude response:', quotes);
        throw new Error('Invalid JSON format received from Claude API.');
      }
      console.log(`Successfully parsed ${quotes.length} quotes.`);
      res.json(quotes);

    } catch (parseError: unknown) {
      // Log the error appropriately
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      console.error("Failed to parse or validate Claude response:", errorMessage);
      console.error("Raw response was:", generatedText);
      res.status(500).json({ error: 'Failed to process response from AI service.' });
    }

  } catch (error) {
    console.error("Error calling Claude API:", error);
     if (error instanceof Anthropic.APIError) {
        console.error("Anthropic API Error Details:", { status: error.status, headers: error.headers, error: error.error });
        res.status(error.status || 500).json({ error: `AI service error: ${error.message}` });
    } else {
        res.status(500).json({ error: 'Failed to fetch quotes from AI service.' });
    }
  }
});

// Mount all routes under /api
app.use('/api', router);

// Add catch-all route for debugging
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  // Avoid logging full router stack in production for security/verbosity
  const availableRoutes = process.env.NODE_ENV === 'development'
    ? app._router.stack
        .filter((r: any) => r.route && r.route.path)
        .map((r: any) => `${Object.keys(r.route.methods).join(',')} ${r.route.path}`)
    : ['/api/', '/api/health', '/api/quotes']; // List known routes

  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    message: 'The requested resource was not found on this server',
    availableRoutes: availableRoutes
  });
});

// Create HTTP server and Socket.IO instance
const httpServer = createHttpServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Version']
  },
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  cookie: false,
  allowEIO3: true,
  path: '/socket.io/',
  connectTimeout: 45000,
  maxHttpBufferSize: 1e8,
  perMessageDeflate: false,
  httpCompression: true
});

// Debug Socket.IO events with more focused error logging
io.engine.on("connection_error", (err: any) => { // Added type annotation
  console.error("Socket.IO connection error:", {
    message: err.message,
    code: err.code,
    // req object might not always be present depending on the error context
    origin: err.req?.headers?.origin
  });
});

// Add focused Socket.IO connection logging
io.on('connection', (socket) => {
  console.log('New client connected:', {
    id: socket.id,
    transport: socket.conn.transport.name,
    origin: socket.handshake.headers.origin
  });

  socket.conn.on('upgrade', (transport) => {
    console.log('Transport upgraded for client:', socket.id, 'to:', transport.name);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'reason:', reason);
  });

  // Delegate race logic - Pass io instance as defined in function signature
  setupRaceSocket(io);
});

// Start the server if this is the main module
if (require.main === module) {
  // Log registered API routes only
  console.log('Registered API routes:');
  router.stack.forEach((r: any) => {
    if (r.route && r.route.path) {
      console.log(` ${Object.keys(r.route.methods).join(',').toUpperCase()} /api${r.route.path}`);
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`Server listening on *:${PORT}`);
    console.log('Allowed origins:', getAllowedOrigins());
    console.log('CORS methods:', corsOptions.methods);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log(`AI Quotes Feature: ${enableAiQuotes ? 'ENABLED' : 'DISABLED'}`); // Reiterate status
  });
}

// Export for testing and deployment
export { httpServer };
export default app; 