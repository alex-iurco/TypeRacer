import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk'; // Import Anthropic SDK
import { setupRaceSocket } from './socket/raceSocket';
import logger from './utils/logger';

// Load environment variables from the correct file based on NODE_ENV
// This ensures consistent environment variable loading everywhere
if (process.env.NODE_ENV) {
  dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
} else {
  dotenv.config(); // Fallback to default .env
}

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const AI_QUOTE_CACHE_MINUTES = parseInt(process.env.AI_QUOTE_CACHE_MINUTES || '10', 10);
const AI_QUOTE_MIN_REQUESTS_BEFORE_REFRESH = parseInt(process.env.AI_QUOTE_MIN_REQUESTS_BEFORE_REFRESH || '10', 10);
const CACHE_DURATION_MS = AI_QUOTE_CACHE_MINUTES * 60 * 1000;
// Refresh slightly before cache expires (e.g., 1 minute before)
const CHECK_INTERVAL_MS = Math.max(60 * 1000, CACHE_DURATION_MS - (60 * 1000)); 

// --- Anthropic Client Setup ---
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const isAiGloballyEnabled = process.env.ENABLE_AI_QUOTES?.toLowerCase() === 'true';

if (!anthropicApiKey && isAiGloballyEnabled) {
  // Only throw error if AI quotes are explicitly enabled but no key is found
  throw new Error("ANTHROPIC_API_KEY is required because ENABLE_AI_QUOTES is true, but it was not found in environment variables.");
} else if (!anthropicApiKey) {
    logger.warn("ANTHROPIC_API_KEY not found. AI quote generation is disabled.");
}

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
// Check if AI can be used (requires flag and initialized client)
const canUseAiQuotes = isAiGloballyEnabled && !!anthropic;

logger.debug('This is a debug log test!');

logger.info(`AI Quote Generation Globally Enabled: ${isAiGloballyEnabled}`);
logger.info(`Anthropic Client Initialized: ${!!anthropic}`);
logger.info(`AI Quotes Feature Active: ${canUseAiQuotes}`);
logger.info(`AI Quote Cache Duration: ${AI_QUOTE_CACHE_MINUTES} minutes`);
logger.info(`AI Quote Min Requests Before Refresh: ${AI_QUOTE_MIN_REQUESTS_BEFORE_REFRESH}`);
logger.info(`AI Quote Refresh Check Interval: ${CHECK_INTERVAL_MS / 1000 / 60} minutes`);
// --- End Anthropic Client Setup ---

// --- Quote Cache ---
let cachedQuotes: string[] = [];
let cacheRefreshTimer: NodeJS.Timeout | null = null;
let cacheLastRefreshedTimestamp: number = 0; // Timestamp of last successful refresh
let cacheRequestCounter: number = 0; // Counter for requests since last refresh

// Original prompt for general typing speed test quotes
const oldPrompt = `Generate 7 distinct paragraphs suitable for a typing speed test.\nEach paragraph MUST be between 150 and 400 characters long. Strictly adhere to this length range.\nThe tone should be generally neutral or inspirational.\nAvoid complex jargon or proper nouns where possible.\nCrucially, ensure NO paragraph exceeds 400 characters.\nIMPORTANT: Respond ONLY with a valid JSON array containing exactly 7 strings, where each string is one paragraph. Do not include any other text, explanation, or markdown formatting before or after the JSON array.\nExample format: ["paragraph 1...", "paragraph 2...", ..., "paragraph 7..."]`;

// Override prompt for quotes related to the latest news in AI, Tech, and Science
const prevprompt = `Generate 7 distinct paragraphs related to the latest news in AI, Technology, and Science.\nEach paragraph MUST be between 150 and 400 characters long. Strictly adhere to this length range.\nThe tone should be informative and engaging, summarizing key advancements or discoveries in these fields.\nAvoid overly technical jargon or speculative content.\nCrucially, ensure NO paragraph exceeds 400 characters.\nIMPORTANT: Respond ONLY with a valid JSON array containing exactly 7 strings, where each string is one paragraph. Do not include any other text, explanation, or markdown formatting before or after the JSON array.\nExample format: ["paragraph 1...", "paragraph 2...", ..., "paragraph 7..."]`;

