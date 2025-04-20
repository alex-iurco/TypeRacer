import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk'; // Import Anthropic SDK
import { setupRaceSocket } from './socket/raceSocket';

// Load environment variables
dotenv.config();

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const AI_QUOTE_CACHE_MINUTES = parseInt(process.env.AI_QUOTE_CACHE_MINUTES || '10', 10);
const CACHE_DURATION_MS = AI_QUOTE_CACHE_MINUTES * 60 * 1000;
// Refresh slightly before cache expires (e.g., 1 minute before)
const REFRESH_INTERVAL_MS = Math.max(60 * 1000, CACHE_DURATION_MS - (60 * 1000)); 

// --- Anthropic Client Setup ---
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const isAiGloballyEnabled = process.env.ENABLE_AI_QUOTES?.toLowerCase() === 'true';

if (!anthropicApiKey && isAiGloballyEnabled) {
  // Only throw error if AI quotes are explicitly enabled but no key is found
  throw new Error("ANTHROPIC_API_KEY is required because ENABLE_AI_QUOTES is true, but it was not found in environment variables.");
} else if (!anthropicApiKey) {
    console.warn("ANTHROPIC_API_KEY not found. AI quote generation is disabled.");
}

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
// Check if AI can be used (requires flag and initialized client)
const canUseAiQuotes = isAiGloballyEnabled && !!anthropic;

console.log(`AI Quote Generation Globally Enabled: ${isAiGloballyEnabled}`);
console.log(`Anthropic Client Initialized: ${!!anthropic}`);
console.log(`AI Quotes Feature Active: ${canUseAiQuotes}`);
console.log(`AI Quote Cache Duration: ${AI_QUOTE_CACHE_MINUTES} minutes`);
console.log(`AI Quote Refresh Interval: ${REFRESH_INTERVAL_MS / 1000 / 60} minutes`);
// --- End Anthropic Client Setup ---

// --- Quote Cache ---
let cachedQuotes: string[] = [];
let cacheRefreshTimer: NodeJS.Timeout | null = null;

async function refreshQuotesCache() {
  if (!canUseAiQuotes) {
      console.log('[Cache Refresh] Skipping: AI quotes feature is not active.');
      return; // Don't try to refresh if AI isn't active
  }
  
  console.log('[Cache Refresh] Attempting to refresh AI quotes...');
  const prompt = `Generate 7 distinct paragraphs suitable for a typing speed test.
Each paragraph MUST be between 150 and 400 characters long. Strictly adhere to this length range.
The tone should be generally neutral or inspirational.
Avoid complex jargon or proper nouns where possible.
Crucially, ensure NO paragraph exceeds 400 characters.
IMPORTANT: Respond ONLY with a valid JSON array containing exactly 7 strings, where each string is one paragraph. Do not include any other text, explanation, or markdown formatting before or after the JSON array.
Example format: ["paragraph 1...", "paragraph 2...", ..., "paragraph 7..."]`;

  try {
    const msg = await anthropic!.messages.create({ // Use non-null assertion as canUseAiQuotes checks anthropic
      model: "claude-3-haiku-20240307",
      max_tokens: 2100, 
      messages: [{ role: "user", content: prompt }],
    });

     if (msg.stop_reason === 'max_tokens') {
        console.warn("[Cache Refresh] Claude response stopped due to max_tokens.");
     }
     const firstContentBlock = msg.content?.[0];
     if (!firstContentBlock || firstContentBlock.type !== 'text') {
        console.error("[Cache Refresh] Received empty, non-text, or invalid content block from Claude:", msg.content);
        throw new Error("Empty or invalid content received from AI service during cache refresh");
     }

    const generatedText = firstContentBlock.text.trim();
    let quotes = [];
    try {
      const jsonMatch = generatedText.match(/(\[.*\])/s); 
      let textToParse = generatedText;
      if (jsonMatch && jsonMatch[1]) {
          textToParse = jsonMatch[1];
      } else {
          console.warn("[Cache Refresh] No JSON array brackets found in Claude response, attempting to parse entire response.");
      }

      quotes = JSON.parse(textToParse);

      if (!Array.isArray(quotes)) {
        console.error('[Cache Refresh] Invalid JSON structure after parsing Claude response: Expected an array, got:', typeof quotes);
        throw new Error('Invalid JSON format received from Claude API - expected array.');
      }

      const maxLength = 500;
      const filteredQuotes = quotes.filter(quote => 
          typeof quote === 'string' && quote.length <= maxLength && quote.trim() !== ''
      );

      if (filteredQuotes.length < quotes.length) {
          console.warn(`[Cache Refresh] Filtered out ${quotes.length - filteredQuotes.length} quotes exceeding ${maxLength} chars or invalid.`);
      }

      let finalQuotes = [];
      if (filteredQuotes.length >= 6) {
          const shuffled = [...filteredQuotes];
          for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          finalQuotes = shuffled.slice(0, 6);
      } else {
          finalQuotes = filteredQuotes; 
      }

      if (finalQuotes.length > 0) {
          cachedQuotes = finalQuotes; // Update the cache
          console.log(`[Cache Refresh] Successfully refreshed cache with ${cachedQuotes.length} quotes.`);
      } else {
          console.warn('[Cache Refresh] Refresh resulted in 0 valid quotes. Cache not updated.');
          // Optionally keep stale cache here instead of clearing it? For now, cache remains unchanged.
      }

    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      console.error("[Cache Refresh] Failed to parse or validate Claude response:", errorMessage);
      console.error("[Cache Refresh] Raw response was:", generatedText);
      // Don't update cache on parse error
    }

  } catch (error) {
    console.error("[Cache Refresh] Error calling Claude API:", error);
     if (error instanceof Anthropic.APIError) {
        console.error("[Cache Refresh] Anthropic API Error Details:", { status: error.status, headers: error.headers, error: error.error });
    }
    // Don't update cache on API error
  }
}
// --- End Quote Cache ---


