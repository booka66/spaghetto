import { GameSocket } from './socket.js';
import { MenuScreen } from './screens/MenuScreen.js';
import { WaitingScreen } from './screens/WaitingScreen.js';
import { GameScreen } from './screens/GameScreen.js';
import { GameState } from './game/GameState.js';

class Game {
  constructor() {
    this.socket = new GameSocket(); // Create socket first
    this.gameState = new GameState(document.getElementById('gameCanvas'), this.socket); // Pass socket to GameState

    this.menuScreen = new MenuScreen(this.socket);
    this.waitingScreen = new WaitingScreen(this.socket);
    this.gameScreen = new GameScreen(this.gameState, this.socket);

    this.initialize();
  }

  initialize() {
    this.menuScreen.initialize();
    this.waitingScreen.initialize();
    this.gameScreen.initialize();
  }
}

// Start the game when the page loads
window.addEventListener('load', () => {
  new Game();
});
