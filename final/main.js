import "./style.css";

import { AssetsId } from "./scripts/constants/AssetsId";
import { AssetsManager } from "./scripts/managers/AssetsManager";
import { Grid } from "./scripts/components/Grid";
import { MainThree } from "./scripts/MainThree";
import { Ticker } from "./scripts/utils/Ticker";
import { HandTrackingUI } from "./scripts/components/HandTrackingUI";
import { HandTrackingManager } from "./scripts/managers/HandTrackingManager";
import { VirtualCursor } from "./scripts/components/VirtualCursor";
import { HandTrackingOverlay } from "./scripts/components/HandTrackingOverlay";
import { IntroOverlay } from "./scripts/components/IntroOverlay";

export class Main {
  static #_handTrackingUI = null;
  static #_virtualCursor = null;
  static #_handTrackingOverlay = null;
  static #_grid = null;

  static async Init() {
    // Always initialize the grid first so it's visible (blurred) during intro
    MainThree.Init();
    Ticker.Start();

    await this.#_LoadAssets();
    this.#_CreateScene();

    // Always show intro overlay on top of the grid
    new IntroOverlay(() => {
      // Enable grid interactions and initialize hand tracking after intro completes
      if (this.#_grid) {
        this.#_grid.enableInteractions();
      }
      this.#_InitHandTracking();
    });
  }

  static async #_LoadAssets() {
    // To use your own photos:
    // 1. Place your image files in the public/textures/ folder
    // 2. Supported formats: .jpg, .jpeg, .png, .webp
    // 3. Update the paths below to match your image filenames
    // 4. You can use any number of images (1-16 or more)
    
    AssetsManager.AddTexture(AssetsId.TEXTURE_1, "textures/img1.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_2, "textures/img2.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_3, "textures/img3.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_4, "textures/img4.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_5, "textures/img5.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_6, "textures/img6.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_7, "textures/img7.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_8, "textures/img8.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_9, "textures/img9.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_10, "textures/img10.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_11, "textures/img11.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_12, "textures/img12.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_13, "textures/img13.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_14, "textures/img14.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_15, "textures/img15.webp");
    AssetsManager.AddTexture(AssetsId.TEXTURE_16, "textures/img16.webp");

    await AssetsManager.Load();
  }

  static #_CreateScene() {
    this.#_grid = new Grid();
    MainThree.Add(this.#_grid);
  }

  static #_InitHandTracking() {
    // Create hand tracking UI (includes video element)
    this.#_handTrackingUI = new HandTrackingUI();
    
    // Create virtual cursor for visual feedback
    this.#_virtualCursor = new VirtualCursor();

    // Create hand tracking overlay (skeleton on video, particles on cursor)
    const videoContainer = this.#_handTrackingUI.getPreviewContainer();
    const videoElement = this.#_handTrackingUI.getVideoElement();
    this.#_handTrackingOverlay = new HandTrackingOverlay(videoContainer, videoElement);

    // Subscribe to hand tracking updates to update virtual cursor
    HandTrackingManager.OnFingerMove((position, isDetected) => {
      if (isDetected && HandTrackingManager.IsActive()) {
        this.#_virtualCursor.update(position.x, position.y);
      } else {
        this.#_virtualCursor.hide();
      }
    });

    // auto-enable hand tracking by default
    this.#_handTrackingUI.enable().catch((error) => {
      console.warn("Could not auto-enable hand tracking:", error);
    });
  }
}

Main.Init();
