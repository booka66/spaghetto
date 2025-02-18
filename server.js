const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game constants
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 720;
const TURN_RATE = 0.1;
const MOVEMENT_SPEED = 1.5;
const POWERUP_SPAWN_INTERVAL = 10000; // 10 seconds
const POWERUP_DURATION = 15000; // 15 seconds
const POWERUP_COLLECTION_RADIUS = 25; // Increased from 10 to 25 pixels
const POWERUP_SIZE = 5;
const BULLET_SPEED = 5;
const WINS_NEEDED = 10;

// Store rooms and players
const rooms = new Map();

function updatePlayerPosition(player, deltaTime) {
  if (!player.is_dead) {
    player.angle += player.turning * TURN_RATE;
    const newX = player.x + Math.cos(player.angle) * MOVEMENT_SPEED;
    const newY = player.y + Math.sin(player.angle) * MOVEMENT_SPEED;

    // Wrap around screen edges
    player.x = ((newX % GAME_WIDTH) + GAME_WIDTH) % GAME_WIDTH;
    player.y = ((newY % GAME_HEIGHT) + GAME_HEIGHT) % GAME_HEIGHT;
  }
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
    is_dead: false,
    respawn_timer: 0,
    bullets: 0,
    activeBullets: [],
    score: 0
  };
}

function resetRound(room) {
  room.players.forEach((player) => {
    player.x = Math.random() * GAME_WIDTH;
    player.y = Math.random() * GAME_HEIGHT;
    player.angle = Math.random() * Math.PI * 2;
    player.is_dead = false;
    player.is_about_to_hit = false;
    player.bullets = 0;
    player.activeBullets = [];
    player.turning = 0;
  });
  room.powerUps = [];
  room.roundInProgress = true;
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('createRoom', (callback) => {
    const roomCode = generateRoomCode();
    const players = new Map();
    players.set(socket.id, createPlayerData());

    rooms.set(roomCode, {
      host: socket.id,
      players: players,
      gameStarted: false,
      roundInProgress: false,
      lastPowerUpSpawn: 0
    });

    socket.join(roomCode);
    callback({ roomCode });
    io.to(roomCode).emit('playerList', Array.from(players.keys()));
  });

  socket.on('joinRoom', (roomCode, callback) => {
    const room = rooms.get(roomCode);
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }
    if (room.gameStarted && room.roundInProgress) {
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
      room.roundInProgress = true;
      io.to(roomCode).emit('gameStarted');
    }
  });

  socket.on('startNewRound', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.host === socket.id && !room.roundInProgress) {
      resetRound(room);
      io.to(roomCode).emit('roundStarted');
    }
  });

  socket.on('pixelState', ({ roomCode, isAboutToHit }) => {
    const room = rooms.get(roomCode);
    if (room && room.roundInProgress) {
      const player = room.players.get(socket.id);
      if (player) {
        if (isAboutToHit && !player.is_dead) {
          player.is_dead = true;

          // Check if round is over (only one player alive)
          let alivePlayers = 0;
          let lastAlivePlayer = null;
          room.players.forEach((p, id) => {
            if (!p.is_dead) {
              alivePlayers++;
              lastAlivePlayer = id;
            }
          });

          if (alivePlayers <= 1 && lastAlivePlayer) {
            const winningPlayer = room.players.get(lastAlivePlayer);
            winningPlayer.score++;
            room.roundInProgress = false;

            // Check if game is over
            if (winningPlayer.score >= WINS_NEEDED) {
              io.to(roomCode).emit('gameOver', {
                winner: lastAlivePlayer,
                scores: Array.from(room.players.entries()).map(([id, p]) => ({
                  id,
                  score: p.score
                }))
              });
            } else {
              io.to(roomCode).emit('roundOver', {
                winner: lastAlivePlayer,
                scores: Array.from(room.players.entries()).map(([id, p]) => ({
                  id,
                  score: p.score
                }))
              });
            }
          }
        }
        player.is_about_to_hit = isAboutToHit;
      }
    }
  });

  socket.on('turn', ({ roomCode, direction }) => {
    console.log(`Turn event received: direction=${direction}`);
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

  socket.on('shoot', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (room) {
      const player = room.players.get(socket.id);
      if (player && player.bullets > 0) {
        player.bullets--;
        player.activeBullets.push({
          x: player.x,
          y: player.y,
          angle: player.angle
        });
      }
    }
  });
});

// Game loop
setInterval(() => {
  const currentTime = Date.now();

  rooms.forEach((room, roomCode) => {
    if (room.gameStarted && room.roundInProgress) {
      // Update all players and their bullets
      room.players.forEach((player) => {
        if (!player.is_dead) {
          // Update player position
          const deltaTime = currentTime - player.lastUpdate;
          updatePlayerPosition(player, deltaTime);
          player.lastUpdate = currentTime;

          if (player.activeBullets) {
            player.activeBullets = player.activeBullets.map(bullet => {
              const newX = bullet.x + Math.cos(bullet.angle) * BULLET_SPEED;
              const newY = bullet.y + Math.sin(bullet.angle) * BULLET_SPEED;

              // Check if bullet has reached screen edge
              if (newX < 0 || newX > GAME_WIDTH || newY < 0 || newY > GAME_HEIGHT) {
                return null; // Mark for removal
              }

              return {
                x: newX,
                y: newY,
                angle: bullet.angle
              };
            }).filter(bullet => bullet !== null); // Remove bullets that hit screen edge
          }
        }
      });

      // Spawn power-ups
      if (!room.lastPowerUpSpawn || currentTime - room.lastPowerUpSpawn > POWERUP_SPAWN_INTERVAL) {
        const powerUp = {
          x: Math.random() * (GAME_WIDTH - 2 * POWERUP_SIZE) + POWERUP_SIZE,
          y: Math.random() * (GAME_HEIGHT - 2 * POWERUP_SIZE) + POWERUP_SIZE,
          type: 'bullet',
          spawnTime: currentTime,
          size: POWERUP_SIZE
        };
        room.powerUps = room.powerUps || [];
        room.powerUps.push(powerUp);
        room.lastPowerUpSpawn = currentTime;
        io.to(roomCode).emit('powerUpSpawned', powerUp);
      }

      // Remove expired power-ups
      if (room.powerUps) {
        room.powerUps = room.powerUps.filter(powerUp =>
          currentTime - powerUp.spawnTime < POWERUP_DURATION
        );
      }

      // Check for power-up collection
      room.players.forEach((player) => {
        if (room.powerUps) {
          room.powerUps = room.powerUps.filter(powerUp => {
            const dx = powerUp.x - player.x;
            const dy = powerUp.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < POWERUP_COLLECTION_RADIUS) {
              if (powerUp.type === 'bullet') {
                player.bullets += 3;
              }
              io.to(roomCode).emit('powerUpCollected', {
                playerId: player.id,
                powerUpType: powerUp.type
              });
              return false;
            }
            return true;
          });
        }
      });

      // Broadcast game state
      io.to(roomCode).emit('gameState', {
        players: Array.from(room.players.entries()),
        powerUps: room.powerUps || []
      });
    }
  });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
