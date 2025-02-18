import { CollisionDetection } from './CollisionDetection.js';
import { Renderer } from './Renderer.js';

export class GameState {
  constructor(canvas, socket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.socket = socket;
    this.renderer = new Renderer(this.ctx, canvas.width, canvas.height);
    this.collisionDetection = new CollisionDetection(this.ctx);
    this.players = new Map();
    this.powerUps = [];
    this.lastUpdate = 0;
    this.updateInterval = 1000 / 60;

    // Handle power-up spawning
    this.socket.onPowerUpSpawned((powerUp) => {
      this.powerUps.push(powerUp);
    });

    // Handle power-up collection
    this.socket.onPowerUpCollected((data) => {
      // Remove the collected power-up
      this.powerUps = this.powerUps.filter(powerUp => {
        const dx = powerUp.x - this.players.get(data.playerId)?.x;
        const dy = powerUp.y - this.players.get(data.playerId)?.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance >= 25; // Keep power-ups that weren't collected
      });
    });
  }

  initialize() {
    this.reset();
  }

  reset() {
    this.renderer.clear();
    this.renderer.drawBackground();
    this.lastUpdate = 0;
  }

  update(gameState) {
    const currentTime = performance.now();
    if (currentTime - this.lastUpdate < this.updateInterval) {
      return;
    }

    this.clearBulletPaths();

    // Update powerUps from server state
    this.powerUps = gameState.powerUps;

    // Update and draw players
    const players = new Map(gameState.players);
    players.forEach((player, id) => {
      let color;
      const isCurrentPlayer = id === this.socket.getId();

      if (isCurrentPlayer) {
        const collision = this.collisionDetection.checkCollision(player);
        this.socket.emitPixelState(collision.isAboutToHit, collision.isOver);
        color = collision.isOver ? '#00ff00' : (collision.isAboutToHit ? '#ffff00' : '#ff0000');
      } else {
        color = player.is_over ? '#00ff00' : (player.is_about_to_hit ? '#ffff00' : '#0000ff');
      }

      this.renderer.drawPlayer(player, color);

      if (player.activeBullets) {
        player.activeBullets.forEach(bullet => {
          this.renderer.drawBullet(bullet);
        });
      }
    });

    // Draw powerUps
    this.powerUps.forEach(powerUp => {
      this.renderer.drawPowerUp(powerUp);
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
