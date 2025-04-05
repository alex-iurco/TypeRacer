import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupRaceSocket } from './socket/raceSocket';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// Get allowed origins from environment
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (!origins) {
    console.warn('No ALLOWED_ORIGINS specified, defaulting to localhost:3000');
    return ['http://localhost:3000'];
  }
  return origins.split(',').map(origin => origin.trim());
};

// Create and configure the app
const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Use allowed origins from environment
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));

app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ status: 'ok' });
});

// Quotes route
app.get('/api/quotes', (req, res) => {
  console.log('Quotes endpoint called');
  const quotes = [
    "The quick brown fox jumps over the lazy dog.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "A journey of a thousand miles begins with a single step.",
    "Actions speak louder than words.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future depends on what you do today.",
    "Life is like riding a bicycle. To keep your balance, you must keep moving.",
    "The only limit to our realization of tomorrow will be our doubts of today.",
    "It does not matter how slowly you go as long as you do not stop."
  ];
  // Shuffle and return 5 random quotes
  const shuffledQuotes = quotes.sort(() => Math.random() - 0.5).slice(0, 5);
  res.json(shuffledQuotes);
});

// Add catch-all route for debugging
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  console.log('Available routes:', app._router.stack
    .filter((r: any) => r.route && r.route.path)
    .map((r: any) => `${Object.keys(r.route.methods).join(',')} ${r.route.path}`));
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method,
    message: 'The requested resource was not found on this server'
  });
});

// Create HTTP server and Socket.IO instance
const httpServer = createHttpServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupRaceSocket(io);

// Start the server if this is the main module
if (require.main === module) {
  // Log all registered routes
  console.log('Registered routes:');
  app._router.stack.forEach((r: any) => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`Server listening on *:${PORT}`);
    console.log('Allowed origins:', getAllowedOrigins());
    console.log('Environment:', process.env.NODE_ENV);
  });
}

// Export for testing and deployment
export { httpServer };
export default app; 