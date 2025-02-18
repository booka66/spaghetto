const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Game constants
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 720;
const TURN_RATE = 0.1;
const MOVEMENT_SPEED = 1.5;

// Store rooms and players
const rooms = new Map();

function updatePlayerPosition(player, deltaTime) {
  player.angle += player.turning * TURN_RATE;
  const newX = player.x + Math.cos(player.angle) * MOVEMENT_SPEED;
  const newY = player.y + Math.sin(player.angle) * MOVEMENT_SPEED;
  player.x = ((newX % GAME_WIDTH) + GAME_WIDTH) % GAME_WIDTH;
  player.y = ((newY % GAME_HEIGHT) + GAME_HEIGHT) % GAME_HEIGHT;
}

function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  } while (rooms.has(code));
  return code;
}

function createPlayerData() {
  return {
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    angle: Math.random() * Math.PI * 2,
    turning: 0,
    lastUpdate: Date.now(),
    is_about_to_hit: false,
    is_over: false
  };
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('createRoom', (callback) => {
    const roomCode = generateRoomCode();
    const players = new Map();
    // Add the host as the first player
    players.set(socket.id, createPlayerData());

    rooms.set(roomCode, {
      host: socket.id,
      players: players,
      gameStarted: false
    });

    socket.join(roomCode);
    callback({ roomCode });
    // Emit initial player list
    io.to(roomCode).emit('playerList', Array.from(players.keys()));
  });

  socket.on('joinRoom', (roomCode, callback) => {
    const room = rooms.get(roomCode);
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }
    if (room.gameStarted) {
      callback({ error: 'Game already in progress' });
      return;
    }

    socket.join(roomCode);
    room.players.set(socket.id, createPlayerData());

    callback({ success: true });
    io.to(roomCode).emit('playerList', Array.from(room.players.keys()));
  });

  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.host === socket.id) {
      room.gameStarted = true;
      io.to(roomCode).emit('gameStarted');
    }
  });

  socket.on('pixelState', ({ roomCode, isAboutToHit, isOver }) => {
    const room = rooms.get(roomCode);
    if (room) {
      const player = room.players.get(socket.id);
      if (player) {
        player.is_about_to_hit = isAboutToHit;
        player.is_over = isOver;
      }
    }
  });

  socket.on('turn', ({ roomCode, direction }) => {
    const room = rooms.get(roomCode);
    if (room) {
      const player = room.players.get(socket.id);
      if (player) {
        player.turning = direction;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    rooms.forEach((room, roomCode) => {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        io.to(roomCode).emit('playerList', Array.from(room.players.keys()));
      }
      if (room.host === socket.id || room.players.size === 0) {
        rooms.delete(roomCode);
        io.to(roomCode).emit('roomClosed');
      }
    });
  });
});

// Game loop for each room
setInterval(() => {
  const currentTime = Date.now();
  rooms.forEach((room, roomCode) => {
    if (room.gameStarted) {
      room.players.forEach((player) => {
        const deltaTime = currentTime - player.lastUpdate;
        updatePlayerPosition(player, deltaTime);
        player.lastUpdate = currentTime;
      });
      io.to(roomCode).emit('gameState', Array.from(room.players.entries()));
    }
  });
}, 1000 / 60);

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
