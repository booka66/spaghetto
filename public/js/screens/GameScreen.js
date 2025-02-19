export class GameScreen {
  constructor(gameState, socket) {
    this.gameState = gameState;
    this.socket = socket;
    this.element = document.getElementById('gameScreen');
    this.canvas = document.getElementById('gameCanvas');
    this.frameCounter = 0;
    this.lastFpsUpdate = 0;
    this.fps = 0;
    this.showFps = false; // Set to true for debugging

    // Add overlay elements
    this.createOverlay();
    this.createFpsCounter();

    // Bind event handlers
    this.handleGameState = this.handleGameState.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // Debounced shoot handler
    this.lastShootTime = 0;
    this.shootMinInterval = 200; // Min 200ms between shots
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'game-overlay';
    this.overlay.style.display = 'none';
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '50%';
    this.overlay.style.left = '50%';
    this.overlay.style.transform = 'translate(-50%, -50%)';
    this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.overlay.style.color = 'white';
    this.overlay.style.padding = '20px';
    this.overlay.style.borderRadius = '10px';
    this.overlay.style.textAlign = 'center';
    this.overlay.style.zIndex = '1000';
    this.element.appendChild(this.overlay);
  }

  createFpsCounter() {
    this.fpsCounter = document.createElement('div');
    this.fpsCounter.style.position = 'absolute';
    this.fpsCounter.style.top = '10px';
    this.fpsCounter.style.right = '10px';
    this.fpsCounter.style.color = 'black';
    this.fpsCounter.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    this.fpsCounter.style.padding = '5px';
    this.fpsCounter.style.borderRadius = '3px';
    this.fpsCounter.style.fontFamily = 'monospace';
    this.fpsCounter.style.display = this.showFps ? 'block' : 'none';
    this.element.appendChild(this.fpsCounter);
  }

  initialize() {
    document.addEventListener('showGameScreen', () => {
      this.show();
    });

    this.socket.onGameState(this.handleGameState);

    this.socket.onRoundOver(({ winner, scores }) => {
      const winnerText = winner === this.socket.getId() ? 'You' : `Player ${winner.slice(0, 4)}`;
      let overlayContent = `<h2>${winnerText} won the round!</h2>`;
      overlayContent += '<h3>Current Scores:</h3>';
      overlayContent += '<ul style="list-style: none; padding: 0;">';
      scores.forEach(({ id, score }) => {
        const playerText = id === this.socket.getId() ? 'You' : `Player ${id.slice(0, 4)}`;
        overlayContent += `<li>${playerText}: ${score}</li>`;
      });
      overlayContent += '</ul>';

      if (this.socket.isHost) {
        overlayContent += '<p>Press SPACE to start next round</p>';
      } else {
        overlayContent += '<p>Waiting for host to start next round...</p>';
      }

      this.overlay.innerHTML = overlayContent;
      this.overlay.style.display = 'block';

      // Reset game state when round ends
      this.gameState.reset();
    });

    this.socket.onGameOver(({ winner, scores }) => {
      const winnerText = winner === this.socket.getId() ? 'You' : `Player ${winner.slice(0, 4)}`;
      let overlayContent = `<h2>${winnerText} won the game!</h2>`;
      overlayContent += '<h3>Final Scores:</h3>';
      overlayContent += '<ul style="list-style: none; padding: 0;">';
      scores.forEach(({ id, score }) => {
        const playerText = id === this.socket.getId() ? 'You' : `Player ${id.slice(0, 4)}`;
        overlayContent += `<li>${playerText}: ${score}</li>`;
      });
      overlayContent += '</ul>';
      overlayContent += '<p>Game Over! Refresh the page to play again.</p>';

      this.overlay.innerHTML = overlayContent;
      this.overlay.style.display = 'block';
    });

    this.socket.onRoundStarted(() => {
      this.overlay.style.display = 'none';
      this.gameState.reset();
    });

    this.socket.onRoomClosed(() => {
      alert('Room has been closed');
      window.location.reload();
    });

    // Use passive event listeners for better performance
    document.addEventListener('keydown', this.handleKeyDown, { passive: true });
    document.addEventListener('keyup', this.handleKeyUp, { passive: true });
  }

  handleGameState(gameState) {
    // Performance monitoring
    const now = performance.now();
    this.frameCounter++;

    if (now - this.lastFpsUpdate > 1000) {
      this.fps = Math.round((this.frameCounter * 1000) / (now - this.lastFpsUpdate));
      this.lastFpsUpdate = now;
      this.frameCounter = 0;

      if (this.showFps) {
        this.fpsCounter.textContent = `FPS: ${this.fps}`;
      }
    }

    // Update game state
    this.gameState.update(gameState);
  }

  handleKeyDown(e) {
    // Prevent default behaviors for game controls
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'ArrowLeft':
        this.socket.emitTurn(-1);
        break;
      case 'ArrowRight':
        this.socket.emitTurn(1);
        break;
      case ' ':
        if (this.socket.isHost && this.overlay.style.display === 'block') {
          this.socket.startNewRound();
        }
        break;
      case 'ArrowUp':
        const now = performance.now();
        if (now - this.lastShootTime >= this.shootMinInterval) {
          this.socket.emitShoot();
          this.lastShootTime = now;
        }
        break;
      case 'f':
        // Toggle FPS counter (for debugging)
        if (e.ctrlKey) {
          this.showFps = !this.showFps;
          this.fpsCounter.style.display = this.showFps ? 'block' : 'none';
        }
        break;
    }
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      this.socket.emitTurn(0);
    }
  }

  show() {
    this.element.style.display = 'block';
    this.canvas.style.display = 'block';
    if (this.gameState) {
      this.gameState.initialize();
    }
  }

  hide() {
    this.element.style.display = 'none';
    this.canvas.style.display = 'none';
  }

  cleanup() {
    // Proper cleanup to prevent memory leaks
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);

    // Clean up any game state resources
    if (this.gameState && this.gameState.cleanup) {
      this.gameState.cleanup();
    }

    // Clean up socket resources
    if (this.socket && this.socket.disconnect) {
      this.socket.disconnect();
    }
  }
}
