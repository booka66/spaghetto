// Enhanced game renderer for Spaghetto

// -------- Main Rendering Engine --------
class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = width;
    this.trailCanvas.height = height;
    this.trailCtx = this.trailCanvas.getContext('2d', { willReadFrequently: true });

    // Initialize virtual pixels for collision detection
    this.virtualPixels = ctx.createImageData(width, height);

    // Initialize trail canvas with white background
    this.trailCtx.fillStyle = 'white';
    this.trailCtx.fillRect(0, 0, width, height);

    // Optimization variables
    this.lastUpdate = 0;
    this.performanceMode = false;
    this.lowPerfCoeff = 0.6;

    console.log("Enhanced renderer initialized: " + width + "x" + height);
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

  drawPlayer(player, color, isCurrentPlayer = false) {
    // Calculate position in screen coordinates
    const x = player.x;
    const y = player.y;

    // Draw on both canvases
    this.drawPlayerOnCanvas(this.ctx, x, y, color);

    // Only update collision map for non-ghost players
    if (!player.is_ghost) {
      this.drawPlayerOnCanvas(this.trailCtx, x, y, color);

      // Update virtual pixels for collision detection
      const pixelX = Math.round(x);
      const pixelY = Math.round(y);
      this.drawCircleAccurate(
        this.virtualPixels.data,
        pixelX,
        pixelY,
        4, // Player head radius for collision
        255
      );
    }

    // If this is the current player, check collision
    if (isCurrentPlayer && this.checkCollision(x, y, 4)) {
      return true; // Collision detected
    }

    return false;
  }

  drawPlayerTrail(startX, startY, endX, endY, color, thickness = 9, isGhost = false) {
    // Draw the trail on the main canvas
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = thickness;
    this.ctx.lineCap = 'round';

    if (isGhost) {
      this.ctx.globalAlpha = 0.3;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    if (isGhost) {
      this.ctx.globalAlpha = 1.0;
    } else {
      // Update collision data
      this.drawLineThickness(
        this.virtualPixels.data,
        Math.round(startX),
        Math.round(startY),
        Math.round(endX),
        Math.round(endY),
        thickness,
        255
      );
    }
  }

  drawPlayerOnCanvas(context, x, y, color) {
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, 2, 0, Math.PI * 2);
    context.fill();
  }

  drawBullet(bullet) {
    // Calculate the bullet position
    const bulletLength = 12;
    const bulletWidth = 13;
    const trailWidth = 13;
    const bulletOffset = 15; // Add offset to prevent trail erasure

    // Calculate offset position for the bullet
    const offsetX = bullet.x + Math.cos(bullet.angle) * bulletOffset;
    const offsetY = bullet.y + Math.sin(bullet.angle) * bulletOffset;

    // Draw white trail on trail canvas to "erase" previous trails
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

    // Update virtual pixels for bullet collision
    this.drawLineThickness(
      this.virtualPixels.data,
      Math.round(trailStartX),
      Math.round(trailStartY),
      Math.round(offsetX),
      Math.round(offsetY),
      trailWidth,
      0 // Clear the trail
    );
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

    // Reset virtual pixels
    for (let i = 0; i < this.virtualPixels.data.length; i += 4) {
      this.virtualPixels.data[i] = 255;     // R
      this.virtualPixels.data[i + 1] = 255; // G
      this.virtualPixels.data[i + 2] = 255; // B
      this.virtualPixels.data[i + 3] = 0;   // A
    }
  }

  // Collision detection utilities
  checkCollision(x, y, radius) {
    // Border collision
    if (x - radius < 0 || x + radius >= this.width ||
      y - radius < 0 || y + radius >= this.height) {
      return true;
    }

    // Check collision against virtual pixels
    const pixelX = Math.round(x);
    const pixelY = Math.round(y);

    // Look ahead for collisions in a few pixels in front of the player
    const lookAheadAngles = [-0.2, 0, 0.2]; // Check in front and slightly to sides
    const lookAheadDistance = 3;

    for (const angleOffset of lookAheadAngles) {
      const checkAngle = angleOffset; // Add to player's angle
      const aheadX = pixelX + Math.round(Math.cos(checkAngle) * lookAheadDistance);
      const aheadY = pixelY + Math.round(Math.sin(checkAngle) * lookAheadDistance);

      if (this.getPixel(aheadX, aheadY) > 200) {
        return true;
      }
    }

    return false;
  }

  getPixel(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return 999; // Out of bounds
    }

    const index = (y * this.width + x) * 4 + 3; // Alpha channel
    return this.virtualPixels.data[index];
  }

  putPixel(x, y, r, g, b, a) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;

    const index = (y * this.width + x) * 4;
    this.virtualPixels.data[index] = r;
    this.virtualPixels.data[index + 1] = g;
    this.virtualPixels.data[index + 2] = b;
    this.virtualPixels.data[index + 3] = a;
  }

  // Efficient line drawing for collision detection
  drawLine(imgData, x0, y0, x1, y1, alpha) {
    if (x0 === x1 && y0 === y1) return;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
      const index = (y0 * this.width + x0) * 4 + 3;
      if (index >= 0 && index < imgData.length) {
        imgData[index] = alpha;
      }

      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  drawLineThickness(imgData, x0, y0, x1, y1, thickness, alpha) {
    if (x0 === x1 && y0 === y1) return;

    // Calculate the half-thickness
    const t2 = Math.max(0.5, (thickness - 1) / 2);

    // Calculate the normalized direction vector
    let dx = x1 - x0;
    let dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;

    // Calculate perpendicular vector
    const px = -dy;
    const py = dx;

    // Draw multiple lines to create thickness
    for (let offset = -t2; offset <= t2; offset++) {
      const ox0 = Math.round(x0 + px * offset);
      const oy0 = Math.round(y0 + py * offset);
      const ox1 = Math.round(x1 + px * offset);
      const oy1 = Math.round(y1 + py * offset);

      this.drawLine(imgData, ox0, oy0, ox1, oy1, alpha);
    }
  }

  drawCircle(imgData, x0, y0, radius, alpha) {
    const diameter = radius * 2;
    const startX = Math.max(0, x0 - radius);
    const startY = Math.max(0, y0 - radius);
    const endX = Math.min(this.width, x0 + radius + 1);
    const endY = Math.min(this.height, y0 + radius + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const dx = x - x0;
        const dy = y - y0;
        if (dx * dx + dy * dy <= radius * radius) {
          const index = (y * this.width + x) * 4 + 3;
          if (index >= 0 && index < imgData.length) {
            imgData[index] = alpha;
          }
        }
      }
    }
  }

  drawCircleAccurate(imgData, x, y, radius, alpha) {
    const r2 = radius * radius;
    const x0 = Math.max(0, Math.ceil(x - radius));
    const x1 = Math.min(this.width, Math.ceil(x + radius));
    const y0 = Math.max(0, Math.ceil(y - radius));
    const y1 = Math.min(this.height, Math.ceil(y + radius));

    for (let cy = y0; cy < y1; cy++) {
      for (let cx = x0; cx < x1; cx++) {
        if (Math.pow(cx - x, 2) + Math.pow(cy - y, 2) <= r2) {
          const index = (cy * this.width + cx) * 4 + 3;
          if (index >= 0 && index < imgData.length) {
            imgData[index] = alpha;
          }
        }
      }
    }
  }
}

// -------- Collision Detection System --------
class CollisionDetection {
  constructor(ctx) {
    // Set willReadFrequently to true for better performance with frequent pixel reads
    this.ctx = ctx;
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;

    // Optimized collision parameters
    this.lookAheadAngles = [-0.2, 0, 0.2]; // Reduced from 5 to 3 angles for performance
    this.lookAheadDistance = 3;
    this.playerSize = 2; // Player head radius
    this.bulletHitboxSize = 6;

    // Cache for pixel data
    this.imageDataCache = null;
    this.lastImageDataUpdate = 0;
    this.imageDataUpdateInterval = 50; // Update every 50ms for performance
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

    // Round coordinates once for performance
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

    // Skip collision detection sometimes for performance optimization
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

// Enhanced GameState class that integrates the new renderer
class EnhancedGameState {
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
    this.gameOver = false;
    this.debugMode = false;

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
    console.log("Enhanced GameState initialized");
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

    // Draw the trails first (persistent lines)
    this.renderer.renderTrails();

    // Update power-ups from server state
    this.powerUps = gameState.powerUps || [];

    // Draw power-ups
    this.powerUps.forEach(powerUp => {
      this.renderer.drawPowerUp(powerUp);
    });

    // Update and draw players
    const players = new Map(gameState.players);

    // Before drawing, check for bullet collisions
    this.collisionDetection.checkBulletCollisions(players);

    players.forEach((player, id) => {
      let color = '#0000ff'; // Default blue for other players
      const isCurrentPlayer = id === this.socket.getId();

      if (isCurrentPlayer) {
        const collision = this.collisionDetection.checkCollision(player);
        this.socket.emitPixelState(collision.isAboutToHit);
        color = collision.isAboutToHit ? '#ffff00' : '#ff0000';
      } else {
        color = player.is_about_to_hit ? '#ffff00' : '#0000ff';
      }

      // Skip dead players
      if (player.is_dead) return;

      // Draw player
      if (player.hasBeenInitialized) {
        // Calculate screen coordinates for player trail
        const prevX = player.prevX || player.x;
        const prevY = player.prevY || player.y;

        // Draw trail between previous and current position
        this.renderer.drawPlayerTrail(
          prevX, prevY, player.x, player.y,
          color, 9, player.is_ghost
        );
      }

      // Draw player head (current position)
      this.renderer.drawPlayer(player, color, isCurrentPlayer);

      // Store current position as previous for next frame
      player.prevX = player.x;
      player.prevY = player.y;

      // Draw bullets
      if (player.activeBullets) {
        player.activeBullets.forEach(bullet => {
          this.renderer.drawBullet(bullet);
        });
      }
    });

    this.lastUpdate = currentTime;
  }

  clearBulletPaths() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // Clear bullet trails (black pixels)
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

// Export the enhanced classes
export { Renderer, CollisionDetection, EnhancedGameState };
