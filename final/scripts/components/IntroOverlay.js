/**
 * IntroOverlay - Displays intro animation sequence on first visit
 * Shows two message cards with navigation
 */
export class IntroOverlay {
  #_container = null;
  #_overlay = null;
  #_backgroundShade = null;
  #_currentCardIndex = 0;
  #_cards = [];
  #_onComplete = null;

  // Message content
  static MESSAGES = [
    {
      text: "welcome to Prague!",
      secondaryText: "this is an interactive photo gallery experience, meant to immerse you in the memories of my quarter abroad.",
    },
    {
      text: "use magic mode to explore:",
      list: [
        "finger/hand movement = scroll across grid",
        "peace sign for 2 seconds = activate zoom",
        "pinch in/out = zoom on hovered over area",
        "open palm for 3 seconds = reset to full size grid"
      ]
    }
  ];

  constructor(onComplete) {
    this.#_onComplete = onComplete;
    this.#_createOverlay();
  }

  #_createOverlay() {
    // Create background shading layer
    this.#_backgroundShade = document.createElement("div");
    this.#_backgroundShade.className = "intro-background-shade";
    this.#_backgroundShade.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 9999;
      pointer-events: none;
      transition: opacity 0.8s ease-out;
    `;
    document.body.appendChild(this.#_backgroundShade);

    // Create main overlay container (centered card area)
    this.#_overlay = document.createElement("div");
    this.#_overlay.className = "intro-overlay";
    this.#_overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 400px;
      background: white;
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 1;
      transition: opacity 0.8s ease-out;
      border-radius: 16px;
      padding: 0;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    // Create cards container
    this.#_container = document.createElement("div");
    this.#_container.className = "intro-cards-container";
    this.#_container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      padding: 0;
    `;

    // Create all cards
    IntroOverlay.MESSAGES.forEach((message, index) => {
      const card = this.#_createCard(message, index);
      this.#_cards.push(card);
      this.#_container.appendChild(card);
    });

    this.#_overlay.appendChild(this.#_container);
    document.body.appendChild(this.#_overlay);

    // Show first card
    this.#_showCard(0);
  }

