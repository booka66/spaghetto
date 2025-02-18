export class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = width;
    this.trailCanvas.height = height;
    this.trailCtx = this.trailCanvas.getContext('2d');

    // Initialize trail canvas with white background
    this.trailCtx.fillStyle = 'white';
    this.trailCtx.fillRect(0, 0, width, height);
  }

  clear() {
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  clearMainCanvas() {
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
    // Draw on both canvases
    this.drawPlayerOnCanvas(this.ctx, player, color);
    this.drawPlayerOnCanvas(this.trailCtx, player, color);
  }

  drawPlayerOnCanvas(context, player, color) {
    context.beginPath();
    context.fillStyle = color;
    context.arc(player.x, player.y, 2, 0, Math.PI * 2);
    context.fill();
  }

  drawBullet(bullet) {
    // Constants for bullet dimensions
    const bulletLength = 12;
    const bulletWidth = 13;
    const trailWidth = 13;
    const bulletOffset = 15; // Add offset to prevent trail erasure

    // Calculate offset position for the bullet
    const offsetX = bullet.x + Math.cos(bullet.angle) * bulletOffset;
    const offsetY = bullet.y + Math.sin(bullet.angle) * bulletOffset;

    // Draw white trail on trail canvas
    this.trailCtx.beginPath();
    this.trailCtx.strokeStyle = 'white';
    this.trailCtx.lineWidth = trailWidth;
    const trailLength = 15;
    const trailStartX = offsetX - Math.cos(bullet.angle) * trailLength;
    const trailStartY = offsetY - Math.sin(bullet.angle) * trailLength;
    this.trailCtx.moveTo(trailStartX, trailStartY);
    this.trailCtx.lineTo(offsetX, offsetY);
    this.trailCtx.stroke();

    // Save the context state
    this.ctx.save();

    // Translate to offset bullet position and rotate
    this.ctx.translate(offsetX, offsetY);
    this.ctx.rotate(bullet.angle);

    // Draw the rectangular body
    this.ctx.beginPath();
    this.ctx.fillStyle = 'black';
    this.ctx.rect(-bulletLength, -bulletWidth / 2, bulletLength, bulletWidth);
    this.ctx.fill();

    // Draw the semicircular tip
    this.ctx.beginPath();
    this.ctx.arc(0, 0, bulletWidth / 2, -Math.PI / 2, Math.PI / 2, false);
    this.ctx.fill();

    // Restore the context state
    this.ctx.restore();
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

  renderTrails() {
    this.ctx.drawImage(this.trailCanvas, 0, 0);
  }

  resetTrails() {
    this.trailCtx.fillStyle = 'white';
    this.trailCtx.fillRect(0, 0, this.width, this.height);
  }
}
