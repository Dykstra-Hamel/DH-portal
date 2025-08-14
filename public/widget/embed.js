/**
 * DH Widget - Built from Source
 * Generated: 2025-08-14T14:19:27.595Z
 * Source files: widget-state.js, widget-utils.js, widget-styles.js, widget-ui.js, widget-logic.js, widget-forms.js, widget-api.js, embed-main.js
 */

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


  // === EXTRACTED FUNCTIONS ===

  // === WIDGET STATE ===
  // Widget state management - initialize as empty placeholder
  let widgetState = {};

  // Step mapping and progress management - initialize as empty placeholder  
  let stepProgressManager = {};

  // Progressive form manager - initialize as empty placeholder
  let progressiveFormManager = {};

  // === WIDGET UTILS ===
  // Enhanced pest type mapping
  const getPestTypeDisplay = (pestType, context = 'default') => {
  if (!pestType) {
    const fallback =
      context === 'comparison' ? 'your pest issue' : 'pests';
    return fallback;
  }

  const pestMappings = {
    ants: {
      default: 'ants',
      comparison: 'ants',
    },
    spiders: {
      default: 'spiders',
      comparison: 'spiders',
    },
    cockroaches: {
      default: 'cockroaches',
      comparison: 'roaches',
    },
    roaches: {
      default: 'cockroaches',
      comparison: 'roaches',
    },
    rodents: {
      default: 'rodents',
      comparison: 'rodents',
    },
    mice: {
      default: 'mice',
      comparison: 'rodents',
    },
    rats: {
      default: 'rats',
      comparison: 'rodents',
    },
    termites: {
      default: 'termites',
      comparison: 'termites',
    },
    wasps: {
      default: 'wasps',
      comparison: 'wasps',
    },
    hornets: {
      default: 'wasps and hornets',
      comparison: 'wasps',
    },
    bees: {
      default: 'bees',
      comparison: 'bees',
    },
    fleas: {
      default: 'fleas',
      comparison: 'fleas',
    },
    ticks: {
      default: 'ticks',
      comparison: 'ticks',
    },
    bed_bugs: {
      default: 'bed bugs',
      comparison: 'bed bugs',
    },
    mosquitoes: {
      default: 'mosquitoes',
      comparison: 'mosquitoes',
    },
    silverfish: {
      default: 'silverfish',
      comparison: 'silverfish',
    },
    carpenter_ants: {
      default: 'carpenter ants',
      comparison: 'carpenter ants',
    },
    others: {
      default: 'pests',
      comparison: 'your pest issue',
    },
  };

  const lowerPestType = pestType.toLowerCase();
  const mapping = pestMappings[lowerPestType];

  const result = mapping
    ? mapping[context]
    : context === 'comparison'
      ? 'your pest issue'
      : 'pests';

  return result;
  };

  // Helper function to get the pest icon SVG
  const getPestIcon = () => {
  const icon = widgetState.formData.pestIcon;
  return icon || null;
  };

  // Helper function to update dynamic text based on form data
  const updateDynamicText = async () => {
  // Wait for DOM to be ready
  return new Promise(resolve => {
    setTimeout(() => {
      // Update urgency step pest type
      const urgencyPestType =
        document.getElementById('urgency-pest-type');
      if (urgencyPestType) {
        const pestText = getPestTypeDisplay(
          widgetState.formData.pestType,
          'default'
        );
        urgencyPestType.textContent = pestText;
      }

      // Update address step pest type
      const addressPestType =
        document.getElementById('address-pest-type');
      if (addressPestType) {
        const pestText = getPestTypeDisplay(
          widgetState.formData.pestType,
          'default'
        );
        addressPestType.textContent = pestText;
      }

      const addressPestTypeTwo = document.getElementById(
        'address-pest-type-two'
      );
      if (addressPestTypeTwo) {
        const pestText = getPestTypeDisplay(
          widgetState.formData.pestType,
          'comparison'
        );
        addressPestTypeTwo.textContent = pestText;
      }

      // Update address step pest icon
      const addressPestIcon =
        document.getElementById('address-pest-icon');
      if (addressPestIcon) {
        const currentIcon = getPestIcon();
        if (currentIcon) {
          addressPestIcon.innerHTML = currentIcon;
        }
      }

      // Update initial offer step pest type
      const offerPestType = document.getElementById('offer-pest-type');
      if (offerPestType) {
        offerPestType.textContent = getPestTypeDisplay(
          widgetState.formData.pestType,
          'default'
        );
      }

      // Update initial offer step price
      const offerPrice = document.getElementById('offer-price');
      
      if (offerPrice && widgetState.formData.offerPrice) {
        const priceText = `$${widgetState.formData.offerPrice}`;
        offerPrice.textContent = priceText;
      } else if (offerPrice) {
        offerPrice.textContent = '$'; // Fallback if no price available
      }

      // Update plan comparison step pest type
      const comparisonPestType = document.getElementById(
        'comparison-pest-type'
      );
      if (comparisonPestType) {
        comparisonPestType.textContent = getPestTypeDisplay(
          widgetState.formData.pestType,
          'comparison'
        );
      }

      // Update completion step with customer name
      const completionMessage = document.querySelector(
        '#dh-step-complete h3'
      );
      if (completionMessage && widgetState.formData.contactInfo) {
        const { firstName, lastName } = widgetState.formData.contactInfo;
        if (firstName) {
          const customerName = lastName
            ? `${firstName} ${lastName}`
            : firstName;
          completionMessage.textContent = `Thank you for your request, ${customerName}!`;
        }
      }

      // Update completion step with additional personalized info
      const completionDescription = document.querySelector(
        '#dh-step-complete p'
      );
      if (completionDescription && widgetState.formData.contactInfo) {
        const { firstName } = widgetState.formData.contactInfo;
        const pestType = getPestTypeDisplay(
          widgetState.formData.pestType,
          'default'
        );
        const addressCity = widgetState.formData.addressCity;

        let message = "We've received your information";
        if (firstName) {
          message = `Hi ${firstName}! We've received your information`;
        }
        if (pestType !== 'pests' && addressCity) {
          message += ` for ${pestType} service in ${addressCity}`;
        } else if (pestType !== 'pests') {
          message += ` for ${pestType} service`;
        } else if (addressCity) {
          message += ` for service in ${addressCity}`;
        }
        message +=
          ' and will contact you within 24 hours with your free estimate. Keep an eye on your email and phone for our response.';

        completionDescription.textContent = message;
      }

      // Update urgency timeline references based on selection
      const urgencyTimelineRef = document.getElementById(
        'urgency-timeline-ref'
      );
      if (urgencyTimelineRef && widgetState.formData.urgency) {
        const timelineMap = {
          yesterday: 'as soon as possible',
          '1-2-days': 'within 1-2 days',
          'next-week': 'within the next week',
          'next-month': 'within the next month',
          'no-rush': 'when convenient',
        };
        urgencyTimelineRef.textContent =
          timelineMap[widgetState.formData.urgency] || 'soon';
      }

      // Update service address references
      const serviceAddressRefs = document.querySelectorAll(
        '.service-address-ref'
      );
      if (serviceAddressRefs.length > 0 && widgetState.formData.address) {
        const shortAddress =
          widgetState.formData.addressStreet &&
          widgetState.formData.addressCity
            ? `${widgetState.formData.addressStreet}, ${widgetState.formData.addressCity}`
            : widgetState.formData.address;
        serviceAddressRefs.forEach(ref => {
          ref.textContent = shortAddress;
        });
      }

      // Update customer address city references
      const addressCityRefs =
        document.querySelectorAll('.address-city-ref');
      if (
        addressCityRefs.length > 0 &&
        widgetState.formData.addressCity
      ) {
        addressCityRefs.forEach(ref => {
          ref.textContent = widgetState.formData.addressCity;
        });
      }
      resolve(); // Resolve the promise when all updates are complete
    }, 100); // Small delay to ensure DOM is ready
  });
  };

  // Function to check if input has value and update label state
  const updateFloatingLabel = input => {
  const label = input.nextElementSibling;
  if (label && label.classList.contains('dh-floating-label')) {
    const isPhoneInput =
      input.id === 'phone-input' || input.id === 'quote-phone-input';
    const isSelectInput = input.tagName.toLowerCase() === 'select';
    const hasValue = input.value.trim() !== '';
    const isFocused = input === document.activeElement;

    // Handle select elements with a class-based approach since :not(:placeholder-shown) doesn't work
    if (isSelectInput) {
      if (hasValue) {
        input.classList.add('dh-has-value');
      } else {
        input.classList.remove('dh-has-value');
      }
    }

    // Only handle special text changes for phone inputs - let CSS handle positioning
    if (isPhoneInput) {
      if (hasValue || isFocused) {
        // Floating state - show field name for phones
        label.textContent =
          label.getAttribute('data-focused-text') || label.textContent;
      } else {
        // Default state - show format placeholder for phones
        const defaultText = label.getAttribute('data-default-text');
        label.textContent = defaultText || label.textContent;
      }
    }

    // Don't set inline styles - let CSS handle all positioning and styling
    // Remove any existing inline styles that might interfere with CSS
    label.style.top = '';
    label.style.transform = '';
    label.style.fontSize = '';
    label.style.fontWeight = '';
    label.style.color = '';
    label.style.left = '';
  }
  };

  // Check Street View availability using Metadata API
  const checkStreetViewAvailability = async (lat, lon, apiKey) => {
    try {
      const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&key=${apiKey}`;
      const response = await fetch(metadataUrl);

      if (!response.ok) {
        throw new Error(`Metadata API error: ${response.status}`);
      }

      const data = await response.json();

      // Return true only if actual street view imagery is available
      return data.status === 'OK';
    } catch (error) {
      console.warn('Street View metadata check failed:', error);
      // On metadata API failure, assume no street view available
      return false;
    }
  };

  // Helper function to ensure minimum loading time for better UX
  const createMinimumLoadingTime = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Helper functions for smooth loading animations
  const showLoadingOverlay = (loadingElement) => {
    if (loadingElement) {
      loadingElement.style.display = 'flex';
      // Force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      loadingElement.offsetHeight;
      loadingElement.classList.add('show');
    }
  };

  const hideLoadingOverlay = (loadingElement) => {
    if (loadingElement) {
      loadingElement.classList.remove('show');
      setTimeout(() => {
        loadingElement.style.display = 'none';
      }, 300); // Match CSS transition duration
    }
  };

  // Load address imagery (Street View with satellite fallback)
  const loadAddressImagery = async address => {
    const loadingEl = document.getElementById('image-loading');
    const imageEl = document.getElementById('address-image');
    const errorEl = document.getElementById('image-error');

    // Show loading state
    if (loadingEl) loadingEl.style.display = 'flex';
    if (imageEl) imageEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    try {
      // Get API key
      const apiKeyResponse = await fetch(
        config.baseUrl + '/api/google-places-key'
      );
      const apiKeyData = await apiKeyResponse.json();

      if (!apiKeyData.apiKey) {
        throw new Error('Google API key not available');
      }

      const apiKey = apiKeyData.apiKey;
      const { lat, lon, formatted } = address;

      // Check Street View availability using metadata API first
      const hasStreetView = await checkStreetViewAvailability(
        lat,
        lon,
        apiKey
      );

      if (hasStreetView) {
        // Street View is available - load the image
        try {
          const streetViewUrl =
            `https://maps.googleapis.com/maps/api/streetview?` +
            `size=515x260&location=${lat},${lon}&heading=0&pitch=0&fov=90&key=${apiKey}`;

          // Test if Street View image loads successfully
          const testImage = new Image();
          testImage.crossOrigin = 'anonymous';

          await new Promise((resolve, reject) => {
            testImage.onload = () => {
              // Street View loaded successfully
              if (imageEl) {
                imageEl.src = streetViewUrl;
                imageEl.style.display = 'block';
                imageEl.alt = `Street view of ${formatted}`;
              }
              resolve();
            };

            testImage.onerror = () => {
              // Street View failed to load, try satellite fallback
              reject(new Error('Street View image failed to load'));
            };

            testImage.src = streetViewUrl;
          });

          // Hide loading
          if (loadingEl) loadingEl.style.display = 'none';
        } catch (streetViewError) {
          console.warn('Street View failed, trying satellite:', streetViewError);
          // Fall back to satellite view
          await loadSatelliteView(lat, lon, formatted, apiKey, imageEl, loadingEl, errorEl);
        }
      } else {
        // No Street View available, use satellite
        await loadSatelliteView(lat, lon, formatted, apiKey, imageEl, loadingEl, errorEl);
      }
    } catch (error) {
      console.error('Address imagery failed:', error);

      // Show error state
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerHTML = '<p>📍 Unable to load address imagery</p>';
      }
    }
  };

  // Helper function to load satellite view
  const loadSatelliteView = async (lat, lon, formatted, apiKey, imageEl, loadingEl, errorEl) => {
    try {
      const satelliteUrl = 
        `https://maps.googleapis.com/maps/api/staticmap?` +
        `center=${lat},${lon}&zoom=18&size=515x260&maptype=satellite&key=${apiKey}`;

      const testImage = new Image();
      testImage.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        testImage.onload = () => {
          if (imageEl) {
            imageEl.src = satelliteUrl;
            imageEl.style.display = 'block';
            imageEl.alt = `Satellite view of ${formatted}`;
          }
          resolve();
        };

        testImage.onerror = () => {
          reject(new Error('Satellite image failed to load'));
        };

        testImage.src = satelliteUrl;
      });

      // Hide loading
      if (loadingEl) loadingEl.style.display = 'none';
    } catch (satelliteError) {
      console.error('Satellite view also failed:', satelliteError);
      
      // Show error state
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerHTML = '<p>📍 Address imagery not available</p>';
      }
    }
  };


  // US States data for address validation
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
    { code: 'DC', name: 'District of Columbia' }
  ];

  // Convert state name to state code
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

  // === WIDGET STYLES ===
  // Create CSS styles with full color palette
  const createStyles = (
  colors = {
    primary: '#3b82f6',
    secondary: '#1e293b',
    background: '#ffffff',
    text: '#374151',
  }
  ) => {
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
  const secondaryDark = darkenColor(secondaryColor);
  const primaryLight = lightenColor(primaryColor);
  const secondaryLight = lightenColor(secondaryColor);
  const primaryRgb = hexToRgb(primaryColor);
  const primaryFocus = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`;

  const styleElement = document.createElement('style');
  styleElement.id = 'dh-widget-styles';
  styleElement.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
  .dh-form-widget { 
  margin: 0 auto; 
  background: ${backgroundColor}; 
  border-radius: 26px; 
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); 
  overflow: visible; 
  color: ${textColor};
  }
  .dh-form-content { 
  padding: 24px; 
  border-radius: 26px; 
  background: ${backgroundColor};
  } 
  .dh-form-step { 
  display: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  } 
  .dh-form-step.welcome { 
  display: none;
  padding: 0;
  opacity: 1;
  } 
  .dh-form-step.active { 
  display: block; 
  opacity: 1;
  }

  .dh-form-step.fade-in {
  animation: fadeIn 0.4s ease forwards;
  }

  .dh-form-step.fade-out {
  animation: fadeOut 0.3s ease forwards;
  } 

  .dh-form-step-content {
    padding: 40px 80px;
    border-bottom: 1px solid #cccccc;
  }
  .dh-form-step h3 { 
  margin: 0 0 12px 0; 
  font-size: 18px; 
  color: ${secondaryColor}; 
  } 
  .dh-form-group { 
  width: 515px;
  max-width: 100%;
  margin: 0 auto 20px;
  } 
  .dh-form-label { 
  display: block; 
  font-weight: 500; 
  color: #4E4E4E; 
  margin-bottom: 6px; 
  font-family: Outfit;
  font-size: 20px;
  line-height: 30px;
  } 
  .dh-address-form-label {
  display: block;
  margin-bottom: 10px;
  color: #4E4E4E;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  line-height: 30px;
  }
  .dh-form-input { 
  width: 100%; 
  padding: 12px 16px; 
  border: 1px solid #d1d5db; 
  border-radius: 8px; 
  outline: none; 
  font-size: 16px; 
  font-family: inherit; 
  box-sizing: border-box; 
  background: ${backgroundColor};
  color: ${textColor};
  } 
  .dh-form-input:focus { 
  border-color: ${primaryColor}; 
  box-shadow: 0 0 0 3px ${primaryFocus}; 
  }

  select.dh-form-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: url('https://cwmckkfkcjxznkpdxgie.supabase.co/storage/v1/object/public/brand-assets/general/select-arrow.svg') no-repeat right 12px center;
  }

  /* Hide default calendar icon for date inputs - we use custom SVG */
  .dh-form-input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  cursor: pointer;
  width: 20px;
  height: 20px;
  }

  /* Make calendar icons clickable */
  .dh-input-icon[data-type="calendar"] {
  pointer-events: auto;
  cursor: pointer;
  }

  .dh-input-icon[data-type="calendar"]:hover {
  color: #16a34a;
  }

  .dh-input-icon svg {
  display: block;
  }

  .dh-floating-input .dh-form-input:focus ~ .dh-input-icon {
  color: #16a34a;
  }

  /* Contact step form field widths */
  #dh-step-contact .dh-form-row, #dh-step-contact .dh-form-group {
  width: 390px;
  }

  #dh-step-contact .dh-form-row .dh-form-group {
  width: 100%;
  }

  /* Floating Label Styles */
  .dh-floating-input {
  position: relative;
  display: flex;
  align-items: center;
  }

  .dh-floating-label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 16px;
  color: #9ca3af;
  background: white;
  padding: 0 4px;
  pointer-events: none;
  transition: all 0.2s ease-out;
  z-index: 1;
  }

  /* Floating state - when focused or has content (NOT for select elements) */
  .dh-floating-input .dh-form-input:not(select):focus + .dh-floating-label,
  .dh-floating-input .dh-form-input:not(select):not(:placeholder-shown) + .dh-floating-label {
  top: 14px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: #16a34a;
  left: 12px;
  }

  /* Select elements - ensure default state */
  .dh-floating-input select.dh-form-input:not(:focus):not(.dh-has-value) + .dh-floating-label {
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: normal;
  color: #9ca3af;
  left: 12px;
  }

  /* Select elements - only float on focus or when they have a value (class-based) */
  .dh-floating-input select.dh-form-input:focus + .dh-floating-label,
  .dh-floating-input select.dh-form-input.dh-has-value + .dh-floating-label {
  top: 14px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: #16a34a;
  left: 12px;
  }

  /* Date inputs should NOT auto-float - only when focused or have actual values */
  .dh-floating-input input[type="date"]:not(:focus):invalid + .dh-floating-label {
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: normal;
  color: #9ca3af;
  }

  /* Date inputs with actual values selected (valid) should float */
  .dh-floating-input input[type="date"]:valid + .dh-floating-label,
  .dh-floating-input input[type="date"]:focus + .dh-floating-label {
  top: 14px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: #16a34a;
  left: 12px;
  }

  .dh-input-with-icon .dh-form-input:not(select):focus + .dh-floating-label,
  .dh-input-with-icon .dh-form-input:not(select):not(:placeholder-shown) + .dh-floating-label,
  .dh-input-with-icon input[type="date"]:valid + .dh-floating-label,
  .dh-input-with-icon input[type="date"]:focus + .dh-floating-label {
  left: 56px;
  }

  /* Select elements with icons - default state */
  .dh-input-with-icon select.dh-form-input:not(:focus):not(.dh-has-value) + .dh-floating-label {
  left: 56px;
  }

  /* Select elements with icons - floating state */
  .dh-input-with-icon select.dh-form-input:focus + .dh-floating-label,
  .dh-input-with-icon select.dh-form-input.dh-has-value + .dh-floating-label {
  left: 56px;
  }

  .dh-floating-input .dh-form-input {
  padding: 20px 16px 8px 16px;
  font-size: 16px;
  line-height: 1.5;
  }

  .dh-input-with-icon .dh-form-input {
  padding-left: 60px;
  }

  .dh-floating-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: ${backgroundColor};
  padding: 0 4px;
  color: #9ca3af;
  font-size: 16px;
  font-weight: 400;
  pointer-events: none;
  transition: all 0.2s ease-in-out;
  z-index: 1;
  font-family: Outfit;
  }

  .dh-input-with-icon .dh-floating-label {
  left: 60px;
  }

  /* Floating state - when focused or has content */
  .dh-floating-input .dh-form-input:focus + .dh-floating-label,
  .dh-floating-input .dh-form-input:not(:placeholder-shown) + .dh-floating-label {
  top: 14px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: ${primaryColor};
  left: 12px;
  background: ${backgroundColor};
  }

  .dh-input-with-icon .dh-form-input:focus + .dh-floating-label,
  .dh-input-with-icon .dh-form-input:not(:placeholder-shown) + .dh-floating-label {
  left: 56px;
  }

  /* Focused input border */
  .dh-floating-input .dh-form-input:focus {
  border-color: ${primaryColor};
  box-shadow: 0 0 0 2px ${primaryFocus};
  }

  /* Input icon styles */
  .dh-input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  z-index: 2;
  pointer-events: none;
  padding-right: 12px;
  }

  /* Full-height border separator for inputs with icons */
  .dh-input-with-icon::before {
  content: '';
  position: absolute;
  left: 48px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e5e7eb;
  z-index: 1;
  }

  /* Make calendar icons clickable */
  .dh-input-icon[data-type="calendar"] {
  pointer-events: auto;
  cursor: pointer;
  }

  .dh-input-icon[data-type="calendar"]:hover {
  color: ${primaryColor};
  }

  .dh-input-icon svg {
  display: block;
  }

  .dh-floating-input .dh-form-input:focus ~ .dh-input-icon {
  color: ${primaryColor};
  }

  /* Textarea specific styles */
  .dh-floating-input textarea.dh-form-input {
  resize: vertical;
  min-height: 80px;
  padding-top: 24px;
  padding-bottom: 12px;
  }

  .dh-floating-input textarea.dh-form-input + .dh-floating-label {
  top: 24px;
  }

  .dh-floating-input textarea.dh-form-input:focus + .dh-floating-label,
  .dh-floating-input textarea.dh-form-input:not(:placeholder-shown) + .dh-floating-label {
  top: 8px;
  }
  .dh-prefilled-field { 
  background: #f0f9ff !important;
  border-color: #3b82f6 !important;
  position: relative;
  }
  .dh-prefilled-field::after {
  content: "✓";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #10b981;
  font-weight: bold;
  pointer-events: none;
  }
  .dh-form-row {
  width: 515px;
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 0 auto;
  }
  .dh-form-row .dh-form-group {
  width: 100%;
  }

  /* Address Autocomplete Styles */
  .dh-address-autocomplete {
  position: relative;
  width: 100%;
  }

  .dh-address-search-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  font-size: 16px;
  font-family: Outfit;
  box-sizing: border-box;
  background: ${backgroundColor};
  color: ${textColor};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .dh-address-search-field:focus {
  border-color: ${primaryColor};
  box-shadow: 0 0 0 3px ${primaryFocus};
  }

  .dh-address-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${backgroundColor};
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: none;
  }

  .dh-address-suggestion {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  font-family: Outfit;
  font-size: 14px;
  color: ${textColor};
  transition: background-color 0.2s ease;
  }

  .dh-address-suggestion:hover {
  background-color: #f9fafb;
  }

  .dh-address-suggestion.selected {
  background-color: ${primaryLight};
  color: ${primaryColor};
  }

  .dh-address-suggestion:last-child {
  border-bottom: none;
  }

  /* Removed duplicate address components - using improved versions below */

  /* Change Address Button */
  .dh-change-address-btn {
  background: none;
  border: 1px solid ${primaryColor};
  color: ${primaryColor};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: Outfit;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  }

  .dh-change-address-btn:hover {
  background: ${primaryColor};
  color: white;
  }

  /* Address Image Loading and Error States */
  .dh-image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
  }

  .dh-image-loading .dh-loading-spinner {
  width: 24px;
  height: 24px;
  margin-bottom: 8px;
  }

  .dh-image-loading p {
  margin: 0;
  font-size: 14px;
  font-family: Outfit;
  }

  .dh-image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  font-family: Outfit;
  text-align: center;
  }

  .dh-address-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  }

  /* Address Search Mode vs Display Mode */
  #address-search-mode {
  display: block;
  }

  #address-display-mode {
  display: none;
  }

  #address-display-mode.active {
  display: block;
  }

  #address-search-mode.hidden {
  display: none;
  }

  /* Selected Address Card Styling */
  .dh-selected-address-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  }

  /* Improved Address Imagery/Street View Styling */
  .dh-address-imagery {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px auto 20px;
  position: relative;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  width: 515px;
  max-width: 100%;
  height: 200px;
  }

  .dh-address-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  transition: opacity 0.3s ease;
  }

  /* Improved Loading States */
  .dh-image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #64748b;
  width: 100%;
  }

  .dh-image-loading .dh-loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid ${primaryColor};
  border-radius: 50%;
  animation: dh-spin 1s linear infinite;
  margin-bottom: 8px;
  }

  .dh-image-loading p {
  margin: 8px 0 0 0;
  font-size: 14px;
  font-family: Outfit;
  }

  /* Improved Error States */
  .dh-image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  text-align: center;
  width: 100%;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  }

  .dh-image-error p {
  margin: 0;
  font-size: 14px;
  font-family: Outfit;
  }

  /* Address Form Specific Improvements */
  .dh-address-search-field {
  font-size: 16px;
  padding: 16px;
  border: 2px solid #d1d5db;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  background: ${backgroundColor};
  color: ${textColor};
  font-family: Outfit;
  }

  .dh-address-search-field:focus {
  border-color: ${primaryColor};
  box-shadow: 0 0 0 4px ${primaryFocus};
  outline: none;
  }

  /* Enhanced Floating Label for Address Fields - moved above to replace incomplete rule */

  /* Improved Change Address Button */
  .dh-change-address-btn {
  background: transparent;
  color: ${primaryColor};
  border: 1px solid ${primaryColor};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-block;
  font-family: Outfit;
  }

  .dh-change-address-btn:hover {
  background: ${primaryColor};
  color: white;
  }

  /* Address Display Header */
  .dh-address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: ${backgroundColor};
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  }

  .dh-address-header p {
  margin: 0;
  font-family: Outfit;
  font-size: 16px;
  color: ${textColor};
  font-weight: 500;
  }

  /* Address Formatted Display */
  .dh-address-formatted {
  font-size: 16px;
  font-weight: 600;
  color: ${secondaryColor};
  margin-bottom: 8px;
  line-height: 1.4;
  font-family: Outfit;
  }

  /* Urgency Step Styling */
  .dh-urgency-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  }

  .dh-urgency-option {
  padding: 20px 24px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  font-family: Outfit;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  background: ${backgroundColor};
  color: ${textColor};
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .dh-urgency-option:hover {
  border-color: ${primaryColor};
  background: ${primaryLight};
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .dh-urgency-option.selected {
  border-color: ${primaryColor};
  background: ${primaryColor};
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .dh-urgency-option.selected::after {
  content: '✓';
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  font-weight: bold;
  }

  /* Enhanced Urgency Loading */
  .dh-urgency-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: none;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
  }

  .dh-urgency-loading .dh-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${primaryColor};
  border-radius: 50%;
  animation: dh-spin 1s linear infinite;
  }

  /* Responsive Urgency Options */
  @media (max-width: 600px) {
  .dh-urgency-selection {
    gap: 12px;
    margin: 20px 0;
  }
  
  .dh-urgency-option {
    padding: 16px 20px;
    font-size: 15px;
  }
  }

  /* Out of Service Step Styling */
  .dh-form-out-of-service {
  text-align: center;
  padding: 40px 0;
  max-width: 500px;
  margin: 0 auto;
  }

  .dh-form-out-of-service h3 {
  font-family: Outfit;
  font-size: 24px;
  font-weight: 600;
  color: ${secondaryColor};
  margin: 0 0 16px 0;
  line-height: 1.3;
  }

  .dh-form-out-of-service p {
  font-family: Outfit;
  font-size: 16px;
  font-weight: 400;
  color: ${textColor};
  line-height: 1.5;
  margin: 0 0 24px 0;
  }

  /* Responsive styling for out-of-service */
  @media (max-width: 600px) {
  .dh-form-out-of-service {
    padding: 30px 20px;
  }
  
  .dh-form-out-of-service h3 {
    font-size: 20px;
  }
  
  .dh-form-out-of-service p {
    font-size: 15px;
  }
  }

  /* Spinning Animation for Loading */
  @keyframes dh-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
  }

  /* Initial Offer Step Styling */
  .dh-offer-options {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 24px 0;
  }

  .dh-offer-options p {
  margin: 0;
  font-family: Outfit;
  font-size: 16px;
  font-weight: 500;
  color: ${textColor};
  }

  .dh-offer-btn {
  padding: 16px 24px;
  border: 2px solid;
  border-radius: 8px;
  font-family: Outfit;
  font-weight: 600;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  outline: none;
  text-decoration: none;
  display: inline-block;
  min-width: 160px;
  box-sizing: border-box;
  }

  .dh-offer-btn-primary {
  background: ${primaryColor};
  color: white;
  border-color: ${primaryColor};
  }

  .dh-offer-btn-primary:hover {
  background: ${primaryDark};
  border-color: ${primaryDark};
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .dh-offer-btn-secondary {
  background: ${backgroundColor};
  color: ${primaryColor};
  border-color: ${primaryColor};
  }

  .dh-offer-btn-secondary:hover {
  background: ${primaryFocus};
  color: ${primaryColor};
  transform: translateY(-1px);
  }

  .dh-offer-btn-tertiary {
  background: transparent;
  color: #6b7280;
  border-color: #d1d5db;
  }

  .dh-offer-btn-tertiary:hover {
  background: #f9fafb;
  color: #374151;
  border-color: #9ca3af;
  }

  @media (max-width: 480px) {
  .dh-form-row {
    grid-template-columns: 1fr;
  }
  
  .dh-offer-options {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .dh-offer-btn {
    width: 100%;
    max-width: 280px;
  }
  
  .dh-address-imagery {
    width: 100%;
    height: 160px;
    margin: 12px auto 16px;
  }
  
  .dh-address-search-field {
    padding: 14px;
    font-size: 16px;
  }
  
  .dh-selected-address-card {
    padding: 16px;
    margin: 12px 0;
  }
  }
  .dh-form-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: ${textColor};
  cursor: pointer;
  }
  .dh-form-checkbox {
  width: auto !important;
  margin: 0 !important;
  flex-shrink: 0;
  margin-top: 2px !important;
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
  position: relative;
  gap: 12px; 
  margin-top: 24px; 
  justify-content: center;
  align-items: center;
  padding: 0 20px 20px 20px;
  border-radius: 0 0 26px 26px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, ${primaryLight} 100%);
  } 
  #dh-step-exit-survey .dh-form-button-group { 
  background: none;
  } 
  .dh-form-btn { 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 18px;
  line-height: 18px;
  font-family: Outfit, sans-serif;
  font-weight: 500; 
  transition: all 0.2s ease;
  transform: translateY(0);
  }
  
  .dh-form-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .dh-form-btn:active {
  transform: translateY(0);
  transition: all 0.1s ease;
  } 
  .dh-form-btn-primary { 
  background: ${primaryColor}; 
  color: white;
  border: 1px solid ${primaryColor};
  } 
  .dh-form-btn-primary:hover { 
  background: ${primaryDark}; 
  } 
  .dh-form-btn-secondary { 
  background: ${secondaryColor}; 
  color: #fff; 
  border: 1px solid ${secondaryColor}; 
  } 
  .dh-form-btn-secondary svg { 
  transition: transform 0.2s ease;
  } 
  .dh-form-btn-secondary:hover svg { 
  transform: translateX(2px);
  }
  .dh-form-btn-back { 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #CBCBCB; 
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
  } 
  .dh-form-btn-back svg { 
  transition: transform 0.2s ease;
  } 
  .dh-form-btn-back:hover svg { 
  transform: translateX(-2px);
  } 
  .dh-form-btn-back#no-thanks:hover svg { 
  transform: none;
  } 
  .form-submit-step-back {
  position: absolute;
  left: 20px;
  bottom: 20px;
  background: transparent;
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
  .dh-form-btn.plan-no-thanks {
    background: transparent;
  }
  .dh-form-btn.plan-no-thanks:hover {
    opacity: 0.8;
  }
  @keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
  }

  /* Animation keyframes for smooth transitions */
  @keyframes fadeIn {
  from { 
    opacity: 0; 
  }
  to { 
    opacity: 1; 
  }
  }

  @keyframes fadeOut {
  from { 
    opacity: 1; 
  }
  to { 
    opacity: 0; 
  }
  }

  @keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
  }

  @keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(30px);
  }
  }

  @keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
  }

  @keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
  }

  /* Respect user's motion preferences */
  @media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  }
  .dh-pest-selection {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  flex-flow: row wrap;
  justify-content: center;
  }
  .dh-pest-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 160px;
  transition: all 0.2s ease;
  }
  .dh-pest-icon {
  width: 160px;
  height: 100px;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 12px;
  background: white;
  transition: all 0.2s ease;
  flex-shrink: 0;
  }
  .dh-pest-icon svg {
  width: 60px;
  height: 60px;
  fill: #4E4E4E;
  }
  .dh-pest-icon svg path {
  fill: #4E4E4E;
  }
  .dh-address-pest-icon {
  display: block;
  margin: 0 auto 20px;
  width: 80px;
  height: 80px;
  }
  .dh-address-pest-icon svg {
  width: 100%;
  height: 100%;
  }
  .dh-address-pest-icon svg path {
  fill: ${primaryColor};
  }
  .dh-pest-label {
  text-align: center;
  margin-top: 8px;
  width: 100%;
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 18px;
  font-weight: 700;
  line-height: 18px;
  }
  .dh-pest-option:hover .dh-pest-icon {
  border-color: ${primaryColor};
  background: #f8fafc;
  }
  .dh-pest-option.selected .dh-pest-icon {
  border-color: ${primaryColor};
  color: white;
  }
  .dh-step-instruction {
  color: #4E4E4E;
  text-align: center;
  font-size: 26px;
  font-weight: 400;
  line-height: 103%;
  margin: 20px 0;
  }
  .dh-plan-loading {
  text-align: center;
  padding: 40px 20px;
  color: ${textColor};
  }
  .dh-pest-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
  }

  .dh-pest-loading.show {
  opacity: 1;
  }
  border-radius: 20px;
  }
  .dh-pest-loading .dh-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${primaryColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0;
  }
  .dh-urgency-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
  }

  .dh-urgency-loading.show {
  opacity: 1;
  }
  border-radius: 20px;
  }
  .dh-urgency-loading .dh-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${primaryColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0;
  }
  .dh-quote-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
  }

  .dh-quote-loading.show {
  opacity: 1;
  }
  border-radius: 20px;
  }
  .dh-quote-loading .dh-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${primaryColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0;
  }
  .dh-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid ${primaryColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
  }

  /* Button widget styles */
  .dh-widget-button {
  background: ${primaryColor};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .dh-widget-button:hover {
  background: ${primaryDark};
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .dh-widget-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Modal styles */
  .dh-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(48, 48, 48, 0.82);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 999999;
  padding: 20px;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
  }

  .dh-modal-overlay.show {
  opacity: 1;
  }

  .dh-modal-overlay.hide {
  opacity: 0;
  }

  .dh-modal-content {
  border-radius: 26px;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  background: white;
  font-family: "Outfit", sans-serif;
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  }

  .dh-modal-overlay.show .dh-modal-content {
  transform: scale(1);
  opacity: 1;
  }

  .dh-modal-overlay.hide .dh-modal-content {
  transform: scale(0.95);
  opacity: 0;
  }

  /* Welcome Screen Styles */
  .dh-welcome-screen {
  position: relative;
  min-height: 500px;
  border-radius: 26px;
  overflow: visible;
  background: white;
  }

  .dh-welcome-content {
  width: 100%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 500px;
  box-sizing: border-box;
  z-index: 10;
  position: relative;
  }

  .dh-welcome-hero {
  position: absolute;
  bottom: 0;
  right: -40px;
  width: 350px;
  height: 450px;
  background-size: contain;
  background-position: bottom right;
  background-repeat: no-repeat;
  border-radius: 0 0 16px 0;
  z-index: 1;
  }

  .dh-welcome-svg-background {
  display: block;
  position: absolute;
  bottom: 0;
  right: 0;
  width: 500px;
  height: 500px;
  z-index: 0;
  pointer-events: none;
  border-radius: 26px;
  opacity: 0.53;
  background: radial-gradient(59.99% 58.34% at 70.4% 74.11%, ${primaryColor} 0%, rgba(255, 255, 255, 0.90) 100%);
  }

  .dh-welcome-svg-background img {
  display: block;
  position: relative;
  width: 100%;
  height: auto;
  pointer-events: none;
  }

  .dh-progress-bar {
  display: flex;
  align-items: center;
  padding: 50px 50px 25px 50px;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  }

  .dh-progress-step-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 32px;
  position: relative;
  }

  .dh-progress-step {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  position: relative;
  z-index: 50;
  }

  .dh-progress-step.completed {
  background: ${primaryColor};
  color: white;
  border: 3px solid ${primaryColor};
  }

  .dh-progress-step.active {
  background: #fff;
  color: white;
  border: 3px solid ${secondaryColor};
  }

  .dh-progress-step.active::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${secondaryColor};
  }

  .dh-progress-step.inactive {
  background: #fff;
  color: #9ca3af;
  border: 3px solid #D9D9D9;
  }

  .dh-progress-step-label {
  display: block;
  position: absolute;
  bottom: -20px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  }

  .dh-progress-step-label.completed {
  color: ${primaryColor};
  font-weight: 600;
  }

  .dh-progress-step-label.active {
  color: ${secondaryColor};
  font-weight: 600;
  }

  .dh-progress-step-label.inactive {
  color: #9ca3af;
  }

  .dh-progress-line {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  position: relative;
  margin-left: -4px;
  margin-right: -4px;
  }

  .dh-progress-line.active {
  background: ${primaryColor};
  }

  .dh-welcome-title {
  font-size: 65px;
  font-weight: 700;
  color: ${secondaryColor};
  margin: 0 0 20px 0;
  line-height: 1.2;
  }

  .dh-welcome-description {
  font-size: 30px;
  color: #2B2B2B;
  font-weight: 500;
  margin: 0 0 32px 0;
  line-height: 103%;
  max-width: 75%;
  }

  .dh-welcome-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 40px 0;
  }

  .dh-welcome-benefits li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-size: 16px;
  color: #374151;
  }

  .dh-benefit-icon {
  margin-right: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  }

  .dh-benefit-icon svg {
  width: 20px;
  height: 20px;
  max-width: 100%;
  max-height: 100%;
  }

  .dh-benefit-text {
  flex: 1;
  }

  .dh-welcome-button {
  background: ${secondaryColor};
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  outline: none;
  }

  .dh-welcome-button:hover {
  background: ${secondaryDark};
  transform: translateY(1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  .dh-welcome-button:focus {
  outline: none;
  }

  .dh-button-arrow {
  transition: all 0.2s;
  }

  .dh-button-arrow svg, .dh-form-btn svg {
  display: block;
  }

  .dh-welcome-button:hover .dh-button-arrow {
  transform: translateX(2px);
  }

  .dh-step-heading {
  color: #4E4E4E;
  text-align: center;
  font-size: 45px;
  font-weight: 700;
  line-height: 100%;
  margin: 0 0 20px 0;
  }

  .dh-terms-disclaimer {
  color: #4E4E4E;
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
  line-height: 103%;
  margin-top: 16px;
  }

  .dh-modal-body {
  flex: 1;
  overflow: visible;
  padding: 0;
  min-height: 0;
  }

  .dh-modal-close {
  display: none;
  position: absolute;
  top: -10px;
  right: -10px;
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #374151;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid #e5e7eb;
  }

  .dh-modal-close:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .dh-modal-body .dh-form-widget {
  margin: 0;
  box-shadow: none;
  border-radius: 26px;
  padding: 0;
  }

  .dh-modal-body .dh-form-content {
  padding: 0;
  margin: 0;
  }

  .dh-modal-body .dh-form-progress {
  margin: 0 24px;
  }

  /* Mobile modal adjustments */
  @media (max-width: 768px) {
  .dh-modal-overlay {
    padding: 10px;
  }
  
  .dh-modal-content {
    max-height: 95vh;
    width: 95%;
  }
  
  .dh-modal-close {
    top: 8px;
    right: 8px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  .dh-modal-body .dh-form-progress {
    margin: 0 16px;
  }
  
  .dh-widget-button {
    padding: 14px 28px;
    font-size: 16px;
    width: 100%;
    max-width: 300px;
  }

  .dh-form-step-content {
    padding: 40px;
  }

  .dh-step-heading {
    font-size: 32px;
  }

  .dh-welcome-screen {
    min-height: auto;
  }
  
  .dh-welcome-content {
    padding: 40px 30px;
    padding-right: 230px;
    min-height: 400px;
  }
  
  .dh-welcome-title {
    font-size: 28px;
  }
  .dh-progress-bar {
    margin-bottom: 30px;
  }
  }
  @media (max-width: 650px) {
  .dh-welcome-hero {
    width: 250px;
  }
  .dh-welcome-svg-background {
    width: 300px;
    height: 400px;
  }
  }
  @media (max-width: 600px) {
  .dh-welcome-hero,
  .dh-welcome-svg-background {
    display: none;
  }

  .dh-welcome-content {
    padding-right: 20px;
    text-align: center;
  }

  .dh-welcome-title {
    font-size: 40px
  }

  .dh-welcome-description {
    max-width: 100%;
    font-size: 22px;
  }

  .dh-welcome-button {
    margin: 0 auto;
  }

  .dh-progress-bar {
    padding: 20px 25px;
  }

  .dh-step-heading {
    font-size: 30px;
  }

  .dh-step-instruction {
    font-size: 18px;
  }

  .dh-form-step-content {
    padding: 20px;
  }
  }

  /* Plan Comparison Styles - Exact Copy from Original */
  .dh-plan-tabs {
  display: flex;
  justify-content: center;
  gap: 0;
  margin: 24px 0;
  border-bottom: 1px solid #cccccc;
  overflow: hidden;
  }
  .dh-plan-tab {
  flex: 1;
  text-align: center;
  padding: 16px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  }
  .dh-plan-tab.active {
  color: ${secondaryColor};
  z-index: 1;
  }
  .dh-plan-tab-label {
  color: #4E4E4E;
  text-align: center;
  font-family: Outfit;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 30px;
  letter-spacing: 2.4px;
  opacity: 0.5;
  }
  .dh-plan-tab-name {
  color: #4E4E4E;
  text-align: center;
  font-family: Outfit;
  font-size: 20px;
  font-weight: 400;
  line-height: 24px;
  }
  .dh-plan-tab.active .dh-plan-tab-label {
  opacity: 1;
  }
  .dh-plan-tab.active .dh-plan-tab-name {
  font-weight: 600;
  color: ${secondaryColor};
  }

  /* Plan Content Area */
  .dh-plan-content {
  margin: 32px 0;
  min-height: 400px;
  }
  .dh-plan-details {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: start;
  }
  @media (max-width: 768px) {
  .dh-plan-details {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  }

  /* Plan Main Content */
  .dh-plan-main {
  padding: 0;
  }
  .dh-form-step h3.dh-plan-title {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 40px;
  font-weight: 500;
  line-height: 50px;
  }
  .dh-plan-description {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 20px;
  font-weight: 400;
  line-height: 25px;
  }

  .dh-plan-included h4 {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 20px;
  font-weight: 600;
  line-height: 33px;
  margin-bottom: 5px;
  }
  .dh-plan-features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
  }

  .dh-plan-feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 20px;
  line-height: 23px;
  font-weight: 400;
  margin-bottom: 8px;
  }

  .dh-feature-checkmark svg {
  display: block;
  }

  .dh-feature-checkmark path {
  stroke: ${primaryColor};
  }

  .dh-plan-pricing {
  margin: 24px 0 0;
  padding: 20px 0 0;
  }
  .dh-plan-price-label {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 26px;
  font-weight: 500;
  line-height: 30px;
  }
  .dh-plan-price-detail {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 20px;
  font-weight: 400;
  line-height: 25px;
  margin: 8px 0 4px 0;
  }
  .dh-plan-price-disclaimer {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  margin: 0;
  font-style: italic;
  }

  .dh-plan-coverage-icons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
  margin: 24px 0;
  grid-column: 1 / -1;
  }

  .dh-coverage-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${textColor};
  }

  .dh-coverage-checkmark {
  color: #10b981;
  font-weight: bold;
  font-size: 14px;
  }

  /* Plan Visual/Image Area */
  .dh-plan-visual {
  position: relative;
  }
  .dh-plan-image-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .dh-plan-image-actual {
  display: flex;
  align-items: center;
  justify-content: center;
  }

  /* Plan Actions */
  .dh-plan-actions {
  margin: 32px 0 0 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  }
  @media (max-width: 768px) {
  .dh-plan-actions {
    flex-direction: column;
  }
  }

  .dh-form-btn.plan-no-thanks {
  background: transparent;
  }
  .dh-form-btn.plan-no-thanks:hover {
  opacity: 0.8;
  }

  /* FAQ Accordion Styles */
  .dh-plan-faqs {
  margin: 40px 0 0 0;
  padding: 40px 0 0 0;
  border-top: 1px solid #e5e7eb;
  }
  .dh-form-step h3.dh-faqs-title {
  color: ${secondaryColor};
  text-align: center;
  font-family: Outfit;
  font-size: 26px;
  font-weight: 600;
  line-height: 103%;
  }
  .dh-faqs-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  }
  .dh-faq-item {
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s ease;
  }
  .dh-faq-item:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .dh-faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  }
  .dh-faq-header:hover {
  background: #f9fafb;
  }

  .dh-faq-question {
  font-size: 16px;
  font-weight: 600;
  color: ${textColor};
  margin: 0;
  flex: 1;
  padding-right: 16px;
  text-align: left;
  }
  .dh-faq-icon {
  font-size: 20px;
  font-weight: 300;
  color: ${primaryColor};
  transition: transform 0.2s ease;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  }
  .dh-faq-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  background: ${backgroundColor};
  }
  .dh-faq-answer {
  padding: 0 20px 16px 20px;
  }
  .dh-faq-answer p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
  }
  @media (max-width: 768px) {
  .dh-plan-faqs {
    margin: 32px 0 0 0;
    padding: 20px 0 0 0;
  }
  .dh-faqs-title {
    font-size: 18px;
    margin: 0 0 20px 0;
  }
  .dh-faq-header {
    padding: 14px 16px;
  }
  .dh-faq-question {
    font-size: 15px;
    padding-right: 12px;
  }
  .dh-faq-answer {
    padding: 0 16px 14px 16px;
  }
  }

  /* Mobile Styles */
  @media (max-width: 650px) {
  .dh-plan-visual {
    order: 1;
  }

  .dh-plan-main {
    order: 2;
  }

  .dh-plan-coverage-icons {
    order: 3;
  }
  }

  @media (max-width: 480px) {
  .dh-plan-title {
    font-size: 26px;
    text-align: center;
  }

  .dh-plan-description {
    font-size: 18px;
    text-align: center;
  }

  .dh-plan-included h4 {
    text-align: center;
    font-size: 16px;
  }

  .dh-plan-tabs {
    justify-content: flex-start;
    overflow-x: auto;
  }

  #comparison-plan-content {
    padding: 0;
  }

  .dh-plan-details {
    gap: 0;
  }

  .dh-form-step h3.dh-plan-title {
    font-size: 30px;
  }
  }

  /* Exit Survey Styles */
  .dh-exit-survey-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
  }
  .dh-survey-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${backgroundColor};
  }
  .dh-survey-option:hover {
  border-color: #d1d5db;
  background: #f9fafb;
  }
  .dh-survey-option.selected {
  border-color: ${primaryColor};
  background: ${primaryFocus};
  }
  .dh-survey-emoji {
  font-size: 24px;
  flex-shrink: 0;
  }
  .dh-survey-text {
  font-size: 16px;
  font-weight: 500;
  color: ${textColor};
  }

  /* Success/completion step styles */
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
  `;
  document.head.appendChild(styleElement);
  };

  // Update widget colors dynamically
  const updateWidgetColors = colors => {
  const existingStyles = document.getElementById('dh-widget-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
  createStyles(colors);
  };

  // === WIDGET UI ===
  // Track if modal widget has been created
  let modalWidgetCreated = false;

  // Open modal function
  const openModal = () => {
  const modal = document.getElementById('dh-modal-overlay');
  const modalBody = document.getElementById('dh-modal-body');

  if (modal && modalBody) {
    // Only create widget on first open, then reuse the existing one
    if (!modalWidgetCreated) {
      modalBody.innerHTML = '';
      const widget = createInlineWidget();
      modalBody.appendChild(widget.formWidget);
      modalWidgetCreated = true;

      // Initialize first step after a brief delay
      setTimeout(() => {
        showStep('welcome');
      }, 100);
    } else {
      // For subsequent modal opens, just show the current step
      if (typeof widgetState !== 'undefined' && widgetState.currentStep) {
        showStep(widgetState.currentStep);
      } else {
        showStep('welcome');
      }
    }

    // Show modal with smooth animation
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Force reflow to ensure display is set before animation
    modal.offsetHeight;
    
    // Add show class for animation
    modal.classList.add('show');

    // Focus management after animation starts
    setTimeout(() => {
      const firstFocusable = modal.querySelector(
        'input, button, select, textarea'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);
  }
  };

  // Close modal function
  const closeModal = () => {
  const modal = document.getElementById('dh-modal-overlay');
  if (modal) {
    // Add hide class for animation
    modal.classList.remove('show');
    modal.classList.add('hide');
    
    // Wait for animation before hiding
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('hide');
      document.body.style.overflow = ''; // Restore scroll
    }, 300); // Match CSS transition duration
    
    // State is automatically preserved since we're not destroying the widget
  }
  };

  // Update progress bar function
  const updateProgressBar = stepName => {
  // Update the current step in widget state
  widgetState.currentStep = stepName;

  // Find and update the global progress bar
  const globalProgressBar = document.getElementById('dh-global-progress-bar');

  if (globalProgressBar) {
    // Replace the global progress bar with a new one reflecting current state
    const newProgressBar = createCircularProgress();
    newProgressBar.id = 'dh-global-progress-bar';
    globalProgressBar.parentNode.replaceChild(
      newProgressBar,
      globalProgressBar
    );
  }
  };

  // Reusable circular progress component creator
  const createCircularProgress = () => {
  const progressBar = document.createElement('div');
  progressBar.className = 'dh-progress-bar';

  stepProgressManager.stepFlow.forEach((stepName, index) => {
    // Create step container
    const stepContainer = document.createElement('div');
    stepContainer.className = 'dh-progress-step-container';

    // Create the step circle
    const step = document.createElement('div');
    const stepStatus = stepProgressManager.getStepStatus(stepName);
    step.className = `dh-progress-step ${stepStatus}`;

    // Add checkmark for completed step or empty for others
    if (stepStatus === 'completed') {
      step.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="13" viewBox="0 0 17 13" fill="none"><path d="M5.7 12.025L0 6.325L1.425 4.9L5.7 9.175L14.875 0L16.3 1.425L5.7 12.025Z" fill="white"/></svg>`;
    } else {
      step.textContent = '';
    }

    // Create step label
    const stepLabel = document.createElement('div');
    stepLabel.className = `dh-progress-step-label ${stepStatus}`;
    stepLabel.textContent = stepProgressManager.stepLabels[stepName];

    stepContainer.appendChild(step);
    stepContainer.appendChild(stepLabel);
    progressBar.appendChild(stepContainer);

    // Add connecting line between steps (except after last step)
    if (index < stepProgressManager.stepFlow.length - 1) {
      const line = document.createElement('div');
      const lineStatus =
        stepProgressManager.getStepStatus(stepName) === 'completed'
          ? 'active'
          : '';
      line.className = `dh-progress-line ${lineStatus}`;
      progressBar.appendChild(line);
    }
  });

  return progressBar;
  };

  // Create button for modal trigger
  const createButton = () => {
  const button = document.createElement('button');
  button.className = 'dh-widget-button';
  button.id = 'dh-widget-button';
  button.textContent = config.buttonText;
  button.type = 'button';

  // Add click handler to open modal
  button.addEventListener('click', openModal);

  return button;
  };

  // Create modal overlay
  const createModal = () => {
  const modal = document.createElement('div');
  modal.className = 'dh-modal-overlay';
  modal.id = 'dh-modal-overlay';
  modal.style.display = 'none';

  const modalContent = document.createElement('div');
  modalContent.className = 'dh-modal-content';
  modalContent.id = 'dh-modal-content';

  const modalBody = document.createElement('div');
  modalBody.className = 'dh-modal-body';
  modalBody.id = 'dh-modal-body';
  modalContent.appendChild(modalBody);

  // Create close button and attach to modal content (positioned outside)
  const closeButton = document.createElement('button');
  closeButton.className = 'dh-modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.type = 'button';
  closeButton.addEventListener('click', closeModal);

  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);

  // Add backdrop click handler if enabled
  if (config.modalCloseOnBackdrop) {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Add ESC key handler
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeModal();
    }
  });

  document.body.appendChild(modal);
  return { modal, modalBody };
  };

  // Create inline widget
  const createInlineWidget = () => {
  // Create main form container
  const formWidget = document.createElement('div');
  formWidget.className = 'dh-form-widget';
  formWidget.id = 'dh-form-widget';

  // Create form elements
  const formContainer = document.createElement('div');
  formContainer.id = 'dh-form-container';

  // Create header (commented out in original)
  // const header = document.createElement('div');
  // header.className = 'dh-form-header';
  // header.id = 'dh-form-header';

  // const titleEl = document.createElement('h2');
  // titleEl.id = 'dh-form-title';
  // titleEl.textContent = config.headerText || 'Get Free Estimate';

  // header.appendChild(titleEl);

  // Only create subtitle if text is provided
  let subtitleEl = null;
  if (config.subHeaderText) {
    subtitleEl = document.createElement('p');
    subtitleEl.id = 'dh-form-subtitle';
    subtitleEl.textContent = config.subHeaderText;
    header.appendChild(subtitleEl);
  }

  // Create content area
  const content = document.createElement('div');
  content.className = 'dh-form-content';
  content.id = 'dh-form-content';

  // Create single global progress bar
  const globalProgressBar = createCircularProgress();
  globalProgressBar.id = 'dh-global-progress-bar';
  content.appendChild(globalProgressBar);

  // Create form steps
  const steps = createFormSteps();
  steps.forEach(step => content.appendChild(step));

  // Assemble form elements into container
  formContainer.appendChild(content);
  formWidget.appendChild(formContainer);

  return {
    formWidget: formWidget,
    formContainer: formContainer,
    content: content
  };
  };

  // Helper function to add progress bar to a form step
  const addProgressBarToStep = stepElement => {
  const progressBar = createCircularProgress();
  stepElement.insertBefore(progressBar, stepElement.firstChild);
  };

  // Main widget creation function
  const createWidget = () => {
  if (config.displayMode === 'button') {
    // Create button and modal for button mode
    createModal();
    return createButton();
  } else {
    // Default inline mode
    return createInlineWidget();
  }
  };

  // Update modal overflow behavior based on current step
  const updateModalOverflow = stepName => {
  const modalContent = document.querySelector('.dh-modal-content');
  const formWidget = document.querySelector('.dh-form-widget');

  if (stepName === 'welcome') {
    // On welcome screen - allow visible overflow
    if (modalContent) {
      modalContent.style.overflow = 'visible';
    }
    if (formWidget) {
      formWidget.style.maxHeight = '';
      formWidget.style.overflow = '';
    }
  } else {
    // Past welcome screen - hide overflow and constrain form
    if (modalContent) {
      modalContent.style.overflow = 'hidden';
    }
    if (formWidget) {
      formWidget.style.maxHeight = '90vh';
      formWidget.style.overflow = 'auto';
    }
  }
  };

  // Create welcome screen content for Step 1 (new design) 
  const createWelcomeScreenContent = () => {
  const welcomeContainer = document.createElement('div');
  welcomeContainer.className = 'dh-welcome-screen';

  // Left content area
  const welcomeContent = document.createElement('div');
  welcomeContent.className = 'dh-welcome-content';

  // Welcome title
  const welcomeTitle = document.createElement('h1');
  welcomeTitle.className = 'dh-welcome-title';
  welcomeTitle.textContent =
    (typeof widgetState !== 'undefined' && widgetState.widgetConfig?.welcomeTitle) || 'Get help now!';

  // Welcome description
  const welcomeDescription = document.createElement('h2');
  welcomeDescription.className = 'dh-welcome-description';
  welcomeDescription.textContent =
    (typeof widgetState !== 'undefined' && widgetState.widgetConfig?.welcomeDescription) ||
    'For fast, affordable & professional pest solutions in your area.';

  // Benefits list
  const benefitsList = document.createElement('ul');
  benefitsList.className = 'dh-welcome-benefits';

  // Render custom benefits if available
  if (
    typeof widgetState !== 'undefined' &&
    widgetState.widgetConfig?.welcomeBenefits &&
    widgetState.widgetConfig.welcomeBenefits.length > 0
  ) {
    widgetState.widgetConfig.welcomeBenefits.forEach(benefit => {
      const li = document.createElement('li');

      // Create icon element
      if (benefit.icon && benefit.icon.trim()) {
        const iconElement = document.createElement('span');
        iconElement.className = 'dh-benefit-icon';
        iconElement.innerHTML = benefit.icon;
        li.appendChild(iconElement);
      }

      // Create text element
      const textElement = document.createElement('span');
      textElement.className = 'dh-benefit-text';
      textElement.textContent = benefit.text;
      li.appendChild(textElement);

      benefitsList.appendChild(li);
    });
  }

  // Welcome button
  const welcomeButton = document.createElement('button');
  welcomeButton.className = 'dh-welcome-button';
  welcomeButton.innerHTML = `
    <span>${widgetState.widgetConfig?.welcomeButtonText || 'Start My Free Estimate'}</span>
    <span class="dh-button-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></span>
  `;
  welcomeButton.addEventListener('click', () => {
    nextStep();
  });

  // Terms disclaimer
  const termsDisclaimer = document.createElement('p');
  termsDisclaimer.className = 'dh-terms-disclaimer';
  termsDisclaimer.textContent =
    '*terms and conditions apply. See details for more information';

  // Assemble content
  welcomeContent.appendChild(welcomeTitle);
  welcomeContent.appendChild(welcomeDescription);
  welcomeContent.appendChild(benefitsList);
  welcomeContent.appendChild(welcomeButton);
  welcomeContent.appendChild(termsDisclaimer);

  // Right hero area
  const welcomeHero = document.createElement('div');
  welcomeHero.className = 'dh-welcome-hero';

  // Set hero image if available
  if (widgetState.widgetConfig?.branding?.hero_image_url) {
    welcomeHero.style.backgroundImage = `url(${widgetState.widgetConfig.branding.hero_image_url})`;
  }

  // Set welcome screen background in bottom corner
  const bgSvg = document.createElement('div');
  bgSvg.className = 'dh-welcome-svg-background';
  bgSvg.innerHTML = `<img src="https://cwmckkfkcjxznkpdxgie.supabase.co/storage/v1/object/public/brand-assets/general/background-pests.svg" alt="" />`;

  // Assemble welcome container
  welcomeContainer.appendChild(welcomeContent);
  welcomeContainer.appendChild(welcomeHero);
  welcomeContainer.appendChild(bgSvg);

  return welcomeContainer;
  };

  // === WIDGET LOGIC ===
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

  // === WIDGET FORMS ===
  // Create form steps
  const createFormSteps = () => {
    const steps = [];

    // Step 1: Welcome (redesigned)
    const welcomeStep = document.createElement('div');
    welcomeStep.className = 'dh-form-step welcome active';
    welcomeStep.id = 'dh-step-welcome';

    // Use the new welcome screen design instead of simple HTML
    const welcomeContent = createWelcomeScreenContent();
    welcomeStep.appendChild(welcomeContent);
    steps.push(welcomeStep);

    // Step 2: Pest Issue
    const pestStep = document.createElement('div');
    pestStep.className = 'dh-form-step';
    pestStep.id = 'dh-step-pest-issue';

    // Generate pest options dynamically from config
    const pestOptionsHtml =
      widgetState.widgetConfig?.pestOptions &&
      widgetState.widgetConfig.pestOptions.length > 0
        ? widgetState.widgetConfig.pestOptions
            .map(
              pest => `
          <div class="dh-pest-option" data-pest="${pest.value}" data-category="${pest.category}">
            <div class="dh-pest-icon">${pest.icon}</div>
            <div class="dh-pest-label">${pest.label}</div>
          </div>
        `
            )
            .join('')
        : `
        <div class="dh-pest-option" data-pest="ants">
          <div class="dh-pest-label">Ants</div>
        </div>
        <div class="dh-pest-option" data-pest="spiders">
          <div class="dh-pest-label">Spiders</div>
        </div>
        <div class="dh-pest-option" data-pest="cockroaches">
          <div class="dh-pest-label">Cockroaches</div>
        </div>
        <div class="dh-pest-option" data-pest="rodents">
          <div class="dh-pest-label">Rodents (mice &amp; rats)</div>
        </div>
        <div class="dh-pest-option" data-pest="termites">
          <div class="dh-pest-label">Termites</div>
        </div>
        <div class="dh-pest-option" data-pest="wasps">
          <div class="dh-pest-label">Wasps</div>
        </div>
        <div class="dh-pest-option" data-pest="others">
          <div class="dh-pest-label">Others (earwigs, boxelders, ect.)</div>
        </div>
      `;

    pestStep.innerHTML = `
    <div class="dh-form-step-content" style="position: relative;">
      <h2 class="dh-step-heading">What's your main pest issue?</h2>
      <p class="dh-step-instruction">What kind of pest issue are you experiencing?</p>
      <div class="dh-pest-selection">
        ${pestOptionsHtml}
      </div>
      <div class="dh-pest-loading" id="pest-loading" style="display: none;">
        <div class="dh-loading-spinner"></div>
      </div>
    </div>
    <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
      </div>
  `;
    steps.push(pestStep);

    // Step 3: Plan Selection
    const planSelectionStep = document.createElement('div');
    planSelectionStep.className = 'dh-form-step';
    planSelectionStep.id = 'dh-step-plan-selection';
    planSelectionStep.innerHTML = `
    <div class="dh-form-step-content">
  <h3>Choose your protection plan</h3>
  <p class="dh-step-instruction">Based on your pest issue, here are our recommended plans</p>
  <div class="dh-plan-loading" id="plan-loading">
    <div class="dh-loading-spinner"></div>
    <p>Finding the best plans for your needs...</p>
  </div>
  <div class="dh-plan-selection" id="plan-selection" style="display: none;">
    <!-- Plans will be populated dynamically -->
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
  </div>
  `;
    steps.push(planSelectionStep);

    // Step 4: Address
    const addressPestIcon = getPestIcon();
    const addressStep = document.createElement('div');
    addressStep.className = 'dh-form-step';
    addressStep.id = 'dh-step-address';
    addressStep.innerHTML = `
    <div class="dh-form-step-content">
    <div class="dh-address-pest-icon" id="address-pest-icon">${addressPestIcon}</div>
  <h2 class="dh-step-heading">Yuck, <span id="address-pest-type">pests</span>! We hate those. No worries, we got you!</h2>
  <!-- Address Search Mode (Initial State) -->
  <div id="address-search-mode">
    <p class="dh-step-instruction">Dealing with pests is a hassle, but our licensed and trained techs will have you free of <span id="address-pest-type-two">pests</span> in no time!</p>
    <div class="dh-form-group">
      <div class="dh-address-autocomplete">
        <label class="dh-address-form-label" for="address-search-input">Let's make sure you're in our service area.</label>
        <input type="text" class="dh-form-input dh-address-search-field" id="address-search-input" name="address-search-input" placeholder="Start typing your address..." autocomplete="off">
        <div class="dh-address-suggestions" id="address-suggestions"></div>
      </div>
    </div>
  </div>

  <!-- Address Display Mode (After Selection) -->
  <div id="address-display-mode" style="display: none;">
    <div class="dh-address-header">
      <p>Review and/or edit your service address:</p>
      <button type="button" class="dh-change-address-btn" onclick="changeAddress()">Search Different Address</button>
    </div>
    
    <!-- Address Visual Confirmation -->
    <div class="dh-address-imagery" id="address-imagery">
      <div class="dh-image-loading" id="image-loading">
        <div class="dh-loading-spinner"></div>
        <p>Loading street view...</p>
      </div>
      <img class="dh-address-image" id="address-image" alt="Street view of selected address" style="display: none;">
      <div class="dh-image-error" id="image-error" style="display: none;">
        <p>📍 Street view not available for this address</p>
      </div>
    </div>
    
    <!-- Editable address form fields -->
    <div class="dh-form-group">
      <div class="dh-floating-input">
        <input type="text" class="dh-form-input" id="street-input" placeholder=" ">
        <label class="dh-floating-label" for="street-input">Street Address</label>
      </div>
    </div>
    <div class="dh-form-group">
      <div class="dh-floating-input">
        <input type="text" class="dh-form-input" id="city-input" placeholder=" ">
        <label class="dh-floating-label" for="city-input">City</label>
      </div>
    </div>
    <div class="dh-form-group">
      <div class="dh-floating-input">
        <input type="text" class="dh-form-input" id="state-input" placeholder=" ">
        <label class="dh-floating-label" for="state-input">State</label>
      </div>
    </div>
    <div class="dh-form-group">
      <div class="dh-floating-input">
        <input type="text" class="dh-form-input" id="zip-input" placeholder=" ">
        <label class="dh-floating-label" for="zip-input">ZIP Code</label>
      </div>
    </div>
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
    <button class="dh-form-btn dh-form-btn-secondary" onclick="nextStep()" id="address-next">Continue <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
  </div>
  `;
    steps.push(addressStep);

    // Step 4: Urgency
    const urgencyStep = document.createElement('div');
    urgencyStep.className = 'dh-form-step';
    urgencyStep.id = 'dh-step-urgency';
    urgencyStep.innerHTML = `
    <div class="dh-form-step-content" style="position: relative;">
  <h2 class="dh-step-heading">Excellent. How soon are you wanting to get rid of those pesky <span id="urgency-pest-type">pests</span>?</h2>
  <p class="dh-step-instruction">Select your preferred timeline to continue</p>
  <div class="dh-urgency-selection">
    <div class="dh-urgency-option" data-urgency="yesterday">Yesterday! (we hear you)</div>
    <div class="dh-urgency-option" data-urgency="1-2-days">Within 1-2 days</div>
    <div class="dh-urgency-option" data-urgency="next-week">Within the next week</div>
    <div class="dh-urgency-option" data-urgency="no-rush">I&apos;m not in a rush</div>
  </div>
  <div class="dh-urgency-loading" id="urgency-loading" style="display: none;">
    <div class="dh-loading-spinner"></div>
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
  </div>
  `;
    steps.push(urgencyStep);

    // Step 5: Initial Offer
    const initialOfferStep = document.createElement('div');
    initialOfferStep.className = 'dh-form-step';
    initialOfferStep.id = 'dh-step-initial-offer';
    initialOfferStep.innerHTML = `
    <div class="dh-form-step-content">
  <h2 class="dh-step-heading">Great! We can take care of those <span id="offer-pest-type">pests</span>, <span id="urgency-timeline-ref">usually within one business day</span>, starting at just <span id="offer-price">$</span>.</h2>
  <p class="dh-step-instruction">How would you like to proceed?</p>
  <div class="dh-offer-options">
    <button class="dh-offer-btn dh-offer-btn-primary" id="lets-schedule" data-choice="schedule">Schedule Now!</button>
    <p>OR</p>
    <button class="dh-offer-btn dh-offer-btn-primary" id="detailed-quote" data-choice="quote">Detailed Quote?</button>
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
    <button class="dh-form-btn dh-form-btn-back" id="no-thanks" data-choice="decline">No Thanks <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none"><line x1="14.9298" y1="1.49153" x2="0.707292" y2="15.714" stroke="#4E4E4E" stroke-width="2"/><line x1="15.2929" y1="15.7103" x2="1.07042" y2="1.48781" stroke="#4E4E4E" stroke-width="2"/></svg></button>
  </div>
  `;
    steps.push(initialOfferStep);

    // Step 6: Contact Info (Schedule Service Form)
    const contactStep = document.createElement('div');
    contactStep.className = 'dh-form-step';
    contactStep.id = 'dh-step-contact';
    contactStep.innerHTML = `
    <div class="dh-form-step-content">
  <h2 class="dh-step-heading">Let&apos;s schedule your service</h2>
  <p class="dh-step-instruction">Fill out the details below and we&apos;ll get you taken care of.</p>
  <div class="dh-form-row">
    <div class="dh-form-group">
      <div class="dh-floating-input">
        <input type="text" class="dh-form-input" id="first-name-input" placeholder=" ">
        <label class="dh-floating-label" for="first-name-input">First Name</label>
      </div>
    </div>
    <div class="dh-form-group">
      <div class="dh-floating-input">
        <input type="text" class="dh-form-input" id="last-name-input" placeholder=" ">
        <label class="dh-floating-label" for="last-name-input">Last Name</label>
      </div>
    </div>
  </div>
  <div class="dh-form-group">
    <div class="dh-floating-input dh-input-with-icon">
      <div class="dh-input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <input type="email" class="dh-form-input" id="email-input" placeholder=" ">
      <label class="dh-floating-label" for="email-input">Email Address</label>
    </div>
  </div>
  <div class="dh-form-group">
    <div class="dh-floating-input dh-input-with-icon">
      <div class="dh-input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      </div>
      <input type="tel" class="dh-form-input" id="phone-input" placeholder=" ">
      <label class="dh-floating-label" for="phone-input" data-default-text="(888) 888-8888" data-focused-text="Cell Phone Number">Cell Phone Number</label>
    </div>
  </div>
  <div class="dh-form-group">
    <div class="dh-floating-input dh-input-with-icon">
      <div class="dh-input-icon" data-type="calendar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <input type="date" class="dh-form-input" id="start-date-input" placeholder=" ">
      <label class="dh-floating-label" for="start-date-input">Preferred Start Date</label>
    </div>
  </div>
  <div class="dh-form-group">
    <div class="dh-floating-input dh-input-with-icon">
      <div class="dh-input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
      </div>
      <select class="dh-form-input" id="arrival-time-input">
        <option value=""></option>
        <option value="morning">Morning (8 AM - 12 PM)</option>
        <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
        <option value="evening">Evening (5 PM - 8 PM)</option>
        <option value="anytime">Anytime</option>
      </select>
      <label class="dh-floating-label" for="arrival-time-input">Select Preferred Arrival Time</label>
    </div>
  </div>
  <div class="dh-form-group">
    <label class="dh-form-checkbox-label">
      <input type="checkbox" class="dh-form-checkbox" id="terms-checkbox">
      <span class="dh-form-checkbox-text">I agree to receive automated promotional messages and calls. Reply STOP to opt out. Message rates apply.</span>
    </label>
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
    <button class="dh-form-btn dh-form-btn-primary" onclick="submitFormWithValidation()" id="submit-btn">Schedule Service <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
  </div>
  `;
    steps.push(contactStep);

    // Step 7: Quote Contact (Simple form for quote path)
    const quoteContactStep = document.createElement('div');
    quoteContactStep.className = 'dh-form-step';
    quoteContactStep.id = 'dh-step-quote-contact';
    quoteContactStep.innerHTML = `
    <div class="dh-form-step-content" style="position: relative;">
      <h2 class="dh-step-heading">Let&apos;s get you a detailed quote</h2>
      <p class="dh-step-instruction">We just need a few details to prepare your personalized quote.</p>
      <div class="dh-form-row">
        <div class="dh-form-group">
          <div class="dh-floating-input">
            <input type="text" class="dh-form-input" id="quote-first-name-input" placeholder=" ">
            <label class="dh-floating-label" for="quote-first-name-input">First Name</label>
          </div>
        </div>
        <div class="dh-form-group">
          <div class="dh-floating-input">
            <input type="text" class="dh-form-input" id="quote-last-name-input" placeholder=" ">
            <label class="dh-floating-label" for="quote-last-name-input">Last Name</label>
          </div>
        </div>
      </div>
      <div class="dh-form-group">
        <div class="dh-floating-input dh-input-with-icon">
          <div class="dh-input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <input type="email" class="dh-form-input" id="quote-email-input" placeholder=" ">
          <label class="dh-floating-label" for="quote-email-input">Email Address</label>
        </div>
      </div>
      <div class="dh-form-group">
        <div class="dh-floating-input dh-input-with-icon">
          <div class="dh-input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <input type="tel" class="dh-form-input" id="quote-phone-input" placeholder=" ">
          <label class="dh-floating-label" for="quote-phone-input" data-default-text="(888) 888-8888" data-focused-text="Cell Phone Number">Cell Phone Number</label>
        </div>
      </div>
      <div class="dh-quote-loading" id="quote-loading" style="display: none;">
        <div class="dh-loading-spinner"></div>
      </div>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="proceedToQuoteWithValidation()" id="quote-contact-submit">Get a Quote</button>
      </div>
    `;
    steps.push(quoteContactStep);

    // Step 8: Plan Comparison (for detailed quote path)
    const planComparisonStep = document.createElement('div');
    planComparisonStep.className = 'dh-form-step';
    planComparisonStep.id = 'dh-step-plan-comparison';
    planComparisonStep.innerHTML = `
        <div class="dh-form-step-content">
      <h2 class="dh-step-heading">Here&apos;s what we recommend for your home to get rid of those pesky <span id="comparison-pest-type">pests</span> - and keep them out!</h2>
      
      <!-- Tab Navigation -->
      <div class="dh-plan-tabs" id="comparison-plan-tabs">
        <!-- Tabs will be dynamically loaded -->
        <div class="dh-plan-loading" id="comparison-plan-loading">
          <div class="dh-loading-spinner"></div>
          <p>Loading your personalized recommendations...</p>
        </div>
      </div>
      
      <!-- Tab Content -->
      <div class="dh-plan-content" id="comparison-plan-content">
        <!-- Active plan content will be dynamically loaded -->
      </div>
      
      </div>
    `;
    steps.push(planComparisonStep);

    // Step 9: Out of Service Area
    const outOfServiceStep = document.createElement('div');
    outOfServiceStep.className = 'dh-form-step';
    outOfServiceStep.id = 'dh-step-out-of-service';
    outOfServiceStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-out-of-service">
        <h3>We&apos;re sorry, we don&apos;t currently service your area</h3>
        <p>Unfortunately, your location is outside our current service area. We&apos;re always expanding, so please check back with us in the future!</p>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-secondary" onclick="changeAddress()">Try Different Address</button>
      </div>
    </div>
  `;
    steps.push(outOfServiceStep);

    // Step: Exit Survey
    const exitSurveyStep = document.createElement('div');
    exitSurveyStep.className = 'dh-form-step';
    exitSurveyStep.id = 'dh-step-exit-survey';
    exitSurveyStep.innerHTML = `
        <div class="dh-form-step-content">
      <h2 class="dh-step-heading">Dang. Was it something we said?</h2>
      <p class="dh-step-instruction">Mind letting us know?</p>
      <div class="dh-exit-survey-options">
        <div class="dh-survey-option" data-reason="not-ready">
          <span class="dh-survey-emoji">🤔</span>
          <span class="dh-survey-text">Not ready</span>
        </div>
        <div class="dh-survey-option" data-reason="just-checking">
          <span class="dh-survey-emoji">👀</span>
          <span class="dh-survey-text">Just checking around</span>
        </div>
        <div class="dh-survey-option" data-reason="out-of-budget">
          <span class="dh-survey-emoji">🤑</span>
          <span class="dh-survey-text">Out of my budget</span>
        </div>
        <div class="dh-survey-option" data-reason="none-of-business">
          <span class="dh-survey-emoji">🖐</span>
          <span class="dh-survey-text">None of your business</span>
        </div>
      </div>
      <div class="dh-form-group">
        <div class="dh-floating-input">
          <textarea class="dh-form-input" id="exit-feedback" placeholder=" " rows="3"></textarea>
          <label class="dh-floating-label" for="exit-feedback">Any other feedback?</label>
        </div>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-primary" id="survey-submit">We&apos;re done here</button>
      </div>
      </div>
    `;
    steps.push(exitSurveyStep);

    // Step 10: Complete (Thank You)
    const completeStep = document.createElement('div');
    completeStep.className = 'dh-form-step';
    completeStep.id = 'dh-step-complete';
    completeStep.innerHTML = `
      <div class="dh-form-success">
        <h3>Thank you for your request!</h3>
        <p>We&apos;ve received your information and will contact you within 24 hours with your free estimate. Keep an eye on your email and phone for our response.</p>
      </div>
    `;
    steps.push(completeStep);

    // Step 11: Decline Complete (for exit survey submissions)
    const declineCompleteStep = document.createElement('div');
    declineCompleteStep.className = 'dh-form-step';
    declineCompleteStep.id = 'dh-step-decline-complete';
    declineCompleteStep.innerHTML = `
      <div class="dh-form-success">
        <h3>Thanks for your feedback!</h3>
        <p>We appreciate you taking the time to let us know. If you change your mind in the future, we&apos;re always here to help with your pest control needs.</p>
        <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">Have a great day! 👋</p>
      </div>
    `;
    steps.push(declineCompleteStep);

    return steps;
  };

  // === WIDGET API ===
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

  // === CONFIGURATION AND INITIALIZATION ===
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