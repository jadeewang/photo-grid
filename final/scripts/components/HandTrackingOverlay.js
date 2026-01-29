import { HandTrackingManager } from "../managers/HandTrackingManager";
import { CoordinateTransformer } from "../utils/CoordinateTransformer";
import { Ticker } from "../utils/Ticker";

/**
 * handtrackingoverlay - visual overlay for hand tracking on video preview
 * renders green skeleton lines connecting hand landmarks on the video feed
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

  // hand landmark connections (indices)
  static #_CONNECTIONS = [
    // wrist to finger bases
    [0, 1],   // wrist to thumb cmc
    [0, 5],   // wrist to index mcp
    [0, 9],   // wrist to middle mcp
    [0, 13],  // wrist to ring mcp
    [0, 17],  // wrist to pinky mcp
    
    // thumb
    [1, 2],   // thumb cmc to mcp
    [2, 3],   // thumb mcp to ip
    [3, 4],   // thumb ip to tip
    
    // index finger
    [5, 6],   // index mcp to pip
    [6, 7],   // index pip to dip
    [7, 8],   // index dip to tip
    
    // middle finger
    [9, 10],  // middle mcp to pip
    [10, 11], // middle pip to dip
    [11, 12], // middle dip to tip
    
    // ring finger
    [13, 14], // ring mcp to pip
    [14, 15], // ring pip to dip
    [15, 16], // ring dip to tip
    
    // pinky finger
    [17, 18], // pinky mcp to pip
    [18, 19], // pinky pip to dip
    [19, 20], // pinky dip to tip
    
    // connections between finger bases
    [5, 9],   // index mcp to middle mcp
    [9, 13],  // middle mcp to ring mcp
    [13, 17], // ring mcp to pinky mcp
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

    // create container positioned over the video
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

    // create canvas matching video container size
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
    // listen for landmark updates
    this.#_landmarkCallback = (landmarks, isDetected) => {
      this.#_currentLandmarks = landmarks;
      this.#_isVisible = isDetected && HandTrackingManager.IsActive();
    };
    HandTrackingManager.OnLandmarksUpdate(this.#_landmarkCallback);

  
    // handle video container resize
    if (this.#_videoContainer) {
      this.#_resizeObserver = new ResizeObserver(() => {
        this.#_updateCanvasSize();
      });
      this.#_resizeObserver.observe(this.#_videoContainer);
    }

    // handle window resize
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
    // no particles in video overlay.. handled separately if needed
  }

  #_render() {
    // clear canvas
    this.#_ctx.clearRect(0, 0, this.#_canvas.width, this.#_canvas.height);

    // always draw grid lines when hand tracking is active!
    if (HandTrackingManager.IsActive()) {
      // pass hand center position, if available
      const handCenter = this.#_getHandCenter();
      this.#_drawGridLines(handCenter);
    }

    // draw skeleton overlay on video when hand is detected
    if (this.#_isVisible && this.#_currentLandmarks) {
      this.#_drawSkeleton();
    }

    // particles are drawn on the main screen (not on video)
  }

  #_getHandCenter() {
    if (!this.#_currentLandmarks || this.#_currentLandmarks.length === 0) {
      return null;
    }

    if (!this.#_videoContainer) return null;

    const rect = this.#_videoContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // use wrist (landmark 0) as the hand center reference
    const wrist = this.#_currentLandmarks[0];
    // flip x since video is mirrored
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

    // determine grid center - use hand center if available, otherwise use screen center
    const centerX = handCenter ? handCenter.x : width / 2;
    const centerY = handCenter ? handCenter.y : height / 2;

    // draw grid lines!
    ctx.strokeStyle = "#0080ff"; // blue color similar to reference
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    // draw vertical center line (dividing left and right zones) - follows hand or centered
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // draw horizontal center line for better grid visualization - follows hand or centered
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // draw quarter lines for finer grid (lighter opacity)
    ctx.globalAlpha = 0.4; // more transparent for quarter lines
    ctx.lineWidth = 1;
    
    // calculate quarter offsets from center
    const quarterOffsetX = width / 4;
    const quarterOffsetY = height / 4;
    
    // vertical quarter lines (relative to hand center)
    ctx.beginPath();
    ctx.moveTo(centerX - quarterOffsetX, 0);
    ctx.lineTo(centerX - quarterOffsetX, height);
    ctx.moveTo(centerX + quarterOffsetX, 0);
    ctx.lineTo(centerX + quarterOffsetX, height);
    ctx.stroke();

    // horizontal quarter lines (relative to hand center)
    ctx.beginPath();
    ctx.moveTo(0, centerY - quarterOffsetY);
    ctx.lineTo(width, centerY - quarterOffsetY);
    ctx.moveTo(0, centerY + quarterOffsetY);
    ctx.lineTo(width, centerY + quarterOffsetY);
    ctx.stroke();

    // reset alpha and line width for other drawings
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

    // convert landmarks from normalized coordinates (0-1) to video canvas coordinates
    // note: mediapipe coordinates are already in the video's coordinate space
    // the video is mirrored (scalex(-1)), so we need to flip x
    const videoLandmarks = landmarks.map((landmark) => {
      // flip x since video is mirrored
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

    // draw landmark points
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
   * hide the overlay
   */
  hide() {
    if (this.#_container) {
      this.#_container.style.display = "none";
    }
  }

  /**
   * clean up and remove overlay
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