// Fun, pop-culture, whimsical, and fact-based prompt for variety
const prompt = `Generate 7 distinct paragraphs suitable for a typing speed test, each with a different style:
- At least one should be light-hearted and humorous (use puns, jokes, or witty observations, family-friendly).
- At least one should reference pop culture (movies, TV, or games) in a fun, indirect way, avoiding trademarked names.
- At least one should be whimsical or imaginative (talking animals, magical lands, silly adventures).
- At least one should share a fun, surprising, or quirky fact from around the world.
The rest can be a mix of these styles. Each paragraph MUST be between 150 and 400 characters long. Keep all content engaging, playful, and suitable for all ages. Avoid offensive or overly technical content.
IMPORTANT: Respond ONLY with a valid JSON array containing exactly 7 strings, where each string is one paragraph. Do not include any other text, explanation, or markdown formatting before or after the JSON array.
Example format: ["paragraph 1...", "paragraph 2...", ..., "paragraph 7..."]`;

const promptLearningCreativity = `Generate 7 distinct motivational quotes or short paragraphs tailored for a professional interested in learning, creativity, leadership, and resilience. Each should be between 150 and 600 characters. Address overcoming knowledge gaps, task aversion, and fear of failure. Mix practical advice and philosophical insights. Prefer original advice, but include real advice from famous people if relevant. Focus on daily motivation, long-term goals, and overcoming immediate procrastination. IMPORTANT: Respond ONLY with a valid JSON array containing exactly 7 strings, where each string is one quote or paragraph. Do not include any other text, explanation, or markdown formatting before or after the JSON array. Example format: ["quote 1...", "quote 2...", ..., "quote 7..."]`;

const promptTechAIEntrepreneur = `Generate 7 distinct motivational quotes or short paragraphs for a professional in technology, AI, and entrepreneurship. Each should be between 150 and 600 characters. Address challenges like knowledge gaps, task aversion, and fear of failure. Blend practical and philosophical advice, with a preference for original insights, but include real advice from notable figures if relevant. Make the content thought-provoking, focusing on daily motivation, long-term vision, and overcoming procrastination. IMPORTANT: Respond ONLY with a valid JSON array containing exactly 7 strings, where each string is one quote or paragraph. Do not include any other text, explanation, or markdown formatting before or after the JSON array. Example format: ["quote 1...", "quote 2...", ..., "quote 7..."]`;

const promptProductivityGeneral = `Generate 7 distinct motivational quotes or short paragraphs focused on productivity, motivation, and overcoming procrastination for an experienced professional. Each should be between 150 and 600 characters. Address issues like knowledge gaps, task aversion, and fear of failure. Use a mix of practical tips and philosophical thoughts, with a preference for original advice, but include real advice from famous people if relevant. Cover both daily motivation and long-term goals. IMPORTANT: Respond ONLY with a valid JSON array containing exactly 7 strings, where each string is one quote or paragraph. Do not include any other text, explanation, or markdown formatting before or after the JSON array. Example format: ["quote 1...", "quote 2...", ..., "quote 7..."]`;

