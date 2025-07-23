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
            font-family: system-ui, sans-serif;
            color: #991b1b;
            display: block;
            position: relative;
            box-sizing: border-box;
          `;
        } catch (styleError) {
          // Fallback if cssText fails
          errorWidget.style.background = '#fee2e2';
          errorWidget.style.padding = '20px';
          errorWidget.style.border = '1px solid #fca5a5';
          errorWidget.style.display = 'block';
        }

        const title = document.createElement('h3');
        title.textContent = '⚠️ DH Widget Error';
        title.style.cssText =
          'margin: 0 0 10px 0; font-size: 16px; font-weight: 600;';

        const errorMessage = document.createElement('p');
        errorMessage.textContent = message || 'Unknown error occurred';
        errorMessage.style.cssText = 'margin: 0 0 10px 0; font-size: 14px;';

        const errorDetails = document.createElement('div');
        errorDetails.textContent = details || `Error Type: ${errorType}`;
        errorDetails.style.cssText =
          'font-size: 12px; color: #7f1d1d; background: #fef2f2; padding: 10px; border-radius: 4px; font-family: monospace;';

        // Safe appendChild with checks
        if (title) errorWidget.appendChild(title);
        if (errorMessage) errorWidget.appendChild(errorMessage);
        if (errorDetails) errorWidget.appendChild(errorDetails);

        // Safe insertion into DOM using captured script reference
        try {
          if (
            scriptTag &&
            scriptTag.parentNode &&
            scriptTag.parentNode.insertBefore
          ) {
            // Insert inline where the script tag is located
            scriptTag.parentNode.insertBefore(
              errorWidget,
              scriptTag.nextSibling
            );
          } else if (document.body && document.body.appendChild) {
            // Only use body as absolute last resort
            document.body.appendChild(errorWidget);
          } else {
            // Final fallback - just log
            console.error(`DH Widget ${errorType}:`, message, details);
            return;
          }
        } catch (insertError) {
          // DOM insertion failed, just log
          console.error(`DH Widget ${errorType}:`, message, details);
          console.error('Failed to insert error widget:', insertError);
          return;
        }

        // Always log the error
        console.error(`DH Widget ${errorType}:`, message, details);
      } catch (displayError) {
        // Absolute fallback - just log everything
        console.error(
          'DH Widget: Critical error in error display:',
          displayError
        );
        console.error('Original error:', errorType, message, details);
      }
    };

    // Run immediately for synchronous inline positioning
    displayError();
  };

  try {
    // Prevent multiple initializations
    if (window.DHWidgetLoaded) {
      return;
    }
    window.DHWidgetLoaded = true;

    // Get the script tag that loaded this file with improved detection for dynamic loading
    const scriptTag =
      document.currentScript ||
      // Try to find by data-script-id attribute (most reliable for React)
      document.querySelector('script[data-script-id]') ||
      // Try to find by data-container-id attribute (React integration)
      document.querySelector('script[data-container-id]') ||
      // Try to find the most recent widget.js script
      [...document.querySelectorAll('script')]
        .reverse()
        .find(s => s.src && s.src.includes('/widget.js')) ||
      // Final fallback
      (function () {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();

    // Extract configuration from script tag attributes
    const config = {
      companyId: scriptTag.getAttribute('data-company-id'),
      baseUrl: scriptTag.getAttribute('data-base-url'),
      headerText: scriptTag.getAttribute('data-header-text') || '',
      subHeaderText: scriptTag.getAttribute('data-sub-header-text') || '',
      isPreview: scriptTag.getAttribute('data-preview') === 'true',
    };

    // Validate required configuration
    let configValid = true;

    if (!config.companyId) {
      showErrorState(
        'Configuration Error',
        'Missing required attribute: data-company-id',
        'Add data-company-id="your-company-id" to your script tag'
      );
      configValid = false;
    }

    if (!config.baseUrl) {
      showErrorState(
        'Configuration Error',
        'Missing required attribute: data-base-url',
        'Add data-base-url="https://your-api-domain.com" to your script tag'
      );
      configValid = false;
    }

    // Only initialize if configuration is valid
    if (configValid) {
      initializeWidget();
    }

    function initializeWidget() {
      // Widget state
      let widgetState = {
        isMinimized: false,
        isLoading: false,
        isSubmitting: false,
        widgetConfig: null,
        currentStep: 'welcome',
        formData: {
          pestIssue: '',
          address: '', // Keep as string for backward compatibility
          addressStreet: '',
          addressCity: '',
          addressState: '',
          addressZip: '',
          homeSize: '',
          urgency: '',
          contactInfo: {
            name: '',
            phone: '',
            email: '',
          },
        },
        priceEstimate: null,
      };

      // US States data for dropdown
      const US_STATES = [
        { code: 'AL', name: 'Alabama' },
        { code: 'AK', name: 'Alaska' },
        { code: 'AZ', name: 'Arizona' },
        { code: 'AR', name: 'Arkansas' },
        { code: 'CA', name: 'California' },
        { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' },
        { code: 'DE', name: 'Delaware' },
        { code: 'FL', name: 'Florida' },
        { code: 'GA', name: 'Georgia' },
        { code: 'HI', name: 'Hawaii' },
        { code: 'ID', name: 'Idaho' },
        { code: 'IL', name: 'Illinois' },
        { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' },
        { code: 'KS', name: 'Kansas' },
        { code: 'KY', name: 'Kentucky' },
        { code: 'LA', name: 'Louisiana' },
        { code: 'ME', name: 'Maine' },
        { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' },
        { code: 'MI', name: 'Michigan' },
        { code: 'MN', name: 'Minnesota' },
        { code: 'MS', name: 'Mississippi' },
        { code: 'MO', name: 'Missouri' },
        { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' },
        { code: 'NV', name: 'Nevada' },
        { code: 'NH', name: 'New Hampshire' },
        { code: 'NJ', name: 'New Jersey' },
        { code: 'NM', name: 'New Mexico' },
        { code: 'NY', name: 'New York' },
        { code: 'NC', name: 'North Carolina' },
        { code: 'ND', name: 'North Dakota' },
        { code: 'OH', name: 'Ohio' },
        { code: 'OK', name: 'Oklahoma' },
        { code: 'OR', name: 'Oregon' },
        { code: 'PA', name: 'Pennsylvania' },
        { code: 'RI', name: 'Rhode Island' },
        { code: 'SC', name: 'South Carolina' },
        { code: 'SD', name: 'South Dakota' },
        { code: 'TN', name: 'Tennessee' },
        { code: 'TX', name: 'Texas' },
        { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' },
        { code: 'VA', name: 'Virginia' },
        { code: 'WA', name: 'Washington' },
        { code: 'WV', name: 'West Virginia' },
        { code: 'WI', name: 'Wisconsin' },
        { code: 'WY', name: 'Wyoming' },
      ];

      // Generate state options HTML
      const generateStateOptions = () => {
        return (
          '<option value="">Select State</option>' +
          US_STATES.map(
            state => `<option value="${state.code}">${state.name}</option>`
          ).join('')
        );
      };

      // Map state names (from API) to state codes (for dropdown)
      const getStateCodeFromName = stateName => {
        if (!stateName) return '';

        // If it's already a 2-letter state code, return as-is
        if (
          typeof stateName === 'string' &&
          stateName.length === 2 &&
          /^[A-Z]{2}$/.test(stateName.toUpperCase())
        ) {
          return stateName.toUpperCase();
        }

        // Convert to lowercase for case-insensitive matching
        const searchName = stateName.toLowerCase().trim();

        // Find matching state by full name
        const matchedState = US_STATES.find(
          state => state.name.toLowerCase() === searchName
        );

        if (matchedState) {
          return matchedState.code;
        }

        // Handle special cases and common variations
        const stateNameMappings = {
          'district of columbia': 'DC',
          'd.c.': 'DC',
          'washington d.c.': 'DC',
          'washington dc': 'DC',
        };

        if (stateNameMappings[searchName]) {
          return stateNameMappings[searchName];
        }

        // If no match found, return empty string
        return '';
      };

      // Global elements reference
      let elements;

      // Create CSS styles with full color palette
      const createStyles = (colors = {
        primary: '#3b82f6',
        secondary: '#1e293b', 
        background: '#ffffff',
        text: '#374151'
      }) => {
        // Convert hex to RGB for rgba usage
        const hexToRgb = hex => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
              }
            : { r: 0, g: 123, b: 255 }; // fallback to blue
        };

        // Generate darker shade for hover effects
        const darkenColor = (hex, percent = 20) => {
          const rgb = hexToRgb(hex);
          const factor = (100 - percent) / 100;
          const r = Math.round(rgb.r * factor);
          const g = Math.round(rgb.g * factor);
          const b = Math.round(rgb.b * factor);
          return `rgb(${r}, ${g}, ${b})`;
        };

        // Generate lighter shade for backgrounds
        const lightenColor = (hex, opacity = 0.1) => {
          const rgb = hexToRgb(hex);
          return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        };

        // Extract colors with fallbacks
        const primaryColor = colors.primary || '#3b82f6';
        const secondaryColor = colors.secondary || '#1e293b';
        const backgroundColor = colors.background || '#ffffff';
        const textColor = colors.text || '#374151';

        const primaryDark = darkenColor(primaryColor);
        const primaryLight = lightenColor(primaryColor);
        const primaryRgb = hexToRgb(primaryColor);
        const primaryFocus = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`;

        const styleElement = document.createElement('style');
        styleElement.id = 'dh-widget-styles';
        styleElement.textContent = `
      .dh-form-widget { 
        max-width: 500px; 
        margin: 0 auto; 
        background: ${backgroundColor}; 
        border-radius: 12px; 
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); 
        overflow: visible; 
        font-family: system-ui, sans-serif; 
        border: 1px solid #e5e7eb; 
        color: ${textColor};
      } 
      .dh-form-header { 
        padding: 24px 24px 16px 24px; 
        background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%); 
        color: white; 
        text-align: center; 
        border-radius: 12px 12px 0 0; 
        overflow: hidden; 
      } 
      .dh-form-header h2 { 
        margin: 0 0 8px 0; 
        font-size: 24px; 
        font-weight: 600; 
        color: white;
      } 
      .dh-form-header p { 
        margin: 0; 
        font-size: 14px; 
        opacity: 0.9; 
        color: white;
      } 
      .dh-form-content { 
        padding: 24px; 
        border-radius: 0 0 12px 12px; 
        overflow: visible; 
        background: ${backgroundColor};
      } 
      .dh-form-step { 
        display: none; 
      } 
      .dh-form-step.active { 
        display: block; 
      } 
      .dh-form-step h3 { 
        margin: 0 0 12px 0; 
        font-size: 18px; 
        color: ${secondaryColor}; 
      } 
      .dh-form-step p { 
        margin: 0 0 20px 0; 
        color: ${textColor}; 
        font-size: 14px; 
        line-height: 1.5; 
        opacity: 0.8;
      } 
      .dh-form-group { 
        margin-bottom: 20px; 
      } 
      .dh-form-label { 
        display: block; 
        font-weight: 500; 
        color: ${secondaryColor}; 
        font-size: 14px; 
        margin-bottom: 6px; 
      } 
      .dh-form-input { 
        width: 100%; 
        padding: 12px 16px; 
        border: 1px solid #d1d5db; 
        border-radius: 8px; 
        outline: none; 
        font-size: 14px; 
        font-family: inherit; 
        box-sizing: border-box; 
        background: ${backgroundColor};
        color: ${textColor};
      } 
      .dh-form-input:focus { 
        border-color: ${primaryColor}; 
        box-shadow: 0 0 0 3px ${primaryFocus}; 
      } 
      .dh-form-select { 
        width: 100%; 
        padding: 12px 16px; 
        border: 1px solid #d1d5db; 
        border-radius: 8px; 
        outline: none; 
        font-size: 14px; 
        font-family: inherit; 
        background: ${backgroundColor}; 
        box-sizing: border-box; 
        color: ${textColor};
      } 
      .dh-form-select:focus { 
        border-color: ${primaryColor}; 
        box-shadow: 0 0 0 3px ${primaryFocus}; 
      } 
      .dh-form-radio-group { 
        display: flex; 
        flex-direction: column; 
        gap: 12px; 
      } 
      .dh-form-radio-option { 
        display: flex; 
        align-items: center; 
        padding: 12px; 
        border: 1px solid #d1d5db; 
        border-radius: 8px; 
        cursor: pointer; 
        transition: all 0.2s ease; 
      } 
      .dh-form-radio-option:hover { 
        background: #f9fafb; 
      } 
      .dh-form-radio-option.selected { 
        border-color: ${primaryColor}; 
        background: ${primaryLight}; 
      } 
      .dh-form-radio-option input { 
        margin-right: 8px; 
      } 
      .dh-form-button-group { 
        display: flex; 
        gap: 12px; 
        margin-top: 24px; 
      } 
      .dh-form-btn { 
        padding: 12px 24px; 
        border: none; 
        border-radius: 8px; 
        cursor: pointer; 
        font-size: 14px; 
        font-weight: 500; 
        transition: all 0.2s ease; 
        flex: 1; 
      } 
      .dh-form-btn-primary { 
        background: ${primaryColor}; 
        color: white; 
      } 
      .dh-form-btn-primary:hover { 
        background: ${primaryDark}; 
      } 
      .dh-form-btn-secondary { 
        background: ${backgroundColor}; 
        color: ${secondaryColor}; 
        border: 1px solid ${secondaryColor}; 
      } 
      .dh-form-btn-secondary:hover { 
        background: #e9ecef; 
      } 
      .dh-form-btn:disabled { 
        opacity: 0.6; 
        cursor: not-allowed; 
      }
      .dh-form-btn.submitting {
        position: relative;
        pointer-events: none;
      }
      .dh-form-btn.submitting::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        margin: auto;
        border: 2px solid transparent;
        border-top-color: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        top: 0;
        right: 12px;
        bottom: 0;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      } 
      .dh-form-progress { 
        height: 4px; 
        background: #e5e7eb; 
        margin-bottom: 24px; 
      } 
      .dh-form-progress-bar { 
        height: 100%; 
        background: linear-gradient(90deg, ${primaryColor}, ${primaryDark}); 
        transition: width 0.3s ease; 
      } 
      .dh-form-success { 
        text-align: center; 
        padding: 40px 20px; 
      } 
      .dh-form-success h3 { 
        color: #059669; 
        margin: 0 0 12px 0; 
      } 
      .dh-form-success p { 
        color: #6b7280; 
        margin: 0; 
      } 
      .dh-address-autocomplete { 
        position: relative; 
      } 
      .dh-address-suggestions { 
        position: absolute; 
        top: 100%; 
        left: 0; 
        right: 0; 
        background: white; 
        border: 1px solid #d1d5db; 
        border-top: none; 
        border-radius: 0 0 8px 8px; 
        max-height: 200px; 
        overflow-y: auto; 
        z-index: 1000; 
        display: none; 
      } 
      .dh-address-suggestion { 
        padding: 12px 16px; 
        cursor: pointer; 
        border-bottom: 1px solid #f3f4f6; 
        font-size: 14px; 
        transition: background-color 0.2s ease; 
      } 
      .dh-address-suggestion:hover { 
        background-color: ${primaryLight}; 
      } 
      .dh-address-suggestion:last-child { 
        border-bottom: none; 
      } 
      .dh-address-suggestion.selected { 
        background-color: ${primaryLight}; 
      }
      .dh-address-search-field {
        font-size: 16px;
        padding: 16px;
        border: 2px solid #d1d5db;
        border-radius: 12px;
        transition: all 0.3s ease;
      }
      .dh-address-search-field:focus {
        border-color: ${primaryColor};
        box-shadow: 0 0 0 4px ${primaryFocus};
        font-size: 16px;
      }
      .dh-selected-address-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin: 16px 0;
      }
      .dh-address-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
      }
      .dh-address-header strong {
        color: ${secondaryColor};
        font-size: 16px;
      }
      .dh-change-address-btn {
        background: transparent;
        color: ${primaryColor};
        border: 1px solid ${primaryColor};
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      .dh-change-address-btn:hover {
        background: ${primaryColor};
        color: white;
      }
      .dh-address-formatted {
        font-size: 16px;
        font-weight: 600;
        color: ${secondaryColor};
        margin-bottom: 8px;
        line-height: 1.4;
      }
      .dh-address-components {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.3;
      }`;
        document.head.appendChild(styleElement);
      };

      // Update widget colors dynamically
      const updateWidgetColors = colors => {
        // Remove existing styles
        const existingStyles = document.getElementById('dh-widget-styles');
        if (existingStyles) {
          existingStyles.remove();
        }

        // Create new styles with updated colors
        createStyles(colors);
      };

      // Create inline form widget
      const createWidget = () => {
        // Create main form container
        const formWidget = document.createElement('div');
        formWidget.className = 'dh-form-widget';
        formWidget.id = 'dh-form-widget';

        // Create header
        const header = document.createElement('div');
        header.className = 'dh-form-header';
        header.id = 'dh-form-header';

        const titleEl = document.createElement('h2');
        titleEl.id = 'dh-form-title';
        titleEl.textContent = config.headerText || 'Get Free Estimate';

        header.appendChild(titleEl);

        // Only create subtitle if text is provided
        let subtitleEl = null;
        if (config.subHeaderText) {
          subtitleEl = document.createElement('p');
          subtitleEl.id = 'dh-form-subtitle';
          subtitleEl.textContent = config.subHeaderText;
          header.appendChild(subtitleEl);
        }

        // Create progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'dh-form-progress';

        const progressBar = document.createElement('div');
        progressBar.className = 'dh-form-progress-bar';
        progressBar.id = 'dh-form-progress-bar';
        progressBar.style.width = '14%'; // 1/7 steps

        progressContainer.appendChild(progressBar);

        // Create content area
        const content = document.createElement('div');
        content.className = 'dh-form-content';
        content.id = 'dh-form-content';

        // Add progress bar to content
        content.appendChild(progressContainer);

        // Create form steps
        const steps = createFormSteps();
        steps.forEach(step => content.appendChild(step));

        // Assemble form
        formWidget.appendChild(header);
        formWidget.appendChild(content);

        // Insert widget into DOM - check for container ID first (for React integration)
        const containerId = scriptTag.getAttribute('data-container-id');

        if (containerId) {
          const container = document.getElementById(containerId);
          if (container) {
            container.appendChild(formWidget);
          } else {
            // Fallback to original logic
            if (scriptTag.parentNode) {
              scriptTag.parentNode.insertBefore(
                formWidget,
                scriptTag.nextSibling
              );
            } else {
              console.error(
                'DH Widget: No script parent node available for insertion'
              );
            }
          }
        } else {
          // Original logic for normal embedding
          if (scriptTag.parentNode) {
            scriptTag.parentNode.insertBefore(
              formWidget,
              scriptTag.nextSibling
            );
          } else {
            console.error(
              'DH Widget: No script parent node available for insertion'
            );
          }
        }

        return {
          formWidget: formWidget,
          content: content,
          header: header,
          title: titleEl,
          subtitle: subtitleEl, // May be null if no subtitle text provided
          progressBar: progressBar,
          steps: {
            welcome: document.getElementById('dh-step-welcome'),
            pestIssue: document.getElementById('dh-step-pest-issue'),
            address: document.getElementById('dh-step-address'),
            contact: document.getElementById('dh-step-contact'),
            complete: document.getElementById('dh-step-complete'),
          },
        };
      };

      // Create form steps
      const createFormSteps = () => {
        const steps = [];

        // Step 1: Welcome
        const welcomeStep = document.createElement('div');
        welcomeStep.className = 'dh-form-step active';
        welcomeStep.id = 'dh-step-welcome';
        const welcomeTitle =
          widgetState.widgetConfig?.messaging?.welcome || 'Get Started';
        const welcomeDescription =
          widgetState.widgetConfig?.messaging?.fallback ||
          'Get your free pest control estimate in just a few steps.';

        welcomeStep.innerHTML = `
      <h3>${welcomeTitle}</h3>
      <p>${welcomeDescription}</p>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-primary" onclick="nextStep()">Start My Estimate</button>
      </div>
    `;
        steps.push(welcomeStep);

        // Step 2: Pest Issue
        const pestStep = document.createElement('div');
        pestStep.className = 'dh-form-step';
        pestStep.id = 'dh-step-pest-issue';
        pestStep.innerHTML = `
      <h3>What pest issue are you dealing with?</h3>
      <p>Describe the pest problem you're experiencing in detail. Include what pests you're seeing, where you've noticed them, and any damage or concerns you have. The more specific you are, the better we can help!</p>
      <div class="dh-form-group">
        <label class="dh-form-label">Pest Issue Description</label>
        <textarea class="dh-form-input" id="pest-input" rows="4" placeholder="Example: I've been seeing small black ants in my kitchen near the sink and countertops. They seem to be coming from somewhere behind the cabinets and I've noticed them for about a week now..."></textarea>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-secondary" onclick="previousStep()">Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="nextStep()" disabled id="pest-next">Next</button>
      </div>
    `;
        steps.push(pestStep);

        // Step 3: Address
        const addressStep = document.createElement('div');
        addressStep.className = 'dh-form-step';
        addressStep.id = 'dh-step-address';
        addressStep.innerHTML = `
      <h3>What's your service address?</h3>
      
      <!-- Address Search Mode (Initial State) -->
      <div id="address-search-mode">
        <p>Start typing your address below and select from the suggestions.</p>
        <div class="dh-form-group">
          <label class="dh-form-label">Enter your service address</label>
          <div class="dh-address-autocomplete">
            <input type="text" class="dh-form-input dh-address-search-field" id="address-search-input" placeholder="Start typing your address..." autocomplete="off">
            <div class="dh-address-suggestions" id="address-suggestions"></div>
          </div>
        </div>
      </div>

      <!-- Address Display Mode (After Selection) -->
      <div id="address-display-mode" style="display: none;">
        <div class="dh-address-header">
          <p>Review and edit your service address:</p>
          <button type="button" class="dh-change-address-btn" onclick="changeAddress()">Search Different Address</button>
        </div>
        
        <!-- Editable address form fields -->
        <div class="dh-form-group">
          <label class="dh-form-label">Street Address</label>
          <input type="text" class="dh-form-input" id="street-input" placeholder="123 Main Street">
        </div>
        <div class="dh-form-group">
          <label class="dh-form-label">City</label>
          <input type="text" class="dh-form-input" id="city-input" placeholder="Your City">
        </div>
        <div class="dh-form-group">
          <label class="dh-form-label">State</label>
          <input type="text" class="dh-form-input" id="state-input" placeholder="State">
        </div>
        <div class="dh-form-group">
          <label class="dh-form-label">ZIP Code</label>
          <input type="text" class="dh-form-input" id="zip-input" placeholder="12345">
        </div>
      </div>

      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-secondary" onclick="previousStep()">Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="nextStep()" disabled id="address-next">Next</button>
      </div>
    `;
        steps.push(addressStep);

        // Step 4: Contact Info
        const contactStep = document.createElement('div');
        contactStep.className = 'dh-form-step';
        contactStep.id = 'dh-step-contact';
        contactStep.innerHTML = `
      <h3>Almost done! Your contact information</h3>
      <p>We'll send you a detailed quote and can schedule a consultation if needed.</p>
      <div class="dh-form-group">
        <label class="dh-form-label">Full Name</label>
        <input type="text" class="dh-form-input" id="name-input" placeholder="John Smith">
      </div>
      <div class="dh-form-group">
        <label class="dh-form-label">Phone Number</label>
        <input type="tel" class="dh-form-input" id="phone-input" placeholder="(555) 123-4567">
      </div>
      <div class="dh-form-group">
        <label class="dh-form-label">Email Address</label>
        <input type="email" class="dh-form-input" id="email-input" placeholder="john@example.com">
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-secondary" onclick="previousStep()">Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="submitForm()" disabled id="contact-submit">Get My Free Estimate</button>
      </div>
    `;
        steps.push(contactStep);

        // Step 5: Complete
        const completeStep = document.createElement('div');
        completeStep.className = 'dh-form-step';
        completeStep.id = 'dh-step-complete';
        completeStep.innerHTML = `
      <div class="dh-form-success">
        <h3>Thank you for your request!</h3>
        <p>We've received your information and will contact you within 24 hours with your free estimate. Keep an eye on your email and phone for our response.</p>
      </div>
    `;
        steps.push(completeStep);

        return steps;
      };

      // Load widget configuration
      const loadConfig = async () => {
        try {
          const url = config.baseUrl + '/api/widget/config/' + config.companyId;
          const response = await fetch(url);
          const data = await response.json();

          if (data.success) {
            widgetState.widgetConfig = data.config;

            // Update header text if not overridden by data attributes
            if (
              (!config.headerText || config.headerText.trim() === '') &&
              data.config.headers &&
              data.config.headers.headerText &&
              data.config.headers.headerText.trim() !== ''
            ) {
              elements.title.textContent = data.config.headers.headerText;
            }

            // Update subtitle if not overridden by data attributes
            if (
              (!config.subHeaderText || config.subHeaderText.trim() === '') &&
              data.config.headers &&
              data.config.headers.subHeaderText &&
              data.config.headers.subHeaderText.trim() !== ''
            ) {
              if (elements.subtitle) {
                elements.subtitle.textContent =
                  data.config.headers.subHeaderText;
              } else {
                // Create subtitle element if it doesn't exist but config provides text
                const subtitleEl = document.createElement('p');
                subtitleEl.id = 'dh-form-subtitle';
                subtitleEl.textContent = data.config.headers.subHeaderText;
                elements.header.appendChild(subtitleEl);
                elements.subtitle = subtitleEl;
              }
            }

            // Update styles with resolved colors
            if (data.config.colors) {
              updateWidgetColors(data.config.colors);
            }

            // Update welcome step with messaging config
            updateWelcomeStep();

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

      // Step navigation
      const showStep = stepName => {
        // Hide all steps
        document.querySelectorAll('.dh-form-step').forEach(step => {
          step.classList.remove('active');
        });

        // Show current step
        const currentStep = document.getElementById('dh-step-' + stepName);
        if (currentStep) {
          currentStep.classList.add('active');
          widgetState.currentStep = stepName;

          // Update progress bar
          updateProgressBar(stepName);
        }
      };

      // Update progress bar
      const updateProgressBar = stepName => {
        const steps = [
          'welcome',
          'pest-issue',
          'address',
          'contact',
          'complete',
        ];
        const currentIndex = steps.indexOf(stepName);
        const progress = ((currentIndex + 1) / steps.length) * 100;

        const progressBar = elements.progressBar;
        if (progressBar) {
          progressBar.style.width = progress + '%';
        }
      };

      // Global functions for step navigation (exposed to window for onclick handlers)
      window.nextStep = () => {
        const steps = [
          'welcome',
          'pest-issue',
          'address',
          'contact',
          'complete',
        ];
        const currentIndex = steps.indexOf(widgetState.currentStep);

        if (currentIndex >= 0 && currentIndex < steps.length - 1) {
          const nextStep = steps[currentIndex + 1];
          showStep(nextStep);

          // Set up form validation for the new step
          setupStepValidation(nextStep);
        }
      };

      window.previousStep = () => {
        const steps = [
          'welcome',
          'pest-issue',
          'address',
          'contact',
          'complete',
        ];
        const currentIndex = steps.indexOf(widgetState.currentStep);

        if (currentIndex > 0) {
          const prevStep = steps[currentIndex - 1];
          showStep(prevStep);
          setupStepValidation(prevStep);
        }
      };

      // Change address function - switch back to search mode
      window.changeAddress = () => {
        // Show search mode, hide display mode
        const searchMode = document.getElementById('address-search-mode');
        const displayMode = document.getElementById('address-display-mode'); 
        const searchInput = document.getElementById('address-search-input');
        const addressNext = document.getElementById('address-next');
        
        if (searchMode && displayMode && searchInput && addressNext) {
          searchMode.style.display = 'block';
          displayMode.style.display = 'none';
          
          // Clear the search input and focus it
          searchInput.value = '';
          searchInput.focus();
          
          // Clear editable form fields
          document.getElementById('street-input').value = '';
          document.getElementById('city-input').value = '';
          document.getElementById('state-input').value = '';
          document.getElementById('zip-input').value = '';
          
          // Disable next button until new address is selected
          addressNext.disabled = true;
          
          // Clear form data
          widgetState.formData.addressStreet = '';
          widgetState.formData.addressCity = '';
          widgetState.formData.addressState = '';
          widgetState.formData.addressZip = '';
          widgetState.formData.address = '';
        }
      };

      window.submitForm = async () => {
        // Prevent double submissions
        if (widgetState.isSubmitting) {
          return;
        }

        // In preview mode, just show completion without submitting
        if (config.isPreview) {
          showStep('complete');
          return;
        }

        // Set submitting state and update UI
        widgetState.isSubmitting = true;
        updateSubmitButtonState(true);

        // Collect all form data
        const formData = {
          companyId: config.companyId,
          pestIssue: widgetState.formData.pestIssue,
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
            showStep('complete');
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
            submitBtn.disabled = true;
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

              submitBtn.disabled = !isValid;
              submitBtn.textContent = 'Get My Free Estimate';
              submitBtn.classList.remove('submitting');
            }
          }
        }
      };

      // Set up form validation for each step
      const setupStepValidation = stepName => {
        switch (stepName) {
          case 'pest-issue':
            const pestInput = document.getElementById('pest-input');
            const pestNext = document.getElementById('pest-next');

            if (pestInput && pestNext) {
              pestInput.addEventListener('input', e => {
                widgetState.formData.pestIssue = e.target.value;
                // Require at least 10 characters for a meaningful description
                pestNext.disabled =
                  !e.target.value.trim() || e.target.value.trim().length < 10;
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


                // Switch modes
                if (searchMode && displayMode) {
                  searchMode.style.display = 'none';
                  displayMode.style.display = 'block';
                }

                // Enable next button
                addressNext.disabled = false;

                hideSuggestions();

                // Trigger property lookup if available
                if (typeof lookupPropertyData === 'function') {
                  lookupPropertyData(address);
                }
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
                  selectedIndex = Math.min(
                    selectedIndex + 1,
                    suggestions.length - 1
                  );
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

              // Update selected suggestion visual state
              const updateSelectedSuggestion = (suggestions, selectedIndex) => {
                suggestions.forEach((suggestion, index) => {
                  suggestion.classList.toggle(
                    'selected',
                    index === selectedIndex
                  );
                });
              };
            }
            break;

          case 'contact':
            const nameInput = document.getElementById('name-input');
            const phoneInput = document.getElementById('phone-input');
            const emailInput = document.getElementById('email-input');
            const submitBtn = document.getElementById('contact-submit');

            if (nameInput && phoneInput && emailInput && submitBtn) {
              const validateContactForm = () => {
                const name = nameInput.value.trim();
                const phone = phoneInput.value.trim();
                const email = emailInput.value.trim();

                widgetState.formData.contactInfo = { name, phone, email };

                const isValid = name && phone && email && email.includes('@');
                submitBtn.disabled = !isValid;
              };

              nameInput.addEventListener('input', validateContactForm);
              phoneInput.addEventListener('input', validateContactForm);
              emailInput.addEventListener('input', validateContactForm);
            }
            break;
        }
      };

      // Update welcome step with messaging configuration
      const updateWelcomeStep = () => {
        const welcomeStep = document.getElementById('dh-step-welcome');
        if (welcomeStep && widgetState.widgetConfig?.messaging) {
          const welcomeTitle =
            widgetState.widgetConfig.messaging.welcome || 'Get Started';
          const welcomeDescription =
            widgetState.widgetConfig.messaging.fallback ||
            'Get your free pest control estimate in just a few steps.';

          welcomeStep.innerHTML = `
        <h3>${welcomeTitle}</h3>
        <p>${welcomeDescription}</p>
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-primary" onclick="nextStep()">Start My Estimate</button>
        </div>
      `;
        }
      };

      // Initialize widget
      const init = async () => {
        try {
          createStyles();
          elements = createWidget();

          // Load configuration
          const configLoaded = await loadConfig();
          if (!configLoaded) {
            showErrorState(
              'Network Error',
              'Failed to load widget configuration',
              'Check your network connection and verify the data-base-url is correct'
            );
            return;
          }

          // Initialize first step
          showStep('welcome');
        } catch (error) {
          showErrorState(
            'Initialization Error',
            'Widget initialization failed',
            error.message || error.toString()
          );
        }
      };

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    } // end initializeWidget function
  } catch (error) {
    // Comprehensive error handling to prevent page breakage
    showErrorState(
      'Script Error',
      'Widget failed to initialize',
      error.message || error.toString()
    );
  }
})();
