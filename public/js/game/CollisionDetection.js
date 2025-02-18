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

    // Check if pixel is not white (255, 255, 255)
    return pixel[0] !== 255 || pixel[1] !== 255 || pixel[2] !== 255;
  }

  checkCollision(player) {
    // Check current position
    const isOver = this.checkPixel(player.x, player.y, player.x, player.y);

    // Early return if already colliding
    if (isOver) {
      return { isAboutToHit: false, isOver: true };
    }

    // Look ahead for potential collisions
    for (const angleOffset of this.lookAheadAngles) {
      const checkAngle = player.angle + angleOffset;
      const aheadX = player.x + Math.cos(checkAngle) * this.lookAheadDistance;
      const aheadY = player.y + Math.sin(checkAngle) * this.lookAheadDistance;

      if (this.checkPixel(aheadX, aheadY, player.x, player.y)) {
        return { isAboutToHit: true, isOver: false };
      }
    }

    return { isAboutToHit: false, isOver: false };
  }
}