async function refreshQuotesCache() {
  if (!canUseAiQuotes) {
      logger.info('[Cache Refresh] Skipping: AI quotes feature is not active.');
      return; // Don't try to refresh if AI isn't active
  }
  
  logger.info('[Cache Refresh] Attempting to refresh AI quotes...');
  // List of available prompts
  const prompts = [
    prompt,
    promptLearningCreativity,
    promptTechAIEntrepreneur,
    promptProductivityGeneral
  ];
  // Randomly select one prompt
  const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  try {
    const msg = await anthropic!.messages.create({ // Use non-null assertion as canUseAiQuotes checks anthropic
      model: "claude-3-haiku-20240307",
      max_tokens: 2100, 
      messages: [{ role: "user", content: selectedPrompt }],
    });

     if (msg.stop_reason === 'max_tokens') {
        logger.warn("[Cache Refresh] Claude response stopped due to max_tokens.");
     }
     const firstContentBlock = msg.content?.[0];
     if (!firstContentBlock || firstContentBlock.type !== 'text') {
        logger.error("[Cache Refresh] Received empty, non-text, or invalid content block from Claude:", msg.content);
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
          logger.warn("[Cache Refresh] No JSON array brackets found in Claude response, attempting to parse entire response.");
      }

      quotes = JSON.parse(textToParse);

      if (!Array.isArray(quotes)) {
        logger.error('[Cache Refresh] Invalid JSON structure after parsing Claude response: Expected an array, got:', typeof quotes);
        throw new Error('Invalid JSON format received from Claude API - expected array.');
      }

      const maxLength = 500;
      const filteredQuotes = quotes.filter(quote => 
          typeof quote === 'string' && quote.length <= maxLength && quote.trim() !== ''
      );

      if (filteredQuotes.length < quotes.length) {
          logger.warn(`[Cache Refresh] Filtered out ${quotes.length - filteredQuotes.length} quotes exceeding ${maxLength} chars or invalid.`);
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
          cacheLastRefreshedTimestamp = Date.now(); // Update timestamp
          cacheRequestCounter = 0; // Reset counter
          logger.info(`[Cache Refresh] Successfully refreshed cache with ${cachedQuotes.length} quotes. Counter reset.`);
      } else {
          logger.warn('[Cache Refresh] Refresh resulted in 0 valid quotes. Cache not updated.');
          // Optionally keep stale cache here instead of clearing it? For now, cache remains unchanged.
      }

    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      logger.error("[Cache Refresh] Failed to parse or validate Claude response:", errorMessage);
      logger.error("[Cache Refresh] Raw response was:", generatedText);
      // Don't update cache on parse error
    }

  } catch (error) {
    logger.error("[Cache Refresh] Error calling Claude API:", error);
     if (error instanceof Anthropic.APIError) {
        logger.error("[Cache Refresh] Anthropic API Error Details:", { status: error.status, headers: error.headers, error: error.error });
    }
    // Don't update cache on API error
  }
}

// Function to check conditions and trigger refresh if needed
async function checkAndRefreshCache() {
  if (!canUseAiQuotes) return; // Don't check if AI is off

  const now = Date.now();
  const timeExpired = (now - cacheLastRefreshedTimestamp) >= CACHE_DURATION_MS;
  const requestThresholdMet = cacheRequestCounter >= AI_QUOTE_MIN_REQUESTS_BEFORE_REFRESH;

  logger.info(`[Cache Check] Time Expired: ${timeExpired}, Request Count: ${cacheRequestCounter}/${AI_QUOTE_MIN_REQUESTS_BEFORE_REFRESH}`);

  if (timeExpired && requestThresholdMet) {
    logger.info('[Cache Check] Conditions met, triggering background refresh.');
    await refreshQuotesCache();
  } else {
    logger.info('[Cache Check] Conditions not met, skipping background refresh.');
  }
}

// --- End Quote Cache ---


// Get allowed origins from environment with more permissive defaults
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (!origins) {
    logger.warn('No ALLOWED_ORIGINS specified, allowing all origins in development');
    return ['http://localhost:5173', 'http://localhost:3000', 'https://speedtype.robocat.ai', '*'];
  }
  return origins.split(',').map(origin => origin.trim());
};

// Debug log to verify allowed origins setting (structured log)
logger.debug({ allowedOrigins: getAllowedOrigins() }, 'Allowed CORS origins');

// Create and configure the app
const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
  logger.debug(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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
      logger.warn('CORS: Origin rejected:', origin);
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
  logger.info('Root endpoint called');
  res.json({
    status: 'healthy',
    message: 'SpeedType Backend is running!',
    version: '1.0.1', // Consider updating this
    environment: process.env.NODE_ENV || 'development',
    ai_quotes_enabled: canUseAiQuotes, // Use the derived status flag
    cache_status: cachedQuotes.length > 0 
      ? `${cachedQuotes.length} quotes cached (Requests: ${cacheRequestCounter}, Last Refresh: ${new Date(cacheLastRefreshedTimestamp).toISOString()})` 
      : 'Cache empty'
  });
});

