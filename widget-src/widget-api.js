/**
 * DH Widget - API Communication and Form Submission
 * Contains form submission, validation, and API interaction functions
 */

(function () {
  'use strict';

  // Main form submission function
  window.submitForm = async () => {
    // Prevent double submissions
    if (widgetState.isSubmitting) {
      return;
    }

    // In preview mode, just navigate to complete step without submitting
    if (config.isPreview) {
      showStep('complete');
      setupStepValidation('complete');
      return;
    }

    // Set submitting state and update UI
    widgetState.isSubmitting = true;
    updateSubmitButtonState(true);

    // Collect all form data including attribution and session information
    const formData = {
      companyId: config.companyId,
      pestType: widgetState.formData.pestType,
      urgency: widgetState.formData.urgency,
      selectedPlan: widgetState.formData.selectedPlan,
      recommendedPlan: widgetState.formData.recommendedPlan,
      address: widgetState.formData.address, // Formatted address for backward compatibility
      addressDetails: {
        street: widgetState.formData.addressStreet,
        city: widgetState.formData.addressCity,
        state: widgetState.formData.addressState,
        zip: widgetState.formData.addressZip,
      },
      homeSize: parseInt(widgetState.formData.homeSize),
      urgency: widgetState.formData.urgency,
      contactInfo: widgetState.formData.contactInfo,
      coordinates: {
        latitude: widgetState.formData.latitude,
        longitude: widgetState.formData.longitude,
      },
      // Enhanced attribution and session data for conversion linking
      sessionId: widgetState.sessionId,
      attributionData: {
        ...widgetState.attributionData,
        form_submission_timestamp: new Date().toISOString(),
        completed_at: 'widget_submit',
      },
    };

    try {
      // Submit to API
      const response = await fetch(config.baseUrl + '/api/widget/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Reset submission state
        widgetState.isSubmitting = false;

        // Navigate to complete step to show thank you message
        showStep('complete');
        setupStepValidation('complete');
      } else {
        console.error('Form submission failed:', data.error);
        alert(
          'There was an error submitting your information. Please try again.'
        );
        // Reset submission state on error to allow retry
        widgetState.isSubmitting = false;
        updateSubmitButtonState(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(
        'There was an error submitting your information. Please try again.'
      );
      // Reset submission state on error to allow retry
      widgetState.isSubmitting = false;
      updateSubmitButtonState(false);
    }
  };

  // Update submit button state for loading/submitting
  const updateSubmitButtonState = isSubmitting => {
    const submitBtn = document.getElementById('contact-submit');
    if (submitBtn) {
      if (isSubmitting) {
        submitBtn.textContent = 'Submitting...';
        submitBtn.classList.add('submitting');
      } else {
        // Only re-enable if form is valid
        const nameInput = document.getElementById('name-input');
        const phoneInput = document.getElementById('phone-input');
        const emailInput = document.getElementById('email-input');

        if (nameInput && phoneInput && emailInput) {
          const name = nameInput.value.trim();
          const phone = phoneInput.value.trim();
          const email = emailInput.value.trim();
          const isValid = name && phone && email && email.includes('@');

          submitBtn.textContent = 'Get My Free Estimate';
          submitBtn.classList.remove('submitting');
        }
      }
    }
  };

  // Helper function to check if date is in the future
  const isDateInFuture = dateStr => {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return selectedDate > today;
  };

  // Form validation with submission
  window.submitFormWithValidation = () => {
    const firstNameInput = document.getElementById('first-name-input');
    const lastNameInput = document.getElementById('last-name-input');
    const phoneInput = document.getElementById('phone-input');
    const emailInput = document.getElementById('email-input');
    const startDateInput = document.getElementById('start-date-input');
    const arrivalTimeInput = document.getElementById('arrival-time-input');
    const termsCheckbox = document.getElementById('terms-checkbox');

    // Clear existing errors
    [
      firstNameInput,
      lastNameInput,
      phoneInput,
      emailInput,
      startDateInput,
      arrivalTimeInput,
    ].forEach(input => {
      if (input) {
        progressiveFormManager.clearFieldError(input);
      }
    });

    let hasErrors = false;

    // Validate required fields
    if (!firstNameInput?.value.trim()) {
      progressiveFormManager.showFieldError(
        firstNameInput,
        'First name is required'
      );
      hasErrors = true;
    }

    if (!lastNameInput?.value.trim()) {
      progressiveFormManager.showFieldError(
        lastNameInput,
        'Last name is required'
      );
      hasErrors = true;
    }

    if (!phoneInput?.value.trim()) {
      progressiveFormManager.showFieldError(
        phoneInput,
        'Phone number is required'
      );
      hasErrors = true;
    } else {
      // Validate phone format
      const cleanPhone = phoneInput.value.replace(/[\s\-\(\)]/g, '');
      if (!/^[\d\+]+$/.test(cleanPhone)) {
        progressiveFormManager.showFieldError(
          phoneInput,
          'Please enter a valid phone number'
        );
        hasErrors = true;
      } else if (cleanPhone.length < 10) {
        progressiveFormManager.showFieldError(
          phoneInput,
          'Phone number must be at least 10 digits'
        );
        hasErrors = true;
      }
    }

    if (!emailInput?.value.trim()) {
      progressiveFormManager.showFieldError(
        emailInput,
        'Email address is required'
      );
      hasErrors = true;
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value)) {
        progressiveFormManager.showFieldError(
          emailInput,
          'Please enter a valid email address'
        );
        hasErrors = true;
      }
    }

    if (!startDateInput?.value) {
      progressiveFormManager.showFieldError(
        startDateInput,
        'Preferred start date is required'
      );
      hasErrors = true;
    } else if (!isDateInFuture(startDateInput.value)) {
      progressiveFormManager.showFieldError(
        startDateInput,
        'Please select a date that is at least one day in the future'
      );
      hasErrors = true;
    }

    if (!arrivalTimeInput?.value) {
      progressiveFormManager.showFieldError(
        arrivalTimeInput,
        'Preferred arrival time is required'
      );
      hasErrors = true;
    }

    if (!termsCheckbox?.checked) {
      // Use the standard error system for terms checkbox
      const termsContainer = termsCheckbox.closest('.dh-form-group');
      if (termsContainer) {
        // Create a temporary container element to use with showFieldError
        let termsErrorContainer = termsContainer.querySelector(
          '.dh-terms-error-container'
        );
        if (!termsErrorContainer) {
          termsErrorContainer = document.createElement('div');
          termsErrorContainer.className = 'dh-terms-error-container';
          termsErrorContainer.id = 'terms-checkbox-container';
          termsContainer.appendChild(termsErrorContainer);
        }

        progressiveFormManager.showFieldError(
          termsErrorContainer,
          'You must agree to the terms and conditions'
        );

        // Add real-time clearing for terms checkbox
        const clearTermsError = () => {
          if (termsCheckbox.checked) {
            progressiveFormManager.clearFieldError(termsErrorContainer);
          }
        };

        // Remove existing listeners to prevent duplicates
        termsCheckbox.removeEventListener('change', clearTermsError);
        termsCheckbox.addEventListener('change', clearTermsError);
      }

      hasErrors = true;
    }

    if (!hasErrors) {
      // Save contact info to widget state before submission
      widgetState.formData.contactInfo = {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        name: `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`,
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        startDate: startDateInput.value,
        arrivalTime: arrivalTimeInput.value,
      };

      // All validation passed, proceed with form submission
      submitForm();
    }
  };

  // Fetch plan comparison data for selected pest
  const fetchPlanComparisonData = async () => {
    try {
      const requestBody = {
        companyId: config.companyId,
        selectedPests: [widgetState.formData.pestType],
      };

      // Include address details and coordinates if available
      if (widgetState.formData.addressStreet) {
        requestBody.addressDetails = {
          street: widgetState.formData.addressStreet,
          city: widgetState.formData.addressCity,
          state: widgetState.formData.addressState,
          zip: widgetState.formData.addressZip,
        };
      }

      if (widgetState.formData.latitude && widgetState.formData.longitude) {
        requestBody.coordinates = {
          latitude: widgetState.formData.latitude,
          longitude: widgetState.formData.longitude,
        };
      }

      const response = await fetch(
        config.baseUrl + '/api/widget/suggested-plans',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store plan comparison data in widgetState for use by plan-comparison step
      widgetState.planComparisonData = data;
      
      return data;
    } catch (error) {
      console.error('Error fetching plan comparison data:', error);
      throw error;
    }
  };


  // Load suggested plans based on selected pest
  const loadSuggestedPlans = async () => {
    const planLoadingEl = document.getElementById('plan-loading');
    const planSelectionEl = document.getElementById('plan-selection');

    // Show loading state
    if (planLoadingEl) planLoadingEl.style.display = 'block';
    if (planSelectionEl) planSelectionEl.style.display = 'none';

    try {
      // Get selected pest from form data
      const selectedPest = widgetState.formData.pestType;
      if (!selectedPest) {
        throw new Error('No pest selected');
      }

      // Call suggested plans API
      const response = await fetch(
        config.baseUrl + '/api/widget/suggested-plans',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyId: config.companyId,
            selectedPests: [selectedPest],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggested plans');
      }

      const data = await response.json();

      if (!data.success || !data.suggestions) {
        throw new Error('Invalid response from plans API');
      }

      // Render plans
      renderSuggestedPlans(data.suggestions);

      // Hide loading, show plans
      if (planLoadingEl) planLoadingEl.style.display = 'none';
      if (planSelectionEl) planSelectionEl.style.display = 'block';
    } catch (error) {
      console.error('Error loading suggested plans:', error);

      // Hide loading and show error state
      if (planLoadingEl) planLoadingEl.style.display = 'none';
      if (planSelectionEl) {
        planSelectionEl.style.display = 'block';
        planSelectionEl.innerHTML = `
          <div class="dh-error-state">
            <p>Unable to load service plans at this time.</p>
            <p>Please continue to the next step.</p>
          </div>
        `;
      }
    }
  };

  // Render suggested plans in the UI
  const renderSuggestedPlans = plans => {
    const planSelectionEl = document.getElementById('plan-selection');
    if (!planSelectionEl) return;

    if (plans.length === 0) {
      planSelectionEl.innerHTML = `
        <div class="dh-no-plans">
          <p>No service plans are currently available.</p>
          <p>Please contact us directly for assistance.</p>
        </div>
      `;
      return;
    }

    const plansHtml = plans
      .map(plan => {
        const coverageClass =
          plan.coverage_match.coverage_percentage === 100
            ? 'full-coverage'
            : 'partial-coverage';
        const badgeHtml = plan.highlight_badge
          ? `<div class="dh-plan-badge">${plan.highlight_badge}</div>`
          : '';
        const featuresHtml = plan.plan_features
          .slice(0, 4)
          .map(feature => `<li class="dh-plan-feature">${feature}</li>`)
          .join('');

        return `
        <div class="dh-plan-card" data-plan-id="${plan.id}" onclick="selectPlan('${plan.id}', '${plan.plan_name}')">
          <div class="dh-coverage-indicator ${coverageClass}">
            ${plan.coverage_match.coverage_percentage}% match
          </div>
          <div class="dh-plan-header">
            <h4 class="dh-plan-title">${plan.plan_name}</h4>
            ${badgeHtml}
          </div>
          <div class="dh-plan-price">
            <span class="dh-plan-price-main">$${plan.recurring_price}</span>
            <span class="dh-plan-price-frequency">${formatBillingFrequency(plan.billing_frequency)}</span>
          </div>
          <p class="dh-plan-description">${plan.plan_description || ''}</p>
          <ul class="dh-plan-features">
            ${featuresHtml}
          </ul>
        </div>
      `;
      })
      .join('');

    planSelectionEl.innerHTML = plansHtml;
  };

  // Select a plan and proceed to next step
  window.selectPlan = (planId, planName) => {
    // Save selected plan to form data
    widgetState.formData.selectedPlan = {
      id: planId,
      name: planName,
    };

    // Visual feedback
    document.querySelectorAll('.dh-plan-card').forEach(card => {
      card.classList.remove('selected', 'processing');
    });

    const selectedCard = document.querySelector(
      `[data-plan-id="${planId}"]`
    );
    if (selectedCard) {
      selectedCard.classList.add('processing');
    }

    // Save partial lead with plan selection
    try {
      savePartialLead('plan_selected');
    } catch (error) {
      console.error('Error saving plan selection:', error);
    }

    // Navigate directly to contact step for scheduling after brief delay
    setTimeout(() => {
      // Set flow identifier to track that user came from plan comparison
      widgetState.formData.offerChoice = 'schedule-from-comparison';
      showStep('contact');
      setupStepValidation('contact');
      updateProgressBar('contact');
    }, 500);
  };

  // Helper function to format billing frequency to natural language
  const formatBillingFrequency = (frequency) => {
    if (!frequency) return '';
    
    const freq = frequency.toLowerCase().trim();
    
    switch (freq) {
      case 'monthly':
        return '/month';
      case 'quarterly':
        return '/quarter';
      case 'annually':
      case 'yearly':
        return '/year';
      case 'weekly':
        return '/week';
      case 'biannually':
      case 'semi-annually':
      case 'semiannually':
        return '/6 months';
      case 'daily':
        return '/day';
      default:
        // Fallback: try to convert "ly" endings to natural form
        if (freq.endsWith('ly')) {
          const base = freq.slice(0, -2);
          return `/${base}`;
        }
        // Final fallback: return as-is with forward slash
        return `/${frequency}`;
    }
  };

  // Partial lead save function
  const savePartialLead = async (
    validationResult,
    stepCompleted = 'address_completed'
  ) => {
    if (!widgetState.sessionId || !widgetState.attributionData) {
      console.warn(
        'Cannot save partial lead: missing session ID or attribution data'
      );
      return { success: false, error: 'Missing session data' };
    }

    // Only require coordinates for steps after address entry
    const { latitude, longitude } = widgetState.formData;
    const requiresCoordinates = ![
      'pest_issue_completed',
      'urgency_completed',
    ].includes(stepCompleted);

    if (requiresCoordinates && (!latitude || !longitude)) {
      console.warn(
        'Cannot save partial lead: missing coordinates for step',
        stepCompleted
      );
      return { success: false, error: 'Missing coordinates' };
    }

    try {
      const partialSaveData = {
        companyId: config.companyId,
        sessionId: widgetState.sessionId,
        stepCompleted: stepCompleted,
        formData: {
          pestType: widgetState.formData.pestType || null,
          pestIcon: widgetState.formData.pestIcon || null,
          urgency: widgetState.formData.urgency || null,
          selectedPlan: widgetState.formData.selectedPlan || null,
          recommendedPlan: widgetState.formData.recommendedPlan || null,
          address: widgetState.formData.address,
          addressDetails: {
            street: widgetState.formData.addressStreet,
            city: widgetState.formData.addressCity,
            state: widgetState.formData.addressState,
            zip: widgetState.formData.addressZip,
          },
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          contactInfo:
            stepCompleted === 'contact_started'
              ? {
                  name: widgetState.formData.contactInfo.name || null,
                  phone: widgetState.formData.contactInfo.phone || null,
                  email: widgetState.formData.contactInfo.email || null,
                  comments:
                    widgetState.formData.contactInfo.comments || null,
                }
              : null,
        },
        serviceAreaData: validationResult || {
          served: false,
          areas: [],
          primaryArea: null,
        },
        attributionData: widgetState.attributionData,
      };

      const response = await fetch(
        config.baseUrl + '/api/widget/partial-save',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(partialSaveData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          'Partial save API error:',
          response.status,
          errorData
        );
        return { success: false, error: errorData.error || 'API error' };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving partial lead:', error);
      return { success: false, error: error.message };
    }
  };

  // Check cached configuration
  const getCachedConfig = () => {
    try {
      const cacheKey = `dh_widget_config_${config.companyId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { config: cachedConfig, timestamp } = JSON.parse(cached);
        // Cache for 5 minutes
        const CACHE_DURATION = 5 * 60 * 1000;
        if (Date.now() - timestamp < CACHE_DURATION) {
          return cachedConfig;
        }
      }
    } catch (error) {
      // Cache read error (non-critical)
    }
    return null;
  };

  // Cache configuration
  const setCachedConfig = configData => {
    try {
      const cacheKey = `dh_widget_config_${config.companyId}`;
      const cacheData = {
        config: configData,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      // Cache write error (non-critical)
    }
  };

  // Apply cached configuration without API call
  const applyCachedConfig = cachedConfig => {
    // Configuration applied - this function can be expanded if needed
    // For now, just ensure the config is loaded into widgetState
  };

  // Load widget configuration
  const loadConfig = async () => {
    try {
      // Check cache first
      const cachedConfig = getCachedConfig();
      if (cachedConfig) {
        widgetState.widgetConfig = cachedConfig;
        // Apply cached config immediately
        applyCachedConfig(cachedConfig);
        return true;
      }

      const url = config.baseUrl + '/api/widget/config/' + config.companyId;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        widgetState.widgetConfig = data.config;

        // Cache the configuration for future use
        setCachedConfig(data.config);

        // Apply the configuration
        applyCachedConfig(data.config);

        return true;
      } else {
        console.error(
          'DH Widget: Failed to load configuration:',
          data.error
        );
        return false;
      }
    } catch (error) {
      console.error('DH Widget: Error loading configuration:', error);
      return false;
    }
  };

  // Quote form validation and submission
  window.proceedToQuoteWithValidation = async () => {
    const quoteFirstNameInput = document.getElementById('quote-first-name-input');
    const quoteLastNameInput = document.getElementById('quote-last-name-input');
    const quoteEmailInput = document.getElementById('quote-email-input');
    const quotePhoneInput = document.getElementById('quote-phone-input');
    const quoteLoadingEl = document.getElementById('quote-loading');

    // Clear existing errors
    [
      quoteFirstNameInput,
      quoteLastNameInput,
      quoteEmailInput,
      quotePhoneInput,
    ].forEach(input => {
      if (input) {
        progressiveFormManager.clearFieldError(input);
      }
    });

    let hasErrors = false;

    // Validate required fields
    if (!quoteFirstNameInput?.value.trim()) {
      progressiveFormManager.showFieldError(
        quoteFirstNameInput,
        'First name is required'
      );
      hasErrors = true;
    }

    if (!quoteLastNameInput?.value.trim()) {
      progressiveFormManager.showFieldError(
        quoteLastNameInput,
        'Last name is required'
      );
      hasErrors = true;
    }

    if (!quoteEmailInput?.value.trim()) {
      progressiveFormManager.showFieldError(
        quoteEmailInput,
        'Email address is required'
      );
      hasErrors = true;
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(quoteEmailInput.value)) {
        progressiveFormManager.showFieldError(
          quoteEmailInput,
          'Please enter a valid email address'
        );
        hasErrors = true;
      }
    }

    if (!quotePhoneInput?.value.trim()) {
      progressiveFormManager.showFieldError(
        quotePhoneInput,
        'Phone number is required'
      );
      hasErrors = true;
    } else {
      // Validate phone format
      const cleanPhone = quotePhoneInput.value.replace(/[\s\-\(\)]/g, '');
      if (!/^[\d\+]+$/.test(cleanPhone)) {
        progressiveFormManager.showFieldError(
          quotePhoneInput,
          'Please enter a valid phone number'
        );
        hasErrors = true;
      } else if (cleanPhone.length < 10) {
        progressiveFormManager.showFieldError(
          quotePhoneInput,
          'Phone number must be at least 10 digits'
        );
        hasErrors = true;
      }
    }

    if (hasErrors) {
      return;
    }

    try {
      // Show loading state
      if (quoteLoadingEl) {
        quoteLoadingEl.style.display = 'flex';
      }

      // Store quote contact information
      widgetState.formData.contactInfo = {
        firstName: quoteFirstNameInput.value.trim(),
        lastName: quoteLastNameInput.value.trim(),
        name: `${quoteFirstNameInput.value.trim()} ${quoteLastNameInput.value.trim()}`,
        email: quoteEmailInput.value.trim(),
        phone: quotePhoneInput.value.trim(),
      };

      // Fetch plan comparison data and ensure minimum loading time
      await Promise.all([
        fetchPlanComparisonData(),
        updateDynamicText(),
        createMinimumLoadingTime(1000), // Ensure loading shows for at least 1 second
      ]);

      // Navigate to plan comparison with pre-loaded data
      await showStep('plan-comparison');
      setupStepValidation('plan-comparison');
      updateProgressBar('plan-comparison');

      // Hide loading overlay after everything is complete
      setTimeout(() => {
        if (quoteLoadingEl) {
          quoteLoadingEl.style.display = 'none';
        }
      }, 100); // Brief delay to ensure step transition is visible
      
    } catch (error) {
      console.error('Error during quote processing:', error);
      
      // Hide loading on error and fallback to plan comparison step anyway
      if (quoteLoadingEl) {
        quoteLoadingEl.style.display = 'none';
      }
      
      // Fallback: proceed to plan comparison even if data fetch failed
      await showStep('plan-comparison');
      setupStepValidation('plan-comparison');
      updateProgressBar('plan-comparison');
    }
  };


  // Fetch pricing data for initial offer
  const fetchPricingData = async () => {
    
    try {
      const requestBody = {
        companyId: config.companyId,
        selectedPests: [widgetState.formData.pestType],
      };
      
      const response = await fetch(
        config.baseUrl + '/api/widget/suggested-plans',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.suggestions && data.suggestions.length > 0) {
        // Use the first plan's price since API sorts by best coverage match
        const bestMatchPrice = data.suggestions[0].recurring_price;
        
        // Store pricing data in widget state for immediate use
        widgetState.formData.offerPrice = bestMatchPrice;
        
        return bestMatchPrice;
      } else {
        widgetState.formData.offerPrice = null;
        return null;
      }
    } catch (error) {
      widgetState.formData.offerPrice = null;
      return null;
    }
  };

  // Expose functions to window for use by other modules
  window.fetchPlanComparisonData = fetchPlanComparisonData;
  window.fetchPricingData = fetchPricingData;

})();