export class GameScreen {
  constructor(gameState, socket) {
    this.gameState = gameState;
    this.socket = socket;
    this.element = document.getElementById('gameScreen');
    this.canvas = document.getElementById('gameCanvas');

    // Add overlay elements
    this.createOverlay();

    // Bind event handlers
    this.handleGameState = this.handleGameState.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
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

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  handleGameState(gameState) {
    this.gameState.update(gameState);
  }

  handleKeyDown(e) {
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
        this.socket.emitShoot();
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
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}