  #_createCard(message, index) {
    const card = document.createElement("div");
    card.className = `intro-card intro-card-${index}`;
    card.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      border: 2px solid #D3D3D3;
      border-radius: 12px;
      padding: 40px 30px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
      transform: translateY(20px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    `;

    // Create text content
    const textContainer = document.createElement("div");
    textContainer.style.cssText = `
      font-family: ui-monospace, monospace;
      font-size: 16px;
      line-height: 1.6;
      color: #000;
      text-align: center;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-transform: none;
    `;

    if (message.text) {
      const title = document.createElement("div");
      title.textContent = message.text;
      title.style.cssText = `
        font-size: 18px;
        font-weight: 600;
        margin-bottom: ${message.secondaryText || message.list ? '20px' : '0'};
        text-transform: none;
        font-variant: normal;
        text-align: center;
        width: 100%;
      `;
      textContainer.appendChild(title);
    }

    // Add secondary text that fades in after 2 seconds (for first card)
    if (message.secondaryText && index === 0) {
      const secondaryText = document.createElement("div");
      secondaryText.textContent = message.secondaryText;
      secondaryText.style.cssText = `
        font-size: 16px;
        font-weight: normal;
        opacity: 0;
        transition: opacity 0.8s ease-in;
        margin-top: 0;
        text-transform: none;
        font-variant: normal;
        text-align: left;
        width: 100%;
      `;
      textContainer.appendChild(secondaryText);
      
      // Store reference for delayed fade-in
      card._secondaryTextElement = secondaryText;
    }

    if (message.list) {
      const list = document.createElement("ul");
      list.style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0;
        text-align: left;
        width: 100%;
      `;
      
      message.list.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = `• ${item}`;
        listItem.style.cssText = `
          margin-bottom: 12px;
          padding-left: 0;
          text-transform: none;
          font-variant: normal;
          text-align: left;
        `;
        list.appendChild(listItem);
      });
      
      textContainer.appendChild(list);
    }

    card.appendChild(textContainer);

    // Create navigation buttons
    const navContainer = document.createElement("div");
    navContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-top: auto;
      padding-top: 20px;
      width: 100%;
    `;

    // Back button (only show on card 2)
    if (index > 0) {
      const backButton = this.#_createNavButton("←", () => this.#_goToPrevious(), false);
      navContainer.appendChild(backButton);
    } else {
      // Spacer for first card
      const spacer = document.createElement("div");
      spacer.style.cssText = `width: 60px;`;
      navContainer.appendChild(spacer);
    }

    // Forward or "Got it!" button
    if (index === IntroOverlay.MESSAGES.length - 1) {
      // Final card: "Got it!" button
      const gotItButton = this.#_createNavButton("Got it!", () => this.#_complete(), true);
      navContainer.appendChild(gotItButton);
    } else {
      // Forward button
      const forwardButton = this.#_createNavButton("→", () => this.#_goToNext(), false);
      navContainer.appendChild(forwardButton);
    }

    card.appendChild(navContainer);

    return card;
  }

  #_createNavButton(text, onClick, isPrimary = false) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.cssText = `
      padding: ${isPrimary ? '12px 30px' : '10px 20px'};
      background: ${isPrimary ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)'};
      color: white;
      border: 2px solid #D3D3D3;
      border-radius: 8px;
      cursor: pointer;
      font-family: ui-monospace, monospace;
      font-size: ${isPrimary ? '14px' : '16px'};
      font-weight: ${isPrimary ? 'bold' : 'normal'};
      transition: all 0.3s ease;
      min-width: ${isPrimary ? '120px' : '60px'};
      text-align: center;
    `;

    button.addEventListener("mouseenter", () => {
      button.style.background = 'rgba(0, 0, 0, 0.9)';
      button.style.borderColor = '#E0E0E0';
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = isPrimary ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)';
      button.style.borderColor = '#D3D3D3';
      button.style.transform = 'scale(1)';
    });

    button.addEventListener("click", onClick);

    return button;
  }

  #_showCard(index) {
    // Hide all cards
    this.#_cards.forEach((card, i) => {
      if (i === index) {
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
        card.style.transform = "translateY(0)";
        
        // If this is the first card, trigger secondary text fade-in after 2 seconds
        if (i === 0 && card._secondaryTextElement) {
          // Reset opacity first
          card._secondaryTextElement.style.opacity = "0";
          
          // Clear any existing timeout
          if (card._fadeInTimeout) {
            clearTimeout(card._fadeInTimeout);
          }
          
          // Fade in after 2 seconds
          card._fadeInTimeout = setTimeout(() => {
            if (card._secondaryTextElement) {
              card._secondaryTextElement.style.opacity = "1";
            }
          }, 2000);
        }
      } else {
        card.style.opacity = "0";
        card.style.pointerEvents = "none";
        card.style.transform = "translateY(20px)";
        
        // Reset secondary text opacity when hiding
        if (card._secondaryTextElement) {
          card._secondaryTextElement.style.opacity = "0";
        }
        
        // Clear timeout if card is hidden
        if (card._fadeInTimeout) {
          clearTimeout(card._fadeInTimeout);
          card._fadeInTimeout = null;
        }
      }
    });
  }

  #_goToNext() {
    if (this.#_currentCardIndex < IntroOverlay.MESSAGES.length - 1) {
      this.#_currentCardIndex++;
      this.#_showCard(this.#_currentCardIndex);
    }
  }

  #_goToPrevious() {
    if (this.#_currentCardIndex > 0) {
      this.#_currentCardIndex--;
      this.#_showCard(this.#_currentCardIndex);
    }
  }

  #_complete() {
    // Fade out overlay and background shade
    this.#_overlay.style.opacity = "0";
    if (this.#_backgroundShade) {
      this.#_backgroundShade.style.opacity = "0";
    }
    
    setTimeout(() => {
      if (this.#_overlay && this.#_overlay.parentNode) {
        this.#_overlay.parentNode.removeChild(this.#_overlay);
      }
      if (this.#_backgroundShade && this.#_backgroundShade.parentNode) {
        this.#_backgroundShade.parentNode.removeChild(this.#_backgroundShade);
      }
      
      if (this.#_onComplete) {
        this.#_onComplete();
      }
    }, 800); // Match transition duration
  }

  /**
   * Check if intro should be shown
   * @returns {boolean}
   */
  static ShouldShowIntro() {
    try {
      const completed = localStorage.getItem("introCompleted");
      return completed !== "true";
    } catch (error) {
      // If localStorage is not available, show intro
      return true;
    }
  }

  /**
   * Reset intro (for testing purposes)
   */
  static ResetIntro() {
    try {
      localStorage.removeItem("introCompleted");
    } catch (error) {
      console.warn("Could not reset intro:", error);
    }
  }
}
