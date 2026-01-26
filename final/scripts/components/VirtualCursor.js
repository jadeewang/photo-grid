/**
 * VirtualCursor - Visual feedback element that follows finger position
 * Provides visual indication of where the hand tracking is pointing
 */
export class VirtualCursor {
  #_element = null;
  #_isVisible = false;

  constructor() {
    this.#_createElement();
  }

  #_createElement() {
    this.#_element = document.createElement("div");
    this.#_element.className = "virtual-cursor";
    this.#_element.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%);
      transition: opacity 0.2s ease;
      opacity: 0;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    `;
    document.body.appendChild(this.#_element);
  }

  /**
   * Update cursor position
   * @param {number} x - X position in screen coordinates
   * @param {number} y - Y position in screen coordinates
   */
  update(x, y) {
    if (!this.#_element) return;

    this.#_element.style.left = `${x}px`;
    this.#_element.style.top = `${y}px`;
    
    if (!this.#_isVisible) {
      this.show();
    }
  }

  /**
   * Show the cursor
   */
  show() {
    if (this.#_element) {
      this.#_element.style.opacity = "1";
      this.#_isVisible = true;
    }
  }

  /**
   * Hide the cursor
   */
  hide() {
    if (this.#_element) {
      this.#_element.style.opacity = "0";
      this.#_isVisible = false;
    }
  }

  /**
   * Remove the cursor element
   */
  destroy() {
    if (this.#_element && this.#_element.parentNode) {
      this.#_element.parentNode.removeChild(this.#_element);
      this.#_element = null;
    }
  }
}
