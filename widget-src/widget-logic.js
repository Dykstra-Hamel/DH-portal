/**
 * Widget Logic and Validation
 * Contains validation, business logic, step management, and API communication
 */

// Step navigation
const showStep = async stepName => {
  // Get current and target steps for animation
  const currentActiveStep = document.querySelector('.dh-form-step.active');
  const targetStep = document.getElementById('dh-step-' + stepName);

  if (!targetStep) return;

  // Reset button states when leaving specific steps
  if (currentActiveStep && currentActiveStep !== targetStep) {
    // Reset confirm-address button when leaving that step
    if (currentActiveStep.id === 'dh-step-confirm-address') {
      const confirmButton = document.getElementById('confirm-address-next');
      if (confirmButton) {
        confirmButton.innerHTML =
          'Continue <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        confirmButton.disabled = true; // Will be re-enabled by checkbox validation
        confirmButton.style.opacity = '0.5';
        confirmButton.style.cursor = 'not-allowed';
      }
    }
  }

  // Standard step navigation with animations
  {
    // For non-welcome steps, use fade animations

    // If there's a currently active step, animate it out first
    if (currentActiveStep && currentActiveStep !== targetStep) {
      currentActiveStep.classList.add('fade-out');

      // Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, 300));

      currentActiveStep.classList.remove('active', 'fade-out');
    } else {
      // Just hide all steps if no current active step
      document.querySelectorAll('.dh-form-step').forEach(step => {
        step.classList.remove('active', 'fade-in', 'fade-out');
      });
    }

    // Show target step with fade-in animation
    targetStep.classList.add('active', 'fade-in');
    widgetState.currentStep = stepName;

    // Scroll to top of the page or widget container
    try {
      // Try to find the widget container and scroll to it
      const widgetContainer =
        document.getElementById('dh-widget-container') ||
        document.querySelector('.dh-widget') ||
        targetStep.closest('.dh-widget-container') ||
        targetStep;

      if (widgetContainer && widgetContainer.scrollIntoView) {
        widgetContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback to window scroll
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      // Final fallback - instant scroll
      try {
        window.scrollTo(0, 0);
      } catch (e) {
        // Silently fail if even basic scroll doesn't work
      }
    }

    // Clean up animation class after animation completes
    setTimeout(() => {
      targetStep.classList.remove('fade-in');
    }, 400);
  }

  // Update modal overflow behavior
  updateModalOverflow(stepName);

  // Scroll to top of modal content
  setTimeout(() => {
    const scrollContainer = document.querySelector('.dh-form-widget');

    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, 50); // Small delay to ensure DOM updates are complete

  // Progress bar removed - no longer needed

  // Update dynamic text based on form data
  await updateDynamicText();

  // Ensure consent status is preserved if user has already completed confirm-address step
  const stepOrder = [
    'pest-issue',
    'address',
    'confirm-address',
    'how-we-do-it',
    'quote-contact',
    'plan-comparison',
    'contact',
    'complete',
  ];
  const confirmAddressIndex = stepOrder.indexOf('confirm-address');
  const currentStepIndex = stepOrder.indexOf(stepName);

  // If current step is after confirm-address and consent was already confirmed, maintain it
  if (
    currentStepIndex > confirmAddressIndex &&
    widgetState.attributionData?.consent_status === 'confirmed'
  ) {
    // Consent status is already confirmed, no action needed - it will be preserved in partial saves
  }

  // Setup step-specific validation and event handlers
  setupStepValidation(stepName);

  // Note: Partial leads are now saved immediately when users interact with forms
  // (pest selection, address validation, contact info entry, plan selection)
  // rather than on step navigation to capture data in real-time

  // Save form progress to local storage
  if (
    typeof window.progressiveFormManager !== 'undefined' &&
    window.progressiveFormManager.saveFormStateToLocalStorage
  ) {
    try {
      window.progressiveFormManager.saveFormStateToLocalStorage();
    } catch (error) {
      console.warn('Failed to save form state to localStorage:', error);
    }
  }


  // Populate address fields when reaching address step
  if (stepName === 'address') {
    setTimeout(() => {
      if (typeof window.populateAddressFields === 'function') {
        window.populateAddressFields();
      }
    }, 0);
  }

  // Initialize floating labels only for new inputs in the current step
  setTimeout(() => {
    const currentStepInputs = targetStep.querySelectorAll(
      '.dh-floating-input .dh-form-input'
    );

    currentStepInputs.forEach(input => {
      // Check if this input already has event listeners by looking for a data attribute
      if (!input.hasAttribute('data-floating-initialized')) {
        // Mark as initialized
        input.setAttribute('data-floating-initialized', 'true');

        // Initial state check
        if (input.tagName.toLowerCase() === 'textarea') {
          updateTextareaLabel(input);
        } else {
          updateFloatingLabel(input);
        }

        // Add event listeners
        input.addEventListener('focus', () => {
          if (input.tagName.toLowerCase() === 'textarea') {
            updateTextareaLabel(input);
          } else {
            updateFloatingLabel(input);
          }
        });

        input.addEventListener('blur', () => {
          if (input.tagName.toLowerCase() === 'textarea') {
            updateTextareaLabel(input);
          } else {
            updateFloatingLabel(input);
          }
        });

        input.addEventListener('input', () => {
          if (input.tagName.toLowerCase() === 'textarea') {
            updateTextareaLabel(input);
          } else {
            updateFloatingLabel(input);
          }
        });
      }
    });
  }, 100);
};

// Geocode address using Google Places API
const geocodeAddress = async addressComponents => {
  const { street, city, state, zip } = addressComponents;

  // Build formatted address
  const formattedAddress = `${street}, ${city}, ${state} ${zip}`;

  try {
    // Get API key
    const apiKeyResponse = await fetch(
      config.baseUrl + '/api/google-places-key'
    );

    if (!apiKeyResponse.ok) {
      throw new Error(`API key request failed: ${apiKeyResponse.status}`);
    }

    const apiKeyData = await apiKeyResponse.json();

    if (!apiKeyData.apiKey) {
      throw new Error('Google API key not available');
    }

    const apiKey = apiKeyData.apiKey;

    // Use Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formattedAddress)}&key=${apiKey}`;

    const response = await fetch(geocodeUrl);

    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding API response:', data);
      throw new Error(
        `Geocoding failed: ${data.status || 'No results found'} for address: ${formattedAddress}`
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;


    return {
      success: true,
      latitude: location.lat,
      longitude: location.lng,
      formatted: result.formatted_address,
    };
  } catch (error) {
    console.error(
      'Geocoding error for address:',
      formattedAddress,
      'Error:',
      error
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

// Global functions for step navigation (exposed to window for onclick handlers)
const nextStep = async () => {
  const steps = [
    'pest-issue',
    'address',
    'confirm-address',
    'how-we-do-it',
    'quote-contact',
    'plan-comparison',
    'contact',
    'complete',
  ];
  const currentIndex = steps.indexOf(widgetState.currentStep);

  // Special handling for confirm-address step - validate service area before proceeding
  if (widgetState.currentStep === 'confirm-address') {
    const continueButton = document.getElementById('confirm-address-next');

    // Capture current address form values
    const streetInput = document.getElementById('confirm-street-input');
    const cityInput = document.getElementById('confirm-city-input');
    const stateInput = document.getElementById('confirm-state-input');
    const zipInput = document.getElementById('confirm-zip-input');

    const currentAddress = {
      street: streetInput?.value?.trim() || '',
      city: cityInput?.value?.trim() || '',
      state: stateInput?.value?.trim() || '',
      zip: zipInput?.value?.trim() || '',
    };

    // Check if address has been modified
    const addressModified =
      currentAddress.street !== widgetState.formData.addressStreet ||
      currentAddress.city !== widgetState.formData.addressCity ||
      currentAddress.state !== widgetState.formData.addressState ||
      currentAddress.zip !== widgetState.formData.addressZip;

    // Show loading state
    if (continueButton) {
      if (addressModified) {
        continueButton.innerHTML =
          'Geocoding address... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else {
        continueButton.innerHTML =
          'Validating area... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
      continueButton.disabled = true;
    }

    try {
      // If address was modified, geocode the new address first
      if (addressModified) {
        const geocodeResult = await geocodeAddress(currentAddress);

        if (!geocodeResult.success) {
          throw new Error(geocodeResult.error || 'Failed to geocode address');
        }

        // Update form data with new address and coordinates
        widgetState.formData.addressStreet = currentAddress.street;
        widgetState.formData.addressCity = currentAddress.city;
        widgetState.formData.addressState = currentAddress.state;
        widgetState.formData.addressZip = currentAddress.zip;
        widgetState.formData.address = geocodeResult.formatted;
        widgetState.formData.latitude = geocodeResult.latitude;
        widgetState.formData.longitude = geocodeResult.longitude;
      }

      // Update button text for validation phase
      if (continueButton) {
        continueButton.innerHTML =
          'Validating area... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }

      const validationResult = await validateServiceArea();

      // Capture consent status since user can't continue without checking the checkbox
      const consentCheckbox = document.getElementById(
        'confirm-address-consent-checkbox'
      );
      const consentStatus =
        consentCheckbox && consentCheckbox.checked
          ? 'confirmed'
          : 'not_provided';

      // Store consent in attribution data
      widgetState.attributionData.consent_status = consentStatus;

      // Save partial lead with consent status and final address confirmation
      try {
        const partialSaveResult = await savePartialLead(
          validationResult,
          'how-we-do-it' // Step user will navigate to
        );
        if (!partialSaveResult.success) {
          console.warn(
            'Failed to save address confirmation with consent:',
            partialSaveResult.error
          );
        }
      } catch (error) {
        console.warn('Error saving address confirmation:', error);
      }

      if (validationResult.served) {
        // User is still in service area, proceed to how-we-do-it step
        // Note: recommendedPlan was already set during pest selection and should not be changed
        showStep('how-we-do-it');
        setupStepValidation('how-we-do-it');
      } else {
        // User is no longer in service area, redirect to out-of-service step
        showStep('out-of-service');
        setupStepValidation('out-of-service');
      }
    } catch (error) {
      console.error('Address processing or validation error:', error);

      // Reset button on error and show error message
      if (continueButton) {
        continueButton.innerHTML =
          'Continue <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg>';
        continueButton.disabled = false;
      }

      alert(
        'There was an error processing your address. Please check the address and try again.'
      );
    }

    return; // Exit early for confirm-address handling
  }

  // Normal step navigation for other steps
  if (currentIndex >= 0 && currentIndex < steps.length - 1) {
    const nextStepName = steps[currentIndex + 1];
    showStep(nextStepName);

    // Set up form validation for the new step
    setupStepValidation(nextStepName);
  }
};

const previousStep = () => {
  // Handle dynamic back navigation based on the new branching flow
  const currentStep = widgetState.currentStep;
  let prevStep = null;

  switch (currentStep) {
    case 'pest-issue':
      prevStep = null; // First step, no previous
      break;
    case 'address':
      prevStep = 'pest-issue';
      break;
    case 'confirm-address':
      // When going back from confirm-address to address, reset the form state
      changeAddress();
      return; // changeAddress() handles navigation and setup
    case 'how-we-do-it':
      prevStep = 'confirm-address';
      break;
    case 'contact':
      // Contact step should go back to plan-comparison
      prevStep = 'plan-comparison';
      break;
    case 'quote-contact':
      prevStep = 'how-we-do-it';
      break;
    case 'plan-comparison':
      prevStep = 'quote-contact';
      break;
    case 'exit-survey':
      // Exit survey should go back to plan-comparison
      prevStep = 'plan-comparison';
      break;
    default:
      // Fallback for any other steps
      prevStep = 'pest-issue';
  }

  if (prevStep) {
    showStep(prevStep);
    setupStepValidation(prevStep);
  } else {
    // First step - close widget or do nothing
  }
};

// Field validation function
const validateField = field => {
  try {
    const fieldName = field.id || field.name;
    const value = field.value;
    let isValid = true;
    let errorMessage = '';
    let warningMessage = '';

    // Clear previous error
    delete widgetState.formState.validationErrors[fieldName];
    progressiveFormManager.clearFieldError(field);

    // Field-specific validation with enhanced rules
    switch (fieldName) {
      case 'email-input':
        if (value) {
          // Basic format validation
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          } else {
            // Advanced email validation
            const commonDomains = [
              'gmail.com',
              'yahoo.com',
              'hotmail.com',
              'outlook.com',
              'aol.com',
            ];
            const domain = value.split('@')[1]?.toLowerCase();

            // Check for common typos
            const possibleTypos = {
              'gmai.com': 'gmail.com',
              'gmial.com': 'gmail.com',
              'yahooo.com': 'yahoo.com',
              'hotmial.com': 'hotmail.com',
            };

            if (possibleTypos[domain]) {
              warningMessage = `Did you mean ${value.replace(domain, possibleTypos[domain])}?`;
            }

            // Check for missing TLD
            if (domain && !domain.includes('.')) {
              isValid = false;
              errorMessage = 'Please include the domain extension (e.g., .com)';
            }
          }
        }
        break;

      case 'phone-input':
      case 'quote-phone-input':
        if (value) {
          const cleanPhone = value.replace(/[\s\-\(\)]/g, '');

          if (!/^[\d\+]+$/.test(cleanPhone)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
          } else if (cleanPhone.length < 10) {
            isValid = false;
            errorMessage = 'Phone number must be at least 10 digits';
          } else if (cleanPhone.length > 15) {
            isValid = false;
            errorMessage = 'Phone number is too long';
          }
        }
        break;

      case 'quote-first-name-input':
      case 'quote-last-name-input':
        if (value) {
          if (value.trim().length < 2) {
            isValid = false;
            errorMessage = 'Please enter your full name';
          } else if (!/^[a-zA-Z\s\-\'\.\u00C0-\u017F]+$/.test(value)) {
            isValid = false;
            errorMessage = 'Name contains invalid characters';
          }
        }
        break;

      case 'quote-email-input':
        if (value) {
          // Basic format validation
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          }
        }
        break;

      case 'name-input':
        if (value) {
          if (value.trim().length < 2) {
            isValid = false;
            errorMessage = 'Please enter your full name';
          } else if (!/^[a-zA-Z\s\-\'\.]+$/.test(value)) {
            isValid = false;
            errorMessage = 'Name contains invalid characters';
          }
        }
        break;

      default:
        // Generic validation for other fields
        if (field.hasAttribute('required') && !value.trim()) {
          isValid = false;
          errorMessage = 'This field is required';
        }
    }

    // Handle validation results
    if (!isValid) {
      widgetState.formState.validationErrors[fieldName] = errorMessage;
      progressiveFormManager.showFieldError(field, errorMessage);
    } else if (warningMessage) {
      progressiveFormManager.showFieldWarning(field, warningMessage);
    }

    return isValid;
  } catch (error) {
    console.error('Field validation error:', error);
    return false;
  }
};

// Function to switch back to address search mode
const changeAddress = () => {
  // Clear form data related to address
  widgetState.formData.address = '';
  widgetState.formData.addressStreet = '';
  widgetState.formData.addressCity = '';
  widgetState.formData.addressState = '';
  widgetState.formData.addressZip = '';
  widgetState.formData.latitude = '';
  widgetState.formData.longitude = '';

  // Navigate back to address step
  showStep('address');
  setupStepValidation('address');

  // Reset address form to search mode
  const addressDisplayMode = document.getElementById('address-display-mode');
  if (addressDisplayMode) {
    addressDisplayMode.style.display = 'none';
  }

  const addressSearchMode = document.getElementById('address-search-mode');
  if (addressSearchMode) {
    addressSearchMode.style.display = 'block';
  }

  // Clear and focus the search input
  const searchInput = document.getElementById('address-search-input');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }

  // Hide any suggestions
  const suggestions = document.getElementById('address-suggestions');
  if (suggestions) {
    suggestions.style.display = 'none';
    suggestions.innerHTML = '';
  }

  // Reset the "Next" button state (legacy - not used in new flow)
  const addressNext = document.getElementById('address-next');
  if (addressNext) {
    addressNext.disabled = true;
    addressNext.classList.add('disabled');
    addressNext.textContent = 'Continue';
  }

  // Reset the service area check button state
  const checkServiceAreaBtn = document.getElementById('check-service-area-btn');
  if (checkServiceAreaBtn) {
    checkServiceAreaBtn.disabled = true;
    checkServiceAreaBtn.classList.add('disabled');
    checkServiceAreaBtn.innerHTML =
      'Check Service Area <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
};

// Service area validation function
const validateServiceArea = async () => {
  const { latitude, longitude } = widgetState.formData;
  const zipCode = widgetState.formData.addressZip;

  if (!latitude || !longitude) {
    console.warn('No coordinates available for service area validation');
    return { served: false, error: 'No coordinates available' };
  }

  try {
    const requestData = {
      companyId: config.companyId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      zipCode: zipCode,
    };

    const response = await fetch(
      `${config.baseUrl}/api/service-areas/validate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        'Service area validation - API error:',
        response.status,
        errorText
      );
      throw new Error(`Service area validation failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Service area validation error:', error);
    return { served: false, error: error.message };
  }
};

// Service area check button handler
const checkServiceAreaButton = async () => {
  // Validate that an address has been selected
  if (!widgetState.formData.address) {
    alert('Please select an address first.');
    return;
  }

  const checkBtn = document.getElementById('check-service-area-btn');

  // Show loading state
  if (checkBtn) {
    checkBtn.innerHTML =
      'Checking area... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    checkBtn.disabled = true;
  }

  try {
    const validationResult = await validateServiceArea();

    // Save partial lead immediately after address validation with actual service area results
    try {
      const partialSaveResult = await savePartialLead(
        validationResult,
        'confirm-address' // Step user will navigate to
      );
      if (!partialSaveResult.success) {
        console.warn(
          'Failed to save address validation:',
          partialSaveResult.error
        );
      }
    } catch (error) {
      console.warn('Error saving address validation:', error);
    }

    if (validationResult.served) {
      // User is in service area, navigate to confirm-address step
      showStep('confirm-address');
      setupStepValidation('confirm-address');
    } else {
      // User is out of service area, navigate to out-of-service step
      showStep('out-of-service');
      setupStepValidation('out-of-service');
    }
  } catch (error) {
    console.error('Service area validation error:', error);
    // Reset button on error
    if (checkBtn) {
      checkBtn.innerHTML =
        'Check Service Area <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      checkBtn.disabled = false;
    }
    alert('There was an error checking your service area. Please try again.');
  }
};

// Function to return to homepage (pest selection step)
const returnToHomepage = () => {
  // Clear form data to reset the widget state
  widgetState.formData = {
    pestType: '',
    pestIcon: '',
    pestBackgroundImage: '',
    address: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    latitude: null,
    longitude: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    startDate: '',
    arrivalTime: '',
    offerPrice: null,
    recommendedPlan: null,
  };

  // Navigate to the pest selection step
  showStep('pest-issue');
  setupStepValidation('pest-issue');
};

// Make returnToHomepage globally accessible
window.returnToHomepage = returnToHomepage;

// Setup calendar icon click functionality
const setupCalendarIconClick = () => {
  // Setup click handler for calendar icons to open date picker
  document.addEventListener('click', event => {
    const calendarIcon = event.target.closest(
      '.dh-input-icon[data-type="calendar"]'
    );

    // Also check if clicking anywhere on a date input container
    const floatingInput = event.target.closest('.dh-floating-input');
    const isDateContainer =
      floatingInput && floatingInput.querySelector('input[type="date"]');
    const isDateInput = event.target.type === 'date';

    if (calendarIcon || (isDateContainer && !isDateInput)) {
      // Find the associated date input
      let container, dateInput;

      if (calendarIcon) {
        container = calendarIcon.closest('.dh-floating-input');
        dateInput = container?.querySelector('input[type="date"]');
      } else if (isDateContainer) {
        container = floatingInput;
        dateInput = container.querySelector('input[type="date"]');
      }

      if (dateInput) {
        event.preventDefault();
        event.stopPropagation();

        try {
          // Try modern showPicker() method first (Chrome 99+)
          if (
            dateInput.showPicker &&
            typeof dateInput.showPicker === 'function'
          ) {
            dateInput.showPicker();
          } else {
            // Fallback: focus and click the input
            dateInput.focus();

            // Small delay to ensure focus is set before clicking
            setTimeout(() => {
              dateInput.click();
            }, 10);
          }
        } catch (error) {
          // Fallback if showPicker() fails
          dateInput.focus();
          dateInput.click();
        }
      }
    }
  });
};

// Initialize calendar icon click when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCalendarIconClick);
} else {
  setupCalendarIconClick();
}

// Function to navigate to detailed quote with proper step tracking
const navigateToDetailedQuote = () => {
  
  // Navigate to quote-contact step
  showStep('quote-contact');
  setupStepValidation('quote-contact');
  
  // Update current step tracking
  widgetState.currentStep = 'quote-contact';
  
  // Trigger auto-save to persist the step change
  if (typeof triggerProgressSave === 'function') {
    triggerProgressSave();
  }
};

// Make function globally available
window.navigateToDetailedQuote = navigateToDetailedQuote;

// Note: selectPlan function is now defined inside plan-comparison setupStepValidation

// Generate FAQ section for a plan
const generateFaqSection = plan => {
  if (!plan.plan_faqs || plan.plan_faqs.length === 0) {
    return '';
  }

  const faqsHtml = plan.plan_faqs
    .map(
      (faq, index) => `
      <div class="dh-faq-item">
        <div class="dh-faq-header" onclick="toggleFaqItem(${index})">
          <h4 class="dh-faq-question">${faq.question}</h4>
          <span class="dh-faq-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M6 9L12 15L18 9" stroke="#515151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></span>
        </div>
        <div class="dh-faq-content" id="faq-content-${index}">
          <div class="dh-faq-answer">
            <p>${faq.answer}</p>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div class="dh-plan-faqs">
      <h3 class="dh-faqs-title">${plan.plan_name} FAQs</h3>
      <div class="dh-faqs-container">
        ${faqsHtml}
      </div>
    </div>
  `;
};

// Switch plan option from dropdown in comparison step
const switchPlanOption = planIndex => {
  const index = parseInt(planIndex);

  if (!window.comparisonPlansData || !window.comparisonPlansData[index]) {
    console.warn('Plan data not available for index:', index);
    return;
  }

  const selectedPlan = window.comparisonPlansData[index];

  // Update plan title
  const titleEl = document.querySelector('.dh-plan-title');
  if (titleEl) titleEl.textContent = selectedPlan.plan_name;

  // Update plan description
  const descEl = document.querySelector('.dh-plan-description');
  if (descEl) descEl.textContent = selectedPlan.plan_description || '';

  // Update features list
  const featuresListEl = document.querySelector('.dh-plan-features-list');
  if (featuresListEl && selectedPlan.plan_features) {
    const featuresHtml = selectedPlan.plan_features
      .map(
        feature =>
          `<li class="dh-plan-feature"><span class="dh-feature-checkmark"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><g clip-path="url(#clip0_6146_560)"><path d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916" stroke="#00AE42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 9.16659L10 11.6666L18.3333 3.33325" stroke="#00AE42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath d="clip0_6146_560"><rect width="20" height="20" fill="white"/></clipPath></defs></svg></span> ${feature}</li>`
      )
      .join('');
    featuresListEl.innerHTML = featuresHtml;
  }

  // Update pricing
  const priceLabelEl = document.querySelector('.dh-plan-price-label');
  if (
    priceLabelEl &&
    selectedPlan.recurring_price &&
    selectedPlan.billing_frequency
  ) {
    priceLabelEl.innerHTML = `Service starts at just $${selectedPlan.recurring_price}${window.formatBillingFrequencyFull ? window.formatBillingFrequencyFull(selectedPlan.billing_frequency) : formatBillingFrequency(selectedPlan.billing_frequency)}.`;
  }

  const priceDetailEl = document.querySelector('.dh-plan-price-detail');
  if (priceDetailEl && selectedPlan.initial_price) {
    priceDetailEl.textContent = `Initial setup fee of $${selectedPlan.initial_price}* to get started.`;
  }

  // Update recurring price in new pricing structure
  const recurringPriceEl = document.querySelector('.dh-plan-price-recurring');
  if (
    recurringPriceEl &&
    selectedPlan.recurring_price &&
    selectedPlan.billing_frequency
  ) {
    recurringPriceEl.innerHTML = `<span class="dh-price-dollar">$</span>${selectedPlan.recurring_price}<div class="dh-price-suffix">
      <span class="dh-price-asterisk">*</span>
      <div class="dh-price-frequency">${formatBillingFrequency(selectedPlan.billing_frequency)}</div>
    </div>`;
  }

  // Update initial only price
  const initialPriceEl = document.querySelector('.dh-plan-price-initial');
  if (initialPriceEl && selectedPlan.initial_price) {
    initialPriceEl.innerHTML = `Initial Only <span class="dh-price-dollar">$</span>${selectedPlan.initial_price}`;
  }

  // Update normally price
  const normallyPriceEl = document.querySelector('.dh-plan-price-normally');
  if (normallyPriceEl && selectedPlan.initial_price) {
    const normalPrice = (
      selectedPlan.initial_price + (selectedPlan.initial_discount || 0)
    ).toFixed(0);
    normallyPriceEl.innerHTML = `Normally <span class="dh-price-dollar">$</span><span class="dh-plan-price-crossed">${normalPrice}</span>`;
  }

  // Update plan image
  const imageEl = document.querySelector('.dh-plan-image-actual img');
  if (imageEl && selectedPlan.plan_image_url) {
    imageEl.src = selectedPlan.plan_image_url;
    imageEl.alt = selectedPlan.plan_name;
  }

  // Update action buttons
  const scheduleBtn = document.querySelector(
    '.dh-plan-actions .dh-form-btn-primary'
  );
  if (scheduleBtn) {
    scheduleBtn.setAttribute(
      'onclick',
      `selectPlan('${selectedPlan.id || 'selected'}', '${selectedPlan.plan_name}')`
    );
  }

  // Update recommendation badge visibility
  const recommendationBadge = document.getElementById(
    'plan-recommendation-badge'
  );
  if (recommendationBadge) {
    if (index === 0) {
      recommendationBadge.style.display = 'block';
    } else {
      recommendationBadge.style.display = 'none';
    }
  }

  // Update FAQ section
  const faqContainer = document.getElementById('comparison-plan-faqs');
  if (faqContainer) {
    faqContainer.innerHTML = generateFaqSection(selectedPlan);
  }

  // Update disclaimer
  const disclaimerEl = document.querySelector('.dh-plan-price-disclaimer');
  if (disclaimerEl) {
    disclaimerEl.innerHTML =
      selectedPlan.plan_disclaimer ||
      '*Pricing may vary based on initial inspection findings and other factors.';
  }
};

// Toggle description read more/less functionality
window.toggleDescription = function (element) {
  // Find the container by traversing up the DOM tree
  let container = element.parentElement;
  
  // If we're inside .dh-description-full (for Read Less), go up one more level
  if (container && container.classList.contains('dh-description-full')) {
    container = container.parentElement;
  }
  
  if (!container) return; // Safety check
  
  const descriptionText = container.querySelector('.dh-description-text');
  const fullDescription = container.querySelector('.dh-description-full');
  const readMoreLink = container.querySelector('.dh-read-more-link');
  const readLessLink = container.querySelector('.dh-read-less-link');

  if (element.textContent === 'Read More') {
    // Show full description and switch to Read Less
    if (descriptionText) descriptionText.style.display = 'none';
    if (fullDescription) fullDescription.style.display = 'inline';
    if (readMoreLink) readMoreLink.style.display = 'none';
    if (readLessLink) readLessLink.style.display = 'inline';
  } else if (element.textContent === 'Read Less') {
    // Show truncated description and switch to Read More
    if (descriptionText) descriptionText.style.display = 'inline';
    if (fullDescription) fullDescription.style.display = 'none';
    if (readMoreLink) readMoreLink.style.display = 'inline';
    if (readLessLink) readLessLink.style.display = 'none';
  }
};

// Legacy function for backward compatibility
const showComparisonPlan = tabIndex => {
  switchPlanOption(tabIndex);
};

// Helper function to populate logo for any step by ID (legacy)
const populateStepLogo = logoElementId => {
  const logoElement = document.getElementById(logoElementId);
  if (logoElement && widgetState.widgetConfig?.branding?.logo_url) {
    populateSingleLogo(logoElement);
  }
};

// Helper function to populate a single logo element
const populateSingleLogo = logoElement => {
  if (logoElement && widgetState.widgetConfig?.branding?.logo_url) {
    // Create logo image with proper loading support
    const logoImg = document.createElement('img');
    logoImg.alt = 'Company Logo';
    logoImg.style.display = 'none';
    logoImg.onload = function () {
      logoImg.style.display = 'block';
    };

    logoImg.onerror = function () {
      console.warn(
        'Failed to load logo image:',
        widgetState.widgetConfig.branding.logo_url
      );
      logoImg.style.display = 'none';
    };

    // Clear existing content and add new image
    logoElement.innerHTML = '';
    logoElement.appendChild(logoImg);

    // Set src last to trigger loading
    logoImg.src = widgetState.widgetConfig.branding.logo_url;
  }
};

// Global function to populate all logos at once
const populateAllLogos = () => {
  const logoElements = document.querySelectorAll('.dh-pest-logo');
  logoElements.forEach(logoElement => {
    populateSingleLogo(logoElement);
  });
};

// Helper function to populate hero images for any step
const populateStepHero = (bgImageId, heroImageId) => {
  const bgImage = document.getElementById(bgImageId);
  const heroImage = document.getElementById(heroImageId);

  // Populate background image
  let backgroundImageUrl;

  // Skip background image for confirm-address step - it will be loaded with address imagery
  if (bgImageId === 'confirm-address-bg-image') {
    backgroundImageUrl = null;
  } else if (
    (bgImageId === 'address-bg-image' || bgImageId === 'offer-bg-image') &&
    typeof getPestBackgroundImage === 'function'
  ) {
    // For address and how-we-do-it steps, try to get pest-specific background image first
    backgroundImageUrl = getPestBackgroundImage();
  } else if (bgImageId === 'quote-bg-image') {
    // For quote-contact step, use the almost done background image
    backgroundImageUrl =
      widgetState.widgetConfig?.branding?.almostDoneBackgroundImage;
  } else {
    // For other steps, use the default pest background image
    backgroundImageUrl =
      widgetState.widgetConfig?.branding?.pestSelectBackgroundImage;
  }

  if (bgImage && backgroundImageUrl) {
    // Preload background image to handle large files
    const bgImg = new Image();
    bgImg.onload = function () {
      bgImage.style.backgroundImage = `url(${backgroundImageUrl})`;
    };
    bgImg.onerror = function () {
      console.warn(
        'Failed to load background image for',
        bgImageId,
        ':',
        backgroundImageUrl
      );
    };
    bgImg.src = backgroundImageUrl;
  }

  // Populate hero image (only for pest step)
  if (
    heroImage &&
    heroImageId === 'pest-hero-image' &&
    widgetState.widgetConfig?.branding?.hero_image_url
  ) {
    // Hide image initially
    heroImage.style.display = 'none';

    // Set up load event listener
    heroImage.onload = function () {
      heroImage.style.display = 'block';
      heroImage.classList.add('dh-fade-in-loaded');
    };

    // Set up error event listener
    heroImage.onerror = function () {
      console.warn(
        'Failed to load hero image:',
        widgetState.widgetConfig.branding.hero_image_url
      );
      // Keep image hidden if it fails to load
      heroImage.style.display = 'none';
    };

    // Set src last to trigger loading
    heroImage.src = widgetState.widgetConfig.branding.hero_image_url;
  }
};

// Setup step-specific event handlers and validation
const setupStepValidation = stepName => {
  // Handle global back button visibility
  const globalBackButton = document.getElementById('dh-global-back-button');
  if (globalBackButton) {
    if (stepName === 'pest-issue' || stepName === 'complete') {
      globalBackButton.classList.add('hidden');
    } else {
      globalBackButton.classList.remove('hidden');
    }
  }

  switch (stepName) {
    case 'pest-issue':
      // Populate logo, background image, and hero image
      populateAllLogos();
      populateStepHero('pest-bg-image', 'pest-hero-image');

      const pestOptions = document.querySelectorAll('.dh-pest-option');

      // Always clear existing selected states when step loads
      // Let populatePestIssueField() handle reapplying if needed
      if (pestOptions) {
        pestOptions.forEach(opt => {
          opt.classList.remove('selected', 'processing');
        });
      }

      if (pestOptions) {
        pestOptions.forEach(option => {
          option.setAttribute('data-listener-attached', 'true');
          option.addEventListener('click', async e => {
            // Prevent double-clicking if loading overlay is visible
            const pestLoadingEl = document.getElementById('pest-loading');
            if (pestLoadingEl && pestLoadingEl.style.display === 'flex') return;

            // Remove selected class from all options
            pestOptions.forEach(opt => {
              opt.classList.remove('selected');
            });

            // Find the parent pest option element
            const pestOption = e.target.closest('.dh-pest-option');
            if (!pestOption) {
              console.error('Could not find pest option element');
              return;
            }

            // Add selected class to clicked option
            pestOption.classList.add('selected');

            // Show centered loading overlay with animation
            showLoadingOverlay(pestLoadingEl);

            // Store selection
            const pestValue = pestOption.dataset.pest;
            widgetState.formData.pestType = pestValue;

            // Find and store the pest icon and background image
            const selectedPest = widgetState.widgetConfig?.pestOptions?.find(
              pest => pest.value === pestValue
            );
            widgetState.formData.pestIcon = selectedPest?.icon || '';
            widgetState.formData.pestBackgroundImage =
              selectedPest?.widget_background_image || '';

            // Fetch and store recommended plan immediately after pest selection
            try {
              const recommendedPlan = await getCheapestFullCoveragePlan(config.companyId, pestValue);
              if (recommendedPlan) {
                widgetState.formData.recommendedPlan = recommendedPlan;
                widgetState.formData.selectedPlan = recommendedPlan; // Default to recommended
                widgetState.formData.offerPrice = recommendedPlan.recurring_price;
                
              }
            } catch (error) {
              console.warn('Error fetching recommended plan for pest selection:', error);
            }

            // Save progress immediately with plan data
            try {
              const partialSaveResult = await savePartialLead(
                { served: false, status: 'unknown' }, // Service area unknown until address validated
                'pest-issue' // Step completed (pest selection)
              );
              if (!partialSaveResult.success) {
                console.warn(
                  'Failed to save pest selection:',
                  partialSaveResult.error
                );
              }
            } catch (error) {
              console.warn('Error saving pest selection:', error);
            }

            // Update dynamic text in background before step transition
            try {
              // Wait for both content updates AND minimum loading time
              await Promise.all([
                updateDynamicText(),
                createMinimumLoadingTime(1000), // Ensure loading shows for at least 1 second
              ]);

              // Update step completion tracking
              const completionStatus =
                progressiveFormManager.calculateStepCompletion();

              // Auto-advance to address validation step
              await showStep('address');
              setupStepValidation('address');

              // Hide loading overlay after everything is complete
              setTimeout(() => {
                hideLoadingOverlay(pestLoadingEl);
              }, 100); // Brief delay to ensure step transition is visible
            } catch (error) {
              console.error('Error updating dynamic text:', error);
              // Fallback: hide loading and proceed anyway
              hideLoadingOverlay(pestLoadingEl);
              await showStep('address');
              setupStepValidation('address');
            }
          });
        });
      }

      // Handle "View All Pests" button toggle
      const viewAllPestsButton = document.getElementById('view-all-pests-button');
      if (viewAllPestsButton) {
        let isExpanded = false;
        
        viewAllPestsButton.addEventListener('click', () => {
          const hiddenPests = document.querySelectorAll('.dh-pest-option-hidden');
          const visiblePests = document.querySelectorAll('.dh-pest-option:not(.dh-pest-option-hidden)');
          const pestSelection = document.querySelector('.dh-pest-selection');
          const viewAllContainer = document.querySelector('.dh-view-all-container');
          
          if (!isExpanded && hiddenPests.length > 0) {
            // Expanding: Show all pests
            isExpanded = true;
            
            // Update button text and icon
            viewAllPestsButton.innerHTML = `
              Show Less Pests <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M8 1.0769L1.52239 8.00002L8 14.9231" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            `;
            
            // Expand the pest selection container
            if (pestSelection) {
              pestSelection.classList.add('expanded');
            }
            
            // Animate the newly visible pests with staggered animation
            hiddenPests.forEach((pest, index) => {
              setTimeout(() => {
                pest.classList.remove('dh-pest-option-hidden');
                pest.classList.add('dh-pest-option-revealing');
                
                // Clean up the revealing class after animation completes
                setTimeout(() => {
                  pest.classList.remove('dh-pest-option-revealing');
                }, 400);
              }, index * 80); // Stagger by 80ms
            });
          } else if (isExpanded) {
            // Collapsing: Hide pests beyond the first 8
            isExpanded = false;
            
            // Update button text and icon back to original
            viewAllPestsButton.innerHTML = `
              View All Pests <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            `;
            
            // Collapse the pest selection container
            if (pestSelection) {
              pestSelection.classList.remove('expanded');
            }
            
            // Hide pests beyond the first 8 with staggered animation
            const allPestOptions = document.querySelectorAll('.dh-pest-option');
            for (let i = 8; i < allPestOptions.length; i++) {
              const pest = allPestOptions[i];
              setTimeout(() => {
                pest.classList.add('dh-pest-option-hidden');
              }, (i - 8) * 50); // Stagger the hiding animation
            }
          }
          
          // Re-attach event listeners to newly visible pest options after expand/collapse
          setTimeout(() => {
            const newPestOptions = document.querySelectorAll('.dh-pest-option:not([data-listener-attached])');
            newPestOptions.forEach(option => {
              option.setAttribute('data-listener-attached', 'true');
              option.addEventListener('click', async e => {
                // Prevent double-clicking if loading overlay is visible
                const pestLoadingEl = document.getElementById('pest-loading');
                if (pestLoadingEl && pestLoadingEl.style.display === 'flex') return;

                // Remove selected class from all options
                const allPestOptions = document.querySelectorAll('.dh-pest-option');
                allPestOptions.forEach(opt => {
                  opt.classList.remove('selected');
                });

                // Find the parent pest option element
                const pestOption = e.target.closest('.dh-pest-option');
                if (!pestOption) {
                  console.error('Could not find pest option element');
                  return;
                }

                // Add selected class and processing state
                pestOption.classList.add('selected', 'processing');

                // Get pest type from data attribute
                const pestType = pestOption.dataset.pest;

                // Store the pest type in form data
                widgetState.formData.pestType = pestType;

                // Show loading overlay
                showLoadingOverlay(pestLoadingEl);

                // Save progress immediately with plan data
                try {
                  const partialSaveResult = await savePartialLead(
                    { served: false, status: 'unknown' }, // Service area unknown until address validated
                    'pest-issue' // Step completed (pest selection)
                  );
                  if (!partialSaveResult.success) {
                    console.warn(
                      'Failed to save pest selection:',
                      partialSaveResult.error
                    );
                  }
                } catch (error) {
                  console.warn('Error saving pest selection:', error);
                }

                // Update dynamic text in background before step transition
                try {
                  // Wait for both content updates AND minimum loading time
                  await Promise.all([
                    updateDynamicText(),
                    createMinimumLoadingTime(1000), // Ensure loading shows for at least 1 second
                  ]);

                  // Update step completion tracking
                  const completionStatus =
                    progressiveFormManager.calculateStepCompletion();

                  // Auto-advance to address validation step
                  hideLoadingOverlay(pestLoadingEl);
                  await showStep('address');
                  setupStepValidation('address');
                } catch (error) {
                  console.error('Error updating dynamic content:', error);
                  // Still advance to next step even if dynamic content fails
                  hideLoadingOverlay(pestLoadingEl);
                  await showStep('address');
                  setupStepValidation('address');
                }
              });
            });
          }, 300); // Wait for animations to complete
        });
      }

      break;

    case 'address':
      // Populate logo and hero section
      populateAllLogos();
      populateStepHero('address-bg-image', 'address-hero-image');

      // Initialize service area check button to disabled state
      const checkServiceAreaBtn = document.getElementById(
        'check-service-area-btn'
      );
      if (checkServiceAreaBtn) {
        checkServiceAreaBtn.disabled = true;
        checkServiceAreaBtn.classList.add('disabled');
        checkServiceAreaBtn.innerHTML =
          'Search Now <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        // If address already exists (user returning to step), enable the button and populate fields
        if (widgetState.formData.address) {
          checkServiceAreaBtn.disabled = false;
          checkServiceAreaBtn.classList.remove('disabled');
          checkServiceAreaBtn.innerHTML =
            'Check Service Area <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          
          // Populate form fields when returning to address step
          setTimeout(() => {
            if (!widgetState.isRestoring && typeof window.populateFormFields === 'function') {
              window.populateFormFields();
            } else if (widgetState.isRestoring) {
            }
          }, 100);
        }
      }

      const searchInput = document.getElementById('address-search-input');
      const addressNext = document.getElementById('address-next');
      const addressSuggestions = document.getElementById('address-suggestions');

      if (searchInput && addressNext && addressSuggestions) {
        let searchTimeout = null;
        let currentResults = [];

        // Search addresses using configured API
        const searchAddresses = async query => {
          try {
            // Check if widget config has address API configuration
            const apiConfig = widgetState.widgetConfig?.addressApi;

            if (!apiConfig || !apiConfig.enabled) {
              // No API configured - use manual entry only
              hideSuggestions();
              return;
            }

            // Use configured API endpoint
            const response = await fetch(
              `${config.baseUrl}/api/widget/address-autocomplete`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  input: query,
                  companyId: config.companyId,
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              currentResults = data.suggestions || [];
              displaySuggestions(currentResults);
            } else {
              hideSuggestions();
            }
          } catch (error) {
            hideSuggestions();
          }
        };

        // Display address suggestions
        const displaySuggestions = results => {
          if (results.length === 0) {
            hideSuggestions();
            return;
          }

          addressSuggestions.innerHTML = results
            .map(
              (result, index) =>
                `<div class="dh-address-suggestion" data-index="${index}">${result.formatted}</div>`
            )
            .join('');

          addressSuggestions.style.display = 'block';

          // Add click handlers for suggestions
          const suggestions = addressSuggestions.querySelectorAll(
            '.dh-address-suggestion'
          );
          suggestions.forEach((suggestion, index) => {
            suggestion.addEventListener('click', () => {
              selectAddress(results[index]);
            });
          });
        };

        // Hide suggestions
        const hideSuggestions = () => {
          if (addressSuggestions) {
            addressSuggestions.style.display = 'none';
          }
        };

        // Select an address and switch to display mode
        const selectAddress = address => {
          // Store address data in form state
          widgetState.formData.addressStreet = address.street || '';
          widgetState.formData.addressCity = address.city || '';
          widgetState.formData.addressState = getStateCodeFromName(
            address.state
          );
          widgetState.formData.addressZip = address.postcode || '';
          widgetState.formData.address = address.formatted;
          widgetState.formData.latitude = address.lat;
          widgetState.formData.longitude = address.lon;

          // Enable the service area check button
          const checkServiceAreaBtn = document.getElementById(
            'check-service-area-btn'
          );
          if (checkServiceAreaBtn) {
            checkServiceAreaBtn.disabled = false;
            checkServiceAreaBtn.classList.remove('disabled');
          }

          // Update the search input to show selected address
          const searchInput = document.getElementById('address-search-input');
          if (searchInput) {
            searchInput.value = address.formatted;
          }

          // Hide suggestions
          hideSuggestions();

          // Trigger property lookup if available (for later use)
          if (typeof lookupPropertyData === 'function') {
            lookupPropertyData(address);
          }
        };

        // Update selected suggestion visual state
        const updateSelectedSuggestion = (suggestions, selectedIndex) => {
          suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('selected', index === selectedIndex);
          });
        };

        // Address search input functionality
        searchInput.addEventListener('input', e => {
          const value = e.target.value.trim();

          // Clear previous timeout
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }

          if (value.length < 3) {
            hideSuggestions();
            return;
          }

          // Debounce API calls
          searchTimeout = setTimeout(() => {
            searchAddresses(value);
          }, 300);
        });

        // Handle clicking outside to close suggestions
        document.addEventListener('click', e => {
          if (
            !searchInput.contains(e.target) &&
            !addressSuggestions.contains(e.target)
          ) {
            hideSuggestions();
          }
        });

        // Keyboard navigation for suggestions
        searchInput.addEventListener('keydown', e => {
          const suggestions = addressSuggestions.querySelectorAll(
            '.dh-address-suggestion'
          );
          const selected = addressSuggestions.querySelector(
            '.dh-address-suggestion.selected'
          );
          let selectedIndex = selected
            ? Array.from(suggestions).indexOf(selected)
            : -1;

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
            updateSelectedSuggestion(suggestions, selectedIndex);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelectedSuggestion(suggestions, selectedIndex);
          } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            if (currentResults[selectedIndex]) {
              selectAddress(currentResults[selectedIndex]);
            }
          } else if (e.key === 'Escape') {
            hideSuggestions();
          }
        });
      }
      break;

    case 'confirm-address':
      // Populate logo and hero section
      populateAllLogos();
      populateStepHero(
        'confirm-address-bg-image',
        'confirm-address-hero-image'
      );

      // Populate mobile background image with address imagery if available, fallback to pest image
      const mobileImage = document.getElementById(
        'confirm-address-mobile-bg-image'
      );
      if (mobileImage) {
        // First try to use address background imagery if address data is available
        if (
          widgetState.formData.address &&
          widgetState.formData.latitude &&
          widgetState.formData.longitude &&
          typeof loadAddressBackgroundImagery === 'function'
        ) {
          const addressData = {
            full_address: widgetState.formData.address,
            street: widgetState.formData.addressStreet,
            city: widgetState.formData.addressCity,
            state: widgetState.formData.addressState,
            postcode: widgetState.formData.addressZip,
            lat: widgetState.formData.latitude,
            lon: widgetState.formData.longitude,
          };

          // Create a temporary background element to get the image URL
          const tempBgElement = document.createElement('div');
          tempBgElement.id = 'temp-mobile-bg';
          tempBgElement.style.display = 'none';
          document.body.appendChild(tempBgElement);

          // Load address imagery and then copy to mobile image
          loadAddressBackgroundImagery(addressData, 'temp-mobile-bg')
            .then(() => {
              const bgStyle = tempBgElement.style.backgroundImage;
              if (bgStyle && bgStyle !== 'none') {
                // Extract URL from background-image CSS property
                const urlMatch = bgStyle.match(/url\(["']?([^"')]+)["']?\)/);
                if (urlMatch && urlMatch[1]) {
                  mobileImage.src = urlMatch[1];
                }
              }
              // Clean up temp element
              document.body.removeChild(tempBgElement);
            })
            .catch(() => {
              // Clean up temp element on error
              document.body.removeChild(tempBgElement);
              // Fallback to pest background image
              if (typeof getPestBackgroundImage === 'function') {
                const pestBgUrl = getPestBackgroundImage();
                if (pestBgUrl) {
                  mobileImage.src = pestBgUrl;
                }
              }
            });
        } else {
          // Fallback to pest background image if no address data
          if (typeof getPestBackgroundImage === 'function') {
            const pestBgUrl = getPestBackgroundImage();
            if (pestBgUrl) {
              mobileImage.src = pestBgUrl;
            }
          }
        }
      }

      // Populate all form fields and setup confirm-address step
      setTimeout(() => {
        
        // Skip field population if we're in restoration mode (will be handled by session restoration)
        if (!widgetState.isRestoring && typeof window.populateFormFields === 'function') {
          window.populateFormFields();
        } else if (widgetState.isRestoring) {
        }

        // Load address background imagery if available
        if (
          widgetState.formData.address &&
          widgetState.formData.latitude &&
          widgetState.formData.longitude &&
          typeof loadAddressBackgroundImagery === 'function'
        ) {
          const addressData = {
            formatted: widgetState.formData.address,
            street: widgetState.formData.addressStreet,
            city: widgetState.formData.addressCity,
            state: widgetState.formData.addressState,
            postcode: widgetState.formData.addressZip,
            lat: widgetState.formData.latitude,
            lon: widgetState.formData.longitude,
          };
          loadAddressBackgroundImagery(addressData, 'confirm-address-bg-image');
        }

        // Populate company name in consent checkbox
        const companyName = widgetState.widgetConfig?.branding?.companyName || 'Company Name';
        const companyNameElements = [
          document.getElementById('confirm-address-company-name'),
          document.getElementById('confirm-address-company-name-2'),
          document.getElementById('confirm-address-company-name-3'),
        ];
        companyNameElements.forEach(element => {
          if (element) {
            element.textContent = companyName;
          }
        });

        // Setup consent checkbox validation for continue button
        const consentCheckbox = document.getElementById('confirm-address-consent-checkbox');
        const continueButton = document.getElementById('confirm-address-next');

        if (consentCheckbox && continueButton) {
          continueButton.disabled = true;
          continueButton.style.opacity = '0.5';
          continueButton.style.cursor = 'not-allowed';
          continueButton.style.backgroundColor = '#9ca3af';

          const updateButtonState = () => {
            if (consentCheckbox.checked) {
              continueButton.disabled = false;
              continueButton.style.opacity = '1';
              continueButton.style.cursor = 'pointer';
              continueButton.style.backgroundColor = '';
            } else {
              continueButton.disabled = true;
              continueButton.style.opacity = '0.5';
              continueButton.style.cursor = 'not-allowed';
              continueButton.style.backgroundColor = '#9ca3af';
            }
          };

          consentCheckbox.addEventListener('change', updateButtonState);
          updateButtonState();
        }
      }, 150);

      break;

    case 'how-we-do-it':
      // Populate logo and hero section (keep existing background image functionality)
      populateAllLogos();
      populateStepHero('offer-bg-image', 'offer-hero-image');

      // Populate How We Do It content
      const populateHowWeDoItContent = () => {
        const pestSlug = widgetState.formData.pestType;
        const pestConfig = widgetState.widgetConfig?.pestOptions?.find(
          pest => pest.value === pestSlug
        );

        // Get elements
        const descriptionEl = document.getElementById(
          'how-we-do-it-description'
        );
        const interiorImageEl = document.getElementById(
          'how-we-do-it-interior-image'
        );
        const subspeciesSectionEl =
          document.getElementById('subspecies-section');
        const subspeciesHeadingEl =
          document.getElementById('subspecies-heading');
        const subspeciesListEl = document.getElementById('subspecies-list');
        const safetyTextEl = document.getElementById('safety-message-text');

        // Populate description text
        if (descriptionEl && pestConfig?.how_we_do_it_text) {
          descriptionEl.textContent = pestConfig.how_we_do_it_text;
        } else if (descriptionEl) {
          descriptionEl.textContent =
            'We use professional-grade treatments tailored to your specific pest problem, ensuring effective elimination and prevention.';
        }

        // Populate interior image (handle both property name formats)
        const interiorImageUrl =
          widgetState.widgetConfig?.branding?.howWeDoItInteriorImage ||
          widgetState.widgetConfig?.branding?.how_we_do_it_interior_image;

        if (interiorImageEl && interiorImageUrl) {
          interiorImageEl.src = interiorImageUrl;
          interiorImageEl.style.display = 'block';
        }

        // Populate subspecies section
        if (
          pestConfig &&
          pestConfig.subspecies &&
          pestConfig.subspecies.length > 0
        ) {
          // Update heading with pest name
          if (subspeciesHeadingEl) {
            subspeciesHeadingEl.textContent = `Some common ${pestConfig.label.toLowerCase()} include:`;
          }

          // Populate subspecies list
          if (subspeciesListEl) {
            subspeciesListEl.innerHTML = pestConfig.subspecies
              .map(
                subspecies =>
                  `<div class="dh-subspecies-item">${subspecies}</div>`
              )
              .join('');
          }

          // Show subspecies section
          if (subspeciesSectionEl) {
            subspeciesSectionEl.style.display = 'block';
          }
        }

        // Update safety message with pest name
        if (safetyTextEl && pestConfig) {
          safetyTextEl.innerHTML = `Oh, and don&apos;t worry, our ${pestConfig.label.toLowerCase()} treatments are people and pet-friendly!`;
        }

        // Set pet safety image source using config.baseUrl
        const petSafetyImageEl = document.getElementById('pet-safety-image');
        if (petSafetyImageEl && config.baseUrl) {
          petSafetyImageEl.src = config.baseUrl + '/widget-pet-image.png';
        }
      };

      // Populate content
      populateHowWeDoItContent();

      // Update step headings
      if (typeof updateStepHeadings === 'function') {
        updateStepHeadings();
      }
      break;

    case 'contact':
      // Populate logo and hero section
      populateAllLogos();
      // Use location background image like confirm-address step
      populateStepHero('confirm-address-bg-image', 'contact-hero-image');

      // Contact step (Schedule Service) - setup floating labels and validation
      const contactInputs = ['start-date-input', 'arrival-time-input'];

      contactInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
          // Setup event listeners for floating labels
          input.addEventListener('focus', () => updateFloatingLabel(input));
          input.addEventListener('blur', () => updateFloatingLabel(input));
          input.addEventListener('input', () => updateFloatingLabel(input));

          // For select elements, also listen to change event
          if (input.tagName.toLowerCase() === 'select') {
            input.addEventListener('change', () => updateFloatingLabel(input));
          }

          // Initial floating label state
          updateFloatingLabel(input);
        }
      });

      // Populate contact details and service address information
      populateContactDetailsDisplay();

      // Copy the existing address background image from confirm-address step
      setTimeout(() => {
        // Try to find the existing background image from confirm-address step
        const existingAddressBg = document.getElementById(
          'confirm-address-bg-image'
        );
        const contactBg = document.getElementById('contact-bg-image');

        if (contactBg) {
          // First priority: Use stored address background URL if available
          if (widgetState.addressBackgroundUrl) {
            contactBg.style.backgroundImage = `url('${widgetState.addressBackgroundUrl}')`;
            contactBg.style.backgroundSize = 'cover';
            contactBg.style.backgroundPosition = 'center';
            contactBg.style.backgroundRepeat = 'no-repeat';
          }
          // Second priority: try to copy from existing address background element
          else {
            let backgroundImageUrl = '';

            // Look for background image in various address step elements
            const addressElements = [
              document.querySelector(
                '#dh-step-confirm-address #confirm-address-bg-image'
              ),
              document.querySelector('#dh-step-address #address-bg-image'),
              document.querySelector('[id*="confirm-address-bg-image"]'),
              document.querySelector('[id*="address-bg-image"]'),
            ];

            for (const element of addressElements) {
              if (
                element &&
                element.style.backgroundImage &&
                element.style.backgroundImage !== 'none'
              ) {
                backgroundImageUrl = element.style.backgroundImage;
                break;
              }
            }

            // If we found an existing background image, use it
            if (backgroundImageUrl) {
              contactBg.style.backgroundImage = backgroundImageUrl;
              contactBg.style.backgroundSize = 'cover';
              contactBg.style.backgroundPosition = 'center';
              contactBg.style.backgroundRepeat = 'no-repeat';
            }
            // Last resort: load it fresh if we have address data
            else if (
              widgetState.formData.address &&
              widgetState.formData.latitude &&
              widgetState.formData.longitude &&
              typeof loadAddressBackgroundImagery === 'function'
            ) {
              const addressData = {
                formatted: widgetState.formData.address,
                street: widgetState.formData.addressStreet,
                city: widgetState.formData.addressCity,
                state: widgetState.formData.addressState,
                postcode: widgetState.formData.addressZip,
                lat: widgetState.formData.latitude,
                lon: widgetState.formData.longitude,
              };
              // Load street view as background image
              loadAddressBackgroundImagery(addressData, 'contact-bg-image');
            }
          }
        }
      }, 200);

      // Pre-populate form fields with any available contact information
      setTimeout(() => {
        populateContactFields();
        // Use global populateFormFields function to ensure all fields are populated
        if (typeof window.populateFormFields === 'function') {
          window.populateFormFields();
        }
      }, 50);
      break;

    case 'quote-contact':
      // Populate logo and hero section
      populateAllLogos();
      populateStepHero('quote-bg-image', 'quote-hero-image');

      // Populate form fields with any existing data
      setTimeout(() => {
        if (typeof window.populateFormFields === 'function') {
          window.populateFormFields();
        }
      }, 100);

      // Quote contact form validation setup - form is submitted via proceedToQuoteWithValidation function
      // Set up basic field validation for real-time feedback
      const quoteInputs = [
        'quote-first-name-input',
        'quote-last-name-input',
        'quote-email-input',
        'quote-phone-input',
      ];

      quoteInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
          input.addEventListener('blur', () => validateField(input));
          input.addEventListener('input', () => {
            // Clear error on input if there was one
            if (widgetState.formState.validationErrors[inputId]) {
              progressiveFormManager.clearFieldError(input);
              delete widgetState.formState.validationErrors[inputId];
            }
          });
        }
      });

      // Pre-populate form fields with any available contact information
      setTimeout(() => {
        populateContactFields();
      }, 50);
      break;

    case 'plan-comparison':
      // Populate logo and hero section
      populateAllLogos();
      populateStepHero(
        'plan-comparison-bg-image',
        'plan-comparison-hero-image'
      );

      // Load Google Reviews data for the comparison step
      const loadComparisonReviews = async () => {
        const reviewsContainer = document.getElementById(
          'comparison-reviews-container'
        );
        const reviewsLoading = document.getElementById(
          'comparison-reviews-loading'
        );
        const reviewsDisplay = document.getElementById(
          'comparison-reviews-display'
        );
        const reviewsCount = document.getElementById(
          'comparison-reviews-count'
        );
        const starElements = document.querySelectorAll(
          '#comparison-reviews-display .dh-star'
        );

        if (!reviewsContainer) {
          return;
        }

        try {
          // Start with loading state visible, content hidden
          if (reviewsLoading) reviewsLoading.style.display = 'flex';
          if (reviewsDisplay) reviewsDisplay.style.display = 'none';

          // Fetch reviews data from API
          const response = await fetch(
            `${config.baseUrl}/api/google-places/reviews/${config.companyId}`
          );

          if (!response.ok) {
            console.warn(
              'Failed to fetch reviews data, hiding reviews section'
            );
            // Hide entire container on failure
            reviewsContainer.style.display = 'none';
            return;
          }

          const data = await response.json();

          // Validate response data - hide if no reviews or no listings configured
          if (
            !data.rating ||
            !data.reviewCount ||
            data.reviewCount === 0 ||
            data.source === 'no_listings'
          ) {
            console.warn('No reviews data available, hiding reviews section');
            reviewsContainer.style.display = 'none';
            return;
          }

          const rating = data.rating;
          const reviewCount = data.reviewCount;

          // Update review count text
          if (reviewsCount) {
            reviewsCount.textContent = `${reviewCount.toLocaleString()} Google Reviews`;
          }

          // Update star display based on rating
          const fullStars = Math.floor(rating);
          const hasHalfStar = rating % 1 >= 0.5;

          starElements.forEach((star, index) => {
            const path = star.querySelector('path');
            if (!path) return;

            if (index < fullStars) {
              // Full star
              path.style.fill = '#F68C1A';
            } else if (index === fullStars && hasHalfStar) {
              // Half star (for now, show as full - could implement half star SVG later)
              path.style.fill = '#F68C1A';
            } else {
              // Empty star
              path.style.fill = '#E5E5E5';
            }
          });

          // Hide loading state and show content
          if (reviewsLoading) reviewsLoading.style.display = 'none';
          if (reviewsDisplay) reviewsDisplay.style.display = 'flex';
        } catch (error) {
          console.error('Error loading reviews data:', error);
          // Hide entire container on error
          reviewsContainer.style.display = 'none';
        }
      };

      // Load Google Reviews data
      loadComparisonReviews();

      const comparisonNoThanksBtn = document.getElementById(
        'comparison-no-thanks'
      );

      // Load service plans for comparison with tabbed interface
      const loadComparisonPlans = async () => {
        try {
          const comparisonPlanContent = document.getElementById(
            'comparison-plan-content'
          );
          const comparisonPlanLoading = document.getElementById(
            'comparison-plan-loading'
          );

          if (!comparisonPlanContent) return;

          let suggestions = null;

          // Check if we have pre-loaded data from quote form submission
          if (widgetState.formData.planComparisonData) {
            suggestions = widgetState.formData.planComparisonData;
          } else {
            // Guard: Don't call API if no pest is selected
            if (!widgetState.formData.pestType) {
              console.warn('Skipping comparison plans: no pest selected yet');
              return;
            }

            // Show loading state for fallback API call
            if (comparisonPlanLoading) {
              comparisonPlanLoading.style.display = 'block';
            }

            // Fallback: Get suggested plans via API if no pre-loaded data
            const response = await fetch(
              config.baseUrl + '/api/widget/suggested-plans',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  companyId: config.companyId,
                  selectedPests: [widgetState.formData.pestType],
                }),
              }
            );

            const data = await response.json();

            // Hide loading state
            if (comparisonPlanLoading) {
              comparisonPlanLoading.style.display = 'none';
            }

            if (
              data.success &&
              data.suggestions &&
              data.suggestions.length > 0
            ) {
              suggestions = data.suggestions;
            }
          }

          if (suggestions && suggestions.length > 0) {
            // Limit to first 3 plans (best matches)
            const plans = suggestions.slice(0, 3);

            // Generate content HTML for first plan (active by default)
            const activeContent = generatePlanContent(plans[0]);

            // Update DOM
            comparisonPlanContent.innerHTML = activeContent;

            // Store plans data for dropdown switching
            window.comparisonPlansData = plans;

            // Populate dropdown options
            const dropdown = document.getElementById('plan-selection-dropdown');
            if (dropdown) {
              const dropdownOptions = plans
                .map((plan, index) => {
                  return `<option value="${index}">${plan.plan_name}</option>`;
                })
                .join('');
              dropdown.innerHTML = dropdownOptions;
            }

            // Show recommendation badge for the first plan
            setTimeout(() => {
              const recommendationBadge = document.getElementById(
                'plan-recommendation-badge'
              );
              if (recommendationBadge) {
                recommendationBadge.style.display = 'block';
              }
            }, 0);

            // Populate initial FAQ section for the first plan
            const faqContainer = document.getElementById(
              'comparison-plan-faqs'
            );
            if (faqContainer && plans[0]) {
              faqContainer.innerHTML = generateFaqSection(plans[0]);
            }
          } else {
            comparisonPlanContent.innerHTML = `
              <div class="dh-no-plans">
                <p>No service plans available at this time.</p>
                <p>Please contact us directly for a custom quote.</p>
              </div>
            `;
          }
        } catch (error) {
          console.error('Error loading comparison plans:', error);
          if (comparisonPlanContent) {
            comparisonPlanContent.innerHTML = `
              <div class="dh-error-state">
                <p>Unable to load service plans.</p>
                <p>Please try again or contact us directly.</p>
              </div>
            `;
          }
        }
      };

      // Generate detailed content for a single plan (without dropdown to avoid regeneration issues)
      const generatePlanContentOnly = plan => {
        const featuresHtml = plan.plan_features
          .map(
            feature =>
              `<li class="dh-plan-feature"><span class="dh-feature-checkmark"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><g clip-path="url(#clip0_6146_560)"><path d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916" stroke="#00AE42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 9.16659L10 11.6666L18.3333 3.33325" stroke="#00AE42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath d="clip0_6146_560"><rect width="20" height="20" fill="white"/></clipPath></defs></svg></span> ${feature}</li>`
          )
          .join('');

        // Truncate description logic - 124 characters max
        const fullDescription = plan.plan_description || '';
        const maxLength = 124;
        const shouldTruncate = fullDescription.length > maxLength;
        const truncatedDescription = shouldTruncate
          ? fullDescription.substring(0, maxLength)
          : fullDescription;

        const descriptionHtml = shouldTruncate
          ? `<span class="dh-description-text">${truncatedDescription}...</span> <span class="dh-read-more-link" onclick="toggleDescription(this)">Read More</span><span class="dh-description-full" style="display: none;">${fullDescription} <span class="dh-read-less-link" onclick="toggleDescription(this)" style="display: none;">Read Less</span></span>`
          : `<span class="dh-description-text">${fullDescription}</span>`;

        return `
          <div class="dh-plan-details">
            <div class="dh-plan-content-grid">
              <div class="dh-plan-info">
                <h3 class="dh-plan-title">${plan.plan_name}</h3>
                <p class="dh-plan-description">${descriptionHtml}</p>
                
                <div class="dh-plan-included">
                  <ul class="dh-plan-features-list">
                    ${featuresHtml}
                  </ul>
                </div>
              </div>
              ${
                plan.plan_image_url
                  ? `
              <div class="dh-plan-visual">
                <div class="dh-plan-image-container">
                  <div class="dh-plan-image-actual">
                    <img src="${plan.plan_image_url}" alt="${plan.plan_name}" style="object-fit: cover;" />
                  </div>
                </div>
              </div>
              `
                  : ''
              }
              <div class="dh-plan-pricing">
                <span class="dh-plan-price-starting">Starting at:</span>
                <div class="dh-plan-price-container">
                  <div class="dh-plan-price-left">
                    <div class="dh-plan-price-recurring">
                      <span class="dh-price-dollar">$</span>${plan.recurring_price}<div class="dh-price-suffix">
                        <span class="dh-price-asterisk">*</span>
                        <div class="dh-price-frequency">${formatBillingFrequency(plan.billing_frequency)}</div>
                      </div>
                    </div>
                  </div>
                  <div class="dh-plan-price-right">
                    <div class="dh-plan-price-initial">Initial Only <span class="dh-price-dollar">$</span><span class="dh-price-number">${plan.initial_price}</span></div>
                    <div class="dh-plan-price-normally">Normally <span class="dh-price-dollar">$</span><span class="dh-plan-price-crossed">${(plan.initial_price + (plan.initial_discount || 0)).toFixed(0)}</span></div>
                  </div>
                </div>
                
                <div id="plan-selection-placeholder">
                  <!-- Dropdown will be inserted here -->
                </div>
                
                <div class="dh-plan-price-disclaimer">${plan.plan_disclaimer || '<strong>*Initial required to start service.</strong> Save over 30% on your intial with our internet special pricing. Prices may vary slightly depending on your home layout and service requirements. Your service technician will discuss your specific situation in detail before starting.'}</div>
              </div>
            </div>
          </div>

          <div class="dh-plan-actions">
            <button class="dh-form-btn dh-form-btn-primary" onclick="selectPlan('${plan.id || 'selected'}', '${plan.plan_name}')">
              Book Now! <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="dh-form-btn plan-no-thanks" onclick="declinePlanComparison()">
              No Thanks <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        `;
      };

      // Generate dropdown HTML separately
      const generateDropdownHtml = (selectedIndex = 0) => {
        if (!window.comparisonPlansData) return '';

        const dropdownOptions = window.comparisonPlansData
          .map((plan, idx) => {
            return `<option value="${idx}">${plan.plan_name}</option>`;
          })
          .join('');

        return `
          <div class="dh-plan-selection-section">
            <label class="dh-plan-selection-label">Available Options</label>
            <select class="dh-plan-selection-dropdown" id="plan-selection-dropdown" onchange="switchPlanOption(this.value)">
              ${dropdownOptions}
            </select>
          </div>
        `;
      };

      // Generate detailed content for a single plan (with dropdown for initial load)
      const generatePlanContent = plan => {
        const featuresHtml = plan.plan_features
          .map(
            feature =>
              `<li class="dh-plan-feature"><span class="dh-feature-checkmark"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><g clip-path="url(#clip0_6146_560)"><path d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916" stroke="#00AE42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 9.16659L10 11.6666L18.3333 3.33325" stroke="#00AE42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath d="clip0_6146_560"><rect width="20" height="20" fill="white"/></clipPath></defs></svg></span> ${feature}</li>`
          )
          .join('');

        // Truncate description logic - 124 characters max
        const fullDescription = plan.plan_description || '';
        const maxLength = 124;
        const shouldTruncate = fullDescription.length > maxLength;
        const truncatedDescription = shouldTruncate
          ? fullDescription.substring(0, maxLength)
          : fullDescription;

        const descriptionHtml = shouldTruncate
          ? `<span class="dh-description-text">${truncatedDescription}...</span> <span class="dh-read-more-link" onclick="toggleDescription(this)">Read More</span><span class="dh-description-full" style="display: none;">${fullDescription} <span class="dh-read-less-link" onclick="toggleDescription(this)" style="display: none;">Read Less</span></span>`
          : `<span class="dh-description-text">${fullDescription}</span>`;

        return `
          <div class="dh-plan-details">
            <div class="dh-plan-content-grid">
              <div class="dh-plan-info">
                <div class="dh-plan-recommendation-badge" id="plan-recommendation-badge" style="display: none;">
                  <span class="dh-recommendation-text">Recommended</span>
                </div>
                <h3 class="dh-plan-title">${plan.plan_name}</h3>
                <p class="dh-plan-description">${descriptionHtml}</p>
                
                <div class="dh-plan-included">
                  <ul class="dh-plan-features-list">
                    ${featuresHtml}
                  </ul>
                </div>
              </div>
              ${
                plan.plan_image_url
                  ? `
              <div class="dh-plan-visual">
                <div class="dh-plan-image-container">
                  <div class="dh-plan-image-actual">
                    <img src="${plan.plan_image_url}" alt="${plan.plan_name}" style="object-fit: cover;" />
                  </div>
                </div>
              </div>
              `
                  : ''
              }
              <div class="dh-plan-pricing">
                <span class="dh-plan-price-starting">Starting at:</span>
                <div class="dh-plan-price-container">
                  <div class="dh-plan-price-left">
                    <div class="dh-plan-price-recurring">
                      <span class="dh-price-dollar">$</span>${plan.recurring_price}<div class="dh-price-suffix">
                        <span class="dh-price-asterisk">*</span>
                        <div class="dh-price-frequency">${formatBillingFrequency(plan.billing_frequency)}</div>
                      </div>
                    </div>
                  </div>
                  <div class="dh-plan-price-right">
                    <div class="dh-plan-price-initial">Initial Only <span class="dh-price-dollar">$</span><span class="dh-price-number">${plan.initial_price}</span></div>
                    <div class="dh-plan-price-normally">Normally <span class="dh-price-dollar">$</span><span class="dh-plan-price-crossed">${(plan.initial_price + (plan.initial_discount || 0)).toFixed(0)}</span></div>
                  </div>
                </div>
                
                <!-- Plan Selection Dropdown -->
                <div class="dh-plan-selection-section">
                  <label class="dh-plan-selection-label">Available Options</label>
                  <select class="dh-plan-selection-dropdown" id="plan-selection-dropdown" onchange="switchPlanOption(this.value)">
                    <!-- Options will be populated dynamically -->
                  </select>
                </div>
                
                <div class="dh-plan-price-disclaimer">${plan.plan_disclaimer || '*Pricing may vary based on initial inspection findings and other factors.'}</div>
              </div>
            </div>
          </div>

          <div class="dh-plan-actions">
            <button class="dh-form-btn dh-form-btn-primary" onclick="selectPlan('${plan.id || 'selected'}', '${plan.plan_name}')">
              Book Now! <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="dh-form-btn plan-no-thanks" onclick="declinePlanComparison()">
              No Thanks <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        `;
      };

      // Switch plan tab function
      window.switchPlanTab = tabIndex => {
        // Update tab active states
        const tabs = document.querySelectorAll('.dh-plan-tab');
        tabs.forEach((tab, index) => {
          tab.classList.toggle('active', index === tabIndex);
        });

        // Update content
        const contentContainer = document.getElementById(
          'comparison-plan-content'
        );
        if (contentContainer && window.comparisonPlansData) {
          const newContent = generatePlanContent(
            window.comparisonPlansData[tabIndex]
          );
          contentContainer.innerHTML = newContent;
        }
      };

      // FAQ accordion toggle functionality
      window.toggleFaqItem = faqIndex => {
        const faqContent = document.getElementById(`faq-content-${faqIndex}`);
        const faqIcon = document.querySelector(
          `[onclick="toggleFaqItem(${faqIndex})"] .dh-faq-icon`
        );
        const faqItem = faqContent?.closest('.dh-faq-item');

        if (!faqContent || !faqIcon || !faqItem) return;

        const isOpen = faqItem.classList.contains('active');

        if (isOpen) {
          // Close the FAQ
          faqItem.classList.remove('active');
          faqContent.style.maxHeight = '0px';
          faqIcon.style.transform = 'rotate(0deg)';
        } else {
          // Open the FAQ
          faqItem.classList.add('active');
          faqContent.style.maxHeight = faqContent.scrollHeight + 'px';
          faqIcon.style.transform = 'rotate(180deg)';
        }
      };

      // Handle plan comparison decline
      window.declinePlanComparison = () => {
        widgetState.formData.offerChoice = 'decline-comparison';
        showStep('exit-survey');
        setupStepValidation('exit-survey');
      };

      // Select plan function - for plan comparison step
      window.selectPlan = (planId, planName) => {
        // Find the full plan object from available plan data
        let fullPlan = null;

        // Try to find plan from plan comparison data
        if (window.comparisonPlansData) {
          fullPlan = window.comparisonPlansData.find(
            plan => plan.id === planId
          );
        }

        // Fallback: try from suggestions in widget state
        if (!fullPlan && widgetState.planComparisonData?.suggestions) {
          fullPlan = widgetState.planComparisonData.suggestions.find(
            plan => plan.id === planId
          );
        }

        // Store selected plan (prefer full plan object, fallback to basic structure)
        widgetState.formData.selectedPlan = fullPlan || {
          id: planId,
          plan_name: planName,
        };

        // Keep legacy fields for backward compatibility (if needed elsewhere)
        widgetState.formData.selectedPlanId = planId;
        widgetState.formData.selectedPlanName = planName;
        widgetState.formData.offerChoice = 'schedule-from-comparison';

        // Navigate to contact form for final submission
        showStep('contact');
        setupStepValidation('contact');
      };

      // Load plans when the step is set up
      setTimeout(() => {
        loadComparisonPlans();
      }, 100);

      // Handle "No Thanks" button if present
      if (comparisonNoThanksBtn) {
        comparisonNoThanksBtn.addEventListener('click', () => {
          widgetState.formData.offerChoice = 'decline-comparison';
          // Navigate to exit survey
          showStep('exit-survey');
          setupStepValidation('exit-survey');
        });
      }
      break;

    case 'exit-survey':
      // Populate logo
      populateAllLogos();

      // Get feedback form elements
      const feedbackRadios = document.querySelectorAll(
        'input[name="exit-feedback"]'
      );
      const feedbackTextarea = document.getElementById('exit-feedback-text');
      const surveySubmitBtn = document.getElementById('survey-submit');

      if (surveySubmitBtn) {
        surveySubmitBtn.addEventListener('click', async () => {
          // Get selected feedback option
          const selectedFeedback = document.querySelector(
            'input[name="exit-feedback"]:checked'
          );
          const additionalFeedback = feedbackTextarea?.value || '';

          // Store exit survey data
          widgetState.formData.exitFeedbackReason =
            selectedFeedback?.value || 'none';
          widgetState.formData.exitFeedbackText = additionalFeedback;

          // Save exit survey data
          try {
            const partialSaveResult = await savePartialLead(
              {
                served: false,
                status: 'declined',
                feedback_reason: selectedFeedback?.value || 'none',
                feedback_text: additionalFeedback,
                email: widgetState.formData.email || '',
                phone: widgetState.formData.phone || '',
              },
              'decline-complete' // Step user will navigate to
            );
            if (!partialSaveResult.success) {
              console.warn(
                'Failed to save exit survey:',
                partialSaveResult.error
              );
            }
          } catch (error) {
            console.warn('Error saving exit survey:', error);
          }

          // Show decline completion message
          showStep('decline-complete');
          setupStepValidation('decline-complete');
        });
      }
      break;

    case 'complete':
      // Populate logo
      populateAllLogos();

      // Populate logo, background image, and hero image
      populateStepHero('complete-bg-image', 'complete-hero-image');

      // Populate customer name
      const customerNameEl = document.getElementById('complete-customer-name');
      if (customerNameEl) {
        const contactInfo =
          widgetState.formData.contactInfo || widgetState.formData;
        const firstName =
          contactInfo.firstName || widgetState.formData.firstName || '';
        customerNameEl.textContent = firstName || 'Customer';
      }

      // Populate office hours
      const officeHoursEl = document.getElementById('office-hours-content');
      if (officeHoursEl) {
        officeHoursEl.innerHTML = formatBusinessHours(config.businessHours);
      }

      // Populate service date and time
      const serviceDateEl = document.getElementById('service-date-content');
      if (serviceDateEl) {
        const serviceDate = widgetState.formData.startDate;
        const serviceTime = widgetState.formData.arrivalTime;
        serviceDateEl.textContent = formatServiceDateTime(
          serviceDate,
          serviceTime
        );
      }

      // Load address background imagery if available
      if (
        widgetState.formData.address &&
        widgetState.formData.latitude &&
        widgetState.formData.longitude &&
        typeof loadAddressBackgroundImagery === 'function'
      ) {
        const addressData = {
          formatted: widgetState.formData.address,
          street: widgetState.formData.addressStreet,
          city: widgetState.formData.addressCity,
          state: widgetState.formData.addressState,
          postcode: widgetState.formData.addressZip,
          lat: widgetState.formData.latitude,
          lon: widgetState.formData.longitude,
        };
        loadAddressBackgroundImagery(addressData, 'complete-bg-image');
      }

      // Handle Return to Homepage button
      const returnHomepageBtn = document.getElementById('return-homepage-btn');
      if (returnHomepageBtn) {
        returnHomepageBtn.addEventListener('click', () => {
          // Redirect to company website or close widget
          if (config.companyWebsite) {
            window.open(config.companyWebsite, '_blank');
          } else {
            // Close widget if no website specified
            if (typeof closeModal === 'function') {
              closeModal();
            }
          }
        });
      }
      break;

    case 'out-of-service':
      // Populate logo for out of service step
      populateAllLogos();

      // Handle background image specifically for out of service step
      const outOfServiceBgElement = document.getElementById(
        'out-of-service-bg-image'
      );
      const locationNotServedBgUrl =
        widgetState.widgetConfig?.branding?.locationNotServedBackgroundImage;

      if (outOfServiceBgElement && locationNotServedBgUrl) {
        // Preload background image
        const bgImg = new Image();
        bgImg.onload = function () {
          outOfServiceBgElement.style.backgroundImage = `url(${locationNotServedBgUrl})`;
          outOfServiceBgElement.style.backgroundSize = 'cover';
          outOfServiceBgElement.style.backgroundPosition = 'center';
          outOfServiceBgElement.style.backgroundRepeat = 'no-repeat';
        };
        bgImg.onerror = function () {
          console.warn(
            'Failed to load out of service background image:',
            locationNotServedBgUrl
          );
        };
        bgImg.src = locationNotServedBgUrl;
      }
      break;

    default:
      // Set up validation for other steps as needed
      break;
  }
};

