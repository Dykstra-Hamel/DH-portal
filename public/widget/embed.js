/**
 * DH Widget - Built from Source

 * Generated: 2025-08-28T16:08:22.700Z

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

  // Helper function to get the pest background image with fallback
  const getPestBackgroundImage = () => {
  const pestBackgroundImage = widgetState.formData.pestBackgroundImage;
  const fallbackImage = widgetState.widgetConfig?.branding?.pestSelectBackgroundImage;
  return pestBackgroundImage || fallbackImage || null;
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

      // Update completion step title to Office Hours
      const completionMessage = document.querySelector(
        '#dh-step-complete h3'
      );
      if (completionMessage) {
        completionMessage.textContent = 'Office Hours';
      }

      // Update completion step with Success Message
      const completionDescription = document.querySelector(
        '#dh-step-complete p'
      );
      if (completionDescription && widgetState.widgetConfig?.successMessage) {
        completionDescription.textContent = widgetState.widgetConfig.successMessage;
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
      // Update step headings with variable replacement
      updateStepHeadings();

      resolve(); // Resolve the promise when all updates are complete
    }, 100); // Small delay to ensure DOM is ready
  });
  };


  // Helper function to replace step heading variables
  const replaceStepVariables = (text, pestType, recommendedPlan) => {
  if (!text) return '';
  
  const pestText = getPestTypeDisplay(pestType, 'default');
  const initialPrice = recommendedPlan?.initial_price ? `$${recommendedPlan.initial_price}` : '$';
  const recurringPrice = recommendedPlan?.recurring_price && recommendedPlan?.billing_frequency 
    ? `$${recommendedPlan.recurring_price}<span class="dh-price-frequency">${window.formatBillingFrequencyFull ? window.formatBillingFrequencyFull(recommendedPlan.billing_frequency) : formatBillingFrequency(recommendedPlan.billing_frequency)}</span>`
    : '$';

  return text
    .replace(/\{pest\}/g, pestText)
    .replace(/\{initialPrice\}/g, initialPrice)
    .replace(/\{recurringPrice\}/g, recurringPrice);
  };

  // Function to update step headings with variables
  const updateStepHeadings = () => {
  const pestType = widgetState.formData.pestType;
  const recommendedPlan = widgetState.formData.recommendedPlan;
  const stepHeadings = widgetState.widgetConfig?.stepHeadings;
  
  if (!stepHeadings) return;
  
  // Update address step heading
  const addressHeading = document.getElementById('address-step-heading');
  if (addressHeading && stepHeadings.address) {
    const processedText = replaceStepVariables(stepHeadings.address, pestType, recommendedPlan);
    addressHeading.innerHTML = processedText;
  }
  
  // Update how-we-do-it step heading
  const howWeDoItHeading = document.getElementById('how-we-do-it-heading');
  if (howWeDoItHeading && stepHeadings.howWeDoIt) {
    const processedText = replaceStepVariables(stepHeadings.howWeDoIt, pestType, recommendedPlan);
    howWeDoItHeading.innerHTML = processedText;
  }
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

  // Function to load address imagery as background image
  const loadAddressBackgroundImagery = async (address, backgroundElementId) => {
    const backgroundEl = document.getElementById(backgroundElementId);
    
    if (!backgroundEl) {
      console.warn(`Background element not found: ${backgroundElementId}`);
      return;
    }

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
      const { lat, lon } = address;

      // Check Street View availability using metadata API first
      const hasStreetView = await checkStreetViewAvailability(
        lat,
        lon,
        apiKey
      );

      if (hasStreetView) {
        // Street View is available - set as background
        try {
          const streetViewUrl =
            `https://maps.googleapis.com/maps/api/streetview?` +
            `size=800x600&location=${lat},${lon}&heading=0&pitch=0&fov=90&key=${apiKey}`;

          // Test if Street View image loads successfully
          const testImage = new Image();
          testImage.crossOrigin = 'anonymous';

          await new Promise((resolve, reject) => {
            testImage.onload = () => {
              // Street View loaded successfully - set as background
              backgroundEl.style.backgroundImage = `url('${streetViewUrl}')`;
              backgroundEl.style.backgroundSize = 'cover';
              backgroundEl.style.backgroundPosition = 'center';
              backgroundEl.style.backgroundRepeat = 'no-repeat';
              
              // Store the URL in widget state for reuse in other steps
              if (typeof widgetState !== 'undefined') {
                widgetState.addressBackgroundUrl = streetViewUrl;
              }
              resolve();
            };

            testImage.onerror = () => {
              // Street View failed to load, try satellite fallback
              reject(new Error('Street View image failed to load'));
            };

            testImage.src = streetViewUrl;
          });

        } catch (streetViewError) {
          console.warn('Street View failed, trying satellite:', streetViewError);
          // Fall back to satellite view
          await loadSatelliteBackground(lat, lon, apiKey, backgroundEl);
        }
      } else {
        // No Street View available, use satellite
        await loadSatelliteBackground(lat, lon, apiKey, backgroundEl);
      }
    } catch (error) {
      console.error('Address background imagery failed:', error);
      // Set a subtle fallback background or leave empty
      backgroundEl.style.backgroundColor = '#f3f4f6';
    }
  };

  // Helper function to load satellite view as background
  const loadSatelliteBackground = async (lat, lon, apiKey, backgroundEl) => {
    try {
      const satelliteUrl = 
        `https://maps.googleapis.com/maps/api/staticmap?` +
        `center=${lat},${lon}&zoom=18&size=800x600&maptype=satellite&key=${apiKey}`;

      const testImage = new Image();
      testImage.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        testImage.onload = () => {
          backgroundEl.style.backgroundImage = `url('${satelliteUrl}')`;
          backgroundEl.style.backgroundSize = 'cover';
          backgroundEl.style.backgroundPosition = 'center';
          backgroundEl.style.backgroundRepeat = 'no-repeat';
          
          // Store the URL in widget state for reuse in other steps
          if (typeof widgetState !== 'undefined') {
            widgetState.addressBackgroundUrl = satelliteUrl;
          }
          resolve();
        };

        testImage.onerror = () => {
          reject(new Error('Satellite image failed to load'));
        };

        testImage.src = satelliteUrl;
      });

    } catch (error) {
      console.error('Satellite background failed:', error);
      // Set fallback background
      backgroundEl.style.backgroundColor = '#f3f4f6';
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

  // Expose functions to window for global access
  window.updateStepHeadings = updateStepHeadings;

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

  // Get font configuration from widget config
  const fontName = widgetState.widgetConfig?.fonts?.primary?.name || 'Outfit';
  const fontUrl =
    widgetState.widgetConfig?.fonts?.primary?.url ||
    'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap';

  const styleElement = document.createElement('style');
  styleElement.id = 'dh-widget-styles';
  styleElement.textContent = `
  @import url('${fontUrl}');

  /* Global font family for all widget elements */
  .dh-form-widget, .dh-form-widget * {
  font-family: "${fontName}", sans-serif !important;
  }

  @keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
  }

  img {
  animation: fadeIn 2s ease forwards;
  }

  .dh-pest-bg-image {
  animation: fadeIn 2s ease forwards;
  }

  .dh-form-widget { 
  margin: 0 auto; 
  background: ${backgroundColor}; 
  border-radius: 26px; 
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); 
  overflow: visible; 
  color: ${textColor};
  position: relative;
  }
  .dh-widget-close-icon {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 100;
  cursor: pointer;
  pointer-events: auto;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
  }

  .dh-widget-close-icon svg, .dh-widget-close-icon svg path {
  transition: all 0.2s ease;
  }
  .dh-widget-close-icon:hover svg {
  scale: 1.08;
  }

  .dh-widget-close-icon:hover svg path {
  fill: #515151;
  }

  .dh-widget-close-icon:hover svg path:not(:first-of-type) {
  stroke: white;
  }

  .dh-widget-close-icon svg {
  width: 27px;
  height: 27px;
  }
  .dh-global-back-button {
  position: absolute;
  justify-content: center;
  align-items: center;
  top: 67px;
  left: 0px;
  z-index: 90;
  background: #E3E3E3;
  color: #4A4A4A;
  border: none;
  padding: 10px 16px;
  border-radius: 0 60px 60px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: '${fontName}', sans-serif;
  font-size: 12px;
  line-height: 20px;
  font-weight: 700;
  transition: background-color 0.2s ease, transform 0.2s ease;
  opacity: 0.7;
  transition: all 0.2s ease;
  }

  .dh-global-back-button:hover {
  background: #B0B0B0;
  }

  .dh-global-back-button svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  }

  .dh-global-back-button:hover svg {
  transform: translateX(-2px);
  }
  .dh-global-back-button.hidden {
  display: none;
  }
  .dh-form-content { 
  padding: 24px; 
  border-radius: 26px; 
  background: ${backgroundColor};
  } 
  .dh-form-step {
  height: 100%;
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
  display: flex; 
  opacity: 1;
  }

  .dh-form-step.fade-in {
  animation: fadeIn 0.4s ease forwards;
  }

  .dh-form-step.fade-out {
  animation: fadeOut 0.3s ease forwards;
  } 

  .dh-form-step-content {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    padding: 0;
    border-bottom: none;
  }

  #dh-step-plan-comparison .dh-form-step-content {
   flex-wrap: wrap;
  }

  #dh-step-plan-comparison .dh-pest-hero {
  width: 386px;
  flex-shrink: 0;
  }


  /* Google Reviews Display Styles */
  .dh-reviews-container {
  margin: 0 0 24px 0;
  font-family: "${fontName}", sans-serif;
  min-height: 24px; /* Reserve space to prevent layout shift */
  }

  .dh-reviews-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  }

  .dh-star-rating {
  display: flex;
  align-items: center;
  gap: 2px;
  }

  .dh-star {
  width: 20px;
  height: 18px;
  flex-shrink: 0;
  }

  .dh-star path {
  fill: #F68C1A;
  transition: fill 0.2s ease;
  }

  .dh-reviews-count {
  font-size: 16px;
  font-weight: 500;
  color: ${secondaryColor};
  margin-left: 4px;
  }

  /* Loading States */
  .dh-reviews-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  }

  .dh-reviews-skeleton {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.6;
  }

  .dh-skeleton-stars {
  display: flex;
  align-items: center;
  gap: 2px;
  }

  .dh-skeleton-stars::before {
  content: '★★★★★';
  color: #E5E5E5;
  font-size: 16px;
  animation: dh-pulse 1.5s ease-in-out infinite;
  }

  .dh-skeleton-text {
  background: #E5E5E5;
  height: 16px;
  width: 120px;
  border-radius: 4px;
  animation: dh-pulse 1.5s ease-in-out infinite;
  }

  @keyframes dh-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.9;
  }
  }

  .dh-plan-faqs-container {
  width: 100%;
  margin: 22px;
  padding: 31px;
  background: rgba(69, 69, 69, 0.05);
  border-radius: 16px;
  }

  .dh-form-content-area {
    flex: 1;
    align-items: center;
    padding: 37px 40px;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
  }

  .dh-price-frequency {
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  color: #515151;
  }

  .dh-price-suffix {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  }

  .dh-form-step h3 { 
  margin: 0 0 12px 0; 
  font-size: 18px; 
  color: ${secondaryColor}; 
  } 

  h3.dh-how-we-do-it-title, .dh-safety-text {
  font-size: 28px;
  line-height: 30px;
  font-weight: 700;
  color: #4E4E4E;
  }

  .dh-how-we-do-it-text {
    margin-right: 35px;
    line-height: 24px;
  }

  .dh-how-we-do-it-content {
   display: flex;
   margin-top: 46px;
  }

  .dh-subspecies-section {
  margin-top: 20px;
  }

  #subspecies-heading {
  margin-bottom: 15px;
  }

  .dh-subspecies-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, auto);
  gap: 4px 20px;
  grid-auto-flow: column;
  }

  .dh-subspecies-grid .dh-subspecies-item {
  display: flex;
  align-items: flex-start;
  font-size: 16px;
  color: #4E4E4E;
  }

  .dh-subspecies-grid .dh-subspecies-item:before {
  content: "•";
  margin-right: 8px;
  color: #4E4E4E;
  font-weight: bold;
  }

  .dh-interior-image {
   width: 244px;
   height: auto;
   object-fit: cover;
   border-radius: 16px;
   opacity: 0;
   transition: opacity 0.5s ease;
  }

  .dh-safety-message {
   display: flex;
   align-items: center;
   margin: 20px 0 40px 0;
  }

  #safety-message-text {
  margin: 0;
  }

  .dh-form-group { 
  max-width: 515px;
  width: 100%;
  margin: 0 auto 20px;
  } 
  .dh-form-label { 
  display: block; 
  font-weight: 500; 
  color: #4E4E4E; 
  margin-bottom: 6px; 
  font-family: "${fontName}", sans-serif;
  font-size: 20px;
  line-height: 30px;
  } 
  .dh-address-form-label {
  display: block;
  margin-bottom: 24px;
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
  font-family: "${fontName}", sans-serif; 
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
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 15px center;
  background-size: 20px;
  }

  /* Style date inputs with dropdown arrow */
  .dh-form-input[type="date"] {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 15px center;
  background-size: 20px;
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
  font-family: "${fontName}", sans-serif;
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
  background: transparent;
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
  gap: 13px;
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
  font-family: "${fontName}", sans-serif;
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
  position: relative;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
  text-align: center;
  }

  .dh-address-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;
  }

  /* Address Search Mode vs Display Mode */
  #address-search-mode {
  height: 100%;
  display: flex;
  flex-direction: column;
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

  /* Service Area Check Button */
  #check-service-area-btn {
  opacity: 0.6;
  }

  #check-service-area-btn:enabled {
  opacity: 1;
  }

  #check-service-area-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  margin: 0 auto;
  }

  .dh-form-out-of-service h3 {
  font-family: "${fontName}", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: ${secondaryColor};
  margin: 0 0 16px 0;
  line-height: 1.3;
  }

  .dh-form-out-of-service p {
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: ${textColor};
  line-height: 1.5;
  margin: 0 0 24px 0;
  }

  /* Specific styling for out of service step heading */
  #dh-step-out-of-service .dh-step-heading {
  margin-bottom: 40px;
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
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: ${textColor};
  }

  .dh-offer-btn {
  padding: 16px 24px;
  border: 2px solid;
  border-radius: 8px;
  font-family: "${fontName}", sans-serif;
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

  .dh-pest-logo img {
    width: 119px !important;
  }

  .dh-safety-message {
    flex-direction: row-reverse;
    margin: 0;
  }

  .dh-how-we-do-it-text {
   margin-right: 0;
  }

  #how-we-do-it-interior-image, .dh-plan-image-actual img {
    width: 100vw !important;
    height: 240px !important;
    max-width: unset !important;
    object-fit: cover;
    object-position: top;
    opacity: 0;
    transition: opacity 0.5s ease;
    border-radius: 0;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    border-radius: 0 !important;
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

  .dh-form-button-group {
    width: 100%;
    padding: 40px 0 0 0 !important;
  }


  .dh-form-btn:not(.plan-no-thanks) {
  width: 100%;
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
  margin-bottom: 40px;
  }
  .dh-form-checkbox {
  width: 18px !important;
  height: 18px !important;
  margin: 0 !important;
  flex-shrink: 0;
  margin-top: 2px !important;
  cursor: pointer;
  } 
  .dh-form-select { 
  width: 100%; 
  padding: 12px 16px; 
  border: 1px solid #d1d5db; 
  border-radius: 8px; 
  outline: none; 
  font-size: 14px; 
  font-family: "${fontName}", sans-serif; 
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
  margin-top: auto; 
  justify-content: center;
  align-items: center;
  padding: 24px 20px 20px 20px;
  border-radius: 0 0 26px 26px;
  } 
  #dh-step-exit-survey .dh-form-button-group { 
  background: none;
  } 
  .dh-form-btn { 
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 30px; 
  gap: 25px;
  border: 2px solid #fff; 
  border-radius: 60px; 
  cursor: pointer; 
  font-size: 18px;
  line-height: 18px;
  font-family: "${fontName}", sans-serif;
  font-weight: 700; 
  transition: all 0.2s ease;
  }

  .dh-form-btn:not(.plan-no-thanks) {
  min-width: 241px;
  }

  .dh-form-btn:active {
  transform: translateY(0);
  transition: all 0.1s ease;
  } 
  .dh-form-btn-primary { 
  background: ${primaryColor}; 
  color: white;
  } 
  .dh-form-btn-primary:hover { 
  border-color: ${primaryColor};
  } 
  .dh-form-btn-secondary { 
  background: ${secondaryColor}; 
  color: #fff;  
  } 

  .dh-form-btn-secondary:hover {
  border-color: ${secondaryColor};
  }

  .dh-form-btn-back { 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #CBCBCB; 
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
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
    background: #bfbfbf20;
    color: #515151;
  }

  .dh-form-btn.plan-no-thanks svg {
    display: none;
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
  gap: 32px;
  padding: 0 0 20px 0;
  flex-flow: row wrap;
  justify-content: center;
  }
  .dh-pest-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  }
  .dh-pest-icon {
  width: 103px;
  height: 103px;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px #BFBFBF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  }
  .dh-pest-icon svg {
  width: 60px;
  height: 60px;
  fill: #4E4E4E;
  opacity: 0.66;
  }
  .dh-pest-icon svg path {
  fill: #4E4E4E;
  }
  .dh-pest-label {
  text-align: center;
  margin-top: 8px;
  width: 100%;
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 18px;
  }
  .dh-pest-option:hover .dh-pest-icon {
  box-shadow: inset 0 0 0 2px #515151;
  }

  .dh-pest-option:hover .dh-pest-icon svg {
  opacity: 1;
  }

  .dh-pest-option.selected .dh-pest-icon {
  box-shadow: inset 0 0 0 2px ${primaryColor};
  color: white;
  }

  /* Keep only these styles that are still used by other steps */
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
  .dh-step-instruction {
  color: #4E4E4E;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  font-weight: 500;
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

  /* New Pest Step Layout with Hero Image */
  .dh-pest-step-container {
  display: flex;
  width: 100%;
  min-height: 100%;
  position: relative;
  overflow: visible;
  }

  .dh-pest-content {
  flex: 1;
  padding: 40px 70px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
  text-align: center;
  align-items: center;
  }

  .dh-pest-logo {
  margin-bottom: 40px;
  }

  .dh-pest-logo img {
  max-height: 99px;
  max-width: 224px;
  height: auto;
  width: auto;
  }

  .dh-pest-time-badge {
  display: inline-block;
  margin-bottom: 24px;
  }

  .dh-pest-time-badge span {
  color: ${secondaryColor};
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 700;
  }

  .dh-pest-heading {
  color: #515151;
  font-family: "${fontName}", sans-serif;
  font-size: 46px;
  font-weight: 700;
  line-height: 46px;
  letter-spacing: -0.46px;
  margin: 0 0 24px 0;
  }

  .dh-pest-instruction {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  margin: 0 0 40px 0;
  }

  .dh-pest-selection {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  }

  .dh-pest-option:hover .dh-pest-icon svg path {
  fill: #515151;
  }

  .dh-pest-option:active .dh-pest-icon svg path {
  fill: ${primaryColor};
  }

  .dh-pest-option:active .dh-pest-label {
  color: ${primaryColor};
  }

  .dh-pest-option:active .dh-pest-icon {
  box-shadow: inset 0 0 0 2px ${primaryColor};
  scale: 1.05;

  }

  .dh-pest-option.selected .dh-pest-icon svg path {
  fill: white;
  }

  .dh-pest-option.selected .dh-pest-label {
  color: white;
  }



  .dh-pest-icon svg {
  width: 69px;
  height: 69px;
  fill: #6b7280;
  transition: fill 0.2s ease;
  }

  .dh-pest-label {
  text-align: center;
  color: #374151;
  font-family: "${fontName}", sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 120%;
  margin: 0;
  transition: color 0.2s ease;
  }

  .dh-pest-hero {
  width: 386px;
  max-height: 889px;;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  }

  .dh-pest-hero:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 1) 80%
  );
  z-index: 2;
  }

  .dh-pest-hero:not(.step1):before {
    background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 1) 100%
  );
  }

  .dh-pest-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #f3f4f6;
  border-radius: 0 26px 26px 0;
  z-index: 1;
  }

  /* Specific styling for confirm-address background */
  #confirm-address-bg-image {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  }

  .dh-pest-bg-image:not(.step1) {
  height: 100%;
  }

  .dh-pest-hero-image {
  position: fixed;
  bottom: 0;
  z-index: 2;
  max-width: 453px;
  max-height: 889px;
  object-fit: contain;
  border-radius: 0 26px 26px 0;
  transition: opacity 0.5s ease;
  }

  /* Tablet Responsive - 1024px and below */
  @media (max-width: 1024px) {
  .dh-modal-overlay {
    padding: 0 !important;
  }

  .dh-modal-content {
    overflow-y: scroll !important;
    border-radius: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    max-width: 100vw !important;
  }

  .dh-form-step-content {
    flex-direction: column;
    flex-wrap: nowrap !important;;
  }

  .dh-pest-hero {
    width: 100%;
    min-height: unset;
  }

  .dh-pest-hero-image {
    display: none !important;
  }

  .dh-pest-bg-image {
    border-radius: 0 !important;;
  }

  .dh-pest-hero:before {
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 1) 100%
  ) !important;
  }

  #dh-form-container {
    width: 100%;
  }
  
  .dh-pest-step-container {
    width: 100%;
    flex-direction: column;
    overflow: visible;
  }

  .dh-how-we-do-it-content {
    flex-direction: column-reverse;
    align-items: center;
    margin-top: 0;
  }
  
  .dh-how-we-do-it-text {
    margin-top: 48px;
  }

  .dh-pest-bg-image {
    position: relative;
    width: 100%;
    min-height: 240px;
    border-radius: 0 0 26px 26px;
    z-index: 1;
    background-position: top;
  }
  
  .dh-pest-bg-image:not(.step1) {
    height: 200px;
  }
  
  /* Confirm address mobile image styles */
  #dh-step-confirm-address .dh-pest-hero {
    display: none;
  }
  
  #dh-step-confirm-address .dh-mobile-bg-image {
    display: block;
    margin: 24px 0;
  }

  .dh-plan-content-grid {
    display: flex !important;
    flex-direction: column !important;
  }

  .dh-plan-visual {
    order: -1;
    margin: auto;
  }

  #dh-step-plan-comparison .dh-pest-hero {
    display: none;
  }

  .dh-widget-close-icon:not(:hover) svg path {
  stroke: #B2B2B2;
  }
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
  .dh-pest-step-container,
  .dh-form-step-content {
    flex-direction: column;
    min-height: auto;
  }
  
  .dh-pest-content,
  .dh-form-content-area {
    padding: 20px;
  }
  
  .dh-pest-heading {
    font-size: 30px;
    line-height: 32px;
  }
  
  .dh-pest-selection {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  /* Global elements mobile responsive */
  .dh-global-back-button {
    top: 20px;
    padding: 12px 18px;
    font-size: 0;
  }
  
  .dh-global-back-button svg {
    width: 16px;
    height: 14px;
  }
  
  .dh-widget-close-icon {
    top: 24px;
    right: 20px;
    width: 26px;
    height: 26px;
  }
  
  .dh-widget-close-icon svg {
    width: 26px;
    height: 26px;
  }

  .dh-plan-faqs-container {
    max-width: 100%;
    width: unset;
    margin: 0 0 50px 0; 
    border-radius: 0;
  }
  }

  /* Mobile background image for confirm address step */
  .dh-mobile-bg-image {
  display: none;
  width: 100%;
  max-width: 512px;
  height: auto;
  object-fit: cover;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.5s ease;
  }
  
  /* Mobile responsive styles for reviews display */
  .dh-reviews-container {
    margin: 0 0 20px 0;
    min-height: 22px;
  }
  
  .dh-reviews-display {
    gap: 6px;
  }
  
  .dh-reviews-count {
    font-size: 14px;
    margin-left: 3px;
    position: relative;
    top: 2px;
  }
  
  .dh-skeleton-stars::before {
    font-size: 14px;
  }
  
  .dh-skeleton-text {
    height: 14px;
    width: 100px;
  }
  }


  @media (max-width: 480px) {

  .dh-pest-logo {
    margin-bottom: 24px;
  }

  .dh-pest-logo img {
    max-height: 53px;
    max-width: 119px;
  }
  
  .dh-pest-heading {
    font-size: 32px;
    line-height: 32px;
    letter-spacing: -0.3px;
  }

  .dh-pet-safety-image {
    width: 144px;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .dh-safety-text {
    font-size: 22px;
    line-height: 26px;
  }

  .dh-subspecies-grid {
    gap: 2px 20px;
  }

  .dh-form-btn {
    width: 100%;
  }

  .dh-plan-visual {
    width: 100vw;
    max-width: unset !important;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
  }

  .dh-plan-visual img {
    border-radius: 0 !important;
  }

  .dh-plan-image-container {
    border-radius: 0 !important;
  }
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
  width: 64px;
  height: 64px;
  border: 6px solid #e5e7eb;
  border-top: 6px solid ${primaryColor};
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
  font-family: "${fontName}", sans-serif;
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
  overflow: auto;
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
  margin: auto;
  max-width: 1078px;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  background: white;
  font-family: "${fontName}", sans-serif;
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  overflow: visible;
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

  /* Progress bar styles removed - no longer needed */

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
  position: relative;
  }

  .dh-welcome-button:hover .dh-button-arrow {
  transform: translateX(2px);
  }

  .dh-step-heading {
  color: #515151;
  text-align: center;
  font-size: 46px;
  font-weight: 700;
  line-height: 46px;
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
  overflow-y: visible;
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
  min-height: 100%;
  display: flex;
  box-shadow: none;
  border-radius: 26px;
  padding: 0;
  }

  #dh-form-container {
  display: flex;
  width: 100%;
  }

  .dh-modal-body .dh-form-content {
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0;
  }

  /* Progress styles removed */

  /* Mobile modal adjustments */
  @media (max-width: 768px) {
  .dh-modal-overlay {
    padding: 10px;
  }
  
  .dh-modal-content {
    min-height: 95vh;
    width: 95%;
  }
  
  .dh-modal-close {
    top: 8px;
    right: 8px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  /* Progress styles removed */
  
  .dh-widget-button {
    padding: 14px 28px;
    font-size: 16px;
    width: 100%;
    max-width: 300px;
  }

  .dh-pest-logo {
    margin-bottom: 24px;
  }

  .dh-step-heading {
    font-size: 30px;
    line-height: 32px;
  }

  .dh-step-instruction {
    margin: 0 0 20px 0;
  }

  #safety-message-text {
    font-size: 22px;
    line-height: 26px;
  }

  .dh-pet-safety-image {
    width: 144px;  
  }

  .dh-subspecies-grid {
    margin-bottom: 48px;
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
  /* Progress styles removed */
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
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
  font-family: "${fontName}", sans-serif;
  font-size: 30px;
  font-style: normal;
  font-weight: 700;
  line-height: 24px;
  }
  .dh-plan-description {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  }

  .dh-plan-included h4 {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 33px;
  margin-bottom: 5px;
  }
  .dh-plan-features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  }

  .dh-plan-feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  line-height: 19px;
  font-weight: 600;
  margin-bottom: 16px;
  }

  .dh-feature-checkmark svg {
  display: block;
  }

  .dh-feature-checkmark path {
  stroke: ${primaryColor};
  }

  .dh-plan-price-label {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 26px;
  font-weight: 500;
  line-height: 30px;
  }

  .dh-plan-recommendation-badge {
  margin-bottom: 7px;
  line-height: 10px;
  }

  .dh-plan-pricing {
  grid-column: span 2;
  margin-left: 15px;
  }
  
  .dh-plan-price-detail {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 25px;
  margin: 8px 0 4px 0;
  }
  .dh-plan-price-disclaimer {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 13px;
  font-style: normal;
  font-weight: 700;
  line-height: 18px;
  margin-top: 20px;
  }
  .dh-plan-price-frequency {
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  margin-top: 10px;
  font-weight: 500;
  line-height: 24px;
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
  height: 100%;
  border-radius: 12px;
  }
  .dh-plan-image-actual {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  }

  /* Plan Actions */
  .dh-plan-actions {
  margin: 32px 0 0 0;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  }
  @media (max-width: 768px) {
  .dh-plan-actions {
    flex-direction: column;
  }
  }

  .dh-form-btn.plan-no-thanks:hover {
  opacity: 0.8;
  }

  /* FAQ Accordion Styles */
  .dh-plan-faqs {
  padding: 20px 0 0 0;
  }
  .dh-form-step h3.dh-faqs-title {
  color: #515151;
  text-align: center;
  font-family: "${fontName}", sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 103%;
  }
  .dh-faqs-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  }

  .dh-faq-item:not(:last-of-type) {
  border-bottom: 1px solid #e5e7eb;
  }

  .dh-faq-item {
  overflow: hidden;
  transition: all 0.2s ease;
  }


  .dh-plan-selection-label {
  color: ${primaryColor};
  font-family: "Source Sans 3";
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 28px;
  }

  .dh-plan-selection-dropdown {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding: 10px;
  min-width: 333px;
  width: 50%;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 22px;
  padding-right: 30px;
  border-radius: 4px;
  border: 1px solid #BFBFBF;
  font-weight: 700;
  font-size: 16px;
  color: #515151;
  }

  .dh-plan-selection-section {
  display: flex;
  flex-direction: column;
  }

  .dh-faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
  }
  .dh-faq-header:hover .dh-faq-question {
  font-weight: 700;
  }

  .dh-faq-question {
  font-size: 17px;
  font-weight: 600;
  color: ${textColor};
  margin: 0;
  flex: 1;
  padding-right: 16px;
  text-align: left;
  transition: all 0.2s ease;
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
  background: transparent;
  }
  .dh-faq-answer {
  padding: 0 0 16px 0;
  }
  .dh-faq-answer p {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
  }
  @media (max-width: 768px) {
  .dh-plan-faqs {
    margin: 32px 0 0 0;
    padding: 0;
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

  .dh-plan-pricing {
    margin-left: 0;
  }
  }

  /* Mobile Styles */
  @media (max-width: 650px) {

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
  }

  .dh-plan-description {
    font-size: 18px;
  
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
  
  .dh-plan-content {
    margin: 24px 0;
  }

  .dh-reviews-container {
    margin: 0;
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

  /* New Feedback Options Styles */
  .dh-feedback-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 30px 0;
  width: 100%;
  max-width: 400px;
  }

  .dh-feedback-option {
  position: relative;
  cursor: pointer;
  }

  .dh-feedback-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  }

  .dh-feedback-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  }

  .dh-feedback-button:hover {
  border-color: #ccc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .dh-feedback-radio:checked + .dh-feedback-button {
  border-color: var(--primary-color, #27ae60);
  background: rgba(39, 174, 96, 0.05);
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.15);
  }

  .dh-feedback-emoji {
  font-size: 24px;
  line-height: 1;
  }

  .dh-feedback-text {
  flex: 1;
  text-align: left;
  }

  /* Textarea Styles */
  .dh-textarea-container {
  width: 100%;
  }

  .dh-form-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  }

  .dh-form-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #27ae60);
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
  }

  .dh-form-textarea::placeholder {
  color: #999;
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

  #dh-step-decline-complete .dh-form-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  }

  /* Plan content grid layout */
  .dh-plan-content-grid {
  display: grid;
  grid-template-columns: 1fr 247px;
  gap: 20px 30px;
  align-items: start;
  }

  .dh-recommendation-text {
  color: ${primaryColor};
  font-size: 10px;
  line-height: 10px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 1.9px;
  margin-bottom: 7px;
  text-transform: uppercase;
  }


  .dh-plan-info {
  /* Content takes up remaining space */
  }

  .dh-plan-visual {
  height: 100%;
  /* Image on the right side */
  }

  .dh-plan-visual .dh-plan-image-actual img {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
  object-fit: cover;
  border-radius: 12px;
  }

  /* New pricing layout styling */
  .dh-plan-price-container {
  display: flex;
  margin: 10px 0 20px 10px;
  align-items: center;
  gap: 40px;
  }

  .dh-plan-price-left {
  display: flex;
  flex-direction: column;
  position: relative
  }

  .dh-plan-price-left::after {
    content: '';
    position: absolute;
    right: -22px;
    top: 10px;
    width: 1px;
    height: 50px;
    background: #BFBFBF; 
  }

  .dh-plan-price-starting {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 5px;
  margin-left: 30px;
  }

  .dh-plan-price-recurring {
  color: ${primaryColor};
  font-family: "${fontName}", sans-serif;
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  position: relative;
  }

  .dh-plan-price-right {
  display: flex;
  flex-direction: column;
  }

  .dh-plan-price-initial {
  color: ${primaryColor};
  font-family: "${fontName}", sans-serif;
  font-size: 24px;
  font-weight: 400;
  }

  .dh-plan-price-initial .dh-price-number {
  font-weight: 700;
  }

  .dh-plan-price-initial span.dh-price-dollar {
  font-size: 17px;
  position: relative;
  top: -7px;
  font-weight: 700;
  }

  .dh-plan-price-normally {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 19px;
  font-weight: 400;
  }

  .dh-plan-price-normally span.dh-price-dollar {
  font-size: 14px;
  position: relative;
  top: -5px;
  }

  .dh-plan-price-crossed {
  text-decoration: line-through;
  font-weight: 700;
  }

  /* Dollar sign styling */
  .dh-plan-price-recurring .dh-price-dollar {
  align-self: flex-start;
  font-size: 37px;
  }

  /* Asterisk and frequency styling - stacked vertically and smaller */
  .dh-price-asterisk {
  font-size: 32px;
  position: relative;
  top: 5px;
  color: #515151;
  font-weight: 400;
  margin-left: 2px;
  align-self: flex-start;
  }

  /* Exit Survey Centered Layout */
  .dh-exit-survey-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  }

  .dh-exit-survey-centered .dh-step-heading {
  font-size: 48px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  margin-bottom: 16px !important;
  color: #333 !important;
  }

  .dh-exit-survey-centered .dh-step-instruction {
  font-size: 20px !important;
  line-height: 1.5 !important;
  margin-bottom: 40px !important;
  color: #666 !important;
  max-width: 500px;
  }

  .dh-exit-survey-centered .dh-form-group {
  width: 100%;
  max-width: 400px;
  margin-bottom: 24px;
  }

  /* Custom checkbox styling for exit survey */
  .dh-checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  margin-bottom: 40px;
  cursor: pointer;
  }

  .dh-checkbox-input {
  position: absolute !important;
  opacity: 0 !important;
  cursor: pointer !important;
  }

  .dh-checkbox-checkmark {
  position: relative;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background-color: white;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
  }

  .dh-checkbox-checkmark:after {
  content: '';
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid ${primaryColor};
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  }

  .dh-checkbox-input:checked ~ .dh-checkbox-checkmark {
  background-color: ${primaryColor};
  border-color: ${primaryColor};
  }

  .dh-checkbox-input:checked ~ .dh-checkbox-checkmark:after {
  display: block;
  border-color: white;
  }

  .dh-checkbox-text {
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
  }

  .dh-link {
  color: ${primaryColor};
  text-decoration: underline;
  cursor: pointer;
  }

  .dh-link:hover {
  color: ${primaryDark};
  }

  .dh-read-more-link {
  color: ${secondaryColor};
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  }

  .dh-read-more-link:hover {
  color: ${secondaryDark};
  }

  .dh-exit-survey-buttons {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  }

  .dh-exit-survey-buttons .dh-form-btn {
  min-width: 200px;
  }

  /* Error states for exit survey */
  .dh-exit-survey-centered .dh-form-input.error {
  border-color: #ef4444 !important;
  }

  .dh-exit-survey-centered .dh-checkbox-container.error .dh-checkbox-checkmark {
  border-color: #ef4444 !important;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
  .dh-exit-survey-centered {
    padding: 20px 16px;
  }
  
  .dh-exit-survey-centered .dh-step-heading {
    font-size: 32px !important;
  }
  
  .dh-exit-survey-centered .dh-step-instruction {
    font-size: 18px !important;
  }
  
  .dh-exit-survey-buttons .dh-form-btn {
    min-width: 160px;
  }
  
  .dh-feedback-options {
    max-width: 100%;
    margin: 20px 0;
  }
  
  .dh-feedback-button {
    padding: 14px 16px;
    font-size: 15px;
  }
  
  .dh-feedback-emoji {
    font-size: 20px;
  }
  
  .dh-form-textarea {
    padding: 14px;
    font-size: 15px;
  }
  }

  /* Contact Step Information Display Sections */
  .dh-info-section {
  margin: 24px 0;
  text-align: center;
  }

  .dh-info-section-header {
  font-size: 12px !important;
  font-style: normal !important;
  font-weight: 600 !important;
  line-height: 28px !important;
  color: ${primaryColor} !important;
  margin: 0 0 8px 0 !important;
  }

  .dh-info-section-content {
  font-size: 18px !important;
  font-style: normal !important;
  font-weight: 600 !important;
  line-height: 28px !important;
  color: #4E4E4E !important;
  }

  .dh-info-section-content div {
  margin-bottom: 4px;
  }

  .dh-info-section-content div:last-child {
  margin-bottom: 0;
  }

  /* Contact step specific adjustments */
  #dh-step-contact .dh-form-content-area {
  margin: 0 auto;
  text-align: center;
  }

  #dh-step-contact .dh-form-row {
  display: flex;
  gap: 16px;
  }

  #dh-step-contact .dh-form-row .dh-form-group {
  flex: 1;
  }

  /* Ensure proper spacing for contact step */
  #dh-step-contact .dh-step-heading {
  text-align: center;
  margin-bottom: 12px;
  }

  #dh-step-contact .dh-step-instruction {
  text-align: center;
  margin-bottom: 32px;
  }

  /* Complete Step Styles */
  .dh-complete-section {
  margin: 32px 0;
  width: 100%;
  }

  #dh-step-complete .dh-complete-section-title,  #dh-step-complete .dh-complete-service-date,  #dh-step-complete .dh-complete-section-content   {
  font-size: 16px;
  font-weight: 700;
  color: #4E4E4E;
  margin: 0 0 8px 0;
  text-align: center;
  line-height: 20px;
  }

  #dh-step-complete .requested-date-time {
  font-size: 13px;
  }

  .dh-complete-section-content {
  font-size: 16px;
  color: #666;
  text-align: center;
  line-height: 1.4;
  }

  .dh-complete-service-date {
  background: #f5f5f5;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin-top: 8px;
  }

  /* Mobile responsive for contact step */
  @media (max-width: 768px) {
  #dh-step-contact .dh-form-row {
    flex-direction: column;
    width: 253px;
    gap: 0;
    margin-bottom: 0;
  }
  
  .dh-info-section {
    margin: 16px 0;
  }
  
  .dh-info-section-content {
    font-size: 16px !important;
  }
  
  /* Mobile responsive for complete step */
  .dh-complete-section {
    margin: 24px 0;
  }
  
  .dh-complete-section-title {
    font-size: 15px;
  }
  
  .dh-complete-section-content {
    font-size: 15px;
  }
  
  .dh-complete-service-date {
    font-size: 15px;
    padding: 14px 20px;
  }
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

  // Update widget fonts after config is loaded
  const updateWidgetFonts = () => {
  const fontName = widgetState.widgetConfig?.fonts?.primary?.name || 'Outfit';
  const fontUrl =
    widgetState.widgetConfig?.fonts?.primary?.url ||
    'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap';

  console.log('DEBUG updateWidgetFonts: fontName =', fontName);
  console.log('DEBUG updateWidgetFonts: fontUrl =', fontUrl);

  const existingStyles = document.getElementById('dh-widget-styles');
  if (existingStyles) {
    console.log('DEBUG updateWidgetFonts: Found existing styles, updating...');
    let cssText = existingStyles.textContent;

    // Update font import URL
    cssText = cssText.replace(
      /@import url\([^)]+\);/,
      `@import url('${fontUrl}');`
    );

    // Update all font-family declarations
    cssText = cssText.replace(/font-family:\s*[^;]+;/g, match => {
      if (match.includes('sans-serif')) {
        return `font-family: '${fontName}', sans-serif;`;
      } else if (match.includes('"')) {
        return `font-family: "${fontName}", sans-serif;`;
      } else {
        return `font-family: "${fontName}", sans-serif;`;
      }
    });

    existingStyles.textContent = cssText;
  }
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

      // Check for recovery data and show continue prompt if available
      if (typeof widgetState !== 'undefined' && widgetState.recoveryData && 
          typeof window.progressiveFormManager !== 'undefined' && 
          window.progressiveFormManager.shouldPromptToContinue(widgetState.recoveryData)) {
        
        // Check if this is cross-device recovery (auto-restore without prompt)
        if (widgetState.recoveryData.source === 'cross-device') {
          // Wait for modal DOM to be fully ready with polling
          const waitForModalReady = () => {
            // Check if all required elements exist
            const requiredElements = [
              '.dh-form-content',
              '.dh-form-step',
              '#dh-step-' + widgetState.recoveryData.currentStep
            ];
            
            const allElementsReady = requiredElements.every(selector => {
              return document.querySelector(selector) !== null;
            });
            
            if (allElementsReady) {
              if (typeof window.restoreProgress === 'function') {
                window.restoreProgress(widgetState.recoveryData);
              }
            } else {
              setTimeout(waitForModalReady, 100);
            }
          };
          
          setTimeout(waitForModalReady, 200);
        } else {
          // Show continue prompt for normal recovery (localStorage/server)
          setTimeout(() => {
            if (window.progressiveFormManager && typeof window.progressiveFormManager.showContinuePrompt === 'function') {
              window.progressiveFormManager.showContinuePrompt(widgetState.recoveryData);
            }
          }, 300); // Slight delay to let modal finish opening
        }
      } else {
        // Initialize first step after a brief delay if no recovery data
        setTimeout(() => {
          if (window.progressiveFormManager) {
            window.progressiveFormManager.startAutoSave();
          }
          showStep('pest-issue');
          setupStepValidation('pest-issue');
        }, 100);
      }
    } else {
      // For subsequent modal opens, check if we should show continue prompt
      if (typeof widgetState !== 'undefined' && widgetState.recoveryData && 
          typeof window.progressiveFormManager !== 'undefined' && 
          window.progressiveFormManager.shouldPromptToContinue(widgetState.recoveryData)) {
        
        setTimeout(() => {
          if (window.progressiveFormManager && typeof window.progressiveFormManager.showContinuePrompt === 'function') {
            window.progressiveFormManager.showContinuePrompt(widgetState.recoveryData);
          }
        }, 300);
      } else {
        // Show current step or default to first step
        if (typeof widgetState !== 'undefined' && widgetState.currentStep) {
          showStep(widgetState.currentStep);
        } else {
          showStep('pest-issue');
        }
      }
    }

    // Show modal with smooth animation
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scroll

    // Force reflow to ensure display is set before animation
    void modal.offsetHeight;

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

  // Progress bar functionality removed - no longer needed

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

  // Create close icon for all steps
  const closeIcon = document.createElement('div');
  closeIcon.className = 'dh-widget-close-icon';
  closeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="29" height="29" viewBox="0 0 29 29" fill="none">
    <path d="M14.5 28C21.9558 28 28 21.9558 28 14.5C28 7.04416 21.9558 1 14.5 1C7.04416 1 1 7.04416 1 14.5C1 21.9558 7.04416 28 14.5 28Z" fill="white" stroke="#515151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18.5492 10.45L10.4492 18.55L18.5492 10.45Z" fill="white"/>
    <path d="M18.5492 10.45L10.4492 18.55" stroke="#515151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.4492 10.45L18.5492 18.55L10.4492 10.45Z" fill="white"/>
    <path d="M10.4492 10.45L18.5492 18.55" stroke="#515151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  // Add click handler for close functionality
  closeIcon.addEventListener('click', () => {
    if (config.displayMode === 'button') {
      // For button mode, close the modal
      closeModal();
    } else {
      // For inline mode, reset to first step or hide widget
      showStep('pest-issue');
      if (typeof resetWidgetState === 'function') {
        resetWidgetState();
      }
    }
  });

  // Create global back button
  const globalBackButton = document.createElement('button');
  globalBackButton.className = 'dh-global-back-button';
  globalBackButton.id = 'dh-global-back-button';
  globalBackButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 20 16" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M19.0006 7.99993C19.0006 8.41414 18.6648 8.74993 18.2506 8.74993H3.5609L9.03122 14.2193C9.32427 14.5124 9.32427 14.9875 9.03122 15.2806C8.73816 15.5736 8.26302 15.5736 7.96996 15.2806L1.21996 8.53055C1.07913 8.38988 1 8.19899 1 7.99993C1 7.80087 1.07913 7.60998 1.21996 7.4693L7.96996 0.719304C8.26302 0.426248 8.73816 0.426248 9.03122 0.719304C9.32427 1.01236 9.32427 1.4875 9.03122 1.78055L3.5609 7.24993H18.2506C18.6648 7.24993 19.0006 7.58571 19.0006 7.99993Z" fill="#515151" stroke="#515151"/>
  </svg> BACK`;

  // Add click handler for global back button
  globalBackButton.addEventListener('click', () => {
    if (typeof previousStep === 'function') {
      previousStep();
    }
  });

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

  // Create form steps
  const steps = createFormSteps();
  steps.forEach(step => content.appendChild(step));

  // Assemble form elements into container
  formContainer.appendChild(content);
  formWidget.appendChild(closeIcon);
  formWidget.appendChild(globalBackButton);
  formWidget.appendChild(formContainer);

  return {
    formWidget: formWidget,
    formContainer: formContainer,
    content: content,
  };
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
      formWidget.style.overflow = 'visible';
    }
  }
  };

  // Welcome screen function removed - widget now starts directly with pest issue selection

  // === WIDGET LOGIC ===
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
      const widgetContainer = document.getElementById('dh-widget-container') || 
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
  const stepOrder = ['pest-issue', 'address', 'confirm-address', 'how-we-do-it', 'offer', 'quote-contact', 'plan-comparison', 'contact', 'complete'];
  const confirmAddressIndex = stepOrder.indexOf('confirm-address');
  const currentStepIndex = stepOrder.indexOf(stepName);
  
  // If current step is after confirm-address and consent was already confirmed, maintain it
  if (currentStepIndex > confirmAddressIndex && widgetState.attributionData?.consent_status === 'confirmed') {
    // Consent status is already confirmed, no action needed - it will be preserved in partial saves
  }

  // Setup step-specific validation and event handlers
  setupStepValidation(stepName);

  // Note: Partial leads are now saved immediately when users interact with forms
  // (pest selection, address validation, contact info entry, plan selection)
  // rather than on step navigation to capture data in real-time

  // Save form progress to local storage
  if (typeof window.progressiveFormManager !== 'undefined' && window.progressiveFormManager.saveFormStateToLocalStorage) {
    try {
      window.progressiveFormManager.saveFormStateToLocalStorage();
    } catch (error) {
      console.warn('Failed to save form state to localStorage:', error);
    }
  }

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

    console.log(
      'Geocoding successful for:',
      formattedAddress,
      'Result:',
      result.formatted_address
    );

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
    'plans',
    'contact',
    'quote-contact',
    'plan-comparison',
    'out-of-service',
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
      const consentCheckbox = document.getElementById('confirm-address-consent-checkbox');
      const consentStatus = consentCheckbox && consentCheckbox.checked ? 'confirmed' : 'not_provided';
      
      // Store consent in attribution data
      widgetState.attributionData.consent_status = consentStatus;

      // Save partial lead with consent status and final address confirmation
      try {
        const partialSaveResult = await savePartialLead(
          validationResult,
          'how-we-do-it' // Next step user will go to
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
        // User is still in service area, fetch recommended plan and proceed to how-we-do-it step
        if (typeof getCheapestFullCoveragePlan === 'function') {
          try {
            await getCheapestFullCoveragePlan();
          } catch (error) {
            console.warn('Could not fetch recommended plan:', error);
          }
        }
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
    console.log('Already at first step, cannot go back further');
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
        'confirm-address' // Next step user will go to
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
    const isDateContainer = floatingInput && floatingInput.querySelector('input[type="date"]');
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
  if (recurringPriceEl && selectedPlan.recurring_price && selectedPlan.billing_frequency) {
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
    const normalPrice = (selectedPlan.initial_price + (selectedPlan.initial_discount || 0)).toFixed(0);
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
  const recommendationBadge = document.getElementById('plan-recommendation-badge');
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
    disclaimerEl.innerHTML = selectedPlan.plan_disclaimer || '*Pricing may vary based on initial inspection findings and other factors.';
  }
  };

  // Toggle description read more/less functionality
  window.toggleDescription = function(element) {
  const container = element.parentElement;
  const descriptionText = container.querySelector('.dh-description-text');
  const fullDescription = container.querySelector('.dh-description-full');
  
  if (element.textContent === 'Read More') {
    // Show full description and hide the Read More link
    descriptionText.style.display = 'none';
    fullDescription.style.display = 'inline';
    element.style.display = 'none';
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
    if (stepName === 'pest-issue') {
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

            // Save progress immediately
            try {
              const partialSaveResult = await savePartialLead(
                { served: false, status: 'unknown' }, // Service area unknown until address validated
                'address' // Next step user will go to
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

        // If address already exists (user returning to step), enable the button
        if (widgetState.formData.address) {
          checkServiceAreaBtn.disabled = false;
          checkServiceAreaBtn.classList.remove('disabled');
          checkServiceAreaBtn.innerHTML =
            'Check Service Area <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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

      // Populate address fields with stored data
      setTimeout(() => {
        const streetInput = document.getElementById('confirm-street-input');
        const cityInput = document.getElementById('confirm-city-input');
        const stateInput = document.getElementById('confirm-state-input');
        const zipInput = document.getElementById('confirm-zip-input');

        if (streetInput)
          streetInput.value = widgetState.formData.addressStreet || '';
        if (cityInput) cityInput.value = widgetState.formData.addressCity || '';
        if (stateInput)
          stateInput.value = widgetState.formData.addressState || '';
        if (zipInput) zipInput.value = widgetState.formData.addressZip || '';

        // Load address background imagery if available
        if (
          widgetState.formData.address &&
          widgetState.formData.latitude &&
          widgetState.formData.longitude
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
          if (typeof loadAddressBackgroundImagery === 'function') {
            loadAddressBackgroundImagery(
              addressData,
              'confirm-address-bg-image'
            );
          }
        }

        // Update floating labels
        if (typeof window.updateAllFloatingLabels === 'function') {
          window.updateAllFloatingLabels();
        }

        // Populate company name in consent checkbox
        const companyName =
          widgetState.widgetConfig?.branding?.companyName || 'Company Name';
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
        const consentCheckbox = document.getElementById(
          'confirm-address-consent-checkbox'
        );
        const continueButton = document.getElementById('confirm-address-next');

        if (consentCheckbox && continueButton) {
          // Disable button initially
          continueButton.disabled = true;
          continueButton.style.opacity = '0.5';
          continueButton.style.cursor = 'not-allowed';

          // Add event listener for checkbox changes
          const updateButtonState = () => {
            if (consentCheckbox.checked) {
              continueButton.disabled = false;
              continueButton.style.opacity = '1';
              continueButton.style.cursor = 'pointer';
            } else {
              continueButton.disabled = true;
              continueButton.style.opacity = '0.5';
              continueButton.style.cursor = 'not-allowed';
            }
          };

          consentCheckbox.addEventListener('change', updateButtonState);

          // Set initial state
          updateButtonState();
        }
      }, 100);

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
          safetyTextEl.innerHTML = `Oh, and don&apos;t worry. Our ${pestConfig.label.toLowerCase()} treatments are safe for people and pets for your property!`;
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
      const contactInputs = [
        'start-date-input',
        'arrival-time-input',
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

      // Populate contact details and service address information
      populateContactDetailsDisplay();

      // Copy the existing address background image from confirm-address step
      setTimeout(() => {
        // Try to find the existing background image from confirm-address step
        const existingAddressBg = document.getElementById('confirm-address-bg-image');
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
              document.querySelector('#dh-step-confirm-address #confirm-address-bg-image'),
              document.querySelector('#dh-step-address #address-bg-image'),
              document.querySelector('[id*="confirm-address-bg-image"]'),
              document.querySelector('[id*="address-bg-image"]')
            ];
            
            for (const element of addressElements) {
              if (element && element.style.backgroundImage && element.style.backgroundImage !== 'none') {
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
              loadAddressBackgroundImagery(
                addressData,
                'contact-bg-image'
              );
            }
          }
        }
      }, 200);

      // Pre-populate form fields with any available contact information
      setTimeout(() => {
        populateContactFields();
      }, 50);
      break;

    case 'quote-contact':
      // Populate logo and hero section
      populateAllLogos();
      populateStepHero('quote-bg-image', 'quote-hero-image');

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
        const reviewsContainer = document.getElementById('comparison-reviews-container');
        const reviewsLoading = document.getElementById('comparison-reviews-loading');
        const reviewsDisplay = document.getElementById('comparison-reviews-display');
        const reviewsCount = document.getElementById('comparison-reviews-count');
        const starElements = document.querySelectorAll('#comparison-reviews-display .dh-star');
        
        if (!reviewsContainer) {
          return;
        }

        try {
          // Start with loading state visible, content hidden
          if (reviewsLoading) reviewsLoading.style.display = 'flex';
          if (reviewsDisplay) reviewsDisplay.style.display = 'none';

          // Fetch reviews data from API
          const response = await fetch(`${config.baseUrl}/api/google-places/reviews/${config.companyId}`);
          
          if (!response.ok) {
            console.warn('Failed to fetch reviews data, hiding reviews section');
            // Hide entire container on failure
            reviewsContainer.style.display = 'none';
            return;
          }

          const data = await response.json();
          
          // Validate response data - hide if no reviews or no listings configured
          if (!data.rating || !data.reviewCount || data.reviewCount === 0 || data.source === 'no_listings') {
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
              const recommendationBadge = document.getElementById('plan-recommendation-badge');
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
        const truncatedDescription = shouldTruncate ? fullDescription.substring(0, maxLength) : fullDescription;
        
        const descriptionHtml = shouldTruncate 
          ? `<span class="dh-description-text">${truncatedDescription}...</span> <span class="dh-read-more-link" onclick="toggleDescription(this)">Read More</span><span class="dh-description-full" style="display: none;">${fullDescription}</span>`
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
              Let&apos;s Schedule! <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
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
        const truncatedDescription = shouldTruncate ? fullDescription.substring(0, maxLength) : fullDescription;
        
        const descriptionHtml = shouldTruncate 
          ? `<span class="dh-description-text">${truncatedDescription}...</span> <span class="dh-read-more-link" onclick="toggleDescription(this)">Read More</span><span class="dh-description-full" style="display: none;">${fullDescription}</span>`
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
              Let&apos;s Schedule! <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
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
        // Store selected plan
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
      const feedbackRadios = document.querySelectorAll('input[name="exit-feedback"]');
      const feedbackTextarea = document.getElementById('exit-feedback-text');
      const surveySubmitBtn = document.getElementById('survey-submit');

      if (surveySubmitBtn) {
        surveySubmitBtn.addEventListener('click', async () => {
          // Get selected feedback option
          const selectedFeedback = document.querySelector('input[name="exit-feedback"]:checked');
          const additionalFeedback = feedbackTextarea?.value || '';

          // Store exit survey data
          widgetState.formData.exitFeedbackReason = selectedFeedback?.value || 'none';
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
                phone: widgetState.formData.phone || ''
              },
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

    case 'complete':
      // Populate logo
      populateAllLogos();
      
      // Populate logo, background image, and hero image
      populateStepHero(
        'complete-bg-image',
        'complete-hero-image'
      );
      
      // Populate customer name
      const customerNameEl = document.getElementById('complete-customer-name');
      if (customerNameEl) {
        const contactInfo = widgetState.formData.contactInfo || widgetState.formData;
        const firstName = contactInfo.firstName || widgetState.formData.firstName || '';
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
        serviceDateEl.textContent = formatServiceDateTime(serviceDate, serviceTime);
      }
      
      // Load address background imagery if available
      if (widgetState.formData.address && 
          widgetState.formData.latitude && 
          widgetState.formData.longitude &&
          typeof loadAddressBackgroundImagery === 'function') {
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
  const formatPhoneNumber = (phone) => {
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
    const contactInfo = widgetState.formData.contactInfo || widgetState.formData;
    
    // Populate contact details
    const contactName = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');
    const contactPhone = document.getElementById('contact-phone');
    const serviceAddress = document.getElementById('service-address');
    
    if (contactName) {
      const firstName = contactInfo.firstName || widgetState.formData.firstName || '';
      const lastName = contactInfo.lastName || widgetState.formData.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || contactInfo.name || 'Not provided';
      contactName.textContent = fullName;
    }
    
    if (contactEmail) {
      const email = contactInfo.email || widgetState.formData.email || 'Not provided';
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
    const contactInfo = widgetState.formData.contactInfo || widgetState.formData;
    const quoteFirstNameInput = document.getElementById('quote-first-name-input');
    const quoteLastNameInput = document.getElementById('quote-last-name-input');
    const quotePhoneInput = document.getElementById('quote-phone-input');
    const quoteEmailInput = document.getElementById('quote-email-input');

    if (contactInfo && quoteFirstNameInput) {
      const firstName = contactInfo.firstName || widgetState.formData.firstName || '';
      if (firstName) {
        quoteFirstNameInput.value = firstName;
        updateFloatingLabel(quoteFirstNameInput);
      }
    }
    if (contactInfo && quoteLastNameInput) {
      const lastName = contactInfo.lastName || widgetState.formData.lastName || '';
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
  const formatBusinessHours = (businessHours) => {
  if (!businessHours || typeof businessHours !== 'object') {
    return 'Monday - Friday 8am - 5:30pm'; // Default fallback
  }

  // Group days with same hours
  const dayGroups = {};
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
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
  const formatTime = (timeString) => {
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
      'morning': '8 AM - 12 PM',
      'afternoon': '12 PM - 5 PM', 
      'evening': '5 PM - 8 PM',
      'anytime': 'Anytime'
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

  // === WIDGET FORMS ===
  // Create form steps
  const createFormSteps = () => {
    const steps = [];

    // Step 1: Pest Issue
    const pestStep = document.createElement('div');
    pestStep.className = 'dh-form-step active';
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
    <div class="dh-pest-step-container">
      <!-- Left Content Area -->
      <div class="dh-pest-content">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <!-- Quick Time Badge -->
        <div class="dh-pest-time-badge">
          <span>Takes only 30 seconds!</span>
        </div>
        
        <!-- Main Heading -->
        <h1 class="dh-pest-heading">Choose the pest that is bugging you.</h1>
        <p class="dh-pest-instruction">What kind of pest issue are you experiencing at your residence?</p>
        
        <!-- Pest Selection Grid -->
        <div class="dh-pest-selection">
          ${pestOptionsHtml}
        </div>
        
        <!-- Loading State -->
        <div class="dh-pest-loading" id="pest-loading" style="display: none;">
          <div class="dh-loading-spinner"></div>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero step1" id="pest-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image step1" id="pest-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="pest-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
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
  `;
    steps.push(planSelectionStep);

    // Step 4: Address
    const addressPestIcon = getPestIcon();
    const addressStep = document.createElement('div');
    addressStep.className = 'dh-form-step';
    addressStep.id = 'dh-step-address';
    addressStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
       
        <h2 class="dh-step-heading" id="address-step-heading">Yuck, <span id="address-pest-type">pests</span>! We hate those. No worries, we got you!</h2>
        <!-- Address Search Mode (Initial State) -->
        <div id="address-search-mode">
          <p class="dh-step-instruction">Dealing with pests is a hassle, but our licensed and trained techs will have you free of <span id="address-pest-type-two">pests</span> in no time!</p>
           <div class="dh-address-pest-icon" id="address-pest-icon">${addressPestIcon}</div>
          <div class="dh-form-group">
            <div class="dh-address-autocomplete">
              <label class="dh-address-form-label" for="address-search-input">Let's make sure you're in our service area.</label>
              <input type="text" class="dh-form-input dh-address-search-field" id="address-search-input" name="address-search-input" placeholder="Start typing your address..." autocomplete="off">
              <div class="dh-address-suggestions" id="address-suggestions"></div>
            </div>
          </div>
          
          <!-- Service Area Check Button -->
          <div class="dh-form-button-group">
            <button class="dh-form-btn dh-form-btn-secondary" onclick="checkServiceAreaButton()" id="check-service-area-btn" disabled>Search Now<svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none">
  <path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg></button>
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
          
          <div class="dh-form-button-group">
            <button class="dh-form-btn dh-form-btn-secondary" onclick="nextStep()" id="address-next">Continue <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
          </div>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="address-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="address-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="address-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
  `;
    steps.push(addressStep);

    // Step 4: Confirm Address
    const confirmAddressStep = document.createElement('div');
    confirmAddressStep.className = 'dh-form-step';
    confirmAddressStep.id = 'dh-step-confirm-address';
    confirmAddressStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Good news! We service your neighborhood.</h2>
        <p class="dh-step-instruction">Double check the address information below and hit continue to proceed.</p>
        
        <!-- Mobile background image (shown only on mobile) -->
        <img class="dh-mobile-bg-image" id="confirm-address-mobile-bg-image" src="" alt="Background Image" />
        
        <!-- Editable address form fields -->
        <div class="dh-form-group">
          <div class="dh-floating-input">
            <input type="text" class="dh-form-input" id="confirm-street-input" placeholder=" ">
            <label class="dh-floating-label" for="confirm-street-input">Street Address</label>
          </div>
        </div>
        <div class="dh-form-group">
          <div class="dh-floating-input">
            <input type="text" class="dh-form-input" id="confirm-city-input" placeholder=" ">
            <label class="dh-floating-label" for="confirm-city-input">City</label>
          </div>
        </div>
        <div class="dh-form-row">
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="confirm-state-input" placeholder=" ">
              <label class="dh-floating-label" for="confirm-state-input">State</label>
            </div>
          </div>
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="confirm-zip-input" placeholder=" ">
              <label class="dh-floating-label" for="confirm-zip-input">ZIP Code</label>
            </div>
          </div>
        </div>
        <div class="dh-form-group">
          <label class="dh-form-checkbox-label">
            <input type="checkbox" class="dh-form-checkbox" id="confirm-address-consent-checkbox">
            <span class="dh-form-checkbox-text">Yes, <span id="confirm-address-company-name">Company Name</span> may contact me. By submitting this request, I validate that I am 18 years of age or older. Additionally, I give <span id="confirm-address-company-name-2">Company Name</span> permission to direct mail me, email me, or to call or text me at the number provided regarding services from <span id="confirm-address-company-name-3">Company Name</span> using automated technology. I understand my consent is not a condition of purchase.</span>
          </label>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" onclick="nextStep()" id="confirm-address-next">Continue <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="confirm-address-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="confirm-address-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="confirm-address-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
  `;
    steps.push(confirmAddressStep);

    // Step 5: Initial Offer
    const initialOfferStep = document.createElement('div');
    initialOfferStep.className = 'dh-form-step';
    initialOfferStep.id = 'dh-step-how-we-do-it';
    initialOfferStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading" id="how-we-do-it-heading">How We Do It</h2>
        
        <div class="dh-how-we-do-it-main">
          <div class="dh-how-we-do-it-content">
            <div class="dh-how-we-do-it-text">
              <h3 class="dh-how-we-do-it-title">How We Do It</h3>
              <p id="how-we-do-it-description">Loading your personalized treatment plan...</p>
              
              <div class="dh-subspecies-section" id="subspecies-section" style="display: none;">
                <h4 id="subspecies-heading">Some common pests include:</h4>
                <div class="dh-subspecies-grid" id="subspecies-list">
                  <!-- Subspecies populated dynamically -->
                </div>
              </div>
            </div>
            <img id="how-we-do-it-interior-image" class="dh-interior-image" src="" alt="Treatment Process" style="display: none;" />
          </div>
          
          <div class="dh-safety-message" id="safety-message">
            <img class="dh-pet-safety-image" src="" alt="Pet Safety" id="pet-safety-image" />
            <div class="dh-safety-text">
              <p id="safety-message-text">Oh, and don&apos;t worry. Our treatments are safe for people and pets for your property!</p>
            </div>
          </div>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" id="view-detailed-quote" onclick="showStep('quote-contact'); setupStepValidation('quote-contact');">View Detailed Quote <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="offer-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="offer-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="offer-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
  `;
    steps.push(initialOfferStep);

    // Step 6: Contact Info (Schedule Service Form)
    const contactStep = document.createElement('div');
    contactStep.className = 'dh-form-step';
    contactStep.id = 'dh-step-contact';
    contactStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Great! When do you want us to get started?</h2>
        <p class="dh-step-instruction">Complete the following information to secure your spot today!</p>
        
        <!-- Scheduling Fields -->
        <div class="dh-form-row">
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
              <input type="date" class="dh-form-input" id="start-date-input" placeholder="Your Start Date">
              <label class="dh-floating-label" for="start-date-input">Your Start Date</label>
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
              <label class="dh-floating-label" for="arrival-time-input">Preferred Time</label>
            </div>
          </div>
        </div>
        
        <!-- Contact Details Section -->
        <div class="dh-info-section">
          <h3 class="dh-info-section-header">Contact Details</h3>
          <div class="dh-info-section-content" id="contact-details-content">
            <div id="contact-name">Loading...</div>
            <div id="contact-email">Loading...</div>
            <div id="contact-phone">Loading...</div>
          </div>
        </div>
        
        <!-- Service Address Section -->
        <div class="dh-info-section">
          <h3 class="dh-info-section-header">Service Address</h3>
          <div class="dh-info-section-content" id="service-address-content">
            <div id="service-address">Loading...</div>
          </div>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-primary" onclick="submitFormWithValidation()" id="submit-btn">Schedule It <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section with Location Background -->
      <div class="dh-pest-hero" id="contact-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="contact-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="contact-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
  `;
    steps.push(contactStep);

    // Step 7: Quote Contact (Simple form for quote path)
    const quoteContactStep = document.createElement('div');
    quoteContactStep.className = 'dh-form-step';
    quoteContactStep.id = 'dh-step-quote-contact';
    quoteContactStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Sure thing. Almost done, we just need a little more info from you.</h2>
        <p class="dh-step-instruction">Complete the following information for your detailed quote.</p>
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
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" onclick="proceedToQuoteWithValidation()" id="quote-contact-submit">See My Quote <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="quote-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="quote-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="quote-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
    `;
    steps.push(quoteContactStep);

    // Step 8: Plan Comparison (for detailed quote path)
    const planComparisonStep = document.createElement('div');
    planComparisonStep.className = 'dh-form-step';
    planComparisonStep.id = 'dh-step-plan-comparison';
    planComparisonStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Here&apos;s what we recommend for your home to get rid of those pesky <span id="comparison-pest-type">pests</span> - and keep them out!</h2>
        
        <!-- Google Reviews Display -->
        <div class="dh-reviews-container" id="comparison-reviews-container">
          <!-- Loading State -->
          <div class="dh-reviews-loading" id="comparison-reviews-loading">
            <div class="dh-reviews-skeleton">
              <div class="dh-skeleton-stars"></div>
              <div class="dh-skeleton-text"></div>
            </div>
          </div>
          
          <!-- Loaded Content -->
          <div class="dh-reviews-display" id="comparison-reviews-display" style="display: none;">
            <div class="dh-star-rating">
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
            </div>
            <span class="dh-reviews-count" id="comparison-reviews-count"></span>
          </div>
        </div>
        
        <!-- Loading State -->
        <div class="dh-plan-loading" id="comparison-plan-loading">
          <div class="dh-loading-spinner"></div>
          <p>Loading your personalized recommendations...</p>
        </div>
        
        <!-- Plan Content -->
        <div class="dh-plan-content" id="comparison-plan-content">
          <!-- Active plan content will be dynamically loaded -->
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="plan-comparison-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="plan-comparison-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="plan-comparison-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>

      <!-- Full Width FAQ Section -->
      <div class="dh-plan-faqs-container" id="comparison-plan-faqs">
        <!-- FAQs will be dynamically loaded here -->
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
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Dang. It doesn&apos;t look like we service your neighborhood.</h2>
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" onclick="returnToHomepage()">Return to Homepage <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="out-of-service-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="out-of-service-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="out-of-service-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
  `;
    steps.push(outOfServiceStep);

    // Step: Exit Survey
    const exitSurveyStep = document.createElement('div');
    exitSurveyStep.className = 'dh-form-step';
    exitSurveyStep.id = 'dh-step-exit-survey';
    exitSurveyStep.innerHTML = `
        <div class="dh-form-step-content dh-exit-survey-centered">
          <!-- Company Logo -->
          <div class="dh-pest-logo" id="pest-logo">
            <!-- Logo will be populated from widget config -->
          </div>
          
          <h2 class="dh-step-heading">Dang. Was it something we said?</h2>
          <p class="dh-step-instruction">Mind letting us know?</p>
          
          <div class="dh-feedback-options">
            <label class="dh-feedback-option">
              <input type="radio" name="exit-feedback" value="not-ready" class="dh-feedback-radio">
              <div class="dh-feedback-button">
                <span class="dh-feedback-emoji">😊</span>
                <span class="dh-feedback-text">Not ready</span>
              </div>
            </label>
            
            <label class="dh-feedback-option">
              <input type="radio" name="exit-feedback" value="just-checking" class="dh-feedback-radio">
              <div class="dh-feedback-button">
                <span class="dh-feedback-emoji">😬</span>
                <span class="dh-feedback-text">Just checking around</span>
              </div>
            </label>
            
            <label class="dh-feedback-option">
              <input type="radio" name="exit-feedback" value="out-of-budget" class="dh-feedback-radio">
              <div class="dh-feedback-button">
                <span class="dh-feedback-emoji">🤑</span>
                <span class="dh-feedback-text">Out of my budget</span>
              </div>
            </label>
          </div>

          <div class="dh-form-group">
            <div class="dh-textarea-container">
              <textarea class="dh-form-textarea" id="exit-feedback-text" placeholder="Any other feedback?" rows="4"></textarea>
            </div>
          </div>

          <div class="dh-form-button-group dh-exit-survey-buttons">
            <button class="dh-form-btn dh-form-btn-primary" id="survey-submit">Submit <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
          </div>
        </div>
    `;
    steps.push(exitSurveyStep);

    // Step 10: Complete (Thank You)
    const completeStep = document.createElement('div');
    completeStep.className = 'dh-form-step';
    completeStep.id = 'dh-step-complete';
    completeStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Thank you <span id="complete-customer-name">Wesley</span>, here is what you can expect next.</h2>
        
        <p class="dh-step-instruction">You should receive a confirmation email shortly. One of our representatives will contact you to confirm your appointment and answer any of your questions during normal business hours.</p>
        
        <!-- Office Hours Section -->
        <div class="dh-complete-section">
          <h3 class="dh-complete-section-title">Office Hours</h3>
          <div class="dh-complete-section-content" id="office-hours-content">
            <!-- Office hours will be populated from widget config -->
          </div>
        </div>
        
        <!-- Requested Service Date & Time Section -->
        <div class="dh-complete-section">
          <h3 class="dh-complete-section-title requested-date-time">Requested Service Date & Time</h3>
          <div class="dh-complete-service-date" id="service-date-content">
            October 7th, 2025 | 10 am
          </div>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" id="return-homepage-btn">Return to Homepage <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section with Location Background -->
      <div class="dh-pest-hero" id="complete-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="complete-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="complete-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
    `;
    steps.push(completeStep);

    // Step 11: Decline Complete (for exit survey submissions)
    const declineCompleteStep = document.createElement('div');
    declineCompleteStep.className = 'dh-form-step';
    declineCompleteStep.id = 'dh-step-decline-complete';
    declineCompleteStep.innerHTML = `
      <div class="dh-form-success">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
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

    if (!hasErrors) {
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
      savePartialLead(null, 'contact'); // Next step user will go to
    } catch (error) {
      console.error('Error saving plan selection:', error);
    }

    // Navigate directly to contact step for scheduling after brief delay
    setTimeout(() => {
      // Set flow identifier to track that user came from plan comparison
      widgetState.formData.offerChoice = 'schedule-from-comparison';
      showStep('contact');
      setupStepValidation('contact');
    }, 500);
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
          contactInfo:
            stepCompleted === 'contact'
              ? {
                  name: widgetState.formData.contactInfo.name || null,
                  phone: widgetState.formData.contactInfo.phone || null,
                  email: widgetState.formData.contactInfo.email || null,
                  comments:
                    widgetState.formData.contactInfo.comments || null,
                }
              : null,
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

      // Save partial lead immediately with contact information
      try {
        const partialSaveResult = await savePartialLead(
          null, // Service area validation not applicable for contact step
          'contact' // Current step user is on
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

      // Fetch plan comparison data and ensure minimum loading time
      await Promise.all([
        fetchPlanComparisonData(),
        updateDynamicText(),
        createMinimumLoadingTime(1000), // Ensure loading shows for at least 1 second
      ]);

      // Navigate to plan comparison with pre-loaded data
      await showStep('plan-comparison');
      setupStepValidation('plan-comparison');

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

  // Get the cheapest plan with full coverage for the selected pest
  const getCheapestFullCoveragePlan = async () => {
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
          widgetState.formData.offerPrice = cheapestPlan.recurring_price;
          
          return cheapestPlan;
        } else {
          // No full coverage plans, use the best match available
          const bestPlan = data.suggestions[0];
          widgetState.formData.recommendedPlan = bestPlan;
          widgetState.formData.offerPrice = bestPlan.recurring_price;
          return bestPlan;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cheapest full coverage plan:', error);
      widgetState.formData.recommendedPlan = null;
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