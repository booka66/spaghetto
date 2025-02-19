import { EnhancedGameState } from './game-renderer.js';

// Game integration module
export function initializeEnhancedGame(gameCanvas, socket) {
  // Create enhanced game state
  const gameState = new EnhancedGameState(gameCanvas, socket);

  // Initialize the game state
  gameState.initialize();

  // Replace the existing game state with enhanced version
  window.gameState = gameState;

  // Return the enhanced game state for further configuration
  return gameState;
}

// Helper function to modify Game class to use the enhanced renderer
export function enhanceGameClass(Game) {
  // Store original methods for chaining
  const originalOnResize = Game.onResize;

  // Override resize method to handle canvas scaling properly
  Game.onResize = function () {
    // Call original method first
    originalOnResize.call(this);

    // Make sure gameState renderer is updated with new dimensions
    if (window.gameState && window.gameState.renderer) {
      window.gameState.renderer.width = this.ctx.canvas.width;
      window.gameState.renderer.height = this.ctx.canvas.height;
      window.gameState.renderer.resetTrails();
    }
  };

  // Apply performance settings
  Game.setPerformanceMode = function (isLowPerf) {
    if (window.gameState && window.gameState.renderer) {
      window.gameState.renderer.performanceMode = isLowPerf;

      // Adjust canvas size based on performance setting
      if (isLowPerf) {
        const lowPerfCoeff = window.gameState.renderer.lowPerfCoeff;
        $("#canvas_fg").attr("width", Math.floor(cwidth * lowPerfCoeff))
          .attr("height", Math.floor(cheight * lowPerfCoeff));
      } else {
        $("#canvas_fg").attr("width", cwidth)
          .attr("height", cheight);
      }

      // Reset renderer after changing canvas size
      window.gameState.reset();
    }
  };

  return Game;
}

// Update GameScreen to use enhanced renderer
export function enhanceGameScreen(GameScreen, gameState) {
  // Store original methods
  const originalInitialize = GameScreen.prototype.initialize;
  const originalHandleGameState = GameScreen.prototype.handleGameState;

  // Enhance initialization
  GameScreen.prototype.initialize = function () {
    // Call original initialization
    originalInitialize.call(this);

    // Add FPS counter if not exists
    if (!this.fpsCounter) {
      this.createFpsCounter();
    }

    // Connect to enhanced game state
    this.gameState = gameState;
  };

  // Enhance game state handling
  GameScreen.prototype.handleGameState = function (gameState) {
    // Performance monitoring
    const now = performance.now();
    this.frameCounter = (this.frameCounter || 0) + 1;

    if (now - (this.lastFpsUpdate || 0) > 1000) {
      this.fps = Math.round((this.frameCounter * 1000) / (now - (this.lastFpsUpdate || now - 1001)));
      this.lastFpsUpdate = now;
      this.frameCounter = 0;

      if (this.showFps) {
        this.fpsCounter.textContent = `FPS: ${this.fps}`;
      }
    }

    // Update enhanced game state
    if (this.gameState) {
      this.gameState.update(gameState);
    } else {
      // Fallback to original handler
      originalHandleGameState.call(this, gameState);
    }
  };

  return GameScreen;
}

// Handler for server-sent states using the enhanced renderer
export function handleServerState(state, gameState) {
  // Process game state from server
  if (state.players) {
    // Update player positions
    state.players.forEach(player => {
      // Transform server coordinates to canvas coordinates if needed
      const screenX = player.x;
      const screenY = player.y;

      // Update player in game state
      player.x = screenX;
      player.y = screenY;
    });
  }

  // Update game state
  gameState.update(state);
}
