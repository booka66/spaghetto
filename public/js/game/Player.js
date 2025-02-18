export class Player {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.turning = 0;
    this.isAboutToHit = false;
    this.isDead = false;  // Add death state
    this.turnRate = 0.1;
    this.movementSpeed = 1.5;
    this.respawnTimer = 0;
    this.bullets = 0;
    this.activeBullets = [];
    this.bulletSpeed = 5;
  }

  update(deltaTime) {
    if (this.isAboutToHit) {
      this.isDead = true;
      this.respawnTimer = 3000; // 3 second respawn time
      this.bullets = 0;
      this.activeBullets = [];
      this.turning = 0;
      return;
    }

    if (this.isDead) {
      this.respawnTimer -= deltaTime;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    // Update angle based on turning direction
    this.angle += this.turning * this.turnRate;

    // Calculate new position
    const newX = this.x + Math.cos(this.angle) * this.movementSpeed;
    const newY = this.y + Math.sin(this.angle) * this.movementSpeed;

    // Wrap around screen edges
    this.x = ((newX % 1080) + 1080) % 1080;
    this.y = ((newY % 720) + 720) % 720;
  }

  respawn() {
    this.isDead = false;
    this.isAboutToHit = false;
    // Randomize position
    this.x = Math.random() * 1080;
    this.y = Math.random() * 720;
    this.angle = Math.random() * Math.PI * 2;
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

  updateBullets() {
    this.activeBullets = this.activeBullets.filter(bullet => {
      // Update bullet position
      bullet.x += Math.cos(bullet.angle) * this.bulletSpeed;
      bullet.y += Math.sin(bullet.angle) * this.bulletSpeed;

      // Check if bullet is within range
      const dx = bullet.x - this.x;
      const dy = bullet.y - this.y;
      return Math.sqrt(dx * dx + dy * dy);
    });
  }
}
