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
      contactInfo: widgetState.formData.contactInfo,
      // Scheduling information
      startDate: widgetState.formData.startDate,
      arrivalTime: widgetState.formData.arrivalTime,
      // Estimated pricing from selected plan
      estimatedPrice: widgetState.formData.selectedPlan ? {
        min: widgetState.formData.selectedPlan.initial_price || 0,
        max: widgetState.formData.selectedPlan.recurring_price || widgetState.formData.selectedPlan.initial_price || 0,
        service_type: widgetState.formData.selectedPlan.plan_name || 'Professional pest control service'
      } : undefined,
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
      // Acquire captcha token if configured
      try {
        const cfg = widgetState.widgetConfig && widgetState.widgetConfig.captcha;
        if (cfg && cfg.provider === 'turnstile' && cfg.siteKey) {
          const submitBtn = document.getElementById('contact-submit');
          
          // Update button to show verification step
          if (submitBtn) {
            submitBtn.innerHTML = 'Verifying security... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          }
          
          // Ensure captcha initialized (lightweight - just loads script)
          if (window.dhCaptcha && typeof window.dhCaptcha.init === 'function') {
            await window.dhCaptcha.init('turnstile', cfg.siteKey);
          }
          
          // Generate fresh token (creates widget on-demand)
          console.log('DH Widget: Requesting fresh Turnstile token...');
          const token = window.dhCaptcha && typeof window.dhCaptcha.getToken === 'function'
            ? await window.dhCaptcha.getToken()
            : null;
          
          console.log('DH Widget: Turnstile token acquired successfully');
          
          // Update button to show submitting
          if (submitBtn) {
            submitBtn.innerHTML = 'Submitting... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          }
          
          formData.captcha = {
            provider: 'turnstile',
            token: token || '',
            action: 'widget_submit',
          };
        }
      } catch (captchaError) {
        console.warn('DH Widget: Captcha token acquisition failed', captchaError);
        
        // Show more specific error message
        const submitBtn = document.getElementById('contact-submit');
        if (submitBtn) {
          if (captchaError.message && captchaError.message.includes('rate limit')) {
            submitBtn.innerHTML = 'Rate limited - retrying... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          } else if (captchaError.message && captchaError.message.includes('max retries')) {
            submitBtn.innerHTML = 'Security check failed <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            // Don't proceed with submission if captcha completely failed
            widgetState.isSubmitting = false;
            updateSubmitButtonState(false);
            alert('Security verification failed. Please try again in a few minutes.');
            return;
          }
        }
        
        // Continue without captcha token if it's not required or if it's a temporary issue
        console.log('DH Widget: Continuing submission without captcha token');
      }

      // Submit to API
      const response = await fetch(config.baseUrl + '/api/webhooks/widget-submit-ticket', {
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
        
        // Reset button state (though user won't see it since we navigated away)
        resetBookItButton();
      } else {
        console.error('Form submission failed:', data.error);
        alert(
          'There was an error submitting your information. Please try again.'
        );
        // Reset submission state on error to allow retry
        widgetState.isSubmitting = false;
        updateSubmitButtonState(false);
        resetBookItButton();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(
        'There was an error submitting your information. Please try again.'
      );
      // Reset submission state on error to allow retry
      widgetState.isSubmitting = false;
      updateSubmitButtonState(false);
      resetBookItButton();
    }
  };

  // Update submit button state for loading/submitting
  const updateSubmitButtonState = isSubmitting => {
    const submitBtn = document.getElementById('contact-submit');
    if (submitBtn) {
      if (isSubmitting) {
        submitBtn.innerHTML = 'Submitting... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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

          submitBtn.innerHTML = 'Schedule Service <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          submitBtn.classList.remove('submitting');
        }
      }
    }
  };

  // Reset Book It button state
  const resetBookItButton = () => {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = 'Book It <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      submitBtn.disabled = false;
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
    const startDateInput = document.getElementById('start-date-input');
    const arrivalTimeInput = document.getElementById('arrival-time-input');

    // Clear existing errors
    [startDateInput, arrivalTimeInput].forEach(input => {
      if (input) {
        progressiveFormManager.clearFieldError(input);
      }
    });

    let hasErrors = false;

    // Validate start date
    if (!startDateInput || !startDateInput.value) {
      if (startDateInput) {
        progressiveFormManager.showFieldError(
          startDateInput,
          'Preferred start date is required'
        );
      }
      hasErrors = true;
    } else if (!isDateInFuture(startDateInput.value)) {
      progressiveFormManager.showFieldError(
        startDateInput,
        'Please select a date that is at least one day in the future'
      );
      hasErrors = true;
    }

    // Validate arrival time
    if (!arrivalTimeInput || !arrivalTimeInput.value) {
      if (arrivalTimeInput) {
        progressiveFormManager.showFieldError(
          arrivalTimeInput,
          'Preferred arrival time is required'
        );
      }
      hasErrors = true;
    }

    if (hasErrors) {
      // Reset button if validation fails
      resetBookItButton();
      return;
    }

    if (!hasErrors) {
      // Update button to show booking state
      const submitBtn = document.getElementById('submit-btn');
      if (submitBtn) {
        submitBtn.innerHTML = 'Booking... <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        submitBtn.disabled = true;
      }

      // Save scheduling info to widget state before submission
      widgetState.formData.startDate = startDateInput.value;
      widgetState.formData.arrivalTime = arrivalTimeInput.value;

      // All validation passed, proceed with form submission
      submitForm();
    }
  };

  // Fetch plan comparison data for selected pest
  const fetchPlanComparisonData = async () => {
    try {
      // Guard: Don't call API if no pest is selected
      if (!widgetState.formData.pestType) {
        console.warn('Skipping plan comparison: no pest selected yet');
        return { plans: [] };
      }

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



  // Helper function to format billing frequency to natural language (abbreviated)
  const formatBillingFrequency = (frequency) => {
    if (!frequency) return '';
    
    const freq = frequency.toLowerCase().trim();
    
    switch (freq) {
      case 'monthly':
        return '/mo';
      case 'quarterly':
        return '/qtr';
      case 'annually':
      case 'yearly':
        return '/yr';
      case 'weekly':
        return '/wk';
      case 'biannually':
      case 'semi-annually':
      case 'semiannually':
        return '/6mo';
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

  // Helper function to format billing frequency with full words (for How We Do It step)
  const formatBillingFrequencyFull = (frequency) => {
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

  // Map widget step names to partial lead step names
  const mapStepToPartialLeadStep = (widgetStep) => {
    const stepMap = {
      'pest-issue': 'pest_issue_completed',
      'address': 'address_validated',
      'confirm-address': 'address_confirmed',
      'how-we-do-it': 'how_we_do_it_viewed',
      'offer': 'offer_viewed',
      'contact': 'contact_started',
      'quote': 'quote_started',
      'plan-comparison': 'plan_selected'
    };
    return stepMap[widgetStep] || widgetStep;
  };

  // Partial lead save function
  const savePartialLead = async (
    validationResult,
    stepCompleted = 'address'
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
      'address', // Address step doesn't need coordinates yet
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
          pestBackgroundImage: widgetState.formData.pestBackgroundImage || null,
          selectedPlan: widgetState.formData.selectedPlan || null,
          recommendedPlan: widgetState.formData.recommendedPlan || null,
          offerPrice: widgetState.formData.offerPrice || null,
          address: widgetState.formData.address,
          addressDetails: {
            street: widgetState.formData.addressStreet,
            city: widgetState.formData.addressCity,
            state: widgetState.formData.addressState,
            zip: widgetState.formData.addressZip,
          },
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          consentStatus: widgetState.formData.consentStatus || null,
          startDate: widgetState.formData.startDate || null,
          arrivalTime: widgetState.formData.arrivalTime || null,
          contactInfo: {
            // Save any contact info that's available, regardless of step
            name: widgetState.formData.contactInfo.name || null,
            firstName: widgetState.formData.contactInfo.firstName || null,
            lastName: widgetState.formData.contactInfo.lastName || null,
            phone: widgetState.formData.contactInfo.phone || null,
            email: widgetState.formData.contactInfo.email || null,
            comments: widgetState.formData.contactInfo.comments || null,
          },
        },
        serviceAreaData: validationResult,
        attributionData: {
          ...widgetState.attributionData,
          consent_status: widgetState.attributionData.consent_status || null
        },
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
      
      // Store partial lead ID in widget state for future updates
      if (result.success && result.partialLeadId) {
        widgetState.partialLeadId = result.partialLeadId;
      }
      
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
    // Merge server config with client overrides
    if (cachedConfig) {
      // Override server defaults with client-provided attributes (if any)
      const mergedConfig = { ...cachedConfig };
      
      // Client overrides take precedence over server defaults
      if (config.primaryColor && cachedConfig.colors) {
        mergedConfig.colors.primary = config.primaryColor;
      }
      if (config.secondaryColor && cachedConfig.colors) {
        mergedConfig.colors.secondary = config.secondaryColor;
      }
      if (config.backgroundColor && cachedConfig.colors) {
        mergedConfig.colors.background = config.backgroundColor;
      }
      if (config.textColor && cachedConfig.colors) {
        mergedConfig.colors.text = config.textColor;
      }
      if (config.buttonText) {
        mergedConfig.submitButtonText = config.buttonText;
        mergedConfig.welcomeButtonText = config.buttonText;
      }
      if (config.headerText && cachedConfig.headers) {
        mergedConfig.headers.headerText = config.headerText;
      }
      if (config.subHeaderText && cachedConfig.headers) {
        mergedConfig.headers.subHeaderText = config.subHeaderText;
      }
      
      // Update the widget state with merged config
      widgetState.widgetConfig = mergedConfig;
    }
    
    // Initialize captcha early if configured
    try {
      const cfg = cachedConfig && cachedConfig.captcha;
      if (cfg && cfg.provider === 'turnstile' && cfg.siteKey && window.dhCaptcha && typeof window.dhCaptcha.init === 'function') {
        window.dhCaptcha.init('turnstile', cfg.siteKey);
      }
    } catch (_) {}
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

      // Use domain-based lookup if no company ID provided
      const url = config.companyId 
        ? config.baseUrl + '/api/widget/config/' + config.companyId
        : config.baseUrl + '/api/widget/config';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        widgetState.widgetConfig = data.config;
        
        // Bootstrap company ID from domain-based config if not already set
        if (!config.companyId && data.config.companyId) {
          config.companyId = data.config.companyId;
        }

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
      
      // Update button to loading state
      const submitBtn = document.getElementById('quote-contact-submit');
      if (submitBtn) {
        submitBtn.innerHTML = 'Loading...';
        submitBtn.classList.add('submitting');
        submitBtn.disabled = true;
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
      
      // Save partial lead AFTER navigation is complete so currentStep is correct
      try {
        const partialSaveResult = await savePartialLead(
          null, // Service area validation not applicable for contact step
          widgetState.currentStep // Now correctly set to 'plan-comparison'
        );
        if (!partialSaveResult.success) {
          console.warn(
            'Failed to save contact information:',
            partialSaveResult.error
          );
        }
      } catch (error) {
        console.warn('Error saving contact information:', error);
      }

      // Reset button state after everything is complete
      setTimeout(() => {
        
        // Reset button state (though user won't see this since we navigated away)
        const submitBtn = document.getElementById('quote-contact-submit');
        if (submitBtn) {
          submitBtn.innerHTML = 'See Your Quote <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          submitBtn.classList.remove('submitting');
          submitBtn.disabled = false;
        }
      }, 100); // Brief delay to ensure step transition is visible
      
    } catch (error) {
      console.error('Error during quote processing:', error);
      
      
      // Reset button state on error
      const submitBtn = document.getElementById('quote-contact-submit');
      if (submitBtn) {
        submitBtn.innerHTML = 'See Your Quote <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        submitBtn.classList.remove('submitting');
        submitBtn.disabled = false;
      }
      
      // Fallback: proceed to plan comparison even if data fetch failed
      await showStep('plan-comparison');
      setupStepValidation('plan-comparison');
    }
  };


  // Fetch pricing data for initial offer
  const fetchPricingData = async () => {
    
    try {
      // Guard: Don't call API if no pest is selected
      if (!widgetState.formData.pestType) {
        console.warn('Skipping pricing data: no pest selected yet');
        return { plans: [] };
      }

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

  // Get the cheapest plan with full coverage for the selected pest
  const getCheapestFullCoveragePlan = async () => {
    try {
      // Guard: Don't call API if no pest is selected
      if (!widgetState.formData.pestType) {
        console.warn('Skipping cheapest plan lookup: no pest selected yet');
        return null;
      }

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
        // Filter for plans with 100% coverage
        const fullCoveragePlans = data.suggestions.filter(plan => 
          plan.coverage_match && plan.coverage_match.coverage_percentage === 100
        );
        
        if (fullCoveragePlans.length > 0) {
          // Sort by initial price (cheapest setup cost) and return the first one
          const cheapestPlan = fullCoveragePlans.sort((a, b) => 
            parseFloat(a.initial_price) - parseFloat(b.initial_price)
          )[0];
          
          // Store the recommended plan data
          widgetState.formData.recommendedPlan = cheapestPlan;
          // Initialize selectedPlan to match recommendedPlan (user can override by actively selecting)
          widgetState.formData.selectedPlan = cheapestPlan;
          widgetState.formData.offerPrice = cheapestPlan.recurring_price;
          
          return cheapestPlan;
        } else {
          // No full coverage plans, use the best match available
          const bestPlan = data.suggestions[0];
          widgetState.formData.recommendedPlan = bestPlan;
          // Initialize selectedPlan to match recommendedPlan (user can override by actively selecting)
          widgetState.formData.selectedPlan = bestPlan;
          widgetState.formData.offerPrice = bestPlan.recurring_price;
          return bestPlan;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cheapest full coverage plan:', error);
      widgetState.formData.recommendedPlan = null;
      // Reset selectedPlan when recommendation fails
      widgetState.formData.selectedPlan = null;
      widgetState.formData.offerPrice = null;
      return null;
    }
  };

  // Expose functions to window for use by other modules
  // Recover partial lead from server
  const recoverPartialLead = async (companyId, sessionId) => {
    try {
      const response = await fetch(config.baseUrl + '/api/widget/recover-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: companyId,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to recover form data' };
      }

      return data; // Return the full response object since it already has success/hasPartialLead structure
    } catch (error) {
      console.error('Error recovering partial lead:', error);
      return { success: false, error: 'Network error recovering form data' };
    }
  };

  window.fetchPlanComparisonData = fetchPlanComparisonData;
  window.fetchPricingData = fetchPricingData;
  window.getCheapestFullCoveragePlan = getCheapestFullCoveragePlan;
  window.formatBillingFrequencyFull = formatBillingFrequencyFull;
  window.recoverPartialLead = recoverPartialLead;
  window.mapStepToPartialLeadStep = mapStepToPartialLeadStep;

})();
