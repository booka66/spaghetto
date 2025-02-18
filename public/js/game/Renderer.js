export class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  clear() {
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawBackground() {
    this.ctx.font = '48px Arial';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SPAGHETTO', this.width / 2, this.height / 2);
  }

  drawPlayer(player, color) {
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(player.x, player.y, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawBullet(bullet) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2.5;
    this.ctx.moveTo(bullet.x, bullet.y);
    const endX = bullet.x + Math.cos(bullet.angle) * 10;
    const endY = bullet.y + Math.sin(bullet.angle) * 10;
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  }

  drawPowerUp(powerUp) {
    this.ctx.beginPath();
    this.ctx.fillStyle = '#ffff00';
    this.ctx.arc(powerUp.x, powerUp.y, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // Add a glowing effect
    this.ctx.beginPath();
    this.ctx.arc(powerUp.x, powerUp.y, 7, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
}
