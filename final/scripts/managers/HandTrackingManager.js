import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { CoordinateTransformer } from "../utils/CoordinateTransformer";

/**
 * HandTrackingManager - Manages MediaPipe hand tracking and provides
 * finger position data for the photo grid interaction
 */
export class HandTrackingManager {
  static #_hands = null;
  static #_camera = null;
  static #_videoElement = null;
  static #_isActive = false;
  static #_isHandDetected = false;
  static #_fingerPosition = { x: 0, y: 0 };
  static #_smoothedPosition = { x: 0, y: 0 };
  static #_smoothingFactor = 0.7; // Exponential moving average factor (0-1, higher = more smoothing)
  static #_callbacks = new Set();
  static #_landmarkCallbacks = new Set(); // Callbacks for full landmark data
  static #_currentLandmarks = null; // Current hand landmarks in normalized coordinates
  static #_lastUpdateTime = 0;
  static #_targetFPS = 30; // Target 30 FPS for hand tracking
  static #_frameInterval = 1000 / this.#_targetFPS;

  /**
   * Initialize MediaPipe Hands and prepare for tracking
   * @param {HTMLVideoElement} videoElement - Video element for webcam feed
   * @returns {Promise<void>}
   */
  static async Init(videoElement) {
    if (!videoElement) {
      throw new Error("Video element is required for hand tracking");
    }

    this.#_videoElement = videoElement;

    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("getUserMedia is not supported. Hand tracking will be disabled.");
      return;
    }

