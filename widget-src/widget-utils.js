/**
 * DH Widget - Utility Functions
 * Contains helper functions, geocoding, image loading, and various utilities
 */

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