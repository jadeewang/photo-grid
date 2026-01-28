import { Card } from './Card';
import { ExtendedObject3D } from "../utils/ExtendedObject3D";
import { Vector2, Vector3 } from 'three';
import { HandTrackingManager } from '../managers/HandTrackingManager';
import { GestureRecognizer } from '../utils/GestureRecognizer';

export class Grid extends ExtendedObject3D {
  static COLUMNS = Math.floor(window.innerWidth / 100) | 1;
  static ROWS = Math.floor(window.innerHeight / 100) | 1;

  static MousePosition = new Vector2();
  #_targetMousePosition = new Vector2();
  #_isUsingHandTracking = false;
  #_interactionsEnabled = false;
  #_handNotDetectedStartTime = null;
  #_handNotDetectedDuration = 2000; // 2 seconds in milliseconds
  #_mouseEnabled = true; // Start with mouse enabled

  // Pinch zoom state
  #_peaceSignDetectionStartTime = null;
  #_peaceSignDetectionDuration = 2000; // 2 seconds in milliseconds
  #_openPalmDetectionStartTime = null;
  #_openPalmDetectionDuration = 3000; // 3 seconds in milliseconds
  #_isZoomEnabled = false;
  #_targetZoom = 1.0; // 1.0 = full grid, 1.5 = 150% zoom
  #_currentZoom = 1.0;
  #_previousZoom = 1.0; // Track previous zoom for smooth transitions
  #_minPinchDistance = 0.02; // Minimum distance when pinched (fingers together)
  #_maxPinchDistance = 0.15; // Maximum distance when expanded (fingers apart)
  #_zoomCenter = new Vector2(); // Point to zoom towards (in NDC coordinates)

  constructor() {
    super();

    Card.SetScale();
    this.#_createCards();
    // Don't set up listeners until intro is dismissed
    // this.#_setListeners();
    // this.#_setupHandTracking();
    // this.#_setupPinchZoom();
  }

  /**
   * Enable interactions (called after intro overlay is dismissed)
   */
  enableInteractions() {
    if (!this.#_interactionsEnabled) {
      this.#_interactionsEnabled = true;
      this.#_setListeners();
      this.#_setupHandTracking();
      this.#_setupPinchZoom();
    }
  }

  #_setListeners() {
    window.addEventListener('mousemove', this.#_updateMousePos)
    window.addEventListener('touchmove', this.#_updateMousePos)
  }

  #_setupHandTracking() {
    // Subscribe to hand tracking updates
    HandTrackingManager.OnFingerMove((position, isDetected) => {
      if (!this.#_interactionsEnabled) {
        return;
      }

      // If hand tracking is not active at all, enable mouse immediately
      if (!HandTrackingManager.IsActive()) {
        this.#_mouseEnabled = true;
        this.#_handNotDetectedStartTime = null;
        this.#_isUsingHandTracking = false;
        return;
      }

      if (isDetected) {
        // Hand detected - disable mouse immediately
        this.#_mouseEnabled = false;
        this.#_handNotDetectedStartTime = null;
        
        // Convert finger position to NDC coordinates for Three.js
        const ndcPos = HandTrackingManager.GetFingerPositionNDC();
        this.#_targetMousePosition.set(ndcPos.x, ndcPos.y);
        this.#_isUsingHandTracking = true;
      } else {
        // Hand not detected but hand tracking is active - start timer
        if (this.#_handNotDetectedStartTime === null) {
          this.#_handNotDetectedStartTime = performance.now();
        } else {
          const elapsed = performance.now() - this.#_handNotDetectedStartTime;
          
          // Enable mouse after 2 seconds of no hand detection
          if (elapsed >= this.#_handNotDetectedDuration) {
            this.#_mouseEnabled = true;
          }
        }
        
        this.#_isUsingHandTracking = false;
      }
    });
  }