    try {
      // Initialize MediaPipe Hands
      this.#_hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      // Configure MediaPipe Hands
      this.#_hands.setOptions({
        maxNumHands: 1, // Use only the first detected hand
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // Set up results callback
      this.#_hands.onResults((results) => {
        this.#_onHandResults(results);
      });

      console.log("HandTrackingManager initialized successfully");
    } catch (error) {
      console.error("Failed to initialize HandTrackingManager:", error);
      throw error;
    }
  }

  /**
   * Start hand tracking with webcam
   * @returns {Promise<void>}
   */
  static async Start() {
    if (this.#_isActive) {
      console.warn("Hand tracking is already active");
      return;
    }

    if (!this.#_hands || !this.#_videoElement) {
      throw new Error("HandTrackingManager must be initialized before starting");
    }

    try {
      // Initialize camera
      this.#_camera = new Camera(this.#_videoElement, {
        onFrame: async () => {
          const now = performance.now();
          // Throttle to target FPS
          if (now - this.#_lastUpdateTime >= this.#_frameInterval) {
            await this.#_hands.send({ image: this.#_videoElement });
            this.#_lastUpdateTime = now;
          }
        },
        width: 640,
        height: 480,
      });

      await this.#_camera.start();
      this.#_isActive = true;
      console.log("Hand tracking started");
    } catch (error) {
      console.error("Failed to start hand tracking:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        throw new Error("Camera permission denied. Please allow camera access.");
      }
      throw error;
    }
  }

  /**
   * Stop hand tracking
   */
  static Stop() {
    if (!this.#_isActive) {
      return;
    }

    if (this.#_camera) {
      this.#_camera.stop();
      this.#_camera = null;
    }

    this.#_isActive = false;
    this.#_isHandDetected = false;
    this.#_fingerPosition = { x: 0, y: 0 };
    this.#_smoothedPosition = { x: 0, y: 0 };
    
    console.log("Hand tracking stopped");
  }

  /**
   * Handle MediaPipe hand detection results
   * @param {Object} results - MediaPipe results object
   */
  static #_onHandResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Use the first detected hand
      const hand = results.multiHandLandmarks[0];
      
      // Store current landmarks
      this.#_currentLandmarks = hand;
      
      // Index finger tip is landmark #8
      const indexFingerTip = hand[8];
      
      // Convert normalized coordinates to screen space
      const screenPos = CoordinateTransformer.NormalizedToScreen(
        indexFingerTip.x,
        indexFingerTip.y
      );
      
      // Apply exponential moving average smoothing
      this.#_smoothedPosition.x = 
        this.#_smoothedPosition.x * this.#_smoothingFactor + 
        screenPos.x * (1 - this.#_smoothingFactor);
      this.#_smoothedPosition.y = 
        this.#_smoothedPosition.y * this.#_smoothingFactor + 
        screenPos.y * (1 - this.#_smoothingFactor);
      
      this.#_fingerPosition = { ...this.#_smoothedPosition };
      this.#_isHandDetected = true;
      
      // Notify subscribers
      this.#_notifyCallbacks();
      this.#_notifyLandmarkCallbacks();
    } else {
      this.#_isHandDetected = false;
      this.#_currentLandmarks = null;
      this.#_notifyLandmarkCallbacks();
    }
  }

  /**
   * Notify all registered callbacks of finger position changes
   */
  static #_notifyCallbacks() {
    this.#_callbacks.forEach((callback) => {
      try {
        callback(this.#_fingerPosition, this.#_isHandDetected);
      } catch (error) {
        console.error("Error in hand tracking callback:", error);
      }
    });
  }

  /**
   * Notify all registered callbacks of landmark changes
   */
  static #_notifyLandmarkCallbacks() {
    this.#_landmarkCallbacks.forEach((callback) => {
      try {
        callback(this.#_currentLandmarks, this.#_isHandDetected);
      } catch (error) {
        console.error("Error in landmark callback:", error);
      }
    });
  }

  /**
   * Subscribe to finger position updates
   * @param {Function} callback - Callback function(position, isHandDetected)
   */
  static OnFingerMove(callback) {
    if (typeof callback === "function") {
      this.#_callbacks.add(callback);
    }
  }

  /**
   * Unsubscribe from finger position updates
   * @param {Function} callback - Callback function to remove
   */
  static OffFingerMove(callback) {
    this.#_callbacks.delete(callback);
  }

  /**
   * Get current finger position in screen coordinates
   * @returns {{x: number, y: number}} Finger position in screen pixels
   */
  static GetFingerPosition() {
    return { ...this.#_fingerPosition };
  }

  /**
   * Get current finger position in Three.js NDC coordinates
   * @returns {{x: number, y: number}} Finger position in NDC (-1 to 1)
   */
  static GetFingerPositionNDC() {
    return CoordinateTransformer.ScreenToNDC(
      this.#_fingerPosition.x,
      this.#_fingerPosition.y
    );
  }

  /**
   * Check if a hand is currently detected
   * @returns {boolean}
   */
  static IsHandDetected() {
    return this.#_isHandDetected && this.#_isActive;
  }

  /**
   * Check if hand tracking is active
   * @returns {boolean}
   */
  static IsActive() {
    return this.#_isActive;
  }

  /**
   * Set smoothing factor (0-1, higher = more smoothing)
   * @param {number} factor - Smoothing factor between 0 and 1
   */
  static SetSmoothingFactor(factor) {
    this.#_smoothingFactor = Math.max(0, Math.min(1, factor));
  }

  /**
   * Get current smoothing factor
   * @returns {number}
   */
  static GetSmoothingFactor() {
    return this.#_smoothingFactor;
  }

  /**
   * Subscribe to hand landmark updates (full 21 landmarks)
   * @param {Function} callback - Callback function(landmarks, isHandDetected)
   */
  static OnLandmarksUpdate(callback) {
    if (typeof callback === "function") {
      this.#_landmarkCallbacks.add(callback);
    }
  }

  /**
   * Unsubscribe from hand landmark updates
   * @param {Function} callback - Callback function to remove
   */
  static OffLandmarksUpdate(callback) {
    this.#_landmarkCallbacks.delete(callback);
  }

  /**
   * Get current hand landmarks in normalized coordinates (0-1)
   * @returns {Array|null} Array of 21 landmarks or null if no hand detected
   */
  static GetLandmarks() {
    return this.#_currentLandmarks ? [...this.#_currentLandmarks] : null;
  }
}
