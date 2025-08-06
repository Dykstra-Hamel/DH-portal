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

  // Special handling for welcome screen - no animations
  if (stepName === 'welcome') {
    // Just hide all steps and show welcome immediately
    document.querySelectorAll('.dh-form-step').forEach(step => {
      step.classList.remove('active', 'fade-in', 'fade-out');
    });
    targetStep.classList.add('active');
    widgetState.currentStep = stepName;
  } else {
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
    
    // Clean up animation class after animation completes
    setTimeout(() => {
      targetStep.classList.remove('fade-in');
    }, 400);
  }

  // Update modal overflow behavior
  updateModalOverflow(stepName);

  // Scroll to top of modal content
  setTimeout(() => {
    const scrollContainer =
      stepName === 'welcome'
        ? document.querySelector('.dh-modal-content')
        : document.querySelector('.dh-form-widget');

    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, 50); // Small delay to ensure DOM updates are complete

  // Update progress bar
  updateProgressBar(stepName);

  // Update dynamic text based on form data
  await updateDynamicText();

  // Setup step-specific validation and event handlers
  setupStepValidation(stepName);

  // Load plans when reaching plan selection step
  if (stepName === 'plan-selection') {
    loadSuggestedPlans();
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

// Global functions for step navigation (exposed to window for onclick handlers)
const nextStep = async () => {
  const steps = [
    'welcome',
    'pest-issue',
    'address',
    'urgency',
    'initial-offer',
    'plans',
    'contact',
    'quote-contact',
    'plan-comparison',
    'out-of-service',
  ];
  const currentIndex = steps.indexOf(widgetState.currentStep);

  // Special handling for address step - validate service area
  if (widgetState.currentStep === 'address') {
    const addressNext = document.getElementById('address-next');

    // Validate that an address has been entered
    if (!widgetState.formData.address) {
      // Show error message
      const addressSearchInput = document.getElementById('address-search-input');
      if (addressSearchInput) {
        progressiveFormManager.showFieldError(
          addressSearchInput,
          'Please enter your address'
        );
      }
      return;
    }

    // Continue with address validation
    if (addressNext) {
      addressNext.textContent = 'Checking area...';
    }

    try {
      const validationResult = await validateServiceArea();
      
      if (validationResult.served) {
        // User is in service area, save partial lead and proceed to urgency step
        const partialSaveResult = await savePartialLead(
          validationResult,
          'address_completed'
        );
        
        if (!partialSaveResult.success) {
          console.warn(
            'Failed to save partial lead, but continuing with form flow:',
            partialSaveResult.error
          );
        }

        // Update step completion tracking
        const completionStatus = progressiveFormManager.calculateStepCompletion();
        showStep('urgency');
        setupStepValidation('urgency');
      } else {
        // User is out of service area, do not save partial lead, show end-stop step
        showStep('out-of-service');
      }
    } catch (error) {
      console.error('Service area validation error:', error);
      // On error, allow user to proceed (graceful fallback)
      // Update step completion tracking even for fallback
      const completionStatus = progressiveFormManager.calculateStepCompletion();
      // Address step completed (fallback)
      showStep('urgency');
      setupStepValidation('urgency');
    } finally {
      // Reset button state
      if (addressNext) {
        addressNext.textContent = 'Continue';
      }
    }
    return;
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
      prevStep = 'welcome';
      break;
    case 'address':
      prevStep = 'pest-issue';
      break;
    case 'urgency':
      prevStep = 'address';
      break;
    case 'initial-offer':
      prevStep = 'urgency';
      break;
    case 'contact':
      // Contact step should go back to initial-offer since it's for scheduling
      prevStep = 'initial-offer';
      break;
    case 'quote-contact':
      prevStep = 'initial-offer';
      break;
    case 'plan-comparison':
      prevStep = 'quote-contact';
      break;
    default:
      // Fallback for any other steps
      prevStep = 'welcome';
  }

  if (prevStep) {
    showStep(prevStep);
    setupStepValidation(prevStep);
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

  // Reset the "Next" button state
  const addressNext = document.getElementById('address-next');
  if (addressNext) {
    addressNext.disabled = true;
    addressNext.classList.add('disabled');
    addressNext.textContent = 'Continue';
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
      throw new Error(
        `Service area validation failed: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Service area validation error:', error);
    return { served: false, error: error.message };
  }
};

// Setup calendar icon click functionality
const setupCalendarIconClick = () => {
  // Setup click handler for calendar icons to open date picker
  document.addEventListener('click', event => {
    const calendarIcon = event.target.closest(
      '.dh-input-icon[data-type="calendar"]'
    );
    if (calendarIcon) {
      // Find the associated date input
      const container = calendarIcon.closest('.dh-floating-input');
      const dateInput = container?.querySelector('input[type="date"]');

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

// Note: selectPlan function is now defined inside plan-comparison setupStepValidation

// Show specific plan tab in comparison step
const showComparisonPlan = (tabIndex) => {
  // Update tab active states
  const tabs = document.querySelectorAll('.dh-plan-tab');
  tabs.forEach((tab, index) => {
    tab.classList.toggle('active', index === tabIndex);
  });

  // Update panel active states
  const panels = document.querySelectorAll('.dh-plan-panel');
  panels.forEach((panel, index) => {
    panel.classList.toggle('active', index === tabIndex);
  });
};

// Setup step-specific event handlers and validation  
const setupStepValidation = (stepName) => {
  switch (stepName) {
    case 'pest-issue':
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
          option.addEventListener('click', async e => {
            // Prevent double-clicking if loading overlay is visible
            const pestLoadingEl = document.getElementById('pest-loading');
            if (pestLoadingEl && pestLoadingEl.style.display === 'flex')
              return;

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

            // Find and store the pest icon
            const selectedPest =
              widgetState.widgetConfig?.pestOptions?.find(
                pest => pest.value === pestValue
              );
            widgetState.formData.pestIcon = selectedPest?.icon || '';

            // Save progress immediately
            try {
              const partialSaveResult = await savePartialLead(
                { served: false, status: 'unknown' }, // Service area unknown until address validated
                'pest_issue_completed'
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
              updateProgressBar('address');

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
              updateProgressBar('address');
            }
          });
        });
      }
      break;

    case 'address':
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
          // Hide search mode, show display mode
          const searchMode = document.getElementById('address-search-mode');
          const displayMode = document.getElementById('address-display-mode');

          // Update editable form fields
          document.getElementById('street-input').value = address.street || '';
          document.getElementById('city-input').value = address.city || '';
          document.getElementById('state-input').value = getStateCodeFromName(address.state);
          document.getElementById('zip-input').value = address.postcode || '';

          // Update form data
          widgetState.formData.addressStreet = address.street || '';
          widgetState.formData.addressCity = address.city || '';
          widgetState.formData.addressState = getStateCodeFromName(address.state);
          widgetState.formData.addressZip = address.postcode || '';
          widgetState.formData.address = address.formatted;
          widgetState.formData.latitude = address.lat;
          widgetState.formData.longitude = address.lon;

          // Switch modes
          if (searchMode && displayMode) {
            searchMode.style.display = 'none';
            displayMode.style.display = 'block';
          }

          // Load address imagery (Street View with satellite fallback)
          loadAddressImagery(address);

          // Update floating labels for pre-filled address fields
          setTimeout(() => {
            // Mark address inputs as initialized to prevent step initialization from overriding
            const streetInput = document.getElementById('street-input');
            const cityInput = document.getElementById('city-input');
            const stateInput = document.getElementById('state-input');
            const zipInput = document.getElementById('zip-input');

            [streetInput, cityInput, stateInput, zipInput].forEach(input => {
              if (input) {
                input.setAttribute('data-floating-initialized', 'true');
              }
            });

            if (typeof window.updateAllFloatingLabels === 'function') {
              window.updateAllFloatingLabels();
            }
          }, 0);

          hideSuggestions();

          // Trigger property lookup if available
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

    case 'urgency':
      const urgencyOptions = document.querySelectorAll('.dh-urgency-option');
      
      if (urgencyOptions) {
        urgencyOptions.forEach(option => {
          option.addEventListener('click', async e => {
            // Prevent double-clicking if loading overlay is visible
            const urgencyLoadingEl = document.getElementById('urgency-loading');
            if (urgencyLoadingEl && urgencyLoadingEl.style.display === 'flex') {
              return;
            }

            // Remove selected class from all options
            urgencyOptions.forEach(opt => {
              opt.classList.remove('selected');
            });

            // Add selected class to clicked option
            const urgencyOption = e.target.closest('.dh-urgency-option');
            if (!urgencyOption) {
              console.error('Could not find urgency option element');
              return;
            }

            urgencyOption.classList.add('selected');

            // Get the urgency value
            const urgencyValue = urgencyOption.getAttribute('data-urgency');

            // Save urgency to form data
            widgetState.formData.urgency = urgencyValue;

            // Show loading state
            if (urgencyLoadingEl) {
              urgencyLoadingEl.style.display = 'flex';
            }

            try {
              // Fetch pricing data first
              const pricingData = await fetchPricingData();

              // Save partial lead with urgency selection
              await savePartialLead({ served: true, areas: ['general'], primaryArea: 'general' }, 'urgency_completed');

              // Wait a brief moment for visual feedback
              setTimeout(() => {
                // Hide loading
                if (urgencyLoadingEl) {
                  urgencyLoadingEl.style.display = 'none';
                }

                // Navigate to next step (initial-offer)
                showStep('initial-offer');
                setupStepValidation('initial-offer');
                updateProgressBar('initial-offer');
              }, 800);
            } catch (error) {
              console.error('Error saving urgency selection:', error);
              // Hide loading and allow retry
              if (urgencyLoadingEl) {
                urgencyLoadingEl.style.display = 'none';
              }
            }
          });
        });
      }
      break;

    case 'initial-offer':
      const letsScheduleBtn = document.getElementById('lets-schedule');
      const detailedQuoteBtn = document.getElementById('detailed-quote');
      const noThanksBtn = document.getElementById('no-thanks');

      // Add click handlers for each button
      if (letsScheduleBtn) {
        letsScheduleBtn.addEventListener('click', () => {
          widgetState.formData.offerChoice = 'schedule';
          // Navigate directly to contact step for scheduling
          showStep('contact');
          setupStepValidation('contact');
          updateProgressBar('contact');
        });
      }

      if (detailedQuoteBtn) {
        detailedQuoteBtn.addEventListener('click', () => {
          widgetState.formData.offerChoice = 'quote';
          // Navigate to quote-contact step for quote
          showStep('quote-contact');
          setupStepValidation('quote-contact');
          updateProgressBar('quote-contact');
        });
      }

      if (noThanksBtn) {
        noThanksBtn.addEventListener('click', () => {
          widgetState.formData.offerChoice = 'decline';
          // For now, just show a thank you message or close the widget
          // TODO: Implement exit-survey step if needed
          alert('Thank you for your time!');
        });
      }
      break;

    case 'contact':
      // Contact step (Schedule Service) - setup floating labels and validation
      const contactInputs = [
        'first-name-input',
        'last-name-input', 
        'phone-input',
        'email-input',
        'start-date-input',
        'arrival-time-input'
      ];
      
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

      // Pre-populate form fields with any available contact information
      setTimeout(() => {
        populateContactFields();
      }, 50);
      break;

    case 'quote-contact':
      // Quote contact form validation setup - form is submitted via proceedToQuoteWithValidation function
      // Set up basic field validation for real-time feedback
      const quoteInputs = [
        'quote-first-name-input',
        'quote-last-name-input', 
        'quote-email-input',
        'quote-phone-input'
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
      const comparisonNoThanksBtn = document.getElementById(
        'comparison-no-thanks'
      );

      // Load service plans for comparison with tabbed interface
      const loadComparisonPlans = async () => {
        try {
          const comparisonPlanTabs = document.getElementById(
            'comparison-plan-tabs'
          );
          const comparisonPlanContent = document.getElementById(
            'comparison-plan-content'
          );
          const comparisonPlanLoading = document.getElementById(
            'comparison-plan-loading'
          );

          if (!comparisonPlanTabs || !comparisonPlanContent) return;

          let suggestions = null;

          // Check if we have pre-loaded data from quote form submission
          if (widgetState.formData.planComparisonData) {
            suggestions = widgetState.formData.planComparisonData;
          } else {
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

            // Generate tabs HTML
            const tabsHtml = plans
              .map((plan, index) => {
                const isRecommended = index === 0; // First plan is recommended
                const label = isRecommended ? 'RECOMMENDED' : 'OPTIONAL';
                const activeClass = index === 0 ? 'active' : '';

                return `
                <div class="dh-plan-tab ${activeClass}" data-plan-index="${index}" onclick="switchPlanTab(${index})">
                  <div class="dh-plan-tab-label">${label}</div>
                  <div class="dh-plan-tab-name">${plan.plan_name}</div>
                </div>
              `;
              })
              .join('');

            // Generate content HTML for first plan (active by default)
            const activeContent = generatePlanContent(plans[0]);

            // Update DOM
            comparisonPlanTabs.innerHTML = tabsHtml;
            comparisonPlanContent.innerHTML = activeContent;

            // Store plans data for tab switching
            window.comparisonPlansData = plans;
          } else {
            comparisonPlanTabs.innerHTML = `
              <div class="dh-no-plans">
                <p>No service plans available at this time.</p>
                <p>Please contact us directly for a custom quote.</p>
              </div>
            `;
            comparisonPlanContent.innerHTML = '';
          }
        } catch (error) {
          console.error('Error loading comparison plans:', error);
          const comparisonPlanTabs = document.getElementById(
            'comparison-plan-tabs'
          );
          if (comparisonPlanTabs) {
            comparisonPlanTabs.innerHTML = `
              <div class="dh-error-state">
                <p>Unable to load service plans.</p>
                <p>Please try again or contact us directly.</p>
              </div>
            `;
          }
        }
      };

      // Generate detailed content for a single plan
      const generatePlanContent = plan => {
        const featuresHtml = plan.plan_features
          .map(
            feature =>
              `<li class="dh-plan-feature"><span class="dh-feature-checkmark"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><g clip-path="url(#clip0_6146_560)"><path d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916" stroke="#00AE42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 9.16659L10 11.6666L18.3333 3.33325" stroke="#00AE42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath d="clip0_6146_560"><rect width="20" height="20" fill="white"/></clipPath></defs></svg></span> ${feature}</li>`
          )
          .join('');

        return `
          <div class="dh-plan-details">
            <div class="dh-plan-main">
              <h3 class="dh-plan-title">${plan.plan_name}</h3>
              <p class="dh-plan-description">${plan.plan_description || ''}</p>
              
              <div class="dh-plan-included">
                <h4>What&apos;s included:</h4>
                <ul class="dh-plan-features-list">
                  ${featuresHtml}
                </ul>
              </div>
              
              <div class="dh-plan-pricing">
                <div class="dh-plan-price">
                  <span class="dh-plan-price-label">Service starts at just $${plan.recurring_price}${formatBillingFrequency(plan.billing_frequency)}.</span>
                </div>
                <p class="dh-plan-price-detail">Initial setup fee of $${plan.initial_price}* to get started.</p>
                <p class="dh-plan-price-disclaimer">*Pricing may vary based on initial inspection findings and other factors.</p>
              </div>
            </div>
            ${
              plan.plan_image_url
                ? `
            <div class="dh-plan-visual">
              <div class="dh-plan-image-container">
                <div class="dh-plan-image-actual">
                  <img src="${plan.plan_image_url}" alt="${plan.plan_name}" style="width: 100%; height: 240px; object-fit: cover; border-radius: 12px;" />
                </div>
              </div>
            </div>
            `
                : ''
            }
            <div class="dh-plan-coverage-icons">
                <div class="dh-coverage-icon">
                  <span class="dh-coverage-checkmark">✓</span>
                  <span>Covers Ants, Spiders, Wasps &amp; More</span>
                </div>
                <div class="dh-coverage-icon">
                  <span class="dh-coverage-checkmark">✓</span>
                  <span>Covers Ants, Spiders, Wasps &amp; More</span>
                </div>
                <div class="dh-coverage-icon">
                  <span class="dh-coverage-checkmark">✓</span>
                  <span>Covers Ants, Spiders, Wasps &amp; More</span>
                </div>
                <div class="dh-coverage-icon">
                  <span class="dh-coverage-checkmark">✓</span>
                  <span>Covers Ants, Spiders, Wasps &amp; More</span>
                </div>
              </div>
          </div>

          <div class="dh-plan-actions">
            <button class="dh-form-btn dh-form-btn-primary" onclick="selectPlan('${plan.id || 'selected'}', '${plan.plan_name}')">
              Let&apos;s Schedule!
            </button>
            <button class="dh-form-btn plan-no-thanks" onclick="declinePlanComparison()">
              No Thank You
            </button>
          </div>

          ${generateFaqSection(plan)}
        `;
      };

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
                <span class="dh-faq-icon">+</span>
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

      // Helper function to format billing frequency
      const formatBillingFrequency = frequency => {
        switch (frequency) {
          case 'monthly':
            return '/month';
          case 'quarterly':
            return '/quarter';
          case 'annually':
            return '/year';
          default:
            return '/month';
        }
      };

      // Switch plan tab function
      window.switchPlanTab = (tabIndex) => {
        // Update tab active states
        const tabs = document.querySelectorAll('.dh-plan-tab');
        tabs.forEach((tab, index) => {
          tab.classList.toggle('active', index === tabIndex);
        });

        // Update content
        const contentContainer = document.getElementById('comparison-plan-content');
        if (contentContainer && window.comparisonPlansData) {
          const newContent = generatePlanContent(
            window.comparisonPlansData[tabIndex]
          );
          contentContainer.innerHTML = newContent;
        }
      };

      // FAQ accordion toggle functionality
      window.toggleFaqItem = faqIndex => {
        const faqContent = document.getElementById(
          `faq-content-${faqIndex}`
        );
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
          faqIcon.textContent = '+';
          faqIcon.style.transform = 'rotate(0deg)';
        } else {
          // Open the FAQ
          faqItem.classList.add('active');
          faqContent.style.maxHeight = faqContent.scrollHeight + 'px';
          faqIcon.textContent = '×';
          faqIcon.style.transform = 'rotate(180deg)';
        }
      };

      // Handle plan comparison decline
      window.declinePlanComparison = () => {
        widgetState.formData.offerChoice = 'decline-comparison';
        showStep('exit-survey');
        setupStepValidation('exit-survey');
        updateProgressBar('exit-survey');
      };

      // Select plan function - for plan comparison step
      window.selectPlan = (planId, planName) => {
        // Store selected plan
        widgetState.formData.selectedPlanId = planId;
        widgetState.formData.selectedPlanName = planName;
        widgetState.formData.offerChoice = 'schedule-from-comparison';

        // Navigate to contact form for final submission
        showStep('contact');
        setupStepValidation('contact');
        updateProgressBar('contact');
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
          updateProgressBar('exit-survey');
        });
      }
      break;

    case 'exit-survey':
      const surveyOptions = document.querySelectorAll('.dh-survey-option');
      const surveySubmitBtn = document.getElementById('survey-submit');
      const exitFeedbackInput = document.getElementById('exit-feedback');

      if (surveyOptions) {
        surveyOptions.forEach(option => {
          option.addEventListener('click', () => {
            // Remove selected class from all options
            surveyOptions.forEach(opt =>
              opt.classList.remove('selected')
            );
            // Add selected class to clicked option
            option.classList.add('selected');
            // Store selection
            widgetState.formData.exitReason = option.dataset.reason;
            // Survey submit button stays enabled
          });
        });
      }

      if (surveySubmitBtn) {
        surveySubmitBtn.addEventListener('click', async () => {
          // Store optional feedback
          if (exitFeedbackInput) {
            widgetState.formData.exitFeedback = exitFeedbackInput.value;
          }

          // Save exit survey data
          try {
            const partialSaveResult = await savePartialLead(
              { served: false, status: 'declined' },
              'exit_survey_completed'
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

    default:
      // Set up validation for other steps as needed
      break;
  }
};

  // Pre-populate contact fields for both regular and quote forms
  const populateContactFields = () => {
    try {
      const contactInfo = widgetState.formData.contactInfo;
      if (!contactInfo) return;

      // Populate regular contact form fields (contact step)
      const firstNameInput = document.getElementById('first-name-input');
      const lastNameInput = document.getElementById('last-name-input');
      const phoneInput = document.getElementById('phone-input');
      const emailInput = document.getElementById('email-input');
      const startDateInput = document.getElementById('start-date-input');
      const arrivalTimeInput = document.getElementById('arrival-time-input');

      // Handle name splitting from consolidated name field if individual fields not available
      let firstName = contactInfo.firstName || '';
      let lastName = contactInfo.lastName || '';
      
      if (!firstName && !lastName && contactInfo.name) {
        const nameParts = contactInfo.name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      if (firstNameInput && firstName) {
        firstNameInput.value = firstName;
        updateFloatingLabel(firstNameInput);
      }
      if (lastNameInput && lastName) {
        lastNameInput.value = lastName;
        updateFloatingLabel(lastNameInput);
      }
      if (phoneInput && contactInfo.phone) {
        phoneInput.value = contactInfo.phone;
        updateFloatingLabel(phoneInput);
      }
      if (emailInput && contactInfo.email) {
        emailInput.value = contactInfo.email;
        updateFloatingLabel(emailInput);
      }
      if (startDateInput && contactInfo.startDate) {
        startDateInput.value = contactInfo.startDate;
        updateFloatingLabel(startDateInput);
      }
      if (arrivalTimeInput && contactInfo.arrivalTime) {
        arrivalTimeInput.value = contactInfo.arrivalTime;
        updateFloatingLabel(arrivalTimeInput);
      }

      // Populate quote contact form fields (quote-contact step)  
      const quoteFirstNameInput = document.getElementById('quote-first-name-input');
      const quoteLastNameInput = document.getElementById('quote-last-name-input');
      const quotePhoneInput = document.getElementById('quote-phone-input');
      const quoteEmailInput = document.getElementById('quote-email-input');

      if (quoteFirstNameInput && firstName) {
        quoteFirstNameInput.value = firstName;
        updateFloatingLabel(quoteFirstNameInput);
      }
      if (quoteLastNameInput && lastName) {
        quoteLastNameInput.value = lastName;
        updateFloatingLabel(quoteLastNameInput);
      }
      if (quotePhoneInput && contactInfo.phone) {
        quotePhoneInput.value = contactInfo.phone;
        updateFloatingLabel(quotePhoneInput);
      }
      if (quoteEmailInput && contactInfo.email) {
        quoteEmailInput.value = contactInfo.email;
        updateFloatingLabel(quoteEmailInput);
      }

    } catch (error) {
      console.error('Error populating contact fields:', error);
    }
  };

// Expose functions to window for onclick handlers
window.showStep = showStep;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.changeAddress = changeAddress;
window.validateServiceArea = validateServiceArea;
// selectPlan is now exposed via window.selectPlan inside plan-comparison setupStepValidation
window.showComparisonPlan = showComparisonPlan;
window.setupStepValidation = setupStepValidation;
window.populateContactFields = populateContactFields;