/**
 * DH Widget - Main Entry Point
 * Contains initialization, configuration, and core setup
 */

(function () {
  'use strict';

  // Show error state instead of breaking the page
  const showErrorState = (errorType, message, details = '') => {
    // Capture script tag reference IMMEDIATELY while document.currentScript is still valid
    const scriptTag =
      document.currentScript ||
      (function () {
        const scripts = document.getElementsByTagName('script');
        return scripts && scripts.length > 0
          ? scripts[scripts.length - 1]
          : null;
      })();

    // Display error function that uses captured script reference
    const displayError = () => {
      try {
        // Extra safety - ensure we don't interfere with page loading
        if (!document || !document.createElement) {
          console.error(`DH Widget ${errorType}:`, message, details);
          return;
        }

        // Create error widget with additional safety checks
        const errorWidget = document.createElement('div');
        if (!errorWidget) {
          console.error(`DH Widget ${errorType}:`, message, details);
          return;
        }

        errorWidget.id = 'dh-widget-error-' + Date.now(); // Unique ID to avoid conflicts

        // Use safe style setting for inline display
        try {
          errorWidget.style.cssText = `
            max-width: 500px;
            margin: 20px auto;
            padding: 20px;
            background: #fee2e2;
            border: 1px solid #fca5a5;
            border-radius: 8px;
            color: #991b1b;
            display: block;
            position: relative;
            box-sizing: border-box;
          `;
        } catch (styleError) {
          // Fallback if cssText fails
          errorWidget.style.background = '#fee2e2';
          errorWidget.style.color = '#991b1b';
          errorWidget.style.padding = '20px';
          errorWidget.style.border = '1px solid #fca5a5';
          errorWidget.style.borderRadius = '8px';
          errorWidget.style.margin = '20px auto';
          errorWidget.style.maxWidth = '500px';
        }

        const errorTitle = document.createElement('div');
        errorTitle.style.cssText = 'font-weight: bold; margin: 0 0 10px 0; font-size: 16px;';
        errorTitle.textContent = `DH Widget ${errorType}`;

        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = 'margin: 0 0 10px 0; font-size: 14px;';
        errorMessage.textContent = message;

        const errorDetails = document.createElement('div');
        errorDetails.textContent = details || `Error Type: ${errorType}`;

        // Safe appendChild with checks
        try {
          errorWidget.appendChild(errorTitle);
          errorWidget.appendChild(errorMessage);
          errorWidget.appendChild(errorDetails);
        } catch (appendError) {
          // If appendChild fails, just set textContent
          errorWidget.textContent = `${errorType}: ${message}`;
        }

        // Safe insertion into DOM using captured script reference
        try {
          if (scriptTag && scriptTag.parentNode) {
            // Insert inline where the script tag is located
            try {
              scriptTag.parentNode.insertBefore(errorWidget, scriptTag.nextSibling);
            } catch (insertError) {
              // Only use body as absolute last resort
              if (document.body) {
                document.body.appendChild(errorWidget);
              } else {
                // Final fallback - just log
                console.error(`DH Widget ${errorType}:`, message, details);
              }
            }
          } else {
            // DOM insertion failed, just log
            console.error(`DH Widget ${errorType}:`, message, details);
            console.error('Failed to insert error widget:', insertError);
          }
        } catch (insertError) {
          // Always log the error
          console.error(`DH Widget ${errorType}:`, message, details);
        }
      } catch (displayErrorException) {
        // Absolute fallback - just log everything
        console.error(
          'DH Widget: Critical error in error display:',
          displayErrorException
        );
        console.error('Original error:', errorType, message, details);
      }
    };

    // Run immediately for synchronous inline positioning
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', displayError);
    } else {
      displayError();
    }
  };

  // Prevent multiple initializations
  if (window.dhWidgetInitialized) {
    return;
  }

  // Get the script tag that loaded this file with improved detection for dynamic loading
  const scriptTag = document.currentScript ||
    (function () {
      // Try to find by data-script-id attribute (most reliable for React)
      let foundScript = document.querySelector('script[data-script-id="dh-widget"]');
      // Try to find by data-container-id attribute (React integration)
      if (!foundScript) foundScript = document.querySelector('script[data-container-id]');
      // Try to find the most recent widget.js script
      if (!foundScript) {
        const scripts = document.querySelectorAll('script[src*="embed"]');
        foundScript = scripts[scripts.length - 1];
      }
      // Final fallback
      if (!foundScript) {
        const allScripts = document.getElementsByTagName('script');
        foundScript = allScripts[allScripts.length - 1];
      }
      return foundScript;
    })();

  // Extract configuration from script tag attributes
  if (!scriptTag) {
    showErrorState('Initialization Error', 'Could not determine script tag reference');
    return;
  }

  const config = {
    companyId: scriptTag.getAttribute('data-company-id'),
    baseUrl: scriptTag.getAttribute('data-base-url'),
    containerId: scriptTag.getAttribute('data-container-id'),
    displayMode: scriptTag.getAttribute('data-display-mode') || 'inline',
    primaryColor: scriptTag.getAttribute('data-primary-color') || '#007bff',
    secondaryColor: scriptTag.getAttribute('data-secondary-color') || '#6c757d',
    backgroundColor: scriptTag.getAttribute('data-background-color') || '#ffffff',
    textColor: scriptTag.getAttribute('data-text-color') || '#333333',
    buttonText: scriptTag.getAttribute('data-button-text') || 'Get Started',
    headerText: scriptTag.getAttribute('data-header-text'),
    subHeaderText: scriptTag.getAttribute('data-sub-header-text'),
    modalCloseOnBackdrop: scriptTag.getAttribute('data-modal-close-on-backdrop') !== 'false',
  };

  // Validate required configuration
  if (!config.companyId) {
    showErrorState(
      'Configuration Error',
      'Missing required attribute: data-company-id',
      'Please add data-company-id="your-company-id" to the script tag'
    );
    return;
  }

  if (!config.baseUrl) {
    showErrorState(
      'Configuration Error',
      'Missing required attribute: data-base-url',
      'Please add data-base-url="https://your-domain.com" to the script tag'
    );
    return;
  }

  // Only initialize if configuration is valid
  window.dhWidgetInitialized = true;

  // Utility Functions (extracted from embed.js)
  const generateSessionId = () => {
    // Generate a proper UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  const parseUrlParameters = (url = window.location.href) => {
    const urlObj = new URL(url);
    const params = {};

    // Extract UTM parameters
    [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ].forEach(param => {
      const value = urlObj.searchParams.get(param);
      if (value) params[param] = value;
    });

    // Extract GCLID
    const gclid = urlObj.searchParams.get('gclid');
    if (gclid) params.gclid = gclid;

    return params;
  };

  const getCookieValue = name => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Get initial colors from configuration
  const getInitialColors = () => {
    const defaultColors = {
      primary: '#3b82f6',
      secondary: '#1e293b',
      background: '#ffffff',
      text: '#374151',
    };

    // Use data attribute colors if available, otherwise use defaults
    return {
      primary: config.primaryColor || defaultColors.primary,
      secondary: config.secondaryColor || defaultColors.secondary,
      background: config.backgroundColor || defaultColors.background,
      text: config.textColor || defaultColors.text,
    };
  };

  // Initialize the widget
  async function initializeWidget() {
    try {
      
      // Initialize session and URL parameters
      const sessionId = generateSessionId();
      const urlParams = parseUrlParameters();
      
      // Create attribution data with required page_url field
      const attributionData = {
        ...urlParams,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        collected_at: 'widget_load',
      };
      
      // Initialize widget state objects (already declared globally)
      widgetState = {
        isMinimized: false,
        isLoading: false,
        isSubmitting: false,
        widgetConfig: null,
        currentStep: 'welcome',
        sessionId: sessionId,
        attributionData: attributionData,
        recoveryData: null,
        formData: {
          pestType: '',
          pestIcon: '',
          urgency: '',
          selectedPlan: '',
          recommendedPlan: '',
          address: '',
          addressStreet: '',
          addressCity: '',
          addressState: '',
          addressZip: '',
          latitude: '',
          longitude: '',
          homeSize: '',
          contactInfo: {
            name: '',
            phone: '',
            email: '',
            comments: '',
          },
        },
        priceEstimate: null,
        formState: {
          lastSaved: null,
          autoSaveEnabled: true,
          autoSaveInterval: 10000,
          validationErrors: {},
          fieldCompletionStatus: {},
          stepCompletionPercentage: {},
          fieldsWithErrors: new Set(),
          userEngagement: {
            startTime: null,
            stepTimes: {},
            totalTimeSpent: 0,
            abandonmentPoints: [],
            returningUser: false,
          },
          formVersion: '2.1',
          progressiveFeatures: {
            smartSuggestions: true,
            realTimeValidation: true,
            autoSave: true,
            stepAnalytics: true,
          },
        },
      };

      // Initialize step progress manager
      stepProgressManager = {
        stepFlow: ['welcome', 'pest-issue', 'address', 'quote', 'complete'],
        stepLabels: {
          welcome: 'Welcome',
          'pest-issue': 'Pest Issue',
          address: 'Address',
          quote: 'Quote',
          complete: 'Complete',
        },
        getProgressStep: actualStep => {
          const quoteSteps = [
            'urgency',
            'initial-offer',
            'plan-comparison',
            'quote-contact',
            'contact',
            'plan-selection',
            'plans',
          ];
          if (quoteSteps.includes(actualStep)) {
            return 'quote';
          }
          if (actualStep === 'complete') {
            return 'complete';
          }
          return actualStep;
        },
        getStepStatus: stepName => {
          const currentProgressStep = stepProgressManager.getProgressStep(
            widgetState.currentStep
          );
          const currentStepIndex =
            stepProgressManager.stepFlow.indexOf(currentProgressStep);
          const stepIndex = stepProgressManager.stepFlow.indexOf(stepName);
          if (stepIndex < currentStepIndex) {
            return 'completed';
          } else if (stepIndex === currentStepIndex) {
            return 'active';
          } else {
            return 'inactive';
          }
        },
        getCurrentStepIndex: () => {
          const currentProgressStep = stepProgressManager.getProgressStep(
            widgetState.currentStep
          );
          return stepProgressManager.stepFlow.indexOf(currentProgressStep);
        },
      };

      // Initialize progressive form manager
      progressiveFormManager = {
        autoSaveTimer: null,
        initializeProgressiveFeatures: () => {
          try {
            widgetState.formState.userEngagement.startTime = new Date().toISOString();
            widgetState.formState.userEngagement.returningUser = progressiveFormManager.isReturningUser();
          } catch (error) {
            console.warn('Error initializing progressive form features:', error);
          }
        },
        isReturningUser: () => {
          try {
            const lastVisit = localStorage.getItem('dh_last_visit_' + config.companyId);
            return !!lastVisit;
          } catch (error) {
            return false;
          }
        },
        hasSignificantFormData: () => {
          const data = widgetState.formData;
          return !!(
            data.pestType ||
            data.address ||
            data.homeSize ||
            data.contactInfo.name ||
            data.contactInfo.email ||
            data.contactInfo.phone
          );
        },
        loadLocalFormState: () => {
          try {
            const saved = localStorage.getItem('dh_form_state_' + config.companyId);
            return saved ? JSON.parse(saved) : null;
          } catch (error) {
            return null;
          }
        },
        calculateStepCompletion: () => {
          const steps = {
            welcome: widgetState.currentStep !== 'welcome' ? 100 : 0, // Completed if we've moved past welcome
            pest_issue: widgetState.formData.pestType ? 100 : 0, // Fixed field name from pestIssue to pestType
            address:
              (widgetState.formData.address ? 50 : 0) +
              (widgetState.formData.latitude ? 50 : 0), // Address entered + validated
            urgency: widgetState.formData.urgency ? 100 : 0, // Added urgency step
            plans:
              widgetState.currentStep === 'contact' ||
              widgetState.currentStep === 'complete'
                ? 100
                : 0, // Completed if moved past plans
            contact:
              (widgetState.formData.contactInfo.name ? 34 : 0) +
              (widgetState.formData.contactInfo.email ? 33 : 0) +
              (widgetState.formData.contactInfo.phone ? 33 : 0),
          };

          const totalSteps = Object.keys(steps).length;
          const overall =
            Object.values(steps).reduce((sum, val) => sum + val, 0) /
            totalSteps;

          widgetState.formState.stepCompletionPercentage = steps;

          return {
            steps: steps,
            overall: Math.round(overall),
          };
        },
        
        // Clear field indicators (errors, warnings, success)
        clearFieldIndicators: field => {
          // Reset field styling
          field.style.borderColor = '';
          field.style.boxShadow = '';
          
          // Find and remove error/warning/success elements
          const container = field.closest('.dh-form-group') || field.parentNode;
          if (container) {
            const indicators = container.querySelectorAll(
              '.dh-field-error, .dh-field-warning, .dh-field-success, .dh-format-suggestion'
            );
            indicators.forEach(el => el.remove());
          }
        },
        
        clearFieldError: field => {
          // Remove from error tracking
          if (field.id) {
            widgetState.formState.fieldsWithErrors.delete(field.id);
          }
          // Use the comprehensive clearFieldIndicators method
          progressiveFormManager.clearFieldIndicators(field);
        },
        
        showFieldError: (field, message) => {
          // Remove existing error
          progressiveFormManager.clearFieldError(field);
          
          // Create error element
          const errorEl = document.createElement('div');
          errorEl.className = 'dh-field-error';
          errorEl.textContent = message;
          errorEl.style.cssText = `
            color: #ef4444;
            font-size: 12px;
            margin-top: 8px;
            display: block;
            width: 100%;
            line-height: 1.4;
            animation: fadeIn 0.3s ease;
          `;
          
          // Add error styling to field
          field.style.borderColor = '#ef4444';
          field.style.boxShadow = '0 0 0 1px #ef4444';
          
          // Track field as having error
          if (field.id) {
            widgetState.formState.fieldsWithErrors.add(field.id);
          }
          
          // Insert error message at container level for full width
          const container = field.closest('.dh-form-group') || field.parentNode;
          if (container) {
            container.appendChild(errorEl);
          }
        },
        
        showFieldWarning: (field, message) => {
          // Remove existing warnings
          const container = field.closest('.dh-form-group') || field.parentNode;
          if (container) {
            const existingWarnings = container.querySelectorAll('.dh-field-warning');
            existingWarnings.forEach(el => el.remove());
          }
          
          // Create warning element
          const warningEl = document.createElement('div');
          warningEl.className = 'dh-field-warning';
          warningEl.textContent = message;
          warningEl.style.cssText = `
            color: #f59e0b;
            font-size: 12px;
            margin-top: 8px;
            display: block;
            width: 100%;
            line-height: 1.4;
            animation: fadeIn 0.3s ease;
          `;
          
          if (container) {
            container.appendChild(warningEl);
          }
        }
      };
      
      // Load configuration first
      const configLoaded = await loadConfig();
      if (!configLoaded) {
        showErrorState(
          'Network Error',
          'Failed to load widget configuration',
          'Check your network connection and verify the data-base-url is correct'
        );
        return;
      }
      
      // Create styles with initial colors from data attributes
      const initialColors = getInitialColors();
      createStyles(initialColors);
      
      // Create the widget elements
      const elements = createWidget();

      // Insert widget into DOM - check for container ID first (for React integration)
      const containerId = scriptTag.getAttribute('data-container-id');
      if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
          if (config.displayMode === 'button') {
            // For button mode, elements is the button element
            container.appendChild(elements);
          } else {
            // For inline mode, elements is an object with formWidget
            container.appendChild(elements.formWidget);
          }
        } else {
          // Fallback to original logic
          if (scriptTag.parentNode) {
            if (config.displayMode === 'button') {
              scriptTag.parentNode.insertBefore(
                elements,
                scriptTag.nextSibling
              );
            } else {
              scriptTag.parentNode.insertBefore(
                elements.formWidget,
                scriptTag.nextSibling
              );
            }
          } else {
            console.error(
              'DH Widget: No script parent node available for insertion'
            );
          }
        }
      } else {
        // Original logic for normal embedding
        if (scriptTag.parentNode) {
          if (config.displayMode === 'button') {
            scriptTag.parentNode.insertBefore(
              elements,
              scriptTag.nextSibling
            );
          } else {
            scriptTag.parentNode.insertBefore(
              elements.formWidget,
              scriptTag.nextSibling
            );
          }
        } else {
          console.error(
            'DH Widget: No parent node available for widget insertion'
          );
        }
      }
    } catch (error) {
      console.error('DH Widget initialization failed:', error);
      showErrorState('INITIALIZATION_ERROR', 'Widget failed to initialize', error.message);
    }
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }

})();