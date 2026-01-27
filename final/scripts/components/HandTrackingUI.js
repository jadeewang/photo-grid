import { HandTrackingManager } from "../managers/HandTrackingManager";

/**
 * HandTrackingUI - Manages UI elements for hand tracking control
 * Includes toggle button, video preview, and status indicators
 */
export class HandTrackingUI {
  #_container = null;
  #_toggleButton = null;
  #_videoElement = null;
  #_statusIndicator = null;
  #_previewContainer = null;
  #_isEnabled = false;
  #_showPreview = true;

  constructor() {
    this.#_loadPreferences();
    this.#_createUI();
    this.#_setupEventListeners();
  }

  #_loadPreferences() {
    try {
      const saved = localStorage.getItem("handTrackingEnabled");
      if (saved !== null) {
        this.#_isEnabled = saved === "true";
      }
      
      const previewSaved = localStorage.getItem("handTrackingShowPreview");
      if (previewSaved !== null) {
        this.#_showPreview = previewSaved === "true";
      }
    } catch (error) {
      console.warn("Could not load hand tracking preferences:", error);
    }
  }

  #_savePreferences() {
    try {
      localStorage.setItem("handTrackingEnabled", this.#_isEnabled.toString());
      localStorage.setItem("handTrackingShowPreview", this.#_showPreview.toString());
    } catch (error) {
      console.warn("Could not save hand tracking preferences:", error);
    }
  }

  #_createUI() {
    // Create main container
    this.#_container = document.createElement("div");
    this.#_container.className = "hand-tracking-ui";
    this.#_container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
    `;

    // Create toggle button
    this.#_toggleButton = document.createElement("button");
    this.#_toggleButton.className = "hand-tracking-toggle";
    this.#_toggleButton.textContent = "Enable Hand Tracking";
    this.#_toggleButton.style.cssText = `
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      cursor: pointer;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      transition: all 0.3s ease;
    `;

    // Create status indicator
    this.#_statusIndicator = document.createElement("div");
    this.#_statusIndicator.className = "hand-tracking-status";
    this.#_statusIndicator.textContent = "Hand tracking off";
    this.#_statusIndicator.style.cssText = `
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border-radius: 6px;
      font-family: ui-monospace, monospace;
      font-size: 11px;
      min-width: 150px;
      text-align: center;
    `;

    // Create video preview container
    this.#_previewContainer = document.createElement("div");
    this.#_previewContainer.className = "hand-tracking-preview";
    this.#_previewContainer.style.cssText = `
      position: relative;
      width: 200px;
      height: 150px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.3);
      display: ${this.#_showPreview ? "block" : "none"};
    `;

    // Create video element
    this.#_videoElement = document.createElement("video");
    this.#_videoElement.autoplay = true;
    this.#_videoElement.playsInline = true;
    this.#_videoElement.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1); /* Mirror for natural interaction */
    `;

    this.#_previewContainer.appendChild(this.#_videoElement);
    this.#_container.appendChild(this.#_toggleButton);
    this.#_container.appendChild(this.#_statusIndicator);
    this.#_container.appendChild(this.#_previewContainer);
    document.body.appendChild(this.#_container);

    // Update initial state
    this.#_updateUI();
  }

  #_setupEventListeners() {
    this.#_toggleButton.addEventListener("click", () => {
      this.toggle();
    });

    // Listen for hand detection changes
    HandTrackingManager.OnFingerMove((position, isDetected) => {
      this.#_updateStatus(isDetected);
    });
  }

  #_updateStatus(isHandDetected) {
    if (!this.#_isEnabled) return;

    if (isHandDetected) {
      this.#_statusIndicator.textContent = "Hand detected ✓";
      this.#_statusIndicator.style.background = "rgba(0, 255, 0, 0.3)";
    } else {
      this.#_statusIndicator.textContent = "No hand detected";
      this.#_statusIndicator.style.background = "rgba(255, 0, 0, 0.3)";
    }
  }

  #_updateUI() {
    if (this.#_isEnabled) {
      this.#_toggleButton.textContent = "Disable Hand Tracking";
      this.#_toggleButton.style.background = "rgba(255, 0, 0, 0.7)";
      this.#_statusIndicator.textContent = "Initializing...";
      this.#_statusIndicator.style.background = "rgba(255, 255, 0, 0.3)";
    } else {
      this.#_toggleButton.textContent = "Enable Hand Tracking";
      this.#_toggleButton.style.background = "rgba(0, 0, 0, 0.7)";
      this.#_statusIndicator.textContent = "Hand tracking off";
      this.#_statusIndicator.style.background = "rgba(0, 0, 0, 0.5)";
    }
  }

  /**
   * Toggle hand tracking on/off
   */
  async toggle() {
    if (this.#_isEnabled) {
      await this.disable();
    } else {
      await this.enable();
    }
  }

  /**
   * Enable hand tracking
   */
  async enable() {
    try {
      // Initialize if not already done
      if (!HandTrackingManager.IsActive()) {
        await HandTrackingManager.Init(this.#_videoElement);
      }

      await HandTrackingManager.Start();
      this.#_isEnabled = true;
      this.#_savePreferences();
      this.#_updateUI();
    } catch (error) {
      console.error("Failed to enable hand tracking:", error);
      this.#_statusIndicator.textContent = `Error: ${error.message}`;
      this.#_statusIndicator.style.background = "rgba(255, 0, 0, 0.5)";
      this.#_isEnabled = false;
    }
  }

  /**
   * Disable hand tracking
   */
  async disable() {
    HandTrackingManager.Stop();
    this.#_isEnabled = false;
    this.#_savePreferences();
    this.#_updateUI();
  }

  /**
   * Get the video element for MediaPipe
   * @returns {HTMLVideoElement}
   */
  getVideoElement() {
    return this.#_videoElement;
  }

  /**
   * Get the video preview container element
   * @returns {HTMLElement}
   */
  getPreviewContainer() {
    return this.#_previewContainer;
  }

  /**
   * Toggle video preview visibility
   */
  togglePreview() {
    this.#_showPreview = !this.#_showPreview;
    this.#_previewContainer.style.display = this.#_showPreview ? "block" : "none";
    this.#_savePreferences();
  }

  /**
   * Check if hand tracking is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.#_isEnabled;
  }

  /**
   * Clean up UI elements
   */
  destroy() {
    if (this.#_container && this.#_container.parentNode) {
      this.#_container.parentNode.removeChild(this.#_container);
    }
  }
}
