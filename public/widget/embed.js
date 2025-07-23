(function() {
  'use strict';

  // Show error state instead of breaking the page
  const showErrorState = (errorType, message, details = '') => {
    // Capture script tag reference IMMEDIATELY while document.currentScript is still valid
    const scriptTag = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts && scripts.length > 0 ? scripts[scripts.length - 1] : null;
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
        title.style.cssText = 'margin: 0 0 10px 0; font-size: 16px; font-weight: 600;';
        
        const errorMessage = document.createElement('p');
        errorMessage.textContent = message || 'Unknown error occurred';
        errorMessage.style.cssText = 'margin: 0 0 10px 0; font-size: 14px;';

        const errorDetails = document.createElement('div');
        errorDetails.textContent = details || `Error Type: ${errorType}`;
        errorDetails.style.cssText = 'font-size: 12px; color: #7f1d1d; background: #fef2f2; padding: 10px; border-radius: 4px; font-family: monospace;';

        // Safe appendChild with checks
        if (title) errorWidget.appendChild(title);
        if (errorMessage) errorWidget.appendChild(errorMessage);
        if (errorDetails) errorWidget.appendChild(errorDetails);

        // Safe insertion into DOM using captured script reference
        try {
          if (scriptTag && scriptTag.parentNode && scriptTag.parentNode.insertBefore) {
            // Insert inline where the script tag is located
            scriptTag.parentNode.insertBefore(errorWidget, scriptTag.nextSibling);
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
        console.error('DH Widget: Critical error in error display:', displayError);
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
  const scriptTag = document.currentScript || 
    // Try to find by data-script-id attribute (most reliable for React)
    document.querySelector('script[data-script-id]') ||
    // Try to find by data-container-id attribute (React integration)
    document.querySelector('script[data-container-id]') ||
    // Try to find the most recent widget.js script
    [...document.querySelectorAll('script')].reverse().find(s => s.src && s.src.includes('/widget.js')) ||
    // Final fallback
    (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  // Extract configuration from script tag attributes
  const config = {
    companyId: scriptTag.getAttribute('data-company-id'),
    baseUrl: scriptTag.getAttribute('data-base-url'),
    headerText: scriptTag.getAttribute('data-header-text') || '',
    subHeaderText: scriptTag.getAttribute('data-sub-header-text') || '',
    isPreview: scriptTag.getAttribute('data-preview') === 'true'
  };


  // Validate required configuration
  let configValid = true;

  if (!config.companyId) {
    showErrorState('Configuration Error', 'Missing required attribute: data-company-id', 'Add data-company-id="your-company-id" to your script tag');
    configValid = false;
  }

  if (!config.baseUrl) {
    showErrorState('Configuration Error', 'Missing required attribute: data-base-url', 'Add data-base-url="https://your-api-domain.com" to your script tag');
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
        email: ''
      }
    },
    priceEstimate: null
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
    { code: 'WY', name: 'Wyoming' }
  ];

  // Generate state options HTML
  const generateStateOptions = () => {
    return '<option value="">Select State</option>' + 
           US_STATES.map(state => `<option value="${state.code}">${state.name}</option>`).join('');
  };

  // Map state names (from API) to state codes (for dropdown)
  const getStateCodeFromName = (stateName) => {
    if (!stateName) return '';
    
    // If it's already a 2-letter state code, return as-is
    if (typeof stateName === 'string' && stateName.length === 2 && /^[A-Z]{2}$/.test(stateName.toUpperCase())) {
      return stateName.toUpperCase();
    }
    
    // Convert to lowercase for case-insensitive matching
    const searchName = stateName.toLowerCase().trim();
    
    // Find matching state by full name
    const matchedState = US_STATES.find(state => 
      state.name.toLowerCase() === searchName
    );
    
    if (matchedState) {
      return matchedState.code;
    }
    
    // Handle special cases and common variations
    const stateNameMappings = {
      'district of columbia': 'DC',
      'd.c.': 'DC',
      'washington d.c.': 'DC',
      'washington dc': 'DC'
    };
    
    if (stateNameMappings[searchName]) {
      return stateNameMappings[searchName];
    }
    
    // If no match found, return empty string
    return '';
  };

  // Global elements reference
  let elements;

  // Create CSS styles with dynamic brand colors
  const createStyles = (primaryColor = '#007bff') => {
    // Convert hex to RGB for rgba usage
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : {r: 0, g: 123, b: 255}; // fallback to blue
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

    const darkShade = darkenColor(primaryColor);
    const lightShade = lightenColor(primaryColor);
    const rgb = hexToRgb(primaryColor);
    const focusShade = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;

    const styleElement = document.createElement('style');
    styleElement.id = 'dh-widget-styles';
    styleElement.textContent = `
      .dh-form-widget { 
        max-width: 500px; 
        margin: 0 auto; 
        background: white; 
        border-radius: 12px; 
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); 
        overflow: visible; 
        font-family: system-ui, sans-serif; 
        border: 1px solid #e5e7eb; 
      } 
      .dh-form-header { 
        padding: 24px 24px 16px 24px; 
        background: linear-gradient(135deg, ${primaryColor} 0%, ${darkShade} 100%); 
        color: white; 
        text-align: center; 
        border-radius: 12px 12px 0 0; 
        overflow: hidden; 
      } 
      .dh-form-header h2 { 
        margin: 0 0 8px 0; 
        font-size: 24px; 
        font-weight: 600; 
      } 
      .dh-form-header p { 
        margin: 0; 
        font-size: 14px; 
        opacity: 0.9; 
      } 
      .dh-form-content { 
        padding: 24px; 
        border-radius: 0 0 12px 12px; 
        overflow: visible; 
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
        color: #1f2937; 
      } 
      .dh-form-step p { 
        margin: 0 0 20px 0; 
        color: #6b7280; 
        font-size: 14px; 
        line-height: 1.5; 
      } 
      .dh-form-group { 
        margin-bottom: 20px; 
      } 
      .dh-form-label { 
        display: block; 
        font-weight: 500; 
        color: #374151; 
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
      } 
      .dh-form-input:focus { 
        border-color: ${primaryColor}; 
        box-shadow: 0 0 0 3px ${focusShade}; 
      } 
      .dh-form-select { 
        width: 100%; 
        padding: 12px 16px; 
        border: 1px solid #d1d5db; 
        border-radius: 8px; 
        outline: none; 
        font-size: 14px; 
        font-family: inherit; 
        background: white; 
        box-sizing: border-box; 
      } 
      .dh-form-select:focus { 
        border-color: ${primaryColor}; 
        box-shadow: 0 0 0 3px ${focusShade}; 
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
        background: ${lightShade}; 
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
        background: ${darkShade}; 
      } 
      .dh-form-btn-secondary { 
        background: #f8f9fa; 
        color: #6c757d; 
        border: 1px solid #dee2e6; 
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
        background: linear-gradient(90deg, ${primaryColor}, ${darkShade}); 
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
        background-color: ${lightShade}; 
      } 
      .dh-address-suggestion:last-child { 
        border-bottom: none; 
      } 
      .dh-address-suggestion.selected { 
        background-color: ${lightShade}; 
      }`;
    document.head.appendChild(styleElement);
  };

  // Update widget colors dynamically
  const updateWidgetColors = (primaryColor) => {
    // Remove existing styles
    const existingStyles = document.getElementById('dh-widget-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    // Create new styles with updated color
    createStyles(primaryColor);
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
          scriptTag.parentNode.insertBefore(formWidget, scriptTag.nextSibling);
        } else {
          console.error('DH Widget: No script parent node available for insertion');
        }
      }
    } else {
      // Original logic for normal embedding
      if (scriptTag.parentNode) {
        scriptTag.parentNode.insertBefore(formWidget, scriptTag.nextSibling);
      } else {
        console.error('DH Widget: No script parent node available for insertion');
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
        complete: document.getElementById('dh-step-complete')
      }
    };
  };

  // Create form steps
  const createFormSteps = () => {
    const steps = [];

    // Step 1: Welcome
    const welcomeStep = document.createElement('div');
    welcomeStep.className = 'dh-form-step active';
    welcomeStep.id = 'dh-step-welcome';
    const welcomeTitle = widgetState.widgetConfig?.messaging?.welcome || 'Get Started';
    const welcomeDescription = widgetState.widgetConfig?.messaging?.fallback || 'Get your free pest control estimate in just a few steps.';
    
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
      <p>Please provide your complete service address below. Start typing the street address for autocomplete suggestions.</p>
      <div class="dh-form-group">
        <label class="dh-form-label">Street Address</label>
        <div class="dh-address-autocomplete">
          <input type="text" class="dh-form-input" id="street-input" placeholder="123 Main Street" autocomplete="off">
          <div class="dh-address-suggestions" id="address-suggestions"></div>
        </div>
      </div>
      <div class="dh-form-group">
        <label class="dh-form-label">City</label>
        <input type="text" class="dh-form-input" id="city-input" placeholder="City" required>
      </div>
      <div style="display: flex; gap: 12px;">
        <div class="dh-form-group" style="flex: 1;">
          <label class="dh-form-label">State</label>
          <select class="dh-form-select" id="state-input" required>
            ${generateStateOptions()}
          </select>
        </div>
        <div class="dh-form-group" style="flex: 0 0 120px;">
          <label class="dh-form-label">ZIP Code</label>
          <input type="text" class="dh-form-input" id="zip-input" placeholder="12345" maxlength="5" pattern="[0-9]{5}" required>
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
        if ((!config.headerText || config.headerText.trim() === '') && 
            data.config.headers && 
            data.config.headers.headerText && 
            data.config.headers.headerText.trim() !== '') {
          elements.title.textContent = data.config.headers.headerText;
        }
        
        // Update subtitle if not overridden by data attributes
        if ((!config.subHeaderText || config.subHeaderText.trim() === '') && 
            data.config.headers && 
            data.config.headers.subHeaderText && 
            data.config.headers.subHeaderText.trim() !== '') {
          if (elements.subtitle) {
            elements.subtitle.textContent = data.config.headers.subHeaderText;
          } else {
            // Create subtitle element if it doesn't exist but config provides text
            const subtitleEl = document.createElement('p');
            subtitleEl.id = 'dh-form-subtitle';
            subtitleEl.textContent = data.config.headers.subHeaderText;
            elements.header.appendChild(subtitleEl);
            elements.subtitle = subtitleEl;
          }
        }
        
        // Update styles with brand color if different from default
        if (data.config.branding.primaryColor && data.config.branding.primaryColor !== '#007bff') {
          updateWidgetColors(data.config.branding.primaryColor);
        }
        
        // Update welcome step with messaging config
        updateWelcomeStep();
        
        return true;
      } else {
        console.error('DH Widget: Failed to load configuration:', data.error);
        return false;
      }
    } catch (error) {
      console.error('DH Widget: Error loading configuration:', error);
      return false;
    }
  };

  // Step navigation
  const showStep = (stepName) => {
    
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
  const updateProgressBar = (stepName) => {
    const steps = ['welcome', 'pest-issue', 'address', 'contact', 'complete'];
    const currentIndex = steps.indexOf(stepName);
    const progress = ((currentIndex + 1) / steps.length) * 100;
    
    const progressBar = elements.progressBar;
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
  };

  // Global functions for step navigation (exposed to window for onclick handlers)
  window.nextStep = () => {
    const steps = ['welcome', 'pest-issue', 'address', 'contact', 'complete'];
    const currentIndex = steps.indexOf(widgetState.currentStep);
    
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      showStep(nextStep);
      
      // Set up form validation for the new step
      setupStepValidation(nextStep);
    }
  };

  window.previousStep = () => {
    const steps = ['welcome', 'pest-issue', 'address', 'contact', 'complete'];
    const currentIndex = steps.indexOf(widgetState.currentStep);
    
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      showStep(prevStep);
      setupStepValidation(prevStep);
    }
  };

  // selectUrgency function removed - now using text input


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
        zip: widgetState.formData.addressZip
      },
      homeSize: parseInt(widgetState.formData.homeSize),
      urgency: widgetState.formData.urgency,
      contactInfo: widgetState.formData.contactInfo
    };

    try {
      // Submit to API
      const response = await fetch(config.baseUrl + '/api/widget/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showStep('complete');
      } else {
        console.error('Form submission failed:', data.error);
        alert('There was an error submitting your information. Please try again.');
        // Reset submission state on error to allow retry
        widgetState.isSubmitting = false;
        updateSubmitButtonState(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your information. Please try again.');
      // Reset submission state on error to allow retry
      widgetState.isSubmitting = false;
      updateSubmitButtonState(false);
    }
  };

  // Update submit button state for loading/submitting
  const updateSubmitButtonState = (isSubmitting) => {
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
  const setupStepValidation = (stepName) => {
    switch (stepName) {
      case 'pest-issue':
        const pestInput = document.getElementById('pest-input');
        const pestNext = document.getElementById('pest-next');
        
        if (pestInput && pestNext) {
          pestInput.addEventListener('input', (e) => {
            widgetState.formData.pestIssue = e.target.value;
            // Require at least 10 characters for a meaningful description
            pestNext.disabled = !e.target.value.trim() || e.target.value.trim().length < 10;
          });
        }
        break;
        
      case 'address':
        const streetInput = document.getElementById('street-input');
        const cityInput = document.getElementById('city-input');
        const stateInput = document.getElementById('state-input');
        const zipInput = document.getElementById('zip-input');
        const addressNext = document.getElementById('address-next');
        const addressSuggestions = document.getElementById('address-suggestions');
        
        if (streetInput && cityInput && stateInput && zipInput && addressNext) {
          let searchTimeout = null;
          
          // Validation function to check all address fields
          const validateAddressFields = () => {
            const street = streetInput.value.trim();
            const city = cityInput.value.trim();
            const state = stateInput.value.trim();
            const zip = zipInput.value.trim();
            
            // Update form data
            widgetState.formData.addressStreet = street;
            widgetState.formData.addressCity = city;
            widgetState.formData.addressState = state;
            widgetState.formData.addressZip = zip;
            
            // Create formatted address for backward compatibility
            if (street && city && state && zip) {
              widgetState.formData.address = `${street}, ${city}, ${state} ${zip}`;
            }
            
            // Enable next button only if all fields are filled
            const isValid = street.length >= 3 && city.length >= 2 && state && zip.length === 5 && /^\d{5}$/.test(zip);
            addressNext.disabled = !isValid;
            
            return isValid;
          };
          
          // Street address autocomplete functionality
          streetInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            
            // Clear previous timeout
            if (searchTimeout) {
              clearTimeout(searchTimeout);
            }
            
            validateAddressFields();
            
            if (value.length < 3) {
              hideSuggestions();
              return;
            }
            
            // Debounce API calls
            searchTimeout = setTimeout(() => {
              searchAddresses(value);
            }, 300);
          });
          
          // Add validation to other address fields
          cityInput.addEventListener('input', validateAddressFields);
          stateInput.addEventListener('change', validateAddressFields);
          zipInput.addEventListener('input', (e) => {
            // Only allow digits for ZIP code
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
            validateAddressFields();
          });
          
          // Handle clicking outside to close suggestions
          document.addEventListener('click', (e) => {
            if (!streetInput.contains(e.target) && !addressSuggestions.contains(e.target)) {
              hideSuggestions();
            }
          });
          
          // Search addresses using configured API
          const searchAddresses = async (query) => {
            try {
              // Check if widget config has address API configuration
              const apiConfig = widgetState.widgetConfig?.addressApi;
              
              if (!apiConfig || !apiConfig.enabled) {
                // No API configured - use manual entry only
                hideSuggestions();
                return;
              }
              
              // Use configured API endpoint
              const response = await fetch(`${config.baseUrl}/api/widget/address-autocomplete`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  query: query,
                  companyId: config.companyId
                })
              });
              
              if (response.ok) {
                const data = await response.json();
                displaySuggestions(data.suggestions || []);
              } else {
                hideSuggestions();
              }
            } catch (error) {
              hideSuggestions();
            }
          };
          
          // Display address suggestions
          const displaySuggestions = (results) => {
            if (results.length === 0) {
              hideSuggestions();
              return;
            }
            
            addressSuggestions.innerHTML = results.map((result, index) => 
              `<div class="dh-address-suggestion" data-index="${index}">${result.formatted}</div>`
            ).join('');
            
            addressSuggestions.style.display = 'block';
            
            // Add click handlers for suggestions
            const suggestions = addressSuggestions.querySelectorAll('.dh-address-suggestion');
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
          
          // Select an address and populate all fields
          const selectAddress = (address) => {
            // Populate individual fields
            streetInput.value = address.street || '';
            cityInput.value = address.city || '';
            // Use state mapping to convert API state name to state code
            const stateCode = getStateCodeFromName(address.state);
            stateInput.value = stateCode;
            zipInput.value = address.postcode || '';
            
            // Update form data
            widgetState.formData.addressStreet = address.street || '';
            widgetState.formData.addressCity = address.city || '';
            widgetState.formData.addressState = stateCode;
            widgetState.formData.addressZip = address.postcode || '';
            widgetState.formData.address = address.formatted;
            
            hideSuggestions();
            validateAddressFields();
            
            // Trigger property lookup if available
            if (typeof lookupPropertyData === 'function') {
              lookupPropertyData(address);
            }
          };
          
          // Keyboard navigation for suggestions
          streetInput.addEventListener('keydown', (e) => {
            const suggestions = addressSuggestions.querySelectorAll('.dh-address-suggestion');
            const selected = addressSuggestions.querySelector('.dh-address-suggestion.selected');
            let selectedIndex = selected ? Array.from(suggestions).indexOf(selected) : -1;
            
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
              const results = JSON.parse(addressSuggestions.dataset.results || '[]');
              selectAddress(results[selectedIndex]);
            } else if (e.key === 'Escape') {
              hideSuggestions();
            }
          });
          
          // Update selected suggestion visual state
          const updateSelectedSuggestion = (suggestions, selectedIndex) => {
            suggestions.forEach((suggestion, index) => {
              suggestion.classList.toggle('selected', index === selectedIndex);
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
      const welcomeTitle = widgetState.widgetConfig.messaging.welcome || 'Get Started';
      const welcomeDescription = widgetState.widgetConfig.messaging.fallback || 'Get your free pest control estimate in just a few steps.';
      
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
        showErrorState('Network Error', 'Failed to load widget configuration', 'Check your network connection and verify the data-base-url is correct');
        return;
      }

      // Initialize first step
      showStep('welcome');

    } catch (error) {
      showErrorState('Initialization Error', 'Widget initialization failed', error.message || error.toString());
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
    showErrorState('Script Error', 'Widget failed to initialize', error.message || error.toString());
  }
})();