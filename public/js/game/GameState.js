import { CollisionDetection } from './game-renderer.js';

export class GameState {
  constructor(canvas, socket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.socket = socket;

    // Import the enhanced renderer if available
    this.useEnhancedRenderer = typeof window.Renderer !== 'undefined';

    if (this.useEnhancedRenderer && window.Renderer) {
      console.log("Using enhanced renderer");
      this.renderer = new window.Renderer(this.ctx, canvas.width, canvas.height);
    } else {
      // Fallback to basic renderer from original code
      console.log("Using fallback renderer");
      this.renderer = {
        clear: () => {
          this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        clearMainCanvas: () => {
          this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        drawBackground: () => {
          this.ctx.font = '48px Arial';
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('SPAGHETTO', canvas.width / 2, canvas.height / 2);
        },
        drawPlayer: (player, color) => {
          this.ctx.beginPath();
          this.ctx.fillStyle = color;
          this.ctx.arc(player.x, player.y, 2, 0, Math.PI * 2);
          this.ctx.fill();
          return false;
        },
        renderTrails: () => { },
        resetTrails: () => { }
      };
    }

    // Initialize collision detection
    this.collisionDetection = new CollisionDetection(this.ctx);

    // Game state variables
    this.players = new Map();
    this.powerUps = [];
    this.lastUpdate = 0;
    this.updateInterval = 1000 / 60;
    this.gameOver = false;

    // Set up power-up handling
    this.socket.onPowerUpSpawned((powerUp) => {
      this.powerUps.push(powerUp);
    });

    this.socket.onPowerUpCollected((data) => {
      this.powerUps = this.powerUps.filter(powerUp => {
        const dx = powerUp.x - this.players.get(data.playerId)?.x;
        const dy = powerUp.y - this.players.get(data.playerId)?.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance >= 25;
      });
    });
  }

  initialize() {
    this.reset();
  }

  reset() {
    this.renderer.clear();
    this.renderer.resetTrails();
    this.renderer.drawBackground();
    this.lastUpdate = 0;
  }

  update(gameState) {
    if (this.gameOver) {
      this.socket.emitGameOver();
      return;
    }

    const currentTime = performance.now();
    if (currentTime - this.lastUpdate < this.updateInterval) {
      return;
    }

    // Clear only the main canvas each frame
    this.renderer.clearMainCanvas();
    this.renderer.drawBackground();

    // Draw the trails first
    this.renderer.renderTrails();

    // Update powerUps from server state
    this.powerUps = gameState.powerUps || [];

    // Draw powerUps
    this.powerUps.forEach(powerUp => {
      if (typeof this.renderer.drawPowerUp === 'function') {
        this.renderer.drawPowerUp(powerUp);
      } else {
        // Fallback drawing
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ffff00';
        this.ctx.arc(powerUp.x, powerUp.y, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Update and draw players
    const players = new Map(gameState.players);
    players.forEach((player, id) => {
      let color;
      const isCurrentPlayer = id === this.socket.getId();

      if (isCurrentPlayer) {
        const collision = this.collisionDetection.checkCollision(player);
        this.socket.emitPixelState(collision.isAboutToHit);
        color = collision.isAboutToHit ? '#ffff00' : '#ff0000';
      } else {
        color = player.is_about_to_hit ? '#ffff00' : '#0000ff';
      }

      // Draw player
      if (typeof this.renderer.drawPlayerTrail === 'function' && player.hasBeenInitialized) {
        // Draw trail using enhanced renderer
        const prevX = player.prevX || player.x;
        const prevY = player.prevY || player.y;

        this.renderer.drawPlayerTrail(
          prevX, prevY, player.x, player.y,
          color, 9, player.is_ghost
        );
      }

      this.renderer.drawPlayer(player, color, isCurrentPlayer);

      // Store position for next frame
      player.prevX = player.x;
      player.prevY = player.y;

      // Draw bullets
      if (player.activeBullets) {
        player.activeBullets.forEach(bullet => {
          if (typeof this.renderer.drawBullet === 'function') {
            this.renderer.drawBullet(bullet);
          } else {
            // Fallback bullet drawing
            this.ctx.save();
            this.ctx.translate(bullet.x, bullet.y);
            this.ctx.rotate(bullet.angle);
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(-6, -2, 12, 4);
            this.ctx.restore();
          }
        });
      }
    });

    this.lastUpdate = currentTime;
  }

  clearBulletPaths() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // If pixel is black (bullet trail)
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
        // Set to white
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
  }
}
