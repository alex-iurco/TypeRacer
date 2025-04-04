import { io as SocketClient } from 'socket.io-client';
import { setupTestDB, teardownTestDB } from '../../test/helpers/setup';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createApp } from '../../src/server';
import { setupRaceSocket } from '../../src/socket/raceSocket';

describe('Race Socket', () => {
  let clientSocket: ReturnType<typeof SocketClient>;
  let httpServer: ReturnType<typeof createServer>;
  let io: Server;
  let roomId: string;

  beforeAll(async () => {
    await setupTestDB();
    const app = createApp();
    httpServer = createServer(app);
    io = new Server(httpServer);
    setupRaceSocket(io);
    httpServer.listen();

    clientSocket = SocketClient(`http://localhost:${(httpServer.address() as any).port}`, {
      autoConnect: false
    });

    roomId = 'test-room';
  });

  beforeEach(async () => {
    return new Promise<void>((resolve) => {
      clientSocket.connect();
      clientSocket.once('connect', () => {
        clientSocket.emit('joinRoom', roomId);
        clientSocket.once('roomJoined', () => resolve());
      });
    });
  });

  afterEach(() => {
    clientSocket.removeAllListeners();
    clientSocket.disconnect();
  });

  afterAll(async () => {
    await Promise.all([
      new Promise<void>((resolve) => httpServer.close(() => resolve())),
      teardownTestDB()
    ]);
  });

  describe('Room Management', () => {
    it('should join a room successfully', (done) => {
      clientSocket.emit('joinRoom', roomId);
      
      clientSocket.once('roomJoined', (data) => {
        expect(data).toHaveProperty('text');
        expect(data).toHaveProperty('playerCount', 1);
        done();
      });
    });
  });

  describe('Race Progress', () => {
    it('should broadcast race progress to other players', (done) => {
      const progress = { wpm: 50, accuracy: 95 };
      
      clientSocket.emit('raceProgress', progress);
      
      clientSocket.once('raceUpdate', (data) => {
        expect(data).toEqual(expect.objectContaining({
          playerId: clientSocket.id,
          ...progress
        }));
        done();
      });
    });

    it('should handle multiple progress updates', (done) => {
      const progress1 = { wpm: 50, accuracy: 95 };
      const progress2 = { wpm: 60, accuracy: 98 };
      
      let updateCount = 0;
      const onRaceUpdate = (data: any) => {
        expect(data).toEqual(expect.objectContaining({
          playerId: clientSocket.id,
          ...(updateCount === 0 ? progress1 : progress2)
        }));
        updateCount++;
        if (updateCount === 2) {
          clientSocket.off('raceUpdate', onRaceUpdate);
          done();
        }
      };

      clientSocket.on('raceUpdate', onRaceUpdate);
      clientSocket.emit('raceProgress', progress1);
      clientSocket.emit('raceProgress', progress2);
    });
  });

  describe('Race Start', () => {
    it('should not start race with single player', (done) => {
      let raceStarted = false;
      
      clientSocket.emit('ready');
      
      const onRaceStart = () => {
        raceStarted = true;
      };

      clientSocket.on('raceStart', onRaceStart);

      setTimeout(() => {
        clientSocket.off('raceStart', onRaceStart);
        expect(raceStarted).toBe(false);
        done();
      }, 1000);
    });

    it('should start race when multiple players are ready', (done) => {
      // Create a second client
      const client2 = SocketClient(`http://localhost:${(httpServer.address() as any).port}`, {
        autoConnect: true
      });

      client2.once('connect', () => {
        client2.emit('joinRoom', roomId);
        client2.once('roomJoined', () => {
          clientSocket.emit('ready');
          client2.emit('ready');
        });
      });

      clientSocket.once('raceStart', (data) => {
        expect(data).toHaveProperty('text');
        expect(data).toHaveProperty('startTime');
        client2.disconnect();
        done();
      });
    });
  });
}); 