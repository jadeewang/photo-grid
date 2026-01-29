/**
 * utility class for converting mediapipe normalized coordinates
 * to screen space and Three.js ndc
 */
export class CoordinateTransformer {
  /**
   * convert mediapipe normalized coordinates (0-1) to screen space pixels
   * @param {number} normalizedX - x coordinate from mediapipe (0-1)
   * @param {number} normalizedY - y coordinate from mediapipe (0-1)
   * @returns {{x: number, y: number}} screen coordinates in pixels
   */
  static NormalizedToScreen(normalizedX, normalizedY) {
    // mirror x-axis for natural interaction (as if looking in a mirror)
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
   * convert mediapipe normalized coordinates directly to Three.js ndc
   * @param {number} normalizedX - x coordinate from mediapipe (0-1)
   * @param {number} normalizedY - y coordinate from mediapipe (0-1)
   * @returns {{x: number, y: number}} ndc coordinates (-1 to 1)
   */
  static NormalizedToNDC(normalizedX, normalizedY) {
    const screen = this.NormalizedToScreen(normalizedX, normalizedY);
    return this.ScreenToNDC(screen.x, screen.y);
  }
}
