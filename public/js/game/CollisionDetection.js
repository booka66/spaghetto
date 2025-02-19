export class CollisionDetection {
  constructor(ctx) {
    // Set willReadFrequently to true for better performance
    this.ctx = ctx.canvas.getContext('2d', { willReadFrequently: true });

    // Cache canvas dimensions
    this.width = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;

    // Pre-calculate common angles for collision detection
    this.lookAheadAngles = [-0.2, 0, 0.2]; // Reduced from 5 to 3 checks
    this.lookAheadDistance = 3;
    this.playerSize = 2; // Player head radius
    this.bulletHitboxSize = 6;

    // Cached image data for collision detection
    this.imageDataCache = null;
    this.lastImageDataUpdate = 0;
    this.imageDataUpdateInterval = 50; // Update every 50ms
  }

  updateImageDataCache() {
    const currentTime = performance.now();
    if (currentTime - this.lastImageDataUpdate > this.imageDataUpdateInterval) {
      this.imageDataCache = this.ctx.getImageData(0, 0, this.width, this.height);
      this.lastImageDataUpdate = currentTime;
      return true;
    }
    return false;
  }

  checkBulletCollisions(players) {
    players.forEach((player, playerId) => {
      if (player.is_dead) return;

      players.forEach((otherPlayer, otherPlayerId) => {
        if (playerId === otherPlayerId || otherPlayer.is_dead) return;

        // Check each bullet from otherPlayer
        if (otherPlayer.activeBullets) {
          otherPlayer.activeBullets = otherPlayer.activeBullets.filter(bullet => {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            const distanceSquared = dx * dx + dy * dy;
            const collisionDistanceSquared = Math.pow(this.playerSize + this.bulletHitboxSize, 2);

            // If bullet hits player's head (using squared distance to avoid sqrt)
            if (distanceSquared < collisionDistanceSquared) {
              player.is_dead = true;
              return false; // Remove the bullet
            }
            return true;
          });
        }
      });
    });

    return players;
  }

  checkPixel(x, y, currentX, currentY) {
    // Boundary check
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }

    // Self-collision prevention
    if (Math.abs(x - currentX) < 2 && Math.abs(y - currentY) < 2) {
      return false;
    }

    // Round coordinates once
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);

    // Get pixel data from cache if available
    let pixel;
    if (this.imageDataCache) {
      const index = (roundedY * this.width + roundedX) * 4;
      pixel = [
        this.imageDataCache.data[index],
        this.imageDataCache.data[index + 1],
        this.imageDataCache.data[index + 2],
        this.imageDataCache.data[index + 3]
      ];
    } else {
      // Fallback to slower getImageData if cache isn't available
      pixel = this.ctx.getImageData(roundedX, roundedY, 1, 1).data;
    }

    // Ignore white pixels (255, 255, 255) and yellow powerup pixels (255, 255, 0)
    if (pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 255) {
      return false;  // white pixel - no collision
    }
    if (pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 0) {
      return false;  // yellow pixel (powerup) - no collision
    }

    // Any other color means collision
    return true;
  }

  checkCollision(player) {
    // Update image data cache periodically
    this.updateImageDataCache();

    // Skip collision detection sometimes for performance
    if (Math.random() < 0.2) {
      return { isAboutToHit: player.is_about_to_hit || false };
    }

    // Look ahead for potential collisions
    for (const angleOffset of this.lookAheadAngles) {
      const checkAngle = player.angle + angleOffset;
      const aheadX = player.x + Math.cos(checkAngle) * this.lookAheadDistance;
      const aheadY = player.y + Math.sin(checkAngle) * this.lookAheadDistance;

      if (this.checkPixel(aheadX, aheadY, player.x, player.y)) {
        return { isAboutToHit: true };
      }
    }

    return { isAboutToHit: false };
  }
}
