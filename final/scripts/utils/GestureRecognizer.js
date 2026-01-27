/**
 * GestureRecognizer - Detects hand gestures from MediaPipe landmarks
 * Supports: open hand, fist, pointing
 */
export class GestureRecognizer {
  // MediaPipe hand landmarks indices
  static LANDMARKS = {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_MCP: 5,
    INDEX_PIP: 6,
    INDEX_DIP: 7,
    INDEX_TIP: 8,
    MIDDLE_MCP: 9,
    MIDDLE_PIP: 10,
    MIDDLE_DIP: 11,
    MIDDLE_TIP: 12,
    RING_MCP: 13,
    RING_PIP: 14,
    RING_DIP: 15,
    RING_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20,
  };

  /**
   * Calculate 3D distance between two landmarks
   * @param {Object} landmark1 - MediaPipe landmark {x, y, z}
   * @param {Object} landmark2 - MediaPipe landmark {x, y, z}
   * @returns {number} Distance
   */
  static #_distance(landmark1, landmark2) {
    const dx = landmark1.x - landmark2.x;
    const dy = landmark1.y - landmark2.y;
    const dz = landmark1.z - landmark2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Check if a finger is extended (not curled)
   * @param {Array} hand - Array of hand landmarks
   * @param {number} tipIndex - Tip landmark index
   * @param {number} pipIndex - PIP joint index
   * @param {number} mcpIndex - MCP joint index
   * @returns {boolean} True if finger is extended
   */
  static #_isFingerExtended(hand, tipIndex, pipIndex, mcpIndex) {
    const tip = hand[tipIndex];
    const pip = hand[pipIndex];
    const mcp = hand[mcpIndex];
    
    // Finger is extended if tip is further from wrist than PIP joint
    return tip.y < pip.y && tip.y < mcp.y;
  }

  /**
   * Detect if hand is in a fist gesture
   * @param {Array} hand - Array of hand landmarks from MediaPipe
   * @returns {boolean} True if fist is detected
   */
  static IsFist(hand) {
    if (!hand || hand.length < 21) return false;

    const wrist = hand[this.LANDMARKS.WRIST];
    
    // Check if all fingers are curled (tips are close to palm)
    const fingers = [
      { tip: this.LANDMARKS.INDEX_TIP, pip: this.LANDMARKS.INDEX_PIP, mcp: this.LANDMARKS.INDEX_MCP },
      { tip: this.LANDMARKS.MIDDLE_TIP, pip: this.LANDMARKS.MIDDLE_PIP, mcp: this.LANDMARKS.MIDDLE_MCP },
      { tip: this.LANDMARKS.RING_TIP, pip: this.LANDMARKS.RING_PIP, mcp: this.LANDMARKS.RING_MCP },
      { tip: this.LANDMARKS.PINKY_TIP, pip: this.LANDMARKS.PINKY_PIP, mcp: this.LANDMARKS.PINKY_MCP },
    ];

    // Count how many fingers are curled
    let curledCount = 0;
    for (const finger of fingers) {
      const tip = hand[finger.tip];
      const pip = hand[finger.pip];
      const mcp = hand[finger.mcp];
      
      // Check if finger tip is close to MCP (curled)
      const distanceToMCP = this.#_distance(tip, mcp);
      const isCurled = tip.y > pip.y || distanceToMCP < 0.08;
      
      if (isCurled) {
        curledCount++;
      }
    }

    // Fist: at least 3 fingers curled (thumb can be extended or not)
    return curledCount >= 3;
  }

  /**
   * Detect if hand is open (all fingers extended)
   * @param {Array} hand - Array of hand landmarks from MediaPipe
   * @returns {boolean} True if hand is open
   */
  static IsOpenHand(hand) {
    if (!hand || hand.length < 21) return false;

    const fingers = [
      { tip: this.LANDMARKS.INDEX_TIP, pip: this.LANDMARKS.INDEX_PIP, mcp: this.LANDMARKS.INDEX_MCP },
      { tip: this.LANDMARKS.MIDDLE_TIP, pip: this.LANDMARKS.MIDDLE_PIP, mcp: this.LANDMARKS.MIDDLE_MCP },
      { tip: this.LANDMARKS.RING_TIP, pip: this.LANDMARKS.RING_PIP, mcp: this.LANDMARKS.RING_MCP },
      { tip: this.LANDMARKS.PINKY_TIP, pip: this.LANDMARKS.PINKY_PIP, mcp: this.LANDMARKS.PINKY_PIP },
    ];

    // Check if all fingers are extended
    let extendedCount = 0;
    for (const finger of fingers) {
      if (this.#_isFingerExtended(hand, finger.tip, finger.pip, finger.mcp)) {
        extendedCount++;
      }
    }

    // Open hand: at least 3 fingers extended
    return extendedCount >= 3;
  }

  /**
   * Detect if index finger is pointing (only index extended)
   * @param {Array} hand - Array of hand landmarks from MediaPipe
   * @returns {boolean} True if pointing
   */
  static IsPointing(hand) {
    if (!hand || hand.length < 21) return false;

    const indexExtended = this.#_isFingerExtended(
      hand,
      this.LANDMARKS.INDEX_TIP,
      this.LANDMARKS.INDEX_PIP,
      this.LANDMARKS.INDEX_MCP
    );

    const middleCurled = !this.#_isFingerExtended(
      hand,
      this.LANDMARKS.MIDDLE_TIP,
      this.LANDMARKS.MIDDLE_PIP,
      this.LANDMARKS.MIDDLE_MCP
    );

    const ringCurled = !this.#_isFingerExtended(
      hand,
      this.LANDMARKS.RING_TIP,
      this.LANDMARKS.RING_PIP,
      this.LANDMARKS.RING_MCP
    );

    // Pointing: index extended, others curled
    return indexExtended && middleCurled && ringCurled;
  }
}
