/**
 * gesturerecognizer - detects hand gestures from mediapipe landmarks
 * supports: open hand, fist, pointing
 */
export class GestureRecognizer {
  // mediapipe hand landmarks indices
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
   * calculate 3d distance between two landmarks
   * @param {Object} landmark1 - mediapipe landmark {x, y, z}
   * @param {Object} landmark2 - mediapipe landmark {x, y, z}
   * @returns {number} distance
   */
  static #_distance(landmark1, landmark2) {
    const dx = landmark1.x - landmark2.x;
    const dy = landmark1.y - landmark2.y;
    const dz = landmark1.z - landmark2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * check if a finger is extended (not curled)
   * @param {Array} hand - array of hand landmarks
   * @param {number} tipIndex - tip landmark index
   * @param {number} pipIndex - pip joint index
   * @param {number} mcpIndex - mcp joint index
   * @returns {boolean} true if finger is extended
   */
  static #_isFingerExtended(hand, tipIndex, pipIndex, mcpIndex) {
    const tip = hand[tipIndex];
    const pip = hand[pipIndex];
    const mcp = hand[mcpIndex];
    
    // finger is extended if tip is further from wrist than pip joint??
    return tip.y < pip.y && tip.y < mcp.y;
  }

  /**
   * detect if hand is in a fist gesture
   * @param {Array} hand - array of hand landmarks from mediapipe
   * @returns {boolean} true if fist is detected
   */
  static IsFist(hand) {
    if (!hand || hand.length < 21) return false;

    const wrist = hand[this.LANDMARKS.WRIST];
    
    // check if all fingers are curled (tips are close to palm)
    const fingers = [
      { tip: this.LANDMARKS.INDEX_TIP, pip: this.LANDMARKS.INDEX_PIP, mcp: this.LANDMARKS.INDEX_MCP },
      { tip: this.LANDMARKS.MIDDLE_TIP, pip: this.LANDMARKS.MIDDLE_PIP, mcp: this.LANDMARKS.MIDDLE_MCP },
      { tip: this.LANDMARKS.RING_TIP, pip: this.LANDMARKS.RING_PIP, mcp: this.LANDMARKS.RING_MCP },
      { tip: this.LANDMARKS.PINKY_TIP, pip: this.LANDMARKS.PINKY_PIP, mcp: this.LANDMARKS.PINKY_MCP },
    ];

    // count how many fingers are curled!
    let curledCount = 0;
    for (const finger of fingers) {
      const tip = hand[finger.tip];
      const pip = hand[finger.pip];
      const mcp = hand[finger.mcp];
      
      // check if finger tip is close to mcp (curled)
      const distanceToMCP = this.#_distance(tip, mcp);
      const isCurled = tip.y > pip.y || distanceToMCP < 0.08;
      
      if (isCurled) {
        curledCount++;
      }
    }

    // fist: at least 3 fingers curled (thumb can be extended or not)!
    return curledCount >= 3;
  }

  /**
   * detect if hand is open (all fingers extended)
   * @param {Array} hand - array of hand landmarks from mediapipe
   * @returns {boolean} true if hand is open
   */
  static IsOpenHand(hand) {
    if (!hand || hand.length < 21) return false;

    const fingers = [
      { tip: this.LANDMARKS.INDEX_TIP, pip: this.LANDMARKS.INDEX_PIP, mcp: this.LANDMARKS.INDEX_MCP },
      { tip: this.LANDMARKS.MIDDLE_TIP, pip: this.LANDMARKS.MIDDLE_PIP, mcp: this.LANDMARKS.MIDDLE_MCP },
      { tip: this.LANDMARKS.RING_TIP, pip: this.LANDMARKS.RING_PIP, mcp: this.LANDMARKS.RING_MCP },
      { tip: this.LANDMARKS.PINKY_TIP, pip: this.LANDMARKS.PINKY_PIP, mcp: this.LANDMARKS.PINKY_PIP },
    ];

    // check if all fingers are extended
    let extendedCount = 0;
    for (const finger of fingers) {
      if (this.#_isFingerExtended(hand, finger.tip, finger.pip, finger.mcp)) {
        extendedCount++;
      }
    }

    // open hand: at least 3 fingers extended
    return extendedCount >= 3;
  }

  /**
   * detect if index finger is pointing (only index extended)
   * @param {Array} hand - array of hand landmarks from mediapipe
   * @returns {boolean} true if pointing
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

    // pointing: index extended, others curled
    return indexExtended && middleCurled && ringCurled;
  }

  /**
   * check if thumb and index finger are both extended (pinch gesture ready)
   * @param {Array} hand - array of hand landmarks from mediapipe
   * @returns {boolean} true if both thumb and index are extended
   */
  static IsPinchReady(hand) {
    if (!hand || hand.length < 21) return false;

    const thumbTip = hand[this.LANDMARKS.THUMB_TIP];
    const indexTip = hand[this.LANDMARKS.INDEX_TIP];
    
    // check if thumb tip is extended (thumb is special - check if it's away from palm)
    const thumbMCP = hand[this.LANDMARKS.THUMB_MCP];
    const thumbExtended = thumbTip.x > thumbMCP.x || Math.abs(thumbTip.y - thumbMCP.y) < 0.1;
    
    // check if index finger is extended
    const indexExtended = this.#_isFingerExtended(
      hand,
      this.LANDMARKS.INDEX_TIP,
      this.LANDMARKS.INDEX_PIP,
      this.LANDMARKS.INDEX_MCP
    );

    return thumbExtended && indexExtended;
  }

  /**
   * calculate distance between thumb tip and index finger tip
   * @param {Array} hand - array of hand landmarks from mediapipe
   * @returns {number|null} distance between tips, or null if invalid
   */
  static GetPinchDistance(hand) {
    if (!hand || hand.length < 21) return null;

    const thumbTip = hand[this.LANDMARKS.THUMB_TIP];
    const indexTip = hand[this.LANDMARKS.INDEX_TIP];

    return this.#_distance(thumbTip, indexTip);
  }

  /**
   * detect if hand is in a peace sign gesture (index and middle fingers extended, others curled)
   * @param {Array} hand - array of hand landmarks from mediapipe
   * @returns {boolean} true if peace sign is detected
   */
  static IsPeaceSign(hand) {
    if (!hand || hand.length < 21) return false;

    // check if index finger is extended
    const indexExtended = this.#_isFingerExtended(
      hand,
      this.LANDMARKS.INDEX_TIP,
      this.LANDMARKS.INDEX_PIP,
      this.LANDMARKS.INDEX_MCP
    );

    // check if middle finger is extended
    const middleExtended = this.#_isFingerExtended(
      hand,
      this.LANDMARKS.MIDDLE_TIP,
      this.LANDMARKS.MIDDLE_PIP,
      this.LANDMARKS.MIDDLE_MCP
    );

    // check if ring finger is curled
    const ringCurled = !this.#_isFingerExtended(
      hand,
      this.LANDMARKS.RING_TIP,
      this.LANDMARKS.RING_PIP,
      this.LANDMARKS.RING_MCP
    );

    // check if pinky finger is curled
    const pinkyCurled = !this.#_isFingerExtended(
      hand,
      this.LANDMARKS.PINKY_TIP,
      this.LANDMARKS.PINKY_PIP,
      this.LANDMARKS.PINKY_MCP
    );

    // peace sign: index and middle extended, ring and pinky curled
    return indexExtended && middleExtended && ringCurled && pinkyCurled;
  }
}
