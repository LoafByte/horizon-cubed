/**
 * Cart Age Verification Component
 * Validates user's age before allowing checkout
 */

class CartAgeVerification extends HTMLElement {
  constructor() {
    super();
    this.dateInput = this.querySelector('#cart-dob');
    this.errorContainer = this.querySelector('.cart-age-verification__error');
    this.checkoutButton = null;
    this.minAge = 18;
  }

  connectedCallback() {
    this.init();
  }

  init() {
    // Find checkout button (could be in cart drawer or cart page)
    this.checkoutButton = document.querySelector('#checkout, button[name="checkout"]');
    
    if (!this.checkoutButton || !this.dateInput) {
      console.warn('Cart age verification: Required elements not found');
      return;
    }

    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    this.dateInput.setAttribute('max', today);

    // Set min date to 120 years ago (reasonable limit)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    this.dateInput.setAttribute('min', minDate.toISOString().split('T')[0]);

    // Add event listeners
    this.dateInput.addEventListener('change', () => this.hideError());
    this.dateInput.addEventListener('input', () => this.hideError());
    
    // Intercept checkout button click
    this.checkoutButton.addEventListener('click', (e) => this.handleCheckoutClick(e));
  }

  /**
   * Calculate age from date of birth
   * @param {string} dateOfBirth - Date string in YYYY-MM-DD format
   * @returns {number} Age in years
   */
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate the date of birth and age
   * @returns {Object} Validation result with isValid and message
   */
  validateAge() {
    const dateValue = this.dateInput.value;

    // Check if date is entered
    if (!dateValue) {
      return {
        isValid: false,
        message: 'Please enter your date of birth to continue.'
      };
    }

    // Check if date is valid
    const birthDate = new Date(dateValue);
    if (isNaN(birthDate.getTime())) {
      return {
        isValid: false,
        message: 'Please enter a valid date of birth.'
      };
    }

    // Check if date is in the future
    if (birthDate > new Date()) {
      return {
        isValid: false,
        message: 'Date of birth cannot be in the future.'
      };
    }

    // Calculate and check age
    const age = this.calculateAge(dateValue);
    
    if (age < this.minAge) {
      return {
        isValid: false,
        message: `You must be ${this.minAge} years or older to complete this purchase.`
      };
    }

    return {
      isValid: true,
      message: ''
    };
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (!this.errorContainer) return;

    this.errorContainer.textContent = message;
    this.errorContainer.classList.add('cart-age-verification__error--visible');
    this.errorContainer.setAttribute('aria-hidden', 'false');
    
    // Set focus to error for accessibility
    this.errorContainer.focus();
    
    // Add error state to input
    this.dateInput.setAttribute('aria-invalid', 'true');
    this.dateInput.classList.add('cart-age-verification__input--error');
  }

  /**
   * Hide error message
   */
  hideError() {
    if (!this.errorContainer) return;

    this.errorContainer.textContent = '';
    this.errorContainer.classList.remove('cart-age-verification__error--visible');
    this.errorContainer.setAttribute('aria-hidden', 'true');
    
    // Remove error state from input
    this.dateInput.setAttribute('aria-invalid', 'false');
    this.dateInput.classList.remove('cart-age-verification__input--error');
  }

  /**
   * Handle checkout button click
   * @param {Event} event - Click event
   */
  handleCheckoutClick(event) {
    const validation = this.validateAge();

    if (!validation.isValid) {
      // Prevent checkout
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Show error message
      this.showError(validation.message);
      
      // Scroll to error if needed
      this.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return false;
    }

    // Age is valid, allow checkout to proceed
    this.hideError();
    return true;
  }
}

// Register custom element
if (!customElements.get('cart-age-verification')) {
  customElements.define('cart-age-verification', CartAgeVerification);
}