  #_setupPinchZoom() {
    // Subscribe to landmark updates for gesture detection
    HandTrackingManager.OnLandmarksUpdate((landmarks, isDetected) => {
      if (!this.#_interactionsEnabled) {
        return;
      }

      if (!isDetected || !HandTrackingManager.IsActive()) {
        // Reset all detection timers if hand is lost
        this.#_peaceSignDetectionStartTime = null;
        this.#_openPalmDetectionStartTime = null;
        this.#_isZoomEnabled = false;
        this.#_targetZoom = 1.0;
        this.#_zoomCenter.set(0, 0); // Reset zoom center
        return;
      }

      // Check for open palm gesture to reset zoom
      const isOpenPalm = GestureRecognizer.IsOpenHand(landmarks);
      
      if (isOpenPalm) {
        // Start or continue open palm detection timer
        if (this.#_openPalmDetectionStartTime === null) {
          this.#_openPalmDetectionStartTime = performance.now();
        } else {
          const elapsed = performance.now() - this.#_openPalmDetectionStartTime;
          
          // Disable zoom after 3 seconds of continuous open palm
          if (elapsed >= this.#_openPalmDetectionDuration) {
            this.#_isZoomEnabled = false;
            this.#_targetZoom = 1.0;
            this.#_zoomCenter.set(0, 0); // Reset zoom center
            this.#_openPalmDetectionStartTime = null; // Reset timer
            this.#_peaceSignDetectionStartTime = null; // Reset peace sign timer so user needs to reactivate
            console.log('Zoom disabled after 3 seconds of open palm detection');
            return; // Exit early to prevent other gesture checks
          }
        }
      } else {
        // Reset open palm detection if gesture is broken
        this.#_openPalmDetectionStartTime = null;
      }

      // If zoom is already enabled, check for pinch gesture
      if (this.#_isZoomEnabled) {
        // Update zoom center to current cursor position (follows cursor)
        this.#_zoomCenter.copy(Grid.MousePosition);
        
        const pinchDistance = GestureRecognizer.GetPinchDistance(landmarks);
        
        if (pinchDistance !== null) {
          // Map pinch distance to zoom level
          // Pinched (small distance) = zoom out to 1.0
          // Expanded (large distance) = zoom in to 1.5
          const normalizedDistance = Math.max(0, Math.min(1, 
            (pinchDistance - this.#_minPinchDistance) / 
            (this.#_maxPinchDistance - this.#_minPinchDistance)
          ));
          
          // Invert: small distance (pinched) = 1.0, large distance (expanded) = 1.5
          this.#_targetZoom = 1.0 + (normalizedDistance * 0.5); // Range: 1.0 to 1.5
        }
        return; // Skip fist detection once zoom is enabled
      }

      // Check for peace sign gesture to activate zoom
      const isPeaceSign = GestureRecognizer.IsPeaceSign(landmarks);
      
      if (isPeaceSign) {
        // Start or continue peace sign detection timer
        if (this.#_peaceSignDetectionStartTime === null) {
          this.#_peaceSignDetectionStartTime = performance.now();
        } else {
          const elapsed = performance.now() - this.#_peaceSignDetectionStartTime;
          
          // Enable zoom after 2 seconds of continuous peace sign
          if (elapsed >= this.#_peaceSignDetectionDuration) {
            this.#_isZoomEnabled = true;
            this.#_peaceSignDetectionStartTime = null; // Reset timer
            console.log('Pinch zoom enabled after 2 seconds of peace sign detection');
          }
        }
      } else {
        // Reset peace sign detection if gesture is broken before 2 seconds
        this.#_peaceSignDetectionStartTime = null;
        this.#_targetZoom = 1.0;
        this.#_zoomCenter.set(0, 0); // Reset zoom center
      }
    });
  }

  #_createCards() {
    for(let i = 0; i < Grid.COLUMNS; i++) {
      for(let j = 0; j < Grid.ROWS; j++) {
        const card = new Card(i, j);
        this.add(card);
      }
    }
  }

  #_updateMousePos = (event) => {
    // Don't process if interactions are not enabled
    if (!this.#_interactionsEnabled) {
      return;
    }

    // If hand tracking is not active (magic mode is OFF), enable mouse immediately
    if (!HandTrackingManager.IsActive()) {
      this.#_mouseEnabled = true;
      this.#_handNotDetectedStartTime = null;
      this.#_isUsingHandTracking = false;
    }

    // Don't process mouse if mouse is disabled (hand tracking was recently active)
    if (!this.#_mouseEnabled) {
      return;
    }

    // Don't process if hand is currently detected
    if (HandTrackingManager.IsHandDetected() && HandTrackingManager.IsActive()) {
      return;
    }

    const isMobile = event.type === 'touchmove';
    
    const { clientX, clientY } = isMobile ? event.changedTouches[0] : event;

    const halfW = 0.5 * window.innerWidth;
    const halfH = 0.5 * window.innerHeight;

    // our position, normalized on a [-1, 1] range.
    const x = (clientX - halfW) / window.innerWidth * 2
    const y = -(clientY - halfH) / window.innerHeight * 2

    this.#_targetMousePosition.set(x, y)
    this.#_isUsingHandTracking = false;
  }

  resize() {
    Grid.COLUMNS = Math.floor(window.innerWidth / 100) | 1;
    Grid.ROWS = Math.floor(window.innerHeight / 100) | 1;
    
    Card.SetScale();
  }

  update(dt) {
    this.#_lerpMousePosition(dt);
    this.#_updateZoom(dt);
  }

  #_lerpMousePosition(dt) {
    Grid.MousePosition.lerp(this.#_targetMousePosition, 1 - Math.pow(0.0125, dt));
  }

  #_updateZoom(dt) {
    // Smoothly interpolate zoom level
    const zoomLerpFactor = 1 - Math.pow(0.05, dt);
    this.#_previousZoom = this.#_currentZoom;
    this.#_currentZoom += (this.#_targetZoom - this.#_currentZoom) * zoomLerpFactor;
    
    // Apply zoom to grid scale
    this.scale.setScalar(this.#_currentZoom);
    
    // Adjust position to zoom towards cursor (keep cursor point fixed)
    // When zooming in, we need to translate the grid so the cursor point stays in place
    // Formula: offset = centerPoint * (1 - zoom)
    // When zoom = 1.0, offset = 0 (no translation)
    // When zoom > 1.0, we translate to keep the cursor point fixed
    const offsetX = this.#_zoomCenter.x * (1 - this.#_currentZoom);
    const offsetY = this.#_zoomCenter.y * (1 - this.#_currentZoom);
    
    // Smoothly interpolate position
    const positionLerpFactor = 1 - Math.pow(0.1, dt);
    this.position.x += (offsetX - this.position.x) * positionLerpFactor;
    this.position.y += (offsetY - this.position.y) * positionLerpFactor;
  }
}