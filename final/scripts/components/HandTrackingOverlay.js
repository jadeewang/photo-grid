import { HandTrackingManager } from "../managers/HandTrackingManager";
import { CoordinateTransformer } from "../utils/CoordinateTransformer";
import { Ticker } from "../utils/Ticker";

/**
 * HandTrackingOverlay - Visual overlay for hand tracking on video preview
 * Renders green skeleton lines connecting hand landmarks on the video feed
 */
export class HandTrackingOverlay {
  #_canvas = null;
  #_ctx = null;
  #_container = null;
  #_videoContainer = null;
  #_videoElement = null;
  #_isVisible = false;
  #_currentLandmarks = null;
  #_animationFrameId = null;
  #_landmarkCallback = null;
  #_resizeObserver = null;

  // Hand landmark connections (indices)
  static #_CONNECTIONS = [
    // Wrist to finger bases
    [0, 1],   // Wrist to Thumb CMC
    [0, 5],   // Wrist to Index MCP
    [0, 9],   // Wrist to Middle MCP
    [0, 13],  // Wrist to Ring MCP
    [0, 17],  // Wrist to Pinky MCP
    
    // Thumb
    [1, 2],   // Thumb CMC to MCP
    [2, 3],   // Thumb MCP to IP
    [3, 4],   // Thumb IP to TIP
    
    // Index finger
    [5, 6],   // Index MCP to PIP
    [6, 7],   // Index PIP to DIP
    [7, 8],   // Index DIP to TIP
    
    // Middle finger
    [9, 10],  // Middle MCP to PIP
    [10, 11], // Middle PIP to DIP
    [11, 12], // Middle DIP to TIP
    
    // Ring finger
    [13, 14], // Ring MCP to PIP
    [14, 15], // Ring PIP to DIP
    [15, 16], // Ring DIP to TIP
    
    // Pinky finger
    [17, 18], // Pinky MCP to PIP
    [18, 19], // Pinky PIP to DIP
    [19, 20], // Pinky DIP to TIP
    
