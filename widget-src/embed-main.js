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

    // Extract continue_session for cross-device recovery
    const continueSession = urlObj.searchParams.get('continue_session');
    if (continueSession) params.continue_session = continueSession;

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
      const urlParams = parseUrlParameters();
      const sessionId = urlParams.continue_session || generateSessionId();
      
      // Determine traffic source based on available data
      const determineTrafficSource = (params, referrer) => {
        // Check for paid search indicators
        if (params.gclid) return 'google_ads';
        if (params.utm_source === 'google' && params.utm_medium === 'cpc') return 'google_ads';
        if (params.utm_medium === 'cpc' || params.utm_medium === 'ppc') return 'paid_search';
        
        // Check for organic search
        if (referrer && (
          referrer.includes('google.com') || 
          referrer.includes('bing.com') || 
          referrer.includes('yahoo.com') ||
          referrer.includes('duckduckgo.com')
        )) return 'organic_search';
        
        // Check for social media
        if (referrer && (
          referrer.includes('facebook.com') || 
          referrer.includes('instagram.com') ||
          referrer.includes('twitter.com') || 
          referrer.includes('linkedin.com') ||
          referrer.includes('youtube.com')
        )) return 'social';
        
        // Check for UTM source
        if (params.utm_source) {
          if (params.utm_medium === 'email') return 'email';
          if (params.utm_medium === 'social') return 'social';
          return `utm_${params.utm_source}`;
        }
        
        // Check if there's a referrer
        if (referrer) return 'referral';
        
        // Default to direct
        return 'direct';
      };

      // Create attribution data with required page_url field
      const attributionData = {
        ...urlParams,
        page_url: window.location.href,
        referrer_url: document.referrer || null,
        referrer_domain: document.referrer ? new URL(document.referrer).hostname : null,
        traffic_source: determineTrafficSource(urlParams, document.referrer),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        collected_at: 'widget_load',
      };

      // Debug logging for URL capture
      console.log('DH Widget URL Capture:', {
        page_url: attributionData.page_url,
        referrer_url: attributionData.referrer_url,
        referrer_domain: attributionData.referrer_domain,
        traffic_source: attributionData.traffic_source,
        document_referrer: document.referrer,
        utm_params: urlParams
      });
      
      // Initialize widget state objects (already declared globally)
      widgetState = {
        isMinimized: false,
        isLoading: false,
        isSubmitting: false,
        widgetConfig: null,
        currentStep: 'pest-issue',
        sessionId: sessionId,
        attributionData: attributionData,
        recoveryData: null,
        formData: {
          pestType: '',
          pestIcon: '',
          pestBackgroundImage: '',
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
          consentStatus: '',
          contactInfo: {
            name: '',
            firstName: '',
            lastName: '',
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
        stepFlow: ['pest-issue', 'address', 'confirm-address', 'how-we-do-it', 'quote-contact', 'plan-comparison', 'contact', 'complete'],
        stepLabels: {
          'pest-issue': 'Pest Issue',
          'address': 'Address',
          'confirm-address': 'Confirm Address',
          'how-we-do-it': 'How We Do It',
          'quote-contact': 'Quote Contact',
          'plan-comparison': 'Plan Comparison',
          'contact': 'Contact',
          'complete': 'Complete',
        },
        getProgressStep: actualStep => {
          // Simply return the actual step name - no mapping needed
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
        getCompletedSteps: () => {
          const completed = [];
          const currentStepIndex = stepProgressManager.getCurrentStepIndex();
          
          // Add all steps before current step as completed
          for (let i = 0; i < currentStepIndex; i++) {
            completed.push(stepProgressManager.stepFlow[i]);
          }
          
          return completed;
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
        
        // Save current form state to localStorage
        saveFormStateToLocalStorage: () => {
          try {
            const saveData = {
              currentStep: widgetState.currentStep,
              formData: { ...widgetState.formData },
              completedSteps: stepProgressManager.getCompletedSteps(),
              timestamp: new Date().toISOString(),
              sessionId: widgetState.sessionId,
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
            };
            
            // Remove sensitive or large data that shouldn't be persisted
            delete saveData.formData.contactInfo;
            
            localStorage.setItem('dh_widget_progress_' + config.companyId, JSON.stringify(saveData));
            widgetState.formState.lastSaved = new Date().toISOString();
            
            console.log('DH Widget: Saved form state to localStorage', saveData);
            return true;
          } catch (error) {
            console.warn('Failed to save form state:', error);
            return false;
          }
        },
        
        // Restore form state from localStorage
        restoreFormStateFromLocalStorage: () => {
          try {
            const saved = localStorage.getItem('dh_widget_progress_' + config.companyId);
            if (!saved) return null;
            
            const saveData = JSON.parse(saved);
            
            // Check if saved data has expired
            if (new Date() > new Date(saveData.expiresAt)) {
              progressiveFormManager.clearSavedFormState();
              return null;
            }
            
            return saveData;
          } catch (error) {
            console.warn('Failed to restore form state:', error);
            return null;
          }
        },
        
        // Clear saved form state
        clearSavedFormState: () => {
          try {
            localStorage.removeItem('dh_widget_progress_' + config.companyId);
            return true;
          } catch (error) {
            console.warn('Failed to clear saved form state:', error);
            return false;
          }
        },
        
        // Check if user has significant progress worth restoring
        shouldPromptToContinue: (savedData) => {
          if (!savedData) {
            console.log('DH Widget: No saved data for continue prompt');
            return false;
          }
          
          const { formData, currentStep } = savedData;
          
          // Check for significant form completion
          const hasSignificantProgress = !!(
            formData.pestType ||
            formData.address ||
            (currentStep !== 'pest-issue' && currentStep !== 'welcome')
          );
          
          console.log('DH Widget: Checking if should prompt to continue', {
            hasSignificantProgress,
            pestType: formData.pestType,
            address: formData.address,
            currentStep: currentStep,
            formData: formData
          });
          
          return hasSignificantProgress;
        },
        
        // Start auto-save functionality
        startAutoSave: () => {
          if (!widgetState.formState.progressiveFeatures.autoSave) {
            console.log('DH Widget: Auto-save is disabled');
            return;
          }
          
          // Clear any existing timer
          if (progressiveFormManager.autoSaveTimer) {
            clearInterval(progressiveFormManager.autoSaveTimer);
          }
          
          console.log('DH Widget: Starting auto-save with interval:', widgetState.formState.autoSaveInterval);
          
          // Start new auto-save timer
          progressiveFormManager.autoSaveTimer = setInterval(() => {
            if (progressiveFormManager.hasSignificantFormData()) {
              console.log('DH Widget: Auto-save triggered - has significant data');
              progressiveFormManager.saveFormStateToLocalStorage();
            }
          }, widgetState.formState.autoSaveInterval);
        },
        
        // Stop auto-save functionality
        stopAutoSave: () => {
          if (progressiveFormManager.autoSaveTimer) {
            clearInterval(progressiveFormManager.autoSaveTimer);
            progressiveFormManager.autoSaveTimer = null;
          }
        },
        calculateStepCompletion: () => {
          const steps = {
            // Remove welcome step completion tracking
            pest_issue: widgetState.formData.pestType ? 100 : 0, // Fixed field name from pestIssue to pestType
            address:
              (widgetState.formData.address ? 50 : 0) +
              (widgetState.formData.latitude ? 50 : 0), // Address entered + validated
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
          // Check if field exists
          if (!field) {
            console.warn('clearFieldIndicators called with null field');
            return;
          }
          
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
          // Check if field exists
          if (!field) {
            console.warn('clearFieldError called with null field');
            return;
          }
          
          // Remove from error tracking
          if (field.id) {
            widgetState.formState.fieldsWithErrors.delete(field.id);
          }
          // Use the comprehensive clearFieldIndicators method
          progressiveFormManager.clearFieldIndicators(field);
        },
        
        showFieldError: (field, message) => {
          // Check if field exists
          if (!field) {
            console.warn('showFieldError called with null field');
            return;
          }
          
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
        },
        
        // Function to show continue prompt to users with saved progress
        showContinuePrompt: (savedData) => {
          console.log('DH Widget: showContinuePrompt called with data:', savedData);
          
          // Create overlay
          const overlay = document.createElement('div');
          overlay.className = 'dh-continue-prompt-overlay';
          overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000000;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease;
          `;
          
          // Create modal
          const modal = document.createElement('div');
          modal.className = 'dh-continue-prompt-modal';
          modal.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 480px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            text-align: center;
            animation: slideUp 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `;
          
          // Get step display name
          const stepNames = {
            'pest-issue': 'pest selection',
            'address': 'address information',
            'confirm-address': 'address confirmation',
            'how-we-do-it': 'service information',
            'quote-contact': 'contact information',
            'plan-comparison': 'plan selection',
            'contact': 'scheduling details'
          };
          
          const currentStepName = stepNames[savedData.currentStep] || 'your information';
          const timeAgo = getTimeAgo(new Date(savedData.timestamp));
          
          modal.innerHTML = `
            <div style="margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; background: ${config.primaryColor}; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M9 11l3 3l8-8"></path>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c1.51 0 2.93 0.37 4.18 1.03"></path>
                </svg>
              </div>
              <h3 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">Welcome back!</h3>
              <p style="color: #6b7280; font-size: 16px; margin: 0; line-height: 1.5;">
                We noticed you have unsaved progress. Do you want to continue or start fresh?
              </p>
            </div>
            
            <div style="display: flex; gap: 12px; flex-direction: column;">
              <button id="continue-btn" style="
                background: ${config.primaryColor};
                color: white;
                border: none;
                border-radius: 12px;
                padding: 16px 24px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
              ">Continue Where I Left Off</button>
              <button id="start-over-btn" style="
                background: transparent;
                color: #6b7280;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 14px 24px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
              ">Start Over</button>
            </div>
          `;
          
          // Add hover effects
          const continueBtn = modal.querySelector('#continue-btn');
          const startOverBtn = modal.querySelector('#start-over-btn');
          
          continueBtn.addEventListener('mouseenter', () => {
            continueBtn.style.transform = 'translateY(-2px)';
          });
          continueBtn.addEventListener('mouseleave', () => {
            continueBtn.style.transform = 'translateY(0)';
          });
          
          startOverBtn.addEventListener('mouseenter', () => {
            startOverBtn.style.borderColor = '#9ca3af';
            startOverBtn.style.color = '#374151';
          });
          startOverBtn.addEventListener('mouseleave', () => {
            startOverBtn.style.borderColor = '#e5e7eb';
            startOverBtn.style.color = '#6b7280';
          });
          
          // Event handlers
          continueBtn.addEventListener('click', () => {
            overlay.remove();
            restoreProgress(savedData);
          });
          
          startOverBtn.addEventListener('click', () => {
            overlay.remove();
            progressiveFormManager.clearSavedFormState();
            startFreshWidget();
          });
          
          // Close on overlay click
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
              overlay.remove();
              startFreshWidget(); // Default to fresh start if they click outside
            }
          });
          
          overlay.appendChild(modal);
          document.body.appendChild(overlay);
          
          // Add CSS animations
          const style = document.createElement('style');
          style.textContent = `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to { 
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `;
          document.head.appendChild(style);
        }
      };
      
      // Function to get human-readable time ago
      const getTimeAgo = (date) => {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'yesterday';
        return `${diffDays} days ago`;
      };
      
      // Function to restore progress from saved data
      const restoreProgress = (savedData) => {
        try {
          // Restore form data
          widgetState.formData = { ...widgetState.formData, ...savedData.formData };
          widgetState.currentStep = savedData.currentStep;
          
          // Navigate to saved step first
          showStep(savedData.currentStep);
          setupStepValidation(savedData.currentStep);
          
          // Then populate form fields after a delay to ensure DOM is ready
          setTimeout(() => {
            populateFormFields();
          }, 300);
          
          // Start auto-save
          progressiveFormManager.startAutoSave();
        } catch (error) {
          console.error('DH Widget: Failed to restore progress', error);
          // Fallback to fresh start if restoration fails
          startFreshWidget();
        }
      };
      
      // Make restoreProgress available globally for cross-device recovery
      window.restoreProgress = restoreProgress;
      
      // Function to populate form fields with restored data
      const populateFormFields = () => {
        const data = widgetState.formData;
        
        try {
          // Populate address fields
          if (data.address) {
            const addressInput = document.getElementById('address-search-input');
            if (addressInput) {
              addressInput.value = data.address;
            }
          }
          
          if (data.addressStreet) {
            const streetInput = document.getElementById('street-input') || document.getElementById('confirm-street-input');
            if (streetInput) {
              streetInput.value = data.addressStreet;
            }
          }
          
          if (data.addressCity) {
            const cityInput = document.getElementById('city-input') || document.getElementById('confirm-city-input');
            if (cityInput) {
              cityInput.value = data.addressCity;
            }
          }
          
          if (data.addressState) {
            const stateInput = document.getElementById('state-input') || document.getElementById('confirm-state-input');
            if (stateInput) {
              stateInput.value = data.addressState;
            }
          }
          
          if (data.addressZip) {
            const zipInput = document.getElementById('zip-input') || document.getElementById('confirm-zip-input');
            if (zipInput) {
              zipInput.value = data.addressZip;
            }
          }
          
          // Populate contact information with improved field detection
          if (data.contactInfo) {
            const { firstName, lastName, email, phone } = data.contactInfo;
            
            if (firstName) {
              const firstNameInput = document.getElementById('quote-first-name-input') || 
                                   document.getElementById('first-name-input');
              if (firstNameInput) {
                firstNameInput.value = firstName;
                if (typeof updateFloatingLabel === 'function') {
                  updateFloatingLabel(firstNameInput);
                }
              }
            }
            
            if (lastName) {
              const lastNameInput = document.getElementById('quote-last-name-input') || 
                                   document.getElementById('last-name-input');
              if (lastNameInput) {
                lastNameInput.value = lastName;
                if (typeof updateFloatingLabel === 'function') {
                  updateFloatingLabel(lastNameInput);
                }
              }
            }
            
            if (email) {
              const emailInput = document.getElementById('quote-email-input') || 
                                document.getElementById('email-input');
              if (emailInput) {
                emailInput.value = email;
                if (typeof updateFloatingLabel === 'function') {
                  updateFloatingLabel(emailInput);
                }
              }
            }
            
            if (phone) {
              const phoneInput = document.getElementById('quote-phone-input') || 
                                document.getElementById('phone-input');
              if (phoneInput) {
                phoneInput.value = phone;
                if (typeof updateFloatingLabel === 'function') {
                  updateFloatingLabel(phoneInput);
                }
              }
            }
          }
          
          // Populate scheduling information
          if (data.startDate) {
            const startDateInput = document.getElementById('start-date-input');
            if (startDateInput) {
              startDateInput.value = data.startDate;
              if (typeof updateFloatingLabel === 'function') {
                updateFloatingLabel(startDateInput);
              }
            }
          }
          
          if (data.arrivalTime) {
            const arrivalTimeInput = document.getElementById('arrival-time-input');
            if (arrivalTimeInput) {
              arrivalTimeInput.value = data.arrivalTime;
              if (typeof updateFloatingLabel === 'function') {
                updateFloatingLabel(arrivalTimeInput);
              }
            }
          }
          
        } catch (error) {
          console.error('DH Widget: Error populating form fields', error);
        }
      };
      
      // Function to start fresh widget
      const startFreshWidget = () => {
        console.log('DH Widget: Starting fresh widget');
        progressiveFormManager.startAutoSave();
        showStep('pest-issue');
        setupStepValidation('pest-issue');
      };
      
      // Function to trigger immediate save after significant form changes
      const triggerProgressSave = () => {
        if (progressiveFormManager.hasSignificantFormData()) {
          progressiveFormManager.saveFormStateToLocalStorage();
        }
      };
      
      // Make functions available globally for other modules
      window.triggerProgressSave = triggerProgressSave;
      window.progressiveFormManager = progressiveFormManager;
      
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
      
      // Update styles with configuration-based colors after config is loaded
      if (widgetState.widgetConfig && widgetState.widgetConfig.colors) {
        updateWidgetColors(widgetState.widgetConfig.colors);
      }
      
      // Update fonts after config is loaded
      console.log('DEBUG: Widget config fonts:', widgetState.widgetConfig?.fonts);
      if (widgetState.widgetConfig && widgetState.widgetConfig.fonts) {
        console.log('DEBUG: Calling updateWidgetFonts with:', widgetState.widgetConfig.fonts);
        updateWidgetFonts();
      } else {
        console.log('DEBUG: No font config found, using default');
      }
      
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
      
      // Cross-device recovery mode (URL parameter present)
      if (urlParams.continue_session) {
        
        // Query server with the session ID from URL
        let serverRecoveryData = null;
        if (typeof recoverPartialLead === 'function') {
          try {
            serverRecoveryData = await recoverPartialLead(config.companyId, urlParams.continue_session);
          } catch (error) {
            console.warn('Failed to recover cross-device partial lead from server:', error);
          }
        }
        
        // If server data found, auto-restore immediately (skip prompt)
        if (serverRecoveryData && serverRecoveryData.success && serverRecoveryData.hasPartialLead) {
          // Use the server data directly - no mapping needed
          const recoveryData = {
            formData: serverRecoveryData.formData,
            currentStep: serverRecoveryData.stepCompleted, // Use stepCompleted as currentStep
            timestamp: serverRecoveryData.timestamps.updated,
            source: 'cross-device'
          };
          
          // Store recovery data for automatic restoration
          widgetState.recoveryData = recoveryData;
          
          if (config.displayMode === 'button') {
            // For button mode with cross-device recovery, auto-open the modal
            setTimeout(() => {
              const widgetButton = document.querySelector('.dh-widget-button');
              if (widgetButton) {
                widgetButton.click();
              }
            }, 100);
          } else {
            // For inline mode, initialize form first then restore progress
            progressiveFormManager.startAutoSave();
            showStep('pest-issue');
            setupStepValidation('pest-issue');
            
            // Wait for inline DOM to be fully ready with polling
            const waitForInlineReady = () => {
              const requiredElements = [
                '.dh-form-content',
                '.dh-form-step',
                '#dh-step-' + recoveryData.currentStep
              ];
              
              const allElementsReady = requiredElements.every(selector => {
                return document.querySelector(selector) !== null;
              });
              
              if (allElementsReady) {
                if (typeof window.restoreProgress === 'function') {
                  window.restoreProgress(recoveryData);
                }
              } else {
                setTimeout(waitForInlineReady, 100);
              }
            };
            
            // Start checking after a brief delay to let initial form render
            setTimeout(waitForInlineReady, 200);
          }
          
          return; // Skip normal initialization
        } else {
          // Fallback to normal initialization if no server data found
        }
      }
      
      // Normal recovery flow (no URL parameter)
      const savedData = progressiveFormManager.restoreFormStateFromLocalStorage();
      
      // Use existing sessionId if available in localStorage to maintain session continuity
      if (savedData?.sessionId && !urlParams.continue_session) {
        widgetState.sessionId = savedData.sessionId;
      }
      
      // Also attempt to recover partial lead data from server using the correct sessionId
      let serverRecoveryData = null;
      const sessionIdToQuery = widgetState.sessionId; // Now uses the restored sessionId if it existed
      
      if (sessionIdToQuery && typeof recoverPartialLead === 'function') {
        try {
          console.log('DH Widget: Querying server with sessionId:', sessionIdToQuery);
          serverRecoveryData = await recoverPartialLead(config.companyId, sessionIdToQuery);
          console.log('DH Widget: Server recovery data check', serverRecoveryData);
        } catch (error) {
          console.warn('Failed to recover partial lead from server:', error);
        }
      }
      
      // Use server data if available and more recent, otherwise use local storage
      let recoveryData = savedData;
      if (serverRecoveryData && serverRecoveryData.success && serverRecoveryData.hasPartialLead) {
        const serverTimestamp = new Date(serverRecoveryData.timestamps.updated);
        const localTimestamp = savedData ? new Date(savedData.timestamp) : new Date(0);
        
        if (serverTimestamp > localTimestamp) {
          // Use server data directly - no mapping needed
          recoveryData = {
            formData: serverRecoveryData.formData,
            currentStep: serverRecoveryData.stepCompleted, // Use stepCompleted as currentStep
            timestamp: serverRecoveryData.timestamps.updated,
            source: 'server'
          };
        }
      }
      
      if (recoveryData && progressiveFormManager.shouldPromptToContinue(recoveryData)) {
        // Store recovery data for potential restoration
        widgetState.recoveryData = recoveryData;
        
        if (config.displayMode !== 'button') {
          // For inline mode, show continue prompt immediately
          setTimeout(() => {
            showContinuePrompt(recoveryData);
          }, 100);
        }
        // For button mode, continue prompt will be shown when modal opens
      } else {
        // No saved progress or not significant, initialize normally
        if (config.displayMode !== 'button') {
          setTimeout(() => {
            console.log('DEBUG: Initializing first step (inline mode)');
            progressiveFormManager.startAutoSave();
            showStep('pest-issue');
            setupStepValidation('pest-issue');
          }, 100);
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