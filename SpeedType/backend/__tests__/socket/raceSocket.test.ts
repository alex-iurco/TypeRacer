import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { setupSocketServer } from '../../socket/raceSocket';

describe('Race Socket Events', () => {
  let io: Server;
  let serverSocket;
  let clientSocket;
  let httpServer;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    setupSocketServer(io);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  beforeEach((done) => {
    if (clientSocket.connected) {
      done();
    } else {
      clientSocket.on('connect', done);
    }
  });

  describe('Race Progress Updates', () => {
    it('handles player progress updates', (done) => {
      const progressData = {
        playerId: '123',
        progress: 0.5,
        wpm: 60
      };

      clientSocket.on('raceProgress', (data) => {
        expect(data).toEqual(progressData);
        done();
      });

      serverSocket.emit('updateProgress', progressData);
    });

    it('broadcasts progress to other players', (done) => {
      const player2Socket = Client(`http://localhost:${httpServer.address().port}`);
      
      player2Socket.on('raceProgress', (data) => {
        expect(data.playerId).toBe('123');
        expect(data.progress).toBe(0.5);
        player2Socket.close();
        done();
      });

      clientSocket.emit('updateProgress', {
        playerId: '123',
        progress: 0.5,
        wpm: 60
      });
    });
  });

  describe('Race State Management', () => {
    it('handles player ready state', (done) => {
      clientSocket.emit('playerReady', { playerId: '123' });

      clientSocket.on('raceState', (state) => {
        expect(state.readyPlayers).toContain('123');
        done();
      });
    });

    it('starts race when all players ready', (done) => {
      const player2Socket = Client(`http://localhost:${httpServer.address().port}`);
      
      let readyCount = 0;
      const checkStart = () => {
        readyCount++;
        if (readyCount === 2) {
          clientSocket.on('raceStart', (data) => {
            expect(data.countdown).toBe(3);
            player2Socket.close();
            done();
          });
        }
      };

      clientSocket.emit('playerReady', { playerId: '123' });
      player2Socket.emit('playerReady', { playerId: '456' });

      clientSocket.on('raceState', checkStart);
      player2Socket.on('raceState', checkStart);
    });
  });
}); 