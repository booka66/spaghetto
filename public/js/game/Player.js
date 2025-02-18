export class Player {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.turning = 0;
    this.isAboutToHit = false;
    this.isOver = false;
    this.bullets = 0;
    this.activeBullets = [];
  }

  update(deltaTime) {
    const TURN_RATE = 0.1;
    const MOVEMENT_SPEED = 1.5;
    const BULLET_SPEED = 3;

    // Update angle based on turning direction
    this.angle += this.turning * TURN_RATE;

    // Calculate new position
    const newX = this.x + Math.cos(this.angle) * MOVEMENT_SPEED;
    const newY = this.y + Math.sin(this.angle) * MOVEMENT_SPEED;

    // Wrap around screen edges
    this.x = ((newX % 1080) + 1080) % 1080; // Canvas width
    this.y = ((newY % 720) + 720) % 720;    // Canvas height

    this.activeBullets = this.activeBullets.map(bullet => ({
      x: bullet.x + Math.cos(bullet.angle) * BULLET_SPEED,
      y: bullet.y + Math.sin(bullet.angle) * BULLET_SPEED,
      angle: bullet.angle
    }));
  }

  shoot() {
    if (this.bullets > 0) {
      this.bullets--;
      this.activeBullets.push({
        x: this.x,
        y: this.y,
        angle: this.angle
      });
      return true;
    }
    return false;
  }
}