// Get allowed origins from environment with more permissive defaults
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (!origins) {
    console.warn('No ALLOWED_ORIGINS specified, allowing all origins in development');
    return ['http://localhost:5173', 'http://localhost:3000', 'https://speedtype.robocat.ai', '*'];
  }
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
    if (process.env.NODE_ENV !== 'production' || !origin) {
      callback(null, true); return;
    }
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS: Origin rejected:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, methods: ['GET', 'POST', 'OPTIONS'],
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
    ai_quotes_enabled: canUseAiQuotes, // Use the derived status flag
    cache_status: cachedQuotes.length > 0 ? `${cachedQuotes.length} quotes cached` : 'Cache empty'
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

// Quotes route - Now uses cache
router.get('/quotes', async (req, res) => {
  console.log("Received request for /api/quotes"); 

  // Check if AI feature is active (uses global check now)
  if (!canUseAiQuotes) {
    console.log("AI Quotes feature is not active.");
    // Maybe return fallback quotes here instead of error? For now, error.
    return res.status(503).json({ error: 'AI quote generation is disabled.' });
  }

  // If AI is active, check cache first
  if (cachedQuotes.length > 0) {
      console.log(`Returning ${cachedQuotes.length} quotes from cache.`);
      return res.json(cachedQuotes);
  }

  // If cache is empty, attempt an immediate refresh
  console.warn('Quote cache is empty. Attempting immediate fetch...');
  try {
      await refreshQuotesCache(); // Wait for the refresh attempt
      if (cachedQuotes.length > 0) {
          console.log(`Immediate fetch successful. Returning ${cachedQuotes.length} quotes.`);
          return res.json(cachedQuotes);
      } else {
          console.error('Immediate fetch failed to populate cache.');
          return res.status(503).json({ error: 'Failed to fetch quotes from AI service.' });
      }
  } catch (error) { // Catch potential errors from refreshQuotesCache itself
      console.error('Error during immediate quote fetch:', error);
      return res.status(500).json({ error: 'Failed to fetch quotes from AI service.' });
  }
});

// Mount all routes under /api
app.use('/api', router);

// Add catch-all route for debugging
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  const availableRoutes = process.env.NODE_ENV === 'development'
    ? app._router.stack.filter((r: any) => r.route?.path).map((r: any) => `${Object.keys(r.route.methods).join(',')} ${r.route.path}`)
    : ['/api/', '/api/health', '/api/quotes']; 
  res.status(404).json({ error: 'Not Found', path: req.path, method: req.method, message: 'The requested resource was not found on this server', availableRoutes });
});


// Create HTTP server and Socket.IO instance
const httpServer = createHttpServer(app);
const io = new Server(httpServer, {
  cors: { origin: getAllowedOrigins(), methods: ['GET', 'POST'], credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Version'] },
  transports: ['polling', 'websocket'], allowUpgrades: true, pingTimeout: 60000, pingInterval: 25000, cookie: false, allowEIO3: true, path: '/socket.io/', connectTimeout: 45000, maxHttpBufferSize: 1e8, perMessageDeflate: false, httpCompression: true
});

// Debug Socket.IO events
io.engine.on("connection_error", (err: any) => { console.error("Socket.IO connection error:", { message: err.message, code: err.code, origin: err.req?.headers?.origin }); });
io.on('connection', (socket) => {
  console.log('New client connected:', { id: socket.id, transport: socket.conn.transport.name, origin: socket.handshake.headers.origin });
  socket.conn.on('upgrade', (transport) => { console.log('Transport upgraded for client:', socket.id, 'to:', transport.name); });
  socket.on('disconnect', (reason) => { console.log('Client disconnected:', socket.id, 'reason:', reason); });
  setupRaceSocket(io); // Delegate race logic
});


// Start the server if this is the main module
if (require.main === module) {
  
  const startServer = async () => {
    // Initial Cache Population
    if (canUseAiQuotes) {
        console.log("Performing initial AI quote cache population...");
        await refreshQuotesCache();
        if (cachedQuotes.length > 0) {
            console.log(`Initial cache populated with ${cachedQuotes.length} quotes.`);
        } else {
            console.warn("Initial cache population failed.");
        }
    } else {
        console.log("Skipping initial cache population as AI quotes are disabled.");
    }

    // Start HTTP Server
    httpServer.listen(PORT, () => {
      console.log(`Server listening on *:${PORT}`);
      console.log('Allowed origins:', getAllowedOrigins());
      console.log('CORS methods:', corsOptions.methods);
      console.log('Environment:', process.env.NODE_ENV || 'development');
      console.log(`AI Quotes Feature Active: ${canUseAiQuotes}`); // Reiterate status

      // Start Background Cache Refresh Interval (only if AI is active)
      if (canUseAiQuotes && REFRESH_INTERVAL_MS > 0) {
          console.log(`Starting background cache refresh interval (${REFRESH_INTERVAL_MS / 1000 / 60} minutes)...`);
          // Clear existing timer just in case
          if (cacheRefreshTimer) clearInterval(cacheRefreshTimer); 
          
          cacheRefreshTimer = setInterval(async () => {
              await refreshQuotesCache();
          }, REFRESH_INTERVAL_MS);
      } else {
          console.log("Background cache refresh disabled (AI not active or interval <= 0).");
      }
    });
  };

  startServer().catch(err => {
      console.error("Failed to start server:", err);
      process.exit(1);
  });
}

// Export for testing and deployment
export { httpServer };
export default app; 