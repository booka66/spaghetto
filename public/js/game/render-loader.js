import { Renderer, CollisionDetection, EnhancedGameState } from './game-renderer.js';

// Make the enhanced renderer available globally
window.Renderer = Renderer;
window.CollisionDetection = CollisionDetection;
window.EnhancedGameState = EnhancedGameState;

// Helper function to convert coordinates from game space to screen space
window.gameToScreenCoords = function (x, y, width, height) {
  return {
    x: width / 2 + x,
    y: height / 2 - y
  };
};

// Helper function to convert coordinates from screen space to game space
window.screenToGameCoords = function (x, y, width, height) {
  return {
    x: x - width / 2,
    y: height / 2 - y
  };
};

// Add helper to detect if device supports hardware acceleration
window.detectHardwareAcceleration = function () {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl');

  if (!gl) {
    // WebGL not supported, suggest low performance mode
    return false;
  }

  // Check for some basic WebGL capabilities
  const extensionCount = gl.getSupportedExtensions().length;
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

  // Reasonable minimums for hardware acceleration
  return extensionCount > 5 && maxTextureSize >= 2048;
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Enhanced renderer loaded');

  // Detect hardware capabilities
  const hasHardwareAcceleration = window.detectHardwareAcceleration();

  // Set performance mode recommendation
  if (!hasHardwareAcceleration && !localStorage.getItem('lowPerf')) {
    localStorage.setItem('lowPerf', 'true');
    console.log('Low performance mode recommended based on hardware detection');
  }
});
