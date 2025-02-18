export class GameScreen {
  constructor(gameState, socket) {
    this.gameState = gameState;
    this.socket = socket;
    this.element = document.getElementById('gameScreen');
    this.canvas = document.getElementById('gameCanvas');
  }

  initialize() {
    document.addEventListener('showGameScreen', () => {
      this.show();
    });

    this.socket.onGameState((gameState) => {
      this.gameState.update(gameState);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.socket.emitTurn(-1);
      } else if (e.key === 'ArrowRight') {
        this.socket.emitTurn(1);
      } else if (e.key === 'r') {
        this.gameState.reset();
      } else if (e.key === 'ArrowUp') { // Space key for shooting
        this.socket.emitShoot();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        this.socket.emitTurn(0);
      }
    });
  }

  show() {
    this.element.style.display = 'block';
    this.canvas.style.display = 'block';
    this.gameState.initialize();
  }

  hide() {
    this.element.style.display = 'none';
    this.canvas.style.display = 'none';
  }
}