    // Connections between finger bases
    [5, 9],   // Index MCP to Middle MCP
    [9, 13],  // Middle MCP to Ring MCP
    [13, 17], // Ring MCP to Pinky MCP
  ];

  constructor(videoContainer, videoElement) {
    this.#_videoContainer = videoContainer;
    this.#_videoElement = videoElement;
    this.#_createCanvas();
    this.#_setupEventListeners();
    this.#_startAnimation();
  }

  #_createCanvas() {
    if (!this.#_videoContainer) {
      console.warn("HandTrackingOverlay: No video container provided");
      return;
    }

    // Create container positioned over the video
    this.#_container = document.createElement("div");
    this.#_container.className = "hand-tracking-overlay";
    this.#_container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    `;

    // Create canvas matching video container size
    this.#_canvas = document.createElement("canvas");
    this.#_updateCanvasSize();
    this.#_canvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
    `;

    this.#_ctx = this.#_canvas.getContext("2d");
    this.#_container.appendChild(this.#_canvas);
    this.#_videoContainer.appendChild(this.#_container);
  }

  #_updateCanvasSize() {
    if (!this.#_videoContainer) return;
    
    const rect = this.#_videoContainer.getBoundingClientRect();
    this.#_canvas.width = rect.width;
    this.#_canvas.height = rect.height;
  }

  #_setupEventListeners() {
    // Listen for landmark updates
    this.#_landmarkCallback = (landmarks, isDetected) => {
      this.#_currentLandmarks = landmarks;
      this.#_isVisible = isDetected && HandTrackingManager.IsActive();
    };
    HandTrackingManager.OnLandmarksUpdate(this.#_landmarkCallback);

    // No need to track cursor position for video overlay

    // Handle video container resize
    if (this.#_videoContainer) {
      this.#_resizeObserver = new ResizeObserver(() => {
        this.#_updateCanvasSize();
      });
      this.#_resizeObserver.observe(this.#_videoContainer);
    }

    // Handle window resize
    window.addEventListener("resize", () => {
      this.#_updateCanvasSize();
    });
  }

  #_startAnimation() {
    const animate = () => {
      this.#_update();
      this.#_render();
      this.#_animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  #_update() {
    // No particles in video overlay - they're handled separately if needed
  }

  #_render() {
    // Clear canvas
    this.#_ctx.clearRect(0, 0, this.#_canvas.width, this.#_canvas.height);

    // Always draw grid lines when hand tracking is active
    if (HandTrackingManager.IsActive()) {
      // Pass hand center position if available
      const handCenter = this.#_getHandCenter();
      this.#_drawGridLines(handCenter);
    }

    // Draw skeleton on video when hand is detected
    if (this.#_isVisible && this.#_currentLandmarks) {
      this.#_drawSkeleton();
    }

    // Particles are drawn on the main screen (not on video)
    // They're handled separately if needed
  }

  #_getHandCenter() {
    if (!this.#_currentLandmarks || this.#_currentLandmarks.length === 0) {
      return null;
    }

    if (!this.#_videoContainer) return null;

    const rect = this.#_videoContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Use wrist (landmark 0) as the hand center reference
    const wrist = this.#_currentLandmarks[0];
    // Flip X because video is mirrored
    const x = (1 - wrist.x) * width;
    const y = wrist.y * height;

    return { x, y };
  }

  #_drawGridLines(handCenter = null) {
    const ctx = this.#_ctx;

    if (!this.#_videoContainer) return;

    const rect = this.#_videoContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Determine grid center - use hand center if available, otherwise use screen center
    const centerX = handCenter ? handCenter.x : width / 2;
    const centerY = handCenter ? handCenter.y : height / 2;

    // Draw grid lines
    ctx.strokeStyle = "#0080ff"; // Blue color similar to reference
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    // Draw vertical center line (dividing left and right zones) - follows hand or centered
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw horizontal center line for better grid visualization - follows hand or centered
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Draw quarter lines for finer grid (lighter opacity)
    ctx.globalAlpha = 0.4; // More transparent for quarter lines
    ctx.lineWidth = 1;
    
    // Calculate quarter offsets from center
    const quarterOffsetX = width / 4;
    const quarterOffsetY = height / 4;
    
    // Vertical quarter lines (relative to hand center)
    ctx.beginPath();
    ctx.moveTo(centerX - quarterOffsetX, 0);
    ctx.lineTo(centerX - quarterOffsetX, height);
    ctx.moveTo(centerX + quarterOffsetX, 0);
    ctx.lineTo(centerX + quarterOffsetX, height);
    ctx.stroke();

    // Horizontal quarter lines (relative to hand center)
    ctx.beginPath();
    ctx.moveTo(0, centerY - quarterOffsetY);
    ctx.lineTo(width, centerY - quarterOffsetY);
    ctx.moveTo(0, centerY + quarterOffsetY);
    ctx.lineTo(width, centerY + quarterOffsetY);
    ctx.stroke();

    // Reset alpha and line width for other drawings
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 2;
  }

  #_drawSkeleton() {
    const landmarks = this.#_currentLandmarks;
    const ctx = this.#_ctx;

    if (!this.#_videoContainer) return;

    const rect = this.#_videoContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Convert landmarks from normalized coordinates (0-1) to video canvas coordinates
    // Note: MediaPipe coordinates are already in the video's coordinate space
    // The video is mirrored (scaleX(-1)), so we need to flip X
    const videoLandmarks = landmarks.map((landmark) => {
      // Flip X because video is mirrored
      const x = (1 - landmark.x) * width;
      const y = landmark.y * height;
      return { x, y };
    });

    // Draw connections
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const [startIdx, endIdx] of HandTrackingOverlay.#_CONNECTIONS) {
      const start = videoLandmarks[startIdx];
      const end = videoLandmarks[endIdx];

      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }

    // Draw landmark points
    ctx.fillStyle = "#00ff00";
    for (const point of videoLandmarks) {
      if (point) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }


  /**
   * Show the overlay
   */
  show() {
    if (this.#_container) {
      this.#_container.style.display = "block";
    }
  }

  /**
   * Hide the overlay
   */
  hide() {
    if (this.#_container) {
      this.#_container.style.display = "none";
    }
  }

  /**
   * Clean up and remove overlay
   */
  destroy() {
    if (this.#_animationFrameId) {
      cancelAnimationFrame(this.#_animationFrameId);
    }

    if (this.#_resizeObserver) {
      this.#_resizeObserver.disconnect();
    }

    if (this.#_landmarkCallback) {
      HandTrackingManager.OffLandmarksUpdate(this.#_landmarkCallback);
    }

    if (this.#_container && this.#_container.parentNode) {
      this.#_container.parentNode.removeChild(this.#_container);
    }
  }
}
