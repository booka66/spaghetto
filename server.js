const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const players = new Map();
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TURN_RATE = 0.1;
const MOVEMENT_SPEED = 1.5;

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  players.set(socket.id, {
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    angle: Math.random() * Math.PI * 2,
    turning: 0,
    lastUpdate: Date.now(),
    is_about_to_hit: false,
    is_over: false
  });

  socket.on('pixelState', ({ isAboutToHit, isOver }) => {
    const player = players.get(socket.id);
    if (player) {
      player.is_about_to_hit = isAboutToHit;
      player.is_over = isOver;
    }
  });

  socket.on('turn', (direction) => {
    const player = players.get(socket.id);
    if (player) {
      player.turning = direction;
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    players.delete(socket.id);
  });
});

function updatePlayerPosition(player, deltaTime) {
  player.angle += player.turning * TURN_RATE;
  const newX = player.x + Math.cos(player.angle) * MOVEMENT_SPEED;
  const newY = player.y + Math.sin(player.angle) * MOVEMENT_SPEED;
  player.x = ((newX % GAME_WIDTH) + GAME_WIDTH) % GAME_WIDTH;
  player.y = ((newY % GAME_HEIGHT) + GAME_HEIGHT) % GAME_HEIGHT;
}

setInterval(() => {
  const currentTime = Date.now();
  players.forEach((player) => {
    const deltaTime = currentTime - player.lastUpdate;
    updatePlayerPosition(player, deltaTime);
    player.lastUpdate = currentTime;
  });
  io.emit('gameState', Array.from(players.entries()));
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
const server = http.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
