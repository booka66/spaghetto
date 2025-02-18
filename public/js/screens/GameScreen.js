export class GameScreen {
  constructor(gameState, socket) {
    this.gameState = gameState;
    this.socket = socket;
    this.element = document.getElementById('gameScreen');
    this.canvas = document.getElementById('gameCanvas');

    // Bind event handlers
    this.handleGameState = this.handleGameState.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  initialize() {
    // Add event listeners
    document.addEventListener('showGameScreen', () => {
      this.show();
    });

    this.socket.onGameState(this.handleGameState);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  handleGameState(gameState) {
    this.gameState.update(gameState);
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        console.log('Turning left');
        this.socket.emitTurn(-1);
        break;
      case 'ArrowRight':
        console.log('Turning right');
        this.socket.emitTurn(1);
        break;
      case 'r':
        if (this.gameState) {
          this.gameState.initialize();
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
    // Remove event listeners when necessary
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}
