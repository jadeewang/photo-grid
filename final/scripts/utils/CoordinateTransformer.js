/**
 * Utility class for converting MediaPipe normalized coordinates
 * to screen space and Three.js NDC (Normalized Device Coordinates)
 */
export class CoordinateTransformer {
  /**
   * Convert MediaPipe normalized coordinates (0-1) to screen space pixels
   * @param {number} normalizedX - X coordinate from MediaPipe (0-1)
   * @param {number} normalizedY - Y coordinate from MediaPipe (0-1)
   * @returns {{x: number, y: number}} Screen coordinates in pixels
   */
  static NormalizedToScreen(normalizedX, normalizedY) {
    // Mirror X-axis for natural interaction (as if looking in a mirror)
    const screenX = (1 - normalizedX) * window.innerWidth;
    const screenY = normalizedY * window.innerHeight;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Convert screen space coordinates to Three.js NDC (-1 to 1)
   * @param {number} screenX - X coordinate in screen pixels
   * @param {number} screenY - Y coordinate in screen pixels
   * @returns {{x: number, y: number}} NDC coordinates (-1 to 1)
   */
  static ScreenToNDC(screenX, screenY) {
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1; // Flip Y axis
    
    return { x: ndcX, y: ndcY };
  }

  /**
   * Convert MediaPipe normalized coordinates directly to Three.js NDC
   * @param {number} normalizedX - X coordinate from MediaPipe (0-1)
   * @param {number} normalizedY - Y coordinate from MediaPipe (0-1)
   * @returns {{x: number, y: number}} NDC coordinates (-1 to 1)
   */
  static NormalizedToNDC(normalizedX, normalizedY) {
    const screen = this.NormalizedToScreen(normalizedX, normalizedY);
    return this.ScreenToNDC(screen.x, screen.y);
  }
}
