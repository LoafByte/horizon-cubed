/**
 * Cart Store Hours Validation Component
 * Validates checkout attempts against store operating hours
 */

class CartStoreHours extends HTMLElement {
  constructor() {
    super();
    this.errorContainer = this.querySelector('.cart-store-hours__error');
    this.checkoutButton = null;
    this.openingTime = this.dataset.openingTime || '09:00';
    this.closingTime = this.dataset.closingTime || '17:00';
    this.enabled = this.dataset.enabled === 'true';
  }

  connectedCallback() {
    if (!this.enabled) {
      return;
    }
    
    this.init();
  }

  init() {
    // Find checkout button (could be in cart drawer or cart page)
    this.checkoutButton = document.querySelector('#checkout, button[name="checkout"]');
    
    if (!this.checkoutButton) {
      console.warn('Cart store hours: Checkout button not found');
      return;
    }

    // Add event listener to checkout button
    // Use capture phase to run before age verification
    this.checkoutButton.addEventListener('click', (e) => this.handleCheckoutClick(e), true);
  }

  /**
   * Parse time string (HH:MM) to Date object for today
   * @param {string} timeString - Time in HH:MM format
   * @returns {Date} Date object with today's date and specified time
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    return time;
  }

  /**
   * Check if current time is within store hours
   * @returns {boolean} True if store is open, false if closed
   */
  isWithinStoreHours() {
    const now = new Date();
    const opening = this.parseTime(this.openingTime);
    const closing = this.parseTime(this.closingTime);
    
    // Handle case where closing time is after midnight (e.g., 23:00 to 02:00)
    if (closing < opening) {
      // Store is open if current time is after opening OR before closing
      return now >= opening || now <= closing;
    }
    
    // Normal case: store opens and closes on same day
    return now >= opening && now <= closing;
  }

  /**
   * Format time for display (convert 24h to 12h format)
   * @param {string} timeString - Time in HH:MM format
   * @returns {string} Formatted time (e.g., "9:00am")
   */
  formatTimeForDisplay(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (!this.errorContainer) return;

    this.errorContainer.textContent = message;
    this.errorContainer.classList.add('cart-store-hours__error--visible');
    this.errorContainer.setAttribute('aria-hidden', 'false');
    
    // Set focus to error for accessibility
    this.errorContainer.focus();
  }

  /**
   * Hide error message
   */
  hideError() {
    if (!this.errorContainer) return;

    this.errorContainer.textContent = '';
    this.errorContainer.classList.remove('cart-store-hours__error--visible');
    this.errorContainer.setAttribute('aria-hidden', 'true');
  }

  /**
   * Handle checkout button click
   * @param {Event} event - Click event
   */
  handleCheckoutClick(event) {
    if (!this.enabled) {
      return true;
    }

    const isOpen = this.isWithinStoreHours();

    if (!isOpen) {
      // Prevent checkout
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Show error message
      const openingDisplay = this.formatTimeForDisplay(this.openingTime);
      const closingDisplay = this.formatTimeForDisplay(this.closingTime);
      const message = `Sorry, our store is currently closed. Please check back during store hours: ${openingDisplay} - ${closingDisplay}`;
      this.showError(message);
      
      // Scroll to error if needed
      this.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return false;
    }

    // Store is open, hide any previous errors and allow checkout
    this.hideError();
    return true;
  }
}

// Register custom element
if (!customElements.get('cart-store-hours')) {
  customElements.define('cart-store-hours', CartStoreHours);
}
