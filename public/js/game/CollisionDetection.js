export class CollisionDetection {
  constructor(ctx) {
    this.ctx = ctx;
    // Set willReadFrequently to true for better performance
    this.ctx = this.ctx.canvas.getContext('2d', { willReadFrequently: true });

    // Cache canvas dimensions
    this.width = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;

    // Pre-calculate common angles for collision detection
    this.lookAheadAngles = [-0.2, -0.1, 0, 0.1, 0.2];
    this.lookAheadDistance = 3;
    this.playerSize = 2; // Player head radius
    this.bulletHitboxSize = 6;
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
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If bullet hits player's head
            if (distance < this.playerSize + this.bulletHitboxSize) {
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

    // Get pixel data
    const pixel = this.ctx.getImageData(roundedX, roundedY, 1, 1).data;

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
