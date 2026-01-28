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
  #_virtualCursorPosition = { x: -1, y: -1 };
  #_opacityCheckInterval = null;

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
      } else {
        // Default to enabled if no preference is saved
        this.#_isEnabled = true;
      }
      
      const previewSaved = localStorage.getItem("handTrackingShowPreview");
      if (previewSaved !== null) {
        this.#_showPreview = previewSaved === "true";
      }
    } catch (error) {
      console.warn("Could not load hand tracking preferences:", error);
      // Default to enabled on error
      this.#_isEnabled = true;
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
    this.#_toggleButton.textContent = "turn on magic mode :)";
    this.#_toggleButton.style.cssText = `
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      cursor: pointer;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      transition: all 0.3s ease, opacity 0.3s ease;
      opacity: 1;
      min-width: 180px;
      text-align: center;
    `;

    // Create status indicator
    this.#_statusIndicator = document.createElement("div");
    this.#_statusIndicator.className = "hand-tracking-status";
    this.#_statusIndicator.textContent = "Hand tracking off";
    this.#_statusIndicator.style.cssText = `
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border-radius: 8px;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      min-width: 180px;
      text-align: center;
      transition: background-color 0.3s ease, opacity 0.3s ease;
      opacity: 1;
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
      opacity: 0.95;
      transition: opacity 0.3s ease, height 0.3s ease, margin 0.3s ease;
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
    
    // If initially disabled, collapse the video player
    if (!this.#_isEnabled) {
      this.#_collapseVideoPlayer();
    } else {
      // If initially enabled, start opacity tracking
      this.#_startOpacityTracking();
    }
  }

  #_setupEventListeners() {
    this.#_toggleButton.addEventListener("click", () => {
      this.toggle();
    });

    // Listen for hand detection changes
    HandTrackingManager.OnFingerMove((position, isDetected) => {
      this.#_updateStatus(isDetected);
      // Track virtual cursor position (tracked cursor from hand tracking)
      this.#_virtualCursorPosition = { x: position.x, y: position.y };
    });
  }

  #_updateStatus(isHandDetected) {
    if (!this.#_isEnabled) return;

    if (isHandDetected) {
      this.#_statusIndicator.textContent = "hand detected ✓";
      this.#_statusIndicator.style.background = "rgba(0, 255, 0, 0.3)";
    } else {
      this.#_statusIndicator.textContent = "no hand detected";
      this.#_statusIndicator.style.background = "rgba(255, 0, 0, 0.3)";
    }
  }

  #_updateUI() {
    if (this.#_isEnabled) {
      this.#_toggleButton.textContent = "turn off magic mode :(";
      this.#_toggleButton.style.background = "rgba(255, 0, 0, 0.7)";
      this.#_statusIndicator.textContent = "one sec...";
      this.#_statusIndicator.style.background = "rgba(255, 255, 0, 0.3)";
      // Set buttons to 50% opacity
      if (this.#_toggleButton) {
        this.#_toggleButton.style.opacity = "0.5";
      }
      if (this.#_statusIndicator) {
        this.#_statusIndicator.style.opacity = "0.5";
      }
      // Show and set opacity for video player
      this.#_showVideoPlayer();
      this.#_setOpacity(0.95);
    } else {
      this.#_toggleButton.textContent = "turn on magic mode :)";
      this.#_toggleButton.style.background = "rgba(0, 0, 0, 0.7)";
      this.#_statusIndicator.textContent = "hand tracking off";
      this.#_statusIndicator.style.background = "rgba(0, 0, 0, 0.5)";
      // Reset opacity to full for buttons when disabled
      if (this.#_toggleButton) {
        this.#_toggleButton.style.opacity = "1.0";
      }
      if (this.#_statusIndicator) {
        this.#_statusIndicator.style.opacity = "1.0";
      }
      // Collapse video player
      this.#_collapseVideoPlayer();
    }
  }

  #_showVideoPlayer() {
    if (this.#_previewContainer) {
      // Only show if preview is enabled
      if (this.#_showPreview) {
        this.#_previewContainer.style.display = "block";
        this.#_previewContainer.style.height = "150px";
        this.#_previewContainer.style.margin = "0";
      } else {
        this.#_previewContainer.style.display = "none";
      }
    }
  }

  #_collapseVideoPlayer() {
    if (this.#_previewContainer) {
      this.#_previewContainer.style.height = "0";
      this.#_previewContainer.style.margin = "0";
      this.#_previewContainer.style.overflow = "hidden";
      // Hide after transition completes
      setTimeout(() => {
        if (!this.#_isEnabled && this.#_previewContainer) {
          this.#_previewContainer.style.display = "none";
        }
      }, 300);
    }
  }

  #_setOpacity(opacity) {
    // Apply opacity to video player only
    if (this.#_previewContainer) {
      this.#_previewContainer.style.opacity = opacity.toString();
    }
    // Buttons always stay at 50% opacity when enabled
    if (this.#_isEnabled) {
      if (this.#_toggleButton) {
        this.#_toggleButton.style.opacity = "0.5";
      }
      if (this.#_statusIndicator) {
        this.#_statusIndicator.style.opacity = "0.5";
      }
    }
  }

  #_startOpacityTracking() {
    // Check cursor position periodically
    this.#_opacityCheckInterval = setInterval(() => {
      if (!this.#_isEnabled || !this.#_previewContainer) {
        return;
      }

      // Only track opacity if video player is visible
      const isVisible = this.#_previewContainer.style.display !== "none" && 
                        this.#_previewContainer.offsetHeight > 0;
      if (!isVisible) {
        return;
      }

      const rect = this.#_previewContainer.getBoundingClientRect();
      // Only check virtual cursor (tracked cursor), not mouse
      const isTrackedCursorOver = this.#_isPointInRect(this.#_virtualCursorPosition, rect);

      // Fade to 30% when tracked cursor is over, otherwise 95%
      this.#_setOpacity(isTrackedCursorOver ? 0.3 : 0.95);
    }, 50); // Check every 50ms for smooth transitions
  }

  #_stopOpacityTracking() {
    if (this.#_opacityCheckInterval) {
      clearInterval(this.#_opacityCheckInterval);
      this.#_opacityCheckInterval = null;
    }
  }

  #_isPointInRect(point, rect) {
    if (!point || point.x < 0 || point.y < 0) {
      return false;
    }
    return (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
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
      this.#_startOpacityTracking();
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
    this.#_stopOpacityTracking();
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
    this.#_stopOpacityTracking();
    if (this.#_container && this.#_container.parentNode) {
      this.#_container.parentNode.removeChild(this.#_container);
    }
  }
}