// Health check route
router.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Quotes route - Now uses cache
router.get('/quotes', async (req, res) => {
  logger.debug("Received request for /api/quotes"); 

  // Check if AI feature is active (uses global check now)
  if (!canUseAiQuotes) {
    logger.info("AI Quotes feature is not active.");
    // Maybe return fallback quotes here instead of error? For now, error.
    return res.status(503).json({ error: 'AI quote generation is disabled.' });
  }

  // Increment request counter *before* checking cache
  cacheRequestCounter++;
  logger.info(`Quote request count since last refresh: ${cacheRequestCounter}`);

  // If AI is active, check cache first
  if (cachedQuotes.length > 0) {
      logger.info(`Returning ${cachedQuotes.length} quotes from cache.`);
      return res.json(cachedQuotes);
  }

  // If cache is empty, attempt an immediate refresh
  logger.warn('Quote cache is empty. Attempting immediate fetch...');
  try {
      await refreshQuotesCache(); // Wait for the refresh attempt
      if (cachedQuotes.length > 0) {
          logger.info(`Immediate fetch successful. Returning ${cachedQuotes.length} quotes.`);
          return res.json(cachedQuotes);
      } else {
          logger.error('Immediate fetch failed to populate cache.');
          return res.status(503).json({ error: 'Failed to fetch quotes from AI service.' });
      }
  } catch (error) { // Catch potential errors from refreshQuotesCache itself
      logger.error('Error during immediate quote fetch:', error);
      return res.status(500).json({ error: 'Failed to fetch quotes from AI service.' });
  }
});

// Mount all routes under /api
app.use('/api', router);

// Add catch-all route for debugging
app.use((req, res) => {
  logger.info('404 - Route not found:', req.method, req.path);
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
io.engine.on("connection_error", (err: any) => { logger.error("Socket.IO connection error:", { message: err.message, code: err.code, origin: err.req?.headers?.origin }); });
io.on('connection', (socket) => {
  logger.info('New client connected:', { id: socket.id, transport: socket.conn.transport.name, origin: socket.handshake.headers.origin });
  socket.conn.on('upgrade', (transport) => { logger.info('Transport upgraded for client:', socket.id, 'to:', transport.name); });
  socket.on('disconnect', (reason) => { logger.info('Client disconnected:', socket.id, 'reason:', reason); });
  setupRaceSocket(io); // Delegate race logic
});


// Start the server if this is the main module
if (require.main === module) {
  
  const startServer = async () => {
    // Initial Cache Population
    cacheLastRefreshedTimestamp = 0; // Ensure first check triggers refresh if needed
    cacheRequestCounter = 0;
    if (canUseAiQuotes) {
        logger.info("Performing initial AI quote cache population...");
        await refreshQuotesCache(); // This will now set timestamp and reset counter on success
        if (cachedQuotes.length > 0) {
            logger.info(`Initial cache populated with ${cachedQuotes.length} quotes.`);
        } else {
            logger.warn("Initial cache population failed.");
        }
    } else {
        logger.info("Skipping initial cache population as AI quotes are disabled.");
    }

    // Start HTTP Server
    httpServer.listen(PORT, () => {
      logger.info(`Server listening on *:${PORT}`);
      logger.info({ allowedOrigins: getAllowedOrigins() }, 'Allowed origins');
      logger.info({ corsMethods: corsOptions.methods }, 'CORS methods');
      logger.info({ environment: process.env.NODE_ENV || 'development' }, 'Environment');
      logger.info(`AI Quotes Feature Active: ${canUseAiQuotes}`); // Reiterate status

      // Start Background Cache Refresh Check Interval
      if (canUseAiQuotes && CHECK_INTERVAL_MS > 0) {
          logger.info(`Starting background cache refresh check interval (${CHECK_INTERVAL_MS / 1000 / 60} minutes)...`);
          if (cacheRefreshTimer) clearInterval(cacheRefreshTimer); 
          
          cacheRefreshTimer = setInterval(async () => {
              await checkAndRefreshCache(); // Call the check function
          }, CHECK_INTERVAL_MS); // Use CHECK_INTERVAL_MS
      } else {
          logger.info("Background cache refresh check disabled (AI not active or interval <= 0).");
      }
    });
  };

  startServer().catch(err => {
      logger.error("Failed to start server:", err);
      process.exit(1);
  });
}

// Export for testing and deployment
export { httpServer };
export default app;