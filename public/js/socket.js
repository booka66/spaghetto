export class GameSocket {
  constructor() {
    this.socket = io();
    this.currentRoom = null;
    this.isHost = false;
  }

  createRoom(callback) {
    this.socket.emit('createRoom', (response) => {
      if (response.roomCode) {
        this.currentRoom = response.roomCode;
        this.isHost = true;
        callback(response);
      }
    });
  }

  joinRoom(roomCode, callback) {
    this.socket.emit('joinRoom', roomCode, (response) => {
      if (!response.error) {
        this.currentRoom = roomCode;
        callback(response);
      } else {
        callback(response);
      }
    });
  }

  startGame() {
    if (this.isHost && this.currentRoom) {
      this.socket.emit('startGame', this.currentRoom);
    }
  }

  startNewRound() {
    if (this.isHost && this.currentRoom) {
      this.socket.emit('startNewRound', this.currentRoom);
    }
  }

  emitTurn(direction) {
    this.socket.emit('turn', {
      roomCode: this.currentRoom,
      direction: direction
    });
  }

  emitPixelState(isAboutToHit) {
    this.socket.emit('pixelState', {
      roomCode: this.currentRoom,
      isAboutToHit,
    });
  }

  onPlayerList(callback) {
    this.socket.on('playerList', callback);
  }

  onGameStarted(callback) {
    this.socket.on('gameStarted', callback);
  }

  onRoundStarted(callback) {
    this.socket.on('roundStarted', callback);
  }

  onRoundOver(callback) {
    this.socket.on('roundOver', callback);
  }

  onGameOver(callback) {
    this.socket.on('gameOver', callback);
  }

  onGameState(callback) {
    this.socket.on('gameState', callback);
  }

  onRoomClosed(callback) {
    this.socket.on('roomClosed', callback);
  }

  getId() {
    return this.socket.id;
  }

  emitShoot() {
    this.socket.emit('shoot', {
      roomCode: this.currentRoom
    });
  }

  onPowerUpSpawned(callback) {
    this.socket.on('powerUpSpawned', callback);
  }

  onPowerUpCollected(callback) {
    this.socket.on('powerUpCollected', callback);
  }
}
