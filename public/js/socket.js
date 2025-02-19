export class GameSocket {
  constructor() {
    this.socket = io();
    this.currentRoom = null;
    this.isHost = false;
    this.lastPixelStateUpdate = 0;
    this.pixelStateUpdateInterval = 100; // Limit updates to every 100ms
    this.pixelState = false;

    // Throttled emitters
    this.turnThrottleTimer = null;
    this.shootThrottleTimer = null;

    // Current game state
    this.currentGameState = {
      players: new Map(),
      powerUps: []
    };

    // Handle partial updates
    this.socket.on('gameStatePartial', (partialState) => {
      // Update players that changed
      if (partialState.players) {
        partialState.players.forEach(([id, player]) => {
          this.currentGameState.players.set(id, player);
        });
      }

      // Update powerups if included
      if (partialState.powerUps !== null) {
        this.currentGameState.powerUps = partialState.powerUps;
      }

      // Trigger update with merged state
      if (this.gameStateCallback) {
        this.gameStateCallback(this.currentGameState);
      }
    });

    // Handle full updates
    this.socket.on('gameState', (gameState) => {
      // Replace entire state
      this.currentGameState = {
        players: new Map(gameState.players),
        powerUps: gameState.powerUps || []
      };

      if (this.gameStateCallback) {
        this.gameStateCallback(this.currentGameState);
      }
    });
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
    // Throttle turn updates to reduce network traffic
    if (this.turnThrottleTimer) {
      clearTimeout(this.turnThrottleTimer);
    }

    this.turnThrottleTimer = setTimeout(() => {
      this.socket.emit('turn', {
        roomCode: this.currentRoom,
        direction: direction
      });
      this.turnThrottleTimer = null;
    }, 50); // Send at most every 50ms
  }

  emitPixelState(isAboutToHit) {
    const currentTime = performance.now();

    // Only update if state changed or enough time passed
    if (isAboutToHit !== this.pixelState ||
      currentTime - this.lastPixelStateUpdate > this.pixelStateUpdateInterval) {

      this.socket.emit('pixelState', {
        roomCode: this.currentRoom,
        isAboutToHit,
      });

      this.pixelState = isAboutToHit;
      this.lastPixelStateUpdate = currentTime;
    }
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
    // Store callback for both full and partial updates
    this.gameStateCallback = callback;

    // Initial setup for full state updates
    this.socket.on('gameState', callback);
  }

  onRoomClosed(callback) {
    this.socket.on('roomClosed', callback);
  }

  getId() {
    return this.socket.id;
  }

  emitShoot() {
    // Throttle shoot requests
    if (this.shootThrottleTimer) {
      return; // Ignore rapid-fire requests
    }

    this.socket.emit('shoot', {
      roomCode: this.currentRoom
    });

    // Prevent shooting again for 200ms
    this.shootThrottleTimer = setTimeout(() => {
      this.shootThrottleTimer = null;
    }, 200);
  }

  onPowerUpSpawned(callback) {
    this.socket.on('powerUpSpawned', callback);
  }

  onPowerUpCollected(callback) {
    this.socket.on('powerUpCollected', callback);
  }

  disconnect() {
    // Clean up timers
    if (this.turnThrottleTimer) {
      clearTimeout(this.turnThrottleTimer);
    }
    if (this.shootThrottleTimer) {
      clearTimeout(this.shootThrottleTimer);
    }
  }
}