// Pre-populate contact fields for both regular and quote forms
// Format phone number to (XXX) XXX-XXXX format
const formatPhoneNumber = phone => {
  if (!phone) return 'Not provided';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Check if we have a valid US phone number (10 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    // Handle numbers with country code
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if not standard format
  return phone;
};

// Populate contact details and service address display sections
const populateContactDetailsDisplay = () => {
  try {
    const contactInfo =
      widgetState.formData.contactInfo || widgetState.formData;

    // Populate contact details
    const contactName = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');
    const contactPhone = document.getElementById('contact-phone');
    const serviceAddress = document.getElementById('service-address');

    if (contactName) {
      const firstName =
        contactInfo.firstName || widgetState.formData.firstName || '';
      const lastName =
        contactInfo.lastName || widgetState.formData.lastName || '';
      const fullName =
        `${firstName} ${lastName}`.trim() || contactInfo.name || 'Not provided';
      contactName.textContent = fullName;
    }

    if (contactEmail) {
      const email =
        contactInfo.email || widgetState.formData.email || 'Not provided';
      contactEmail.textContent = email;
    }

    if (contactPhone) {
      const phone = contactInfo.phone || widgetState.formData.phone;
      contactPhone.textContent = formatPhoneNumber(phone);
    }

    if (serviceAddress) {
      // Format address as 2 lines: Street on first line, City/State/ZIP on second line
      const street = widgetState.formData.addressStreet || '';
      const city = widgetState.formData.addressCity || '';
      const state = widgetState.formData.addressState || '';
      const zip = widgetState.formData.addressZip || '';

      if (street || city || state || zip) {
        // Build the address HTML with 2 lines
        let addressHtml = '';

        // First line: Street address
        if (street) {
          addressHtml += `<div class="address-line-1">${street}</div>`;
        }

        // Second line: City, State ZIP
        const cityStateZip = [];
        if (city) cityStateZip.push(city);
        if (state && zip) {
          cityStateZip.push(`${state} ${zip}`);
        } else {
          if (state) cityStateZip.push(state);
          if (zip) cityStateZip.push(zip);
        }

        if (cityStateZip.length > 0) {
          addressHtml += `<div class="address-line-2">${cityStateZip.join(', ')}</div>`;
        }

        serviceAddress.innerHTML = addressHtml;
      } else {
        // Fallback to single formatted address if individual fields not available
        const formattedAddress = widgetState.formData.address;
        if (formattedAddress && typeof formattedAddress === 'string') {
          // Try to split the address by comma and format as 2 lines
          const parts = formattedAddress.split(',').map(part => part.trim());
          if (parts.length >= 2) {
            const street = parts[0];
            const remainder = parts.slice(1).join(', ');
            serviceAddress.innerHTML = `<div class="address-line-1">${street}</div><div class="address-line-2">${remainder}</div>`;
          } else {
            serviceAddress.innerHTML = `<div class="address-line-1">${formattedAddress}</div>`;
          }
        } else {
          serviceAddress.textContent = 'Address not provided';
          console.warn('Address data not found:', widgetState.formData);
        }
      }
    }
  } catch (error) {
    console.error('Error populating contact details display:', error);
  }
};

const populateContactFields = () => {
  try {
    // Populate scheduling fields (contact step)
    const startDateInput = document.getElementById('start-date-input');
    const arrivalTimeInput = document.getElementById('arrival-time-input');

    // Pre-populate with any existing values
    if (startDateInput && widgetState.formData.startDate) {
      startDateInput.value = widgetState.formData.startDate;
      updateFloatingLabel(startDateInput);
    }
    if (arrivalTimeInput && widgetState.formData.arrivalTime) {
      arrivalTimeInput.value = widgetState.formData.arrivalTime;
      updateFloatingLabel(arrivalTimeInput);
    }

    // Populate quote contact form fields (quote-contact step) if they exist
    const contactInfo =
      widgetState.formData.contactInfo || widgetState.formData;
    const quoteFirstNameInput = document.getElementById(
      'quote-first-name-input'
    );
    const quoteLastNameInput = document.getElementById('quote-last-name-input');
    const quotePhoneInput = document.getElementById('quote-phone-input');
    const quoteEmailInput = document.getElementById('quote-email-input');

    if (contactInfo && quoteFirstNameInput) {
      const firstName =
        contactInfo.firstName || widgetState.formData.firstName || '';
      if (firstName) {
        quoteFirstNameInput.value = firstName;
        updateFloatingLabel(quoteFirstNameInput);
      }
    }
    if (contactInfo && quoteLastNameInput) {
      const lastName =
        contactInfo.lastName || widgetState.formData.lastName || '';
      if (lastName) {
        quoteLastNameInput.value = lastName;
        updateFloatingLabel(quoteLastNameInput);
      }
    }
    if (contactInfo && quotePhoneInput) {
      const phone = contactInfo.phone || widgetState.formData.phone || '';
      if (phone) {
        quotePhoneInput.value = phone;
        updateFloatingLabel(quotePhoneInput);
      }
    }
    if (contactInfo && quoteEmailInput) {
      const email = contactInfo.email || widgetState.formData.email || '';
      if (email) {
        quoteEmailInput.value = email;
        updateFloatingLabel(quoteEmailInput);
      }
    }
  } catch (error) {
    console.error('Error populating contact fields:', error);
  }
};

// Helper function to format business hours
const formatBusinessHours = businessHours => {
  if (!businessHours || typeof businessHours !== 'object') {
    return 'Monday - Friday 8am - 5:30pm'; // Default fallback
  }

  // Group days with same hours
  const dayGroups = {};
  const dayOrder = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  // Group days by their hours
  dayOrder.forEach(day => {
    if (businessHours[day]) {
      const hours = `${formatTime(businessHours[day].open)} - ${formatTime(businessHours[day].close)}`;
      if (!dayGroups[hours]) {
        dayGroups[hours] = [];
      }
      dayGroups[hours].push(dayNames[day]);
    }
  });

  // Format groups
  const formattedGroups = [];
  Object.entries(dayGroups).forEach(([hours, days]) => {
    if (days.length === 1) {
      formattedGroups.push(`${days[0]} ${hours}`);
    } else if (days.length > 1) {
      // Check for consecutive days
      const firstDay = days[0];
      const lastDay = days[days.length - 1];
      formattedGroups.push(`${firstDay} - ${lastDay} ${hours}`);
    }
  });

  return formattedGroups.join('<br>') || 'Monday - Friday 8am - 5:30pm';
};

// Helper function to format time (e.g., "08:00" to "8am")
const formatTime = timeString => {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const min = minutes === '00' ? '' : `:${minutes}`;

  if (hour === 0) return `12${min}am`;
  if (hour < 12) return `${hour}${min}am`;
  if (hour === 12) return `12${min}pm`;
  return `${hour - 12}${min}pm`;
};

// Helper function to format service date and time
const formatServiceDateTime = (dateString, timeString) => {
  if (!dateString) return 'Date TBD';

  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', options);

  // Convert date to "October 7th, 2025" format
  const day = date.getDate();
  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) suffix = 'st';
  else if (day % 10 === 2 && day !== 12) suffix = 'nd';
  else if (day % 10 === 3 && day !== 13) suffix = 'rd';

  const finalDate = formattedDate.replace(day.toString(), day + suffix);

  // Format time
  let timeDisplay = '';
  if (timeString) {
    const timeMap = {
      morning: '8 AM - 12 PM',
      afternoon: '12 PM - 5 PM',
      evening: '5 PM - 8 PM',
      anytime: 'Anytime',
    };
    timeDisplay = timeMap[timeString] || timeString;
  }

  return timeDisplay ? `${finalDate} | ${timeDisplay}` : finalDate;
};

// Expose functions to window for onclick handlers
window.showStep = showStep;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.changeAddress = changeAddress;
window.validateServiceArea = validateServiceArea;
window.checkServiceAreaButton = checkServiceAreaButton;
// selectPlan is now exposed via window.selectPlan inside plan-comparison setupStepValidation
window.showComparisonPlan = showComparisonPlan;
window.switchPlanOption = switchPlanOption;
window.setupStepValidation = setupStepValidation;
window.populateContactFields = populateContactFields;
