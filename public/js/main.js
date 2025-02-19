import { GameSocket } from './socket.js';
import { MenuScreen } from './screens/MenuScreen.js';
import { WaitingScreen } from './screens/WaitingScreen.js';
import { GameScreen } from './screens/GameScreen.js';
import { initializeEnhancedGame, enhanceGameClass, enhanceGameScreen } from './game/game-integration.js';

class Game {
  constructor() {
    // Create socket first
    this.socket = new GameSocket();

    // Get canvas elements
    this.canvas = document.getElementById('gameCanvas');

    // Initialize enhanced game state
    this.gameState = initializeEnhancedGame(this.canvas, this.socket);

    // Create screens
    this.menuScreen = new MenuScreen(this.socket);
    this.waitingScreen = new WaitingScreen(this.socket);

    // Enhance game screen with new renderer
    this.gameScreen = new GameScreen(this.gameState, this.socket);
    enhanceGameScreen(GameScreen, this.gameState);

    // Initialize game
    this.initialize();
  }

  initialize() {
    // Set up enhanced collision detection
    this.setupCollisionDetection();

    // Initialize screens
    this.menuScreen.initialize();
    this.waitingScreen.initialize();
    this.gameScreen.initialize();

    // Apply performance settings from local storage
    const usePerformanceMode = localStorage.getItem('lowPerf') === 'true';
    this.gameState.renderer.performanceMode = usePerformanceMode;

    console.log('Game initialized with enhanced renderer');
  }

  setupCollisionDetection() {
    // Initialize virtual pixels for collision detection
    if (!this.gameState.renderer.virtualPixels) {
      const ctx = this.canvas.getContext('2d');
      this.gameState.renderer.virtualPixels = ctx.createImageData(
        this.canvas.width,
        this.canvas.height
      );

      // Fill with transparent white
      const data = this.gameState.renderer.virtualPixels.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 0;   // A
      }
    }
  }
}

// Start the game when the page loads
window.addEventListener('load', () => {
  // Enhance global Game object if it exists
  if (window.Game) {
    enhanceGameClass(window.Game);
  }

  // Create new game instance
  new Game();
});
