import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import { sanitizeText } from '../utils/shared';

interface RaceRoom {
  players: Map<string, {
    socket: Socket;
    ready: boolean;
    progress: {
      wpm: number;
      accuracy: number;
    };
  }>;
  text: string;
  startTime?: number;
  status: 'waiting' | 'racing' | 'finished';
  isSinglePlayer?: boolean;
}

const rooms = new Map<string, RaceRoom>();

const generateText = () => {
  const texts = [
    "The quick brown fox jumps over the lazy dog.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "A journey of a thousand miles begins with a single step.",
    "Actions speak louder than words."
  ];
  return texts[Math.floor(Math.random() * texts.length)];
};

const startCountdown = (io: Server, roomId: string, room: RaceRoom, socket: Socket) => {
  // Start countdown
  let count = 3;
  
  // Emit initial countdown immediately
  io.to(roomId).emit('countdown', count);
  logger.debug(`Starting countdown from 3 in room: ${roomId}`);
  
  const countdownInterval = setInterval(() => {
    // Check if room still exists
    const currentRoomState = rooms.get(roomId);
    if (!currentRoomState) {
      clearInterval(countdownInterval);
      return;
    }
    
    count--;
    logger.debug(`Countdown: ${count} for room: ${roomId}`);
    
    if (count >= 0) {
      io.to(roomId).emit('countdown', count);
    }
    
    if (count < 0) {
      clearInterval(countdownInterval);
      // Set race status to racing and emit text again
      currentRoomState.status = 'racing';
      currentRoomState.startTime = Date.now();
      logger.debug(`Starting race with text: ${currentRoomState.text}`);
      // Emit race start with text again to ensure it's received
      io.to(roomId).emit('race_text', currentRoomState.text);
      emitRoomUpdate(io, roomId, currentRoomState, socket.id);
    }
  }, 1000);
};

const emitRoomUpdate = (io: Server, roomId: string, room: RaceRoom, currentSocketId?: string) => {
  // Emit race update to all players in the room
  io.to(roomId).emit('race_update', Array.from(room.players.entries()).map(([id, p]) => ({
    id,
    name: id === currentSocketId ? 'You' : `Player ${Array.from(room.players.keys()).indexOf(id) + 1}`,
    progress: p.progress.wpm,
    wpm: p.progress.wpm
  })));

  // Emit room state
  io.to(roomId).emit('room_state', {
    status: room.status,
    text: room.text,
    playerCount: room.players.size
  });
};

export const setupRaceSocket = (io: Server) => {
  io.on('connection', (socket) => {
    let currentRoom: string | null = null;

    socket.on('joinRoom', (roomId: string) => {
      if (currentRoom) {
        socket.leave(currentRoom);
        const room = rooms.get(currentRoom);
        if (room) {
          room.players.delete(socket.id);
          if (room.players.size === 0) {
            rooms.delete(currentRoom);
          } else {
            emitRoomUpdate(io, currentRoom, room, socket.id);
          }
        }
      }

      let room = rooms.get(roomId);
      if (!room) {
        room = {
          players: new Map(),
          text: generateText(),
          status: 'waiting',
          isSinglePlayer: roomId.startsWith('single-player-')
        };
        rooms.set(roomId, room);
      }

      room.players.set(socket.id, {
        socket,
        ready: false,
        progress: { wpm: 0, accuracy: 0 }
      });
      
      socket.join(roomId);
      currentRoom = roomId;
      
      // Emit room joined event first
      socket.emit('roomJoined', {
        roomId,
        isSinglePlayer: room.isSinglePlayer
      });

      // Then emit room update
      emitRoomUpdate(io, roomId, room, socket.id);
    });

    socket.on('ready', () => {
      if (!currentRoom) return;
      const roomId = currentRoom;
      
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      logger.debug(`Player ready in room: ${roomId}`);
      player.ready = true;
      emitRoomUpdate(io, roomId, room, socket.id);

      const allReady = Array.from(room.players.values()).every(p => p.ready);
      const shouldStartRace = room.isSinglePlayer || (allReady && room.players.size > 1);

      if (shouldStartRace) {
        // Emit text immediately when starting countdown
        io.to(roomId).emit('race_text', room.text);
        // Start countdown after a short delay to ensure text is received
        setTimeout(() => {
          startCountdown(io, roomId, room, socket);
        }, 500);
      }
    });

    socket.on('submit_custom_text', (text: string) => {
      if (!currentRoom) return;
      const roomId = currentRoom;
      
      const room = rooms.get(roomId);
      if (!room) return;

      logger.debug(`Setting custom text for room: ${roomId}, text: ${text}`);
      
      // Sanitize custom text before saving and emitting
      const cleanedText = sanitizeText(text);
      room.text = cleanedText;
      io.to(roomId).emit('race_text', cleanedText);
      
      // For single player, mark player as ready and start countdown
      if (room.isSinglePlayer) {
        const player = room.players.get(socket.id);
        if (player) {
          player.ready = true;
          emitRoomUpdate(io, roomId, room, socket.id);
          // Start countdown after a short delay to ensure text is received
          setTimeout(() => {
            startCountdown(io, roomId, room, socket);
          }, 500);
        }
      }
    });

    socket.on('progress_update', (data: { progress: number; wpm: number }) => {
      if (!currentRoom) return;
      
      const room = rooms.get(currentRoom);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.progress = { wpm: data.wpm, accuracy: 0 };
      
      // Check if player has finished
      if (data.progress >= 100) {
        // Set room status to finished if all players are done
        const allFinished = Array.from(room.players.values()).every(p => p.progress.wpm > 0);
        if (allFinished) {
          room.status = 'finished';
        }
      }
      
      emitRoomUpdate(io, currentRoom, room, socket.id);
    });

    socket.on('disconnect', () => {
      if (currentRoom) {
        const room = rooms.get(currentRoom);
        if (room) {
          room.players.delete(socket.id);
          if (room.players.size === 0) {
            rooms.delete(currentRoom);
          } else {
            emitRoomUpdate(io, currentRoom, room, socket.id);
          }
        }
      }
    });
  });
};