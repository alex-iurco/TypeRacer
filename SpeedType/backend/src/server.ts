import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupRaceSocket } from './socket/raceSocket';

dotenv.config();

const PORT = 3001;

export const createApp = () => {
  const app = express();

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://typeracer.example.com'] 
      : ['http://localhost:3000'],
    credentials: true
  }));

  app.use(express.json());

  // Health check route
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Quotes route
  app.get('/api/quotes', (req, res) => {
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
    res.json(quotes);
  });

  return app;
};

if (require.main === module) {
  const app = createApp();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://typeracer.example.com']
        : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  setupRaceSocket(io);

  httpServer.listen(PORT, () => {
    console.log(`Server listening on *:${PORT}`);
  });
}

export default createApp; 