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
      displayMode: scriptTag.getAttribute('data-display-mode') || 'inline',
      buttonText:
        scriptTag.getAttribute('data-button-text') || 'Get Free Quote',
      modalCloseOnBackdrop:
        scriptTag.getAttribute('data-modal-close-on-backdrop') !== 'false',
      // Extract color configuration from data attributes
      colors: {
        primary: scriptTag.getAttribute('data-primary-color') || null,
        secondary: scriptTag.getAttribute('data-secondary-color') || null,
        background: scriptTag.getAttribute('data-background-color') || null,
        text: scriptTag.getAttribute('data-text-color') || null,
      },
      // Extract messaging configuration
      welcomeTitle: scriptTag.getAttribute('data-welcome-title') || null,
      welcomeDescription:
        scriptTag.getAttribute('data-welcome-description') || null,
      welcomeButtonText:
        scriptTag.getAttribute('data-welcome-button-text') || null,
      heroImageUrl: scriptTag.getAttribute('data-hero-image-url') || null,
      submitButtonText:
        scriptTag.getAttribute('data-submit-button-text') || null,
      successMessage: scriptTag.getAttribute('data-success-message') || null,
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
        sessionId: null,
        attributionData: null,
        recoveryData: null,
        formData: {
          pestType: '',
          pestIcon: '',
          urgency: '',
          selectedPlan: '',
          recommendedPlan: '',
          address: '', // Keep as string for backward compatibility
          addressStreet: '',
          addressCity: '',
          addressState: '',
          addressZip: '',
          latitude: '',
          longitude: '',
          homeSize: '',
          urgency: '',
          contactInfo: {
            name: '',
            phone: '',
            email: '',
            comments: '',
          },
        },
        priceEstimate: null,
        // Progressive form state management
        formState: {
          lastSaved: null,
          autoSaveEnabled: true,
          autoSaveInterval: 10000, // 10 seconds
          validationErrors: {},
          fieldCompletionStatus: {},
          stepCompletionPercentage: {},
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

      // Step mapping and progress management
      const stepProgressManager = {
        stepFlow: ['welcome', 'pest-issue', 'address', 'quote', 'complete'],

        stepLabels: {
          welcome: 'Welcome',
          'pest-issue': 'Pest Issue',
          address: 'Address',
          quote: 'Quote',
          complete: 'Complete',
        },

        // Map actual form steps to progress steps
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
          // Return the actual step for welcome, pest-issue, address
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

      // Attribution tracking functions
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

      const extractGclidFromCookies = () => {
        try {
          // Method 1: Google Ads Conversion Cookies (_gac_*)
          const gclid = extractFromGacCookies();
          if (gclid) {
            return gclid;
          }

          // Method 2: Google Analytics Enhanced Ecommerce Cookies
          const gclidFromGa = extractFromGaCookies();
          if (gclidFromGa) {
            return gclidFromGa;
          }

          // Method 3: GTM Conversion Linker Cookies (_gcl_*)
          const gclidFromGcl = extractFromGclCookies();
          if (gclidFromGcl) {
            return gclidFromGcl;
          }

          // Method 4: First-party data layer (if available)
          const gclidFromDataLayer = extractFromDataLayer();
          if (gclidFromDataLayer) {
            return gclidFromDataLayer;
          }

          // Method 5: Cross-domain GCLID from URL fragments or linker params
          const crossDomainGclid = extractCrossDomainGclid();
          if (crossDomainGclid) {
            return crossDomainGclid;
          }
          return null;
        } catch (error) {
          console.warn('Error extracting GCLID from cookies:', error);
          return null;
        }
      };

      // Enhanced GCLID extraction methods
      const extractFromGacCookies = () => {
        try {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name && name.startsWith('_gac_')) {
              // _gac_ cookie format: 1.timestamp.gclid
              const gacParts = value
                ? decodeURIComponent(value).split('.')
                : [];
              if (gacParts.length >= 3) {
                const potentialGclid = gacParts[2];
                // Validate GCLID format (should start with specific prefixes)
                if (isValidGclid(potentialGclid)) {
                  return potentialGclid;
                }
              }
            }
          }
        } catch (error) {
          console.warn('Error extracting from GAC cookies:', error);
        }
        return null;
      };

      const extractFromGaCookies = () => {
        try {
          // Check for Google Analytics 4 cookies
          const ga4Cookie = getCookieValue('_ga_' + getGA4MeasurementId());
          if (ga4Cookie) {
            // GA4 cookie format may contain GCLID data
            const ga4Parts = ga4Cookie.split('.');
            if (ga4Parts.length >= 6) {
              // Look for GCLID in GA4 parameters
              for (let i = 0; i < ga4Parts.length; i++) {
                if (isValidGclid(ga4Parts[i])) {
                  return ga4Parts[i];
                }
              }
            }
          }

          // Check Universal Analytics cookies for enhanced data
          const gaCookie = getCookieValue('_ga');
          if (gaCookie) {
            // Sometimes GCLID is stored in custom dimensions
            const customDimCookie = getCookieValue('_gid');
            if (customDimCookie) {
              const parts = customDimCookie.split('.');
              for (let part of parts) {
                if (isValidGclid(part)) {
                  return part;
                }
              }
            }
          }
        } catch (error) {
          console.warn('Error extracting from GA cookies:', error);
        }
        return null;
      };

      const extractFromGclCookies = () => {
        try {
          // GTM Conversion Linker creates various _gcl_* cookies
          const gclPatterns = [
            '_gcl_au',
            '_gcl_aw',
            '_gcl_dc',
            '_gcl_gf',
            '_gcl_ha',
          ];

          for (let pattern of gclPatterns) {
            const gclCookie = getCookieValue(pattern);
            if (gclCookie) {
              // Different GCL cookie formats
              const gclParts = gclCookie.split('.');
              for (let part of gclParts) {
                if (isValidGclid(part)) {
                  return part;
                }
              }

              // Some GCL cookies store GCLID in encoded format
              try {
                const decoded = decodeURIComponent(gclCookie);
                const decodedParts = decoded.split(/[.,;]/);
                for (let part of decodedParts) {
                  if (isValidGclid(part)) {
                    return part;
                  }
                }
              } catch (e) {
                // Ignore decode errors
              }
            }
          }
        } catch (error) {
          console.warn('Error extracting from GCL cookies:', error);
        }
        return null;
      };

      const extractFromDataLayer = () => {
        try {
          // Check if Google Tag Manager data layer exists
          if (
            typeof window.dataLayer !== 'undefined' &&
            Array.isArray(window.dataLayer)
          ) {
            for (let i = window.dataLayer.length - 1; i >= 0; i--) {
              const layer = window.dataLayer[i];
              if (layer && typeof layer === 'object') {
                // Check for GCLID in various data layer formats
                if (layer.gclid && isValidGclid(layer.gclid)) {
                  return layer.gclid;
                }
                if (layer.google_gclid && isValidGclid(layer.google_gclid)) {
                  return layer.google_gclid;
                }
                if (layer.event_parameters && layer.event_parameters.gclid) {
                  if (isValidGclid(layer.event_parameters.gclid)) {
                    return layer.event_parameters.gclid;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('Error extracting from data layer:', error);
        }
        return null;
      };

      const isValidGclid = value => {
        if (!value || typeof value !== 'string') return false;

        // GCLID typically starts with specific prefixes and has minimum length
        const gclidPrefixes = ['CjwK', 'Cj0K', 'EAIa', 'EAA', 'CjgK'];
        const minLength = 20; // Minimum GCLID length

        if (value.length < minLength) return false;

        // Check if it starts with known GCLID prefixes
        for (let prefix of gclidPrefixes) {
          if (value.startsWith(prefix)) {
            return true;
          }
        }

        // Additional validation: check if it contains only valid GCLID characters
        const gclidPattern = /^[A-Za-z0-9_-]+$/;
        return gclidPattern.test(value) && value.length >= minLength;
      };

      // Cross-domain GCLID extraction for enhanced attribution tracking
      const extractCrossDomainGclid = () => {
        try {
          const url = new URL(window.location.href);

          // Method 1: Check for Google Ads linker parameter format (_gl)
          const glParam = url.searchParams.get('_gl');
          if (glParam) {
            const gclidFromGl = extractGclidFromGlParam(glParam);
            if (gclidFromGl) {
              return gclidFromGl;
            }
          }

          // Method 2: Check URL fragment for cross-domain data
          const fragment = url.hash;
          if (fragment && fragment.includes('gclid=')) {
            const fragmentParams = new URLSearchParams(
              fragment.replace('#', '')
            );
            const fragmentGclid = fragmentParams.get('gclid');
            if (fragmentGclid && isValidGclid(fragmentGclid)) {
              return fragmentGclid;
            }
          }

          // Method 3: Check for GTM Cross-Domain Linker in URL
          const gtmLinker = url.searchParams.get('_ga');
          if (gtmLinker) {
            const gclidFromGtm = extractGclidFromGtmLinker(gtmLinker);
            if (gclidFromGtm) {
              return gclidFromGtm;
            }
          }

          // Method 4: Check for custom cross-domain attribution parameters
          const customGclid =
            url.searchParams.get('xd_gclid') ||
            url.searchParams.get('cross_gclid');
          if (customGclid && isValidGclid(customGclid)) {
            return customGclid;
          }
        } catch (error) {
          console.warn('Error extracting cross-domain GCLID:', error);
        }
        return null;
      };

      const extractGclidFromGlParam = glParam => {
        try {
          // Google Ads linker parameter format: _gl=1*hash*gclid*timestamp
          const parts = glParam.split('*');
          if (parts.length >= 3) {
            for (let part of parts) {
              if (isValidGclid(part)) {
                return part;
              }
            }
          }

          // Alternative format: base64 encoded data
          try {
            const decoded = atob(glParam);
            const decodedParams = new URLSearchParams(decoded);
            const gclid = decodedParams.get('gclid');
            if (gclid && isValidGclid(gclid)) {
              return gclid;
            }
          } catch (e) {
            // Not base64 encoded, continue
          }
        } catch (error) {
          console.warn('Error extracting GCLID from _gl parameter:', error);
        }
        return null;
      };

      const extractGclidFromGtmLinker = gtmLinker => {
        try {
          // GTM linker format: GA1.2.clientId.timestamp.gclid
          const parts = gtmLinker.split('.');
          if (parts.length >= 5) {
            // GCLID is typically in the last part or second-to-last
            for (let i = parts.length - 1; i >= 0; i--) {
              if (isValidGclid(parts[i])) {
                return parts[i];
              }
            }
          }
        } catch (error) {
          console.warn('Error extracting GCLID from GTM linker:', error);
        }
        return null;
      };

      const getGA4MeasurementId = () => {
        // Try to extract GA4 measurement ID from gtag or common patterns
        try {
          if (typeof gtag !== 'undefined') {
            // If gtag is loaded, might be able to extract measurement ID
            return 'UNKNOWN'; // Placeholder - would need specific implementation
          }

          // Look for GA4 measurement ID in common script patterns
          const scripts = document.getElementsByTagName('script');
          for (let script of scripts) {
            if (
              script.src &&
              script.src.includes('googletagmanager.com/gtag/js')
            ) {
              const match = script.src.match(/id=([^&]+)/);
              if (match && match[1].startsWith('G-')) {
                return match[1].replace('G-', '');
              }
            }
          }
        } catch (error) {
          console.warn('Error getting GA4 measurement ID:', error);
        }
        return null;
      };

      const determineTrafficSource = (referrer, utmSource, gclid) => {
        if (gclid || utmSource === 'google') return 'paid';
        if (!referrer) return 'direct';

        try {
          const referrerDomain = new URL(referrer).hostname.toLowerCase();

          if (
            referrerDomain.includes('google') ||
            referrerDomain.includes('bing') ||
            referrerDomain.includes('yahoo') ||
            referrerDomain.includes('duckduckgo')
          ) {
            return 'organic';
          }

          if (
            referrerDomain.includes('facebook') ||
            referrerDomain.includes('instagram') ||
            referrerDomain.includes('twitter') ||
            referrerDomain.includes('linkedin') ||
            referrerDomain.includes('tiktok')
          ) {
            return 'social';
          }

          return 'referral';
        } catch (error) {
          return 'referral';
        }
      };

      const collectAttributionData = () => {
        const urlParams = parseUrlParameters();
        const referrer = document.referrer;
        const cookieGclid = extractGclidFromCookies();

        // Use GCLID from URL if available, otherwise from cookies
        const gclid = urlParams.gclid || cookieGclid;

        const attribution = {
          ...urlParams,
          gclid: gclid,
          referrer_url: referrer,
          referrer_domain: referrer ? new URL(referrer).hostname : null,
          traffic_source: determineTrafficSource(
            referrer,
            urlParams.utm_source,
            gclid
          ),
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          collected_at: 'widget_load',
        };
        return attribution;
      };

      const persistAttributionData = attribution => {
        try {
          const enrichedAttribution = {
            ...attribution,
            cross_domain_data: extractCrossDomainData(),
            domain: window.location.hostname,
            subdomain: extractSubdomain(),
            persisted_at: new Date().toISOString(),
          };

          localStorage.setItem(
            'dh_attribution_' + config.companyId,
            JSON.stringify(enrichedAttribution)
          );

          // Also persist cross-domain safe data for subdomain sharing
          persistCrossDomainAttributionData(enrichedAttribution);
        } catch (error) {
          console.warn(
            'Could not persist attribution data to localStorage:',
            error
          );
        }
      };

      const getPersistedAttributionData = () => {
        try {
          const stored = localStorage.getItem(
            'dh_attribution_' + config.companyId
          );
          if (stored) {
            return JSON.parse(stored);
          }

          // Fallback: check for cross-domain attribution data
          const crossDomainData = getCrossDomainAttributionData();
          if (crossDomainData) {
            return crossDomainData;
          }

          return null;
        } catch (error) {
          console.warn(
            'Could not retrieve attribution data from localStorage:',
            error
          );
          return null;
        }
      };

      const persistCrossDomainAttributionData = attribution => {
        try {
          // Create a simplified version for cross-domain sharing
          const crossDomainSafeData = {
            utm_source: attribution.utm_source,
            utm_medium: attribution.utm_medium,
            utm_campaign: attribution.utm_campaign,
            utm_term: attribution.utm_term,
            utm_content: attribution.utm_content,
            gclid: attribution.gclid,
            traffic_source: attribution.traffic_source,
            collected_at: attribution.collected_at,
            cross_domain_timestamp: new Date().toISOString(),
            original_domain: window.location.hostname,
          };

          // Store with a cross-domain safe key
          const crossDomainKey = 'dh_xd_attr_' + config.companyId;
          localStorage.setItem(
            crossDomainKey,
            JSON.stringify(crossDomainSafeData)
          );

          // Also try to set a cookie for broader cross-domain support
          setCrossDomainCookie(
            'dh_attr_' + config.companyId,
            JSON.stringify(crossDomainSafeData),
            30
          );
        } catch (error) {
          console.warn(
            'Could not persist cross-domain attribution data:',
            error
          );
        }
      };

      const getCrossDomainAttributionData = () => {
        try {
          // First try localStorage cross-domain key
          const crossDomainKey = 'dh_xd_attr_' + config.companyId;
          const stored = localStorage.getItem(crossDomainKey);
          if (stored) {
            const data = JSON.parse(stored);
            // Check if data is not too old (30 days max)
            const timestamp = new Date(data.cross_domain_timestamp);
            const thirtyDaysAgo = new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            );
            if (timestamp > thirtyDaysAgo) {
              return data;
            }
          }

          // Fallback: try cookie
          const cookieData = getCookieValue('dh_attr_' + config.companyId);
          if (cookieData) {
            return JSON.parse(decodeURIComponent(cookieData));
          }
        } catch (error) {
          console.warn(
            'Could not retrieve cross-domain attribution data:',
            error
          );
        }
        return null;
      };

      const extractCrossDomainData = () => {
        try {
          return {
            client_id: getGoogleAnalyticsClientId(),
            session_id: getGoogleAnalyticsSessionId(),
            user_id: getGoogleAnalyticsUserId(),
            gtm_container_id: getGTMContainerId(),
            ga_measurement_id: getGA4MeasurementId(),
          };
        } catch (error) {
          console.warn('Error extracting cross-domain data:', error);
          return {};
        }
      };

      const extractSubdomain = () => {
        try {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          if (parts.length > 2) {
            return parts[0]; // Return subdomain
          }
          return null;
        } catch (error) {
          return null;
        }
      };

      const setCrossDomainCookie = (name, value, days) => {
        try {
          const expires = new Date();
          expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

          // Try to set cookie with different domain strategies
          const hostname = window.location.hostname;
          const domainParts = hostname.split('.');

          // Strategy 1: Current domain
          document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; domain=${hostname}; SameSite=None; Secure`;

          // Strategy 2: Parent domain (if subdomain)
          if (domainParts.length > 2) {
            const parentDomain = '.' + domainParts.slice(-2).join('.');
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; domain=${parentDomain}; SameSite=None; Secure`;
          }
        } catch (error) {
          console.warn('Could not set cross-domain cookie:', error);
        }
      };

      const getGoogleAnalyticsClientId = () => {
        try {
          // Method 1: GA4 gtag
          if (typeof gtag !== 'undefined') {
            let clientId = null;
            gtag('get', 'GA_MEASUREMENT_ID', 'client_id', id => {
              clientId = id;
            });
            if (clientId) return clientId;
          }

          // Method 2: Universal Analytics _ga cookie
          const gaCookie = getCookieValue('_ga');
          if (gaCookie) {
            const parts = gaCookie.split('.');
            if (parts.length >= 4) {
              return parts[2] + '.' + parts[3];
            }
          }

          // Method 3: GA4 cookie
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name && name.startsWith('_ga_')) {
              const cookieParts = value
                ? decodeURIComponent(value).split('.')
                : [];
              if (cookieParts.length >= 4) {
                return cookieParts[2] + '.' + cookieParts[3];
              }
            }
          }
        } catch (error) {
          console.warn('Error getting Google Analytics client ID:', error);
        }
        return null;
      };

      const getGoogleAnalyticsSessionId = () => {
        try {
          // Check for GA4 session ID in cookies
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name && name.startsWith('_ga_')) {
              const cookieParts = value
                ? decodeURIComponent(value).split('.')
                : [];
              if (cookieParts.length >= 6) {
                return cookieParts[4] + '.' + cookieParts[5];
              }
            }
          }
        } catch (error) {
          console.warn('Error getting Google Analytics session ID:', error);
        }
        return null;
      };

      const getGoogleAnalyticsUserId = () => {
        try {
          if (typeof gtag !== 'undefined') {
            let userId = null;
            gtag('get', 'GA_MEASUREMENT_ID', 'user_id', id => {
              userId = id;
            });
            return userId;
          }
        } catch (error) {
          console.warn('Error getting Google Analytics user ID:', error);
        }
        return null;
      };

      const getGTMContainerId = () => {
        try {
          if (typeof google_tag_manager !== 'undefined') {
            return Object.keys(google_tag_manager)[0];
          }

          // Alternative: check for GTM script tags
          const scripts = document.getElementsByTagName('script');
          for (let script of scripts) {
            if (
              script.src &&
              script.src.includes('googletagmanager.com/gtm.js')
            ) {
              const match = script.src.match(/id=([^&]+)/);
              if (match) {
                return match[1];
              }
            }
          }
        } catch (error) {
          console.warn('Error getting GTM container ID:', error);
        }
        return null;
      };

      // GTM Conversion Linker Integration
      const initializeGTMLinker = () => {
        try {
          // Check if GTM is loaded
          if (typeof gtag === 'undefined' && typeof dataLayer === 'undefined') {
            return;
          }

          // Initialize GTM Conversion Linker if gtag is available
          if (typeof gtag !== 'undefined') {
            // Enable conversion linker to improve cross-domain tracking
            gtag('config', 'AW-CONVERSION_ID', {
              allow_enhanced_conversions: true,
              conversion_linker: true,
            });
          }

          // Manually trigger linker functionality for cross-domain attribution
          setupCrossDomainLinker();
        } catch (error) {
          console.warn('Error initializing GTM Conversion Linker:', error);
        }
      };

      const setupCrossDomainLinker = () => {
        try {
          // Create conversion linker cookies for cross-domain tracking
          const createLinkerCookies = () => {
            const clientId = getGoogleAnalyticsClientId();
            const sessionId = getGoogleAnalyticsSessionId();
            const gclid = extractGclidFromCookies();

            if (clientId || gclid) {
              const linkerData = {
                client_id: clientId,
                session_id: sessionId,
                gclid: gclid,
                timestamp: Date.now(),
                domain: window.location.hostname,
              };

              // Create _gcl_au cookie for Google Ads
              if (gclid) {
                const gclCookie = `1.${Date.now()}.${gclid}`;
                setCrossDomainCookie('_gcl_au', gclCookie, 90);
              }

              // Create custom linker cookie
              setCrossDomainCookie(
                '_dh_linker',
                JSON.stringify(linkerData),
                30
              );
            }
          };

          // Setup click handlers for outbound links
          const setupLinkDecoration = () => {
            document.addEventListener('click', event => {
              const link = event.target.closest('a');
              if (link && link.href) {
                try {
                  const url = new URL(link.href);
                  const currentDomain = window.location.hostname;

                  // Check if it's a cross-domain link
                  if (
                    url.hostname !== currentDomain &&
                    !url.hostname.includes(currentDomain)
                  ) {
                    decorateLink(link);
                  }
                } catch (error) {
                  // Invalid URL, skip
                }
              }
            });
          };

          const decorateLink = link => {
            try {
              const url = new URL(link.href);
              const gclid = extractGclidFromCookies();
              const clientId = getGoogleAnalyticsClientId();

              // Add GCLID to cross-domain links
              if (gclid && !url.searchParams.has('gclid')) {
                url.searchParams.set('gclid', gclid);
              }

              // Add GA client ID for cross-domain tracking
              if (clientId && !url.searchParams.has('_ga')) {
                url.searchParams.set('_ga', `1.1.${clientId}`);
              }

              // Add custom cross-domain attribution
              if ((gclid || clientId) && !url.searchParams.has('xd_attr')) {
                const crossDomainData = btoa(
                  JSON.stringify({
                    gclid: gclid,
                    client_id: clientId,
                    source_domain: window.location.hostname,
                    timestamp: Date.now(),
                  })
                );
                url.searchParams.set('xd_attr', crossDomainData);
              }

              link.href = url.toString();
            } catch (error) {
              console.warn('Error decorating link:', error);
            }
          };

          // Initialize linker functionality
          createLinkerCookies();
          setupLinkDecoration();
        } catch (error) {
          console.warn('Error setting up cross-domain linker:', error);
        }
      };

      // Enhanced GCLID persistence for GTM integration
      const persistGclidForGTM = gclid => {
        if (!gclid || !isValidGclid(gclid)) return;

        try {
          // Store GCLID in various formats for GTM compatibility

          // 1. Standard _gcl_aw format (Google Ads)
          const gclAwValue = `GCL.${Date.now()}.${gclid}`;
          setCrossDomainCookie('_gcl_aw', gclAwValue, 90);

          // 2. _gac format (Google Ads Conversion)
          const gacValue = `1.${Date.now()}.${gclid}`;
          setCrossDomainCookie('_gac_UA-XXXXX-X', gacValue, 90);

          // 3. Push to dataLayer if available
          if (typeof dataLayer !== 'undefined') {
            dataLayer.push({
              event: 'gclid_available',
              gclid: gclid,
              gclid_timestamp: Date.now(),
              widget_attribution: true,
            });
          }

          // 4. Store in localStorage for widget-specific tracking
          localStorage.setItem(
            'dh_gtm_gclid_' + config.companyId,
            JSON.stringify({
              gclid: gclid,
              timestamp: Date.now(),
              persisted_by: 'widget',
            })
          );
        } catch (error) {
          console.warn('Error persisting GCLID for GTM:', error);
        }
      };

      // Enhanced attribution data collection for GTM with consent handling
      const collectGTMAttributionData = () => {
        const baseAttribution = collectAttributionData();

        try {
          // Add GTM-specific data
          const gtmData = {
            gtm_container_id: getGTMContainerId(),
            gtm_debug_mode: !!(
              window.google_tag_manager &&
              window.google_tag_manager.dataLayer &&
              window.google_tag_manager.dataLayer.gtm &&
              window.google_tag_manager.dataLayer.gtm.uniqueEventId
            ),
            has_gtag: typeof gtag !== 'undefined',
            has_data_layer: typeof dataLayer !== 'undefined',
            enhanced_conversions_enabled: checkEnhancedConversionsStatus(),
            conversion_linker_enabled: checkConversionLinkerStatus(),
          };

          // Merge with base attribution data
          const fullAttribution = {
            ...baseAttribution,
            gtm_integration: gtmData,
            collection_method: 'gtm_enhanced',
          };

          // Apply consent-safe attribution filtering
          const consentSafeAttribution =
            cookieConsentManager.getConsentSafeAttribution(fullAttribution);

          // Persist GCLID for GTM if found and consent is granted
          if (
            consentSafeAttribution.gclid &&
            consentSafeAttribution.consent_status === 'granted'
          ) {
            persistGclidForGTM(consentSafeAttribution.gclid);
          }

          return consentSafeAttribution;
        } catch (error) {
          console.warn(
            'Error collecting GTM attribution data, falling back to base attribution:',
            error
          );
          // Apply consent filtering to fallback as well
          return cookieConsentManager.getConsentSafeAttribution(
            baseAttribution
          );
        }
      };

      const checkEnhancedConversionsStatus = () => {
        try {
          // Check if enhanced conversions are enabled
          if (typeof gtag !== 'undefined') {
            // This is a simplified check - in reality, you'd need to inspect GTM configuration
            return true; // Assume enabled if gtag is present
          }
          return false;
        } catch (error) {
          return false;
        }
      };

      const checkConversionLinkerStatus = () => {
        try {
          // Check for conversion linker cookies
          const linkerCookies = ['_gcl_au', '_gcl_aw', '_gcl_dc'];
          return linkerCookies.some(cookie => getCookieValue(cookie) !== null);
        } catch (error) {
          return false;
        }
      };

      // Cookie Consent Management for Attribution
      const cookieConsentManager = {
        // Check various cookie consent frameworks
        checkConsentStatus: () => {
          try {
            // Method 1: Check for Google Consent Mode
            if (typeof gtag !== 'undefined') {
              // Check if analytics storage is granted
              let analyticsConsent = false;
              let adStorageConsent = false;

              gtag('get', 'analytics_storage', value => {
                analyticsConsent = value === 'granted';
              });

              gtag('get', 'ad_storage', value => {
                adStorageConsent = value === 'granted';
              });

              if (analyticsConsent && adStorageConsent) {
                return { granted: true, method: 'google_consent_mode' };
              }
            }

            // Method 2: Check for OneTrust
            if (typeof OnetrustActiveGroups !== 'undefined') {
              const groups = OnetrustActiveGroups.split(',');
              const hasAnalytics =
                groups.includes('C0002') || groups.includes('2'); // Analytics
              const hasAdvertising =
                groups.includes('C0004') || groups.includes('4'); // Advertising

              if (hasAnalytics && hasAdvertising) {
                return { granted: true, method: 'onetrust' };
              }
            }

            // Method 3: Check for Cookiebot
            if (typeof Cookiebot !== 'undefined') {
              if (
                Cookiebot.consent &&
                Cookiebot.consent.statistics &&
                Cookiebot.consent.marketing
              ) {
                return { granted: true, method: 'cookiebot' };
              }
            }

            // Method 4: Check for CookieYes
            if (typeof ckyStore !== 'undefined') {
              const consent = ckyStore.getItem('cky-consent');
              if (
                consent &&
                consent.includes('analytics') &&
                consent.includes('advertisement')
              ) {
                return { granted: true, method: 'cookieyes' };
              }
            }

            // Method 5: Check for generic consent in localStorage/cookies
            const genericConsent =
              localStorage.getItem('cookie_consent') ||
              getCookieValue('cookie_consent') ||
              getCookieValue('consent_analytics');

            if (
              genericConsent === 'true' ||
              genericConsent === '1' ||
              genericConsent === 'accepted'
            ) {
              return { granted: true, method: 'generic_consent' };
            }

            // Method 6: Check for EU cookie law compliance
            if (cookieConsentManager.isEUTraffic()) {
              // If no explicit consent found and user appears to be from EU, assume no consent
              return { granted: false, method: 'eu_default_deny' };
            }

            // Default: assume consent granted if no framework detected (non-EU traffic)
            return { granted: true, method: 'default_granted' };
          } catch (error) {
            console.warn('Error checking cookie consent status:', error);
            return { granted: true, method: 'error_fallback' };
          }
        },

        isEUTraffic: () => {
          try {
            // Simple heuristic to detect EU traffic
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const euTimezones = [
              'Europe/London',
              'Europe/Berlin',
              'Europe/Paris',
              'Europe/Rome',
              'Europe/Madrid',
              'Europe/Amsterdam',
              'Europe/Brussels',
              'Europe/Vienna',
              'Europe/Stockholm',
              'Europe/Helsinki',
              'Europe/Copenhagen',
              'Europe/Prague',
              'Europe/Warsaw',
              'Europe/Budapest',
              'Europe/Bucharest',
              'Europe/Sofia',
              'Europe/Athens',
              'Europe/Zagreb',
              'Europe/Ljubljana',
              'Europe/Bratislava',
              'Europe/Vilnius',
              'Europe/Riga',
              'Europe/Tallinn',
              'Europe/Dublin',
              'Europe/Luxembourg',
              'Europe/Malta',
            ];

            return euTimezones.includes(timezone);
          } catch (error) {
            return false; // Assume non-EU if detection fails
          }
        },

        getConsentSafeAttribution: fullAttribution => {
          const consentStatus = cookieConsentManager.checkConsentStatus();

          if (consentStatus.granted) {
            // Full attribution allowed
            return {
              ...fullAttribution,
              consent_status: 'granted',
              consent_method: consentStatus.method,
              privacy_compliant: true,
            };
          } else {
            // Limited attribution - only session-based and URL parameters
            const limitedAttribution = {
              // Keep URL parameters (first-party data)
              utm_source: fullAttribution.utm_source,
              utm_medium: fullAttribution.utm_medium,
              utm_campaign: fullAttribution.utm_campaign,
              utm_term: fullAttribution.utm_term,
              utm_content: fullAttribution.utm_content,

              // Keep GCLID from URL (not from cookies)
              gclid:
                fullAttribution.gclid && cookieConsentManager.gclidFromURL()
                  ? fullAttribution.gclid
                  : null,

              // Keep referrer (first-party data)
              referrer_url: fullAttribution.referrer_url,
              referrer_domain: fullAttribution.referrer_domain,

              // Keep basic page data
              page_url: fullAttribution.page_url,
              traffic_source: fullAttribution.traffic_source,
              timestamp: fullAttribution.timestamp,
              collected_at: fullAttribution.collected_at,

              // Privacy metadata
              consent_status: 'denied',
              consent_method: consentStatus.method,
              privacy_compliant: true,
              limited_attribution: true,

              // Remove cookie-based data
              cross_domain_data: null,
              gtm_integration: null,
            };

            return limitedAttribution;
          }
        },

        gclidFromURL: () => {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.has('gclid');
          } catch (error) {
            return false;
          }
        },

        setupConsentListener: () => {
          try {
            // Listen for consent changes and update attribution accordingly

            // Google Consent Mode listener
            if (typeof gtag !== 'undefined') {
              // Listen for consent updates
              gtag('event', 'consent_update_listener', {
                custom_parameter: 'dh_widget_attribution',
              });
            }

            // OneTrust listener
            if (typeof OneTrust !== 'undefined') {
              OneTrust.OnConsentChanged(() => {
                cookieConsentManager.updateAttributionOnConsentChange();
              });
            }

            // Cookiebot listener
            if (typeof Cookiebot !== 'undefined') {
              window.addEventListener('CookiebotOnConsentReady', () => {
                cookieConsentManager.updateAttributionOnConsentChange();
              });
            }

            // Generic consent change listener
            window.addEventListener('cookie_consent_changed', () => {
              cookieConsentManager.updateAttributionOnConsentChange();
            });
          } catch (error) {
            console.warn('Error setting up consent listeners:', error);
          }
        },

        updateAttributionOnConsentChange: () => {
          try {
            // Re-collect attribution with updated consent status
            const newAttributionData = collectGTMAttributionData();
            widgetState.attributionData = newAttributionData;
            persistAttributionData(newAttributionData);
          } catch (error) {
            console.warn(
              'Error updating attribution on consent change:',
              error
            );
          }
        },
      };

      // Progressive Form State Management System
      const progressiveFormManager = {
        // Auto-save functionality
        autoSaveTimer: null,

        initializeProgressiveFeatures: () => {
          try {
            // Initialize user engagement tracking
            widgetState.formState.userEngagement.startTime =
              new Date().toISOString();
            widgetState.formState.userEngagement.returningUser =
              progressiveFormManager.isReturningUser();

            // Setup auto-save if enabled
            if (
              widgetState.formState.progressiveFeatures.autoSave &&
              widgetState.formState.autoSaveEnabled
            ) {
              progressiveFormManager.setupAutoSave();
            }

            // Setup real-time validation
            if (widgetState.formState.progressiveFeatures.realTimeValidation) {
              progressiveFormManager.setupRealTimeValidation();
            }

            // Initialize step analytics
            if (widgetState.formState.progressiveFeatures.stepAnalytics) {
              progressiveFormManager.initializeStepAnalytics();
            }
          } catch (error) {
            console.warn(
              'Error initializing progressive form features:',
              error
            );
          }
        },

        isReturningUser: () => {
          try {
            const lastVisit = localStorage.getItem(
              'dh_last_visit_' + config.companyId
            );
            return !!lastVisit;
          } catch (error) {
            return false;
          }
        },

        setupAutoSave: () => {
          // Clear existing timer
          if (progressiveFormManager.autoSaveTimer) {
            clearInterval(progressiveFormManager.autoSaveTimer);
          }

          // Setup new auto-save timer
          progressiveFormManager.autoSaveTimer = setInterval(() => {
            if (progressiveFormManager.shouldAutoSave()) {
              progressiveFormManager.performAutoSave();
            }
          }, widgetState.formState.autoSaveInterval);
        },

        shouldAutoSave: () => {
          // Only auto-save if user has made progress and form has data
          const hasFormData = progressiveFormManager.hasSignificantFormData();
          const isInProgress =
            widgetState.currentStep !== 'welcome' &&
            widgetState.currentStep !== 'complete';
          const timeSinceLastSave = widgetState.formState.lastSaved
            ? Date.now() - new Date(widgetState.formState.lastSaved).getTime()
            : Infinity;

          return hasFormData && isInProgress && timeSinceLastSave > 5000; // Min 5 seconds between saves
        },

        hasSignificantFormData: () => {
          const data = widgetState.formData;
          return !!(
            data.pestIssue ||
            data.address ||
            data.homeSize ||
            data.contactInfo.name ||
            data.contactInfo.email ||
            data.contactInfo.phone
          );
        },

        performAutoSave: async () => {
          try {
            // Calculate completion status
            const completionStatus =
              progressiveFormManager.calculateStepCompletion();

            // Prepare progressive save data
            const saveData = {
              companyId: config.companyId,
              sessionId: widgetState.sessionId,
              stepCompleted: progressiveFormManager.getProgressiveStepStatus(),
              formData: {
                ...widgetState.formData,
                latitude: widgetState.formData.latitude || null,
                longitude: widgetState.formData.longitude || null,
              },
              serviceAreaData: widgetState.serviceAreaData || {
                served: null,
                areas: [],
              },
              attributionData: widgetState.attributionData,
              progressiveState: {
                currentStep: widgetState.currentStep,
                completionPercentage: completionStatus.overall,
                stepCompletions: completionStatus.steps,
                userEngagement:
                  progressiveFormManager.calculateEngagementMetrics(),
                validationErrors: widgetState.formState.validationErrors,
                autoSaveTimestamp: new Date().toISOString(),
                formVersion: widgetState.formState.formVersion,
              },
            };

            // Only save if address is validated (same logic as original partial save)
            if (
              widgetState.serviceAreaData &&
              widgetState.serviceAreaData.served
            ) {
              const response = await fetch(
                config.baseUrl + '/api/widget/partial-save',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(saveData),
                }
              );

              if (response.ok) {
                widgetState.formState.lastSaved = new Date().toISOString();
                // Show subtle save indicator
                progressiveFormManager.showSaveIndicator();
              }
            } else {
              // Save locally for incomplete forms
              progressiveFormManager.saveLocalFormState(saveData);
            }
          } catch (error) {
            console.warn('Auto-save failed:', error);
          }
        },

        getProgressiveStepStatus: () => {
          // Determine the most advanced step completed
          if (
            widgetState.formData.contactInfo.name &&
            widgetState.formData.contactInfo.email
          ) {
            return 'contact_started';
          } else if (
            widgetState.formData.address &&
            widgetState.formData.latitude
          ) {
            return 'address_validated';
          } else {
            return 'form_started';
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

        calculateEngagementMetrics: () => {
          const now = new Date().toISOString();
          const startTime = new Date(
            widgetState.formState.userEngagement.startTime
          );
          const totalTime = Date.now() - startTime.getTime();

          return {
            ...widgetState.formState.userEngagement,
            totalTimeSpent: Math.round(totalTime / 1000), // seconds
            currentSessionDuration: Math.round(totalTime / 1000),
            lastActivity: now,
          };
        },

        saveLocalFormState: data => {
          try {
            const localStateKey = 'dh_local_form_state_' + config.companyId;
            localStorage.setItem(localStateKey, JSON.stringify(data));
            widgetState.formState.lastSaved = new Date().toISOString();
          } catch (error) {
            console.warn('Failed to save local form state:', error);
          }
        },

        loadLocalFormState: () => {
          try {
            const localStateKey = 'dh_local_form_state_' + config.companyId;
            const stored = localStorage.getItem(localStateKey);
            if (stored) {
              const data = JSON.parse(stored);
              // Check if data is not too old (7 days)
              const saveTime = new Date(
                data.progressiveState?.autoSaveTimestamp
              );
              const sevenDaysAgo = new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              );

              if (saveTime > sevenDaysAgo) {
                return data;
              } else {
                // Clean up old data
                localStorage.removeItem(localStateKey);
              }
            }
          } catch (error) {
            console.warn('Failed to load local form state:', error);
          }
          return null;
        },

        showSaveIndicator: () => {
          // Create a subtle save indicator
          const indicator = document.createElement('div');
          indicator.textContent = '✓ Saved';
          indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s ease;
          `;

          document.body.appendChild(indicator);

          // Animate in
          setTimeout(() => {
            indicator.style.opacity = '1';
          }, 100);

          // Remove after 2 seconds
          setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
              if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
              }
            }, 300);
          }, 2000);
        },

        setupRealTimeValidation: () => {
          // Setup event listeners for real-time validation
          document.addEventListener('input', event => {
            if (event.target.closest('.dh-widget')) {
              progressiveFormManager.validateField(event.target);
            }
          });

          document.addEventListener('blur', event => {
            if (event.target.closest('.dh-widget')) {
              progressiveFormManager.validateField(event.target);
            }
          });
        },

        validateField: field => {
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
                      errorMessage =
                        'Please include the domain extension (e.g., .com)';
                    }
                  }
                }
                break;

              case 'phone-input':
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
                  } else {
                    // Format suggestion
                    if (cleanPhone.length === 10 && !value.includes('(')) {
                      const formatted = `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
                      progressiveFormManager.suggestFieldFormat(
                        field,
                        formatted
                      );
                    }
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
                  } else if (!value.includes(' ')) {
                    warningMessage = 'Please include your first and last name';
                  }
                }
                break;

              case 'address-input':
                if (value) {
                  if (value.trim().length < 5) {
                    warningMessage = 'Please enter a complete address';
                  } else if (!/\d/.test(value)) {
                    warningMessage = 'Address should include a street number';
                  }
                }
                break;

              case 'home-size-input':
                if (value) {
                  const size = parseInt(value);
                  if (isNaN(size) || size < 1) {
                    isValid = false;
                    errorMessage = 'Please enter a valid square footage';
                  } else if (size < 500) {
                    warningMessage = 'This seems quite small for a home';
                  } else if (size > 10000) {
                    warningMessage = 'This is a very large home';
                  }
                }
                break;
            }

            if (!isValid) {
              widgetState.formState.validationErrors[fieldName] = errorMessage;
              progressiveFormManager.showFieldError(field, errorMessage);
            } else if (warningMessage) {
              progressiveFormManager.showFieldWarning(field, warningMessage);
            } else {
              progressiveFormManager.showFieldSuccess(field);
            }

            // Update field completion status
            widgetState.formState.fieldCompletionStatus[fieldName] = {
              isValid: isValid,
              hasWarning: !!warningMessage,
              completedAt: new Date().toISOString(),
              value: value ? '***' : '', // Don't store actual values for privacy
            };

            // Trigger auto-save if field is valid and significant
            if (
              isValid &&
              value &&
              progressiveFormManager.isSignificantField(fieldName)
            ) {
              setTimeout(() => {
                if (progressiveFormManager.shouldAutoSave()) {
                  progressiveFormManager.performAutoSave();
                }
              }, 2000); // Delay to avoid excessive saves
            }
          } catch (error) {
            console.warn('Error in field validation:', error);
          }
        },

        isSignificantField: fieldName => {
          return [
            'email-input',
            'name-input',
            'phone-input',
            'address-input',
          ].includes(fieldName);
        },

        suggestFieldFormat: (field, suggestion) => {
          // Create format suggestion tooltip
          const tooltip = document.createElement('div');
          tooltip.className = 'dh-format-suggestion';
          tooltip.innerHTML = `
            <span>Format as: <strong>${suggestion}</strong></span>
            <button onclick="this.parentNode.parentNode.querySelector('input').value='${suggestion}'; this.parentNode.remove();">Apply</button>
          `;
          tooltip.style.cssText = `
            position: absolute;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 8px;
            font-size: 12px;
            z-index: 1000;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
          `;

          field.parentNode.style.position = 'relative';
          field.parentNode.appendChild(tooltip);

          // Auto-remove after 5 seconds
          setTimeout(() => {
            if (tooltip.parentNode) {
              tooltip.remove();
            }
          }, 5000);
        },

        showFieldWarning: (field, message) => {
          // Remove existing indicators
          progressiveFormManager.clearFieldIndicators(field);

          // Create warning indicator
          const warningEl = document.createElement('div');
          warningEl.className = 'dh-field-warning';
          warningEl.textContent = message;
          warningEl.style.cssText = `
            color: #f59e0b;
            font-size: 12px;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          `;
          warningEl.innerHTML = `<span>⚠️</span> ${message}`;

          // Add warning styling to field
          field.style.borderColor = '#f59e0b';
          field.style.boxShadow = '0 0 0 1px #f59e0b';

          // Insert warning message
          if (field.parentNode) {
            field.parentNode.appendChild(warningEl);
          }
        },

        showFieldSuccess: field => {
          // Remove existing indicators
          progressiveFormManager.clearFieldIndicators(field);

          // Add success styling to field
          field.style.borderColor = '#10b981';
          field.style.boxShadow = '0 0 0 1px #10b981';

          // Add checkmark indicator
          const successEl = document.createElement('div');
          successEl.className = 'dh-field-success';
          successEl.innerHTML = '✓';
          successEl.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            color: #10b981;
            font-weight: bold;
            pointer-events: none;
          `;

          field.parentNode.style.position = 'relative';
          field.parentNode.appendChild(successEl);
        },

        clearFieldIndicators: field => {
          // Remove error styling
          field.style.borderColor = '';
          field.style.boxShadow = '';

          // Remove all indicator elements
          const indicators = field.parentNode?.querySelectorAll(
            '.dh-field-error, .dh-field-warning, .dh-field-success, .dh-format-suggestion'
          );
          indicators?.forEach(el => el.remove());
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
            margin-top: 4px;
            animation: fadeIn 0.3s ease;
          `;

          // Add error styling to field
          field.style.borderColor = '#ef4444';
          field.style.boxShadow = '0 0 0 1px #ef4444';

          // Insert error message
          if (field.parentNode) {
            field.parentNode.appendChild(errorEl);
          }
        },

        clearFieldError: field => {
          // Use the comprehensive clearFieldIndicators method
          progressiveFormManager.clearFieldIndicators(field);
        },

        initializeStepAnalytics: () => {
          // Track step entry times
          const originalShowStep = window.showStep;
          window.showStep = function (stepName) {
            // Record step timing
            if (widgetState.currentStep) {
              const stepTime =
                Date.now() -
                (widgetState.formState.userEngagement.stepTimes[
                  widgetState.currentStep
                ] || Date.now());
              widgetState.formState.userEngagement.stepTimes[
                widgetState.currentStep
              ] = stepTime;
            }

            // Record new step start
            widgetState.formState.userEngagement.stepTimes[stepName] =
              Date.now();

            // Call original function
            return originalShowStep.call(this, stepName);
          };
        },

        recordAbandonmentPoint: (step, reason) => {
          widgetState.formState.userEngagement.abandonmentPoints.push({
            step: step,
            reason: reason,
            timestamp: new Date().toISOString(),
            completionPercentage:
              progressiveFormManager.calculateStepCompletion().overall,
          });
        },

        cleanup: () => {
          // Clear auto-save timer
          if (progressiveFormManager.autoSaveTimer) {
            clearInterval(progressiveFormManager.autoSaveTimer);
          }

          // Save final state before cleanup
          if (progressiveFormManager.hasSignificantFormData()) {
            progressiveFormManager.saveLocalFormState({
              companyId: config.companyId,
              sessionId: widgetState.sessionId,
              formData: widgetState.formData,
              currentStep: widgetState.currentStep,
              completionPercentage:
                progressiveFormManager.calculateStepCompletion().overall,
              cleanupReason: 'widget_closed',
            });
          }
        },
      };

      // Initialize attribution tracking
      const initializeAttributionTracking = () => {
        // Generate or retrieve session ID
        let sessionId = localStorage.getItem('dh_session_' + config.companyId);

        // Validate existing session ID format (UUID v4: 8-4-4-4-12 characters)
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (sessionId && !uuidRegex.test(sessionId)) {
          sessionId = null; // Force regeneration
        }

        if (!sessionId) {
          sessionId = generateSessionId();
          localStorage.setItem('dh_session_' + config.companyId, sessionId);
        } else {
        }
        widgetState.sessionId = sessionId;

        // Initialize cookie consent listeners
        cookieConsentManager.setupConsentListener();

        // Initialize GTM Conversion Linker
        initializeGTMLinker();

        // Collect attribution data with GTM enhancements and consent handling (prioritize fresh data over stored)
        let attributionData = collectGTMAttributionData();

        // If we have stored attribution and no new UTM/GCLID data, use stored data
        const storedAttribution = getPersistedAttributionData();
        if (
          storedAttribution &&
          !attributionData.utm_source &&
          !attributionData.gclid
        ) {
          attributionData = { ...storedAttribution, ...attributionData };
          attributionData.collected_at = 'widget_load_with_stored';
        }

        widgetState.attributionData = attributionData;
        persistAttributionData(attributionData);
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
      } 
      .dh-form-step.welcome { 
        display: none;
        padding: 0;
      } 
      .dh-form-step.active { 
        display: block; 
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
      @media (max-width: 480px) {
        .dh-form-row {
          grid-template-columns: 1fr;
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
        font-size: 20px;
        line-height: 20px;
        font-family: Outfit, sans-serif;
        font-weight: 500; 
        transition: all 0.2s ease; 
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
        font-size: 20px;
        font-weight: 500;
        line-height: 20px;
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
      .dh-form-btn:disabled { 
        opacity: 0.6; 
        cursor: not-allowed;
      }
      .dh-form-btn:disabled svg { 
        transform: none;
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
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-top: 8px;
      }
      .dh-pest-option:hover .dh-pest-icon {
        border-color: ${primaryColor};
        background: #f8fafc;
      }
      .dh-pest-option.selected .dh-pest-icon {
        border-color: ${primaryColor};
        color: white;
      }
      .dh-pest-option.processing .dh-pest-icon {
        border-color: ${primaryColor};
        color: white;
        position: relative;
        pointer-events: none;
      }
      .dh-pest-option.processing .dh-pest-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
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
      .dh-loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid ${primaryColor};
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px auto;
      }
      .dh-plan-selection {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin: 20px 0;
      }
      .dh-plan-card {
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: ${backgroundColor};
        position: relative;
      }
      .dh-plan-card:hover {
        border-color: ${primaryColor};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .dh-plan-card.selected {
        border-color: ${primaryColor};
        background: ${primaryFocus};
      }
      .dh-plan-card.processing {
        border-color: ${primaryColor};
        background: ${primaryColor};
        color: white;
        pointer-events: none;
      }
      .dh-plan-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .dh-plan-title {
        font-size: 18px;
        font-weight: 600;
        color: ${textColor};
        margin: 0;
      }
      .dh-plan-badge {
        background: ${primaryColor};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      .dh-plan-price {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 12px;
      }
      .dh-plan-price-main {
        font-size: 24px;
        font-weight: 700;
        color: ${primaryColor};
      }
      .dh-plan-price-frequency {
        font-size: 14px;
        color: ${textColor};
        opacity: 0.7;
      }
      .dh-plan-description {
        font-size: 14px;
        color: ${textColor};
        margin-bottom: 16px;
        opacity: 0.8;
      }
      .dh-plan-features {
        list-style: none;
        padding: 0;
        margin: 0;
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

      .dh-feature-checkmark {
        margin-top: 3px;
      }
      .dh-coverage-indicator {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        font-size: 12px;
        color: ${textColor};
      }
      .dh-coverage-indicator.full-coverage {
        background: rgba(34, 197, 94, 0.1);
        color: #059669;
      }
      .dh-coverage-indicator.partial-coverage {
        background: rgba(251, 191, 36, 0.1);
        color: #d97706;
      }
      .dh-error-state, .dh-no-plans {
        text-align: center;
        padding: 40px 20px;
        color: ${textColor};
        opacity: 0.8;
      }
      .dh-error-state p, .dh-no-plans p {
        margin: 8px 0;
      }
      .dh-urgency-selection {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 20px 0;
      }
      .dh-urgency-option {
        padding: 16px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        font-weight: 500;
        background: ${backgroundColor};
        color: ${textColor};
      }
      .dh-urgency-option:hover, .dh-urgency-option.selected {
        border-color: ${primaryColor};
        background: ${primaryFocus};
      }

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
          }
      .dh-offer-btn {
        padding: 16px 24px;
        border: 2px solid;
        border-radius: 8px;
        font-family: 'Outfit', sans-serif;
        font-weight: 400;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        font-weight: 600;
        font-size: 20px;
        line-height: 100%;
        background: none;
        outline: none;
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
      .dh-plans-container {
        display: flex;
        gap: 12px;
        margin: 24px 0;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding: 4px;
      }
      .dh-plan-card {
        flex: 0 0 calc(33.333% - 8px);
        min-width: 240px;
        max-width: 280px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: ${backgroundColor};
        transition: all 0.2s ease;
        opacity: 0.3;
        filter: grayscale(0.7);
        pointer-events: none;
      }
      @media (max-width: 768px) {
        .dh-plans-container {
          flex-wrap: wrap;
          overflow-x: visible;
        }
        .dh-plan-card {
          flex: 1 1 100%;
          min-width: 100%;
          max-width: 100%;
        }
      }
      .dh-plan-card.recommended {
        opacity: 1;
        filter: none;
        pointer-events: auto;
        border-color: ${primaryColor};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: scale(1.02);
      }
      .dh-plan-header {
        padding: 16px;
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        color: white;
      }
      .dh-plan-card[data-plan="defense"] .dh-plan-header {
        background: #10b981;
      }
      .dh-plan-card[data-plan="smartdefense"] .dh-plan-header {
        background: #06b6d4;
      }
      .dh-plan-card[data-plan="smartdefense-complete"] .dh-plan-header {
        background: #1e40af;
      }
      .dh-plan-content {
        padding: 20px;
      }
      .dh-plan-included {
        font-weight: bold;
        margin-bottom: 12px;
        color: ${textColor};
      }
      .dh-plan-feature-enabled {
        color: ${primaryColor};
        font-weight: 500;
      }
      .dh-plan-feature-disabled {
        color: #9ca3af;
        text-decoration: line-through;
      }
      .dh-plan-button {
        width: 100%;
        padding: 12px;
        margin: 16px 0;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .dh-plan-card[data-plan="defense"] .dh-plan-button {
        background: #10b981;
        color: white;
      }
      .dh-plan-card[data-plan="smartdefense"] .dh-plan-button {
        background: #06b6d4;
        color: white;
      }
      .dh-plan-card[data-plan="smartdefense-complete"] .dh-plan-button {
        background: #1e40af;
        color: white;
      }
      .dh-plan-button:hover {
        opacity: 0.9;
      }
      .dh-plans-footer {
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        margin-top: 16px;
      }

      /* Tabbed Plan Interface Styles */
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
        gap: 8px;
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
        margin-top: 40px;
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
        margin: 30px 0 40px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e2e8f0;
      }
      .dh-address-header p {
        margin: 0 0 8px 0;
        font-weight: 500;
      }
      .dh-address-header strong {
        color: ${secondaryColor};
        font-size: 16px;
      }
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
      }
      .dh-change-address-btn:hover {
        background: ${primaryColor};
        color: white;
      }
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
      }
      .dh-address-image {
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: 12px;
        transition: opacity 0.3s ease;
      }
      .dh-image-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #64748b;
      }
      .dh-image-loading p {
        margin: 8px 0 0 0;
        font-size: 14px;
      }
      .dh-loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e2e8f0;
        border-top: 2px solid ${primaryColor};
        border-radius: 50%;
        animation: dh-spin 1s linear infinite;
      }
      @keyframes dh-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .dh-image-error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #6b7280;
        text-align: center;
      }
      .dh-image-error p {
        margin: 0;
        font-size: 14px;
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
      }
      
      /* Recovery step styles */
      .dh-form-recovery {
        text-align: center;
      }
      .dh-form-recovery h3 {
        color: ${primaryColor};
        margin-bottom: 12px;
        font-size: 20px;
        font-weight: 600;
      }
      .dh-form-recovery p {
        margin-bottom: 20px;
        color: ${textColor};
        line-height: 1.5;
      }
      .dh-recovery-info {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        text-align: left;
      }
      .dh-recovery-detail strong {
        color: ${primaryColor};
        font-weight: 600;
        display: block;
        margin-bottom: 8px;
      }
      .dh-recovery-detail ul {
        margin: 0;
        padding-left: 20px;
      }
      .dh-recovery-detail li {
        margin-bottom: 4px;
        color: ${textColor};
        font-size: 14px;
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
      
      .dh-welcome-benefits li::before {
        content: '';
        width: 20px;
        height: 20px;
        background: #d1d5db;
        border-radius: 50%;
        margin-right: 12px;
        flex-shrink: 0;
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
      }
      
      .dh-welcome-button:hover {
        background: ${secondaryDark};
        transform: translateY(1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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
        font-size: 50px;
        font-weight: 600;
        line-height: 103%;
        margin: 0 0 20px 0;
      }
      
      @media (max-width: 768px) {
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
      
      /* Button widget styles */
      .dh-widget-button {
        background: ${primaryColor};
        color: white;
        border: none;
        padding: 16px 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .dh-widget-button:hover {
        background: ${primaryColor}dd;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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
      @media (max-width: 650px) {
        .dh-welcome-hero {
          width: 250px;
        }
        .dh-welcome-svg-background {
          width: 300px;
          height: 400px;
        }

        .dh-plan-coverage-icons {
          grid-template-columns: repeat(2, 1fr);
        }

        #dh-step-contact .dh-form-button-group {
          padding-bottom: 80px;
        }

        /* iOS-specific safe area handling */
        .dh-ios-device .dh-form-button-group {
          padding-bottom: calc(20px + env(safe-area-inset-bottom, 60px));
        }

        /* Additional iOS styling for specific steps */
        .dh-ios-device #dh-step-contact .dh-form-button-group {
          padding-bottom: calc(40px + env(safe-area-inset-bottom, 80px));
        }

        .dh-ios-device #dh-step-exit-survey .dh-form-button-group {
          padding-bottom: calc(20px + env(safe-area-inset-bottom, 60px));
        }

        .form-submit-step-back {
          left: 50%;
          transform: translateX(-50%);
        }

        #dh-step-exit-survey .dh-form-button-group {
          flex-direction: column-reverse;
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

          .dh-address-header {
            flex-direction: column;
            text-align: center;
          }

          .dh-form-step-content {
            padding: 20px;
          }
          
          .dh-offer-options {
            flex-direction: column;
            align-items: center;
          }

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

          .dh-pest-icon, .dh-pest-option {
            width: 120px;
          }

          .dh-form-row {
            gap: 0;
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

      // Open modal function
      // Track if modal widget has been created
      let modalWidgetCreated = false;

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
          }

          // Show modal
          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden'; // Prevent background scroll

          // Focus management
          const firstFocusable = modal.querySelector(
            'input, button, select, textarea'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      };

      // Close modal function
      const closeModal = () => {
        const modal = document.getElementById('dh-modal-overlay');
        if (modal) {
          modal.style.display = 'none';
          document.body.style.overflow = ''; // Restore scroll
          // State is automatically preserved since we're not destroying the widget
        }
      };

      // Function to reset modal widget (for testing purposes)
      window.resetModalWidget = () => {
        modalWidgetCreated = false;
        const modalBody = document.getElementById('dh-modal-body');
        if (modalBody) {
          modalBody.innerHTML = '';
        }
      };

      // Main widget creation router
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
        welcomeTitle.textContent = config.welcomeTitle || 'Get help now!';

        // Welcome description
        const welcomeDescription = document.createElement('h2');
        welcomeDescription.className = 'dh-welcome-description';
        welcomeDescription.textContent =
          config.welcomeDescription ||
          'For fast, affordable & professional pest solutions in your area.';

        // Benefits list
        const benefitsList = document.createElement('ul');
        benefitsList.className = 'dh-welcome-benefits';

        const defaultBenefits = [
          'Fully Licensed & Insured',
          'Over 3,000+ Google Reviews',
          'Local Service Since 1979',
          'Fast Solutions For Any Pest Problems',
        ];

        defaultBenefits.forEach(benefit => {
          const li = document.createElement('li');
          li.textContent = benefit;
          benefitsList.appendChild(li);
        });

        // Welcome button
        const welcomeButton = document.createElement('button');
        welcomeButton.className = 'dh-welcome-button';
        welcomeButton.innerHTML = `
          <span>${config.welcomeButtonText || 'Start My Free Estimate'}</span>
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
        if (config.heroImageUrl) {
          welcomeHero.style.backgroundImage = `url(${config.heroImageUrl})`;
        }

        // Set welcome screen background in bottom corner
        const bgSvg = document.createElement('div');
        bgSvg.className = 'dh-welcome-svg-background';
        // bgSvg.innerHTML = ``

        // Assemble welcome container
        welcomeContainer.appendChild(welcomeContent);
        welcomeContainer.appendChild(welcomeHero);
        welcomeContainer.appendChild(bgSvg);

        return welcomeContainer;
      };

      // Create inline form widget (renamed for clarity)
      const createInlineWidget = () => {
        // Create main form container
        const formWidget = document.createElement('div');
        formWidget.className = 'dh-form-widget';
        formWidget.id = 'dh-form-widget';

        // Create form elements
        const formContainer = document.createElement('div');
        formContainer.id = 'dh-form-container';

        // Create header
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
          content: content,
          subtitle: subtitleEl, // May be null if no subtitle text provided
          progressBar: globalProgressBar,
          steps: {
            welcome: document.getElementById('dh-step-welcome'),
            pestIssue: document.getElementById('dh-step-pest-issue'),
            address: document.getElementById('dh-step-address'),
            urgency: document.getElementById('dh-step-urgency'),
            contact: document.getElementById('dh-step-contact'),
            plans: document.getElementById('dh-step-plans'),
            complete: document.getElementById('dh-step-complete'),
          },
        };
      };

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
            comparison: 'cockroaches',
          },
          roaches: {
            default: 'cockroaches',
            comparison: 'cockroaches',
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
      const updateDynamicText = () => {
        // Wait for DOM to be ready
        setTimeout(() => {
          // Update urgency step pest type
          const urgencyPestType = document.getElementById('urgency-pest-type');
          if (urgencyPestType) {
            const pestText = getPestTypeDisplay(
              widgetState.formData.pestType,
              'default'
            );
            urgencyPestType.textContent = pestText;
          }

          // Update address step pest type
          const addressPestType = document.getElementById('address-pest-type');
          if (addressPestType) {
            const pestText = getPestTypeDisplay(
              widgetState.formData.pestType,
              'default'
            );
            addressPestType.textContent = pestText;
          }

          // Update address step pest icon
          const addressPestIcon = document.getElementById('address-pest-icon');
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
          if (addressCityRefs.length > 0 && widgetState.formData.addressCity) {
            addressCityRefs.forEach(ref => {
              ref.textContent = widgetState.formData.addressCity;
            });
          }
        }, 100); // Small delay to ensure DOM is ready
      };

      // Helper function to add progress bar to a form step
      const addProgressBarToStep = stepElement => {
        const progressBar = createCircularProgress();
        stepElement.insertBefore(progressBar, stepElement.firstChild);
      };

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
        <div class="dh-form-step-content">
          <h2 class="dh-step-heading">What's your main pest issue?</h2>
          <p class="dh-step-instruction">What kind of pest issue are you experiencing?</p>
          <div class="dh-pest-selection">
            ${pestOptionsHtml}
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
        <p class="dh-step-instruction">Dealing with pests is a hassle, but our licensed and trained techs will have you free of ants in no time! </p>
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
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-secondary" onclick="nextStep()" disabled id="address-next">Continue <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
      </div>
    `;
        steps.push(addressStep);

        // Step 4: Urgency
        const urgencyStep = document.createElement('div');
        urgencyStep.className = 'dh-form-step';
        urgencyStep.id = 'dh-step-urgency';
        urgencyStep.innerHTML = `
        <div class="dh-form-step-content">
      <h2 class="dh-step-heading">Excellent. How soon are you wanting to get rid of those pesky <span id="urgency-pest-type">pests</span>?</h2>
      <p class="dh-step-instruction">Select your preferred timeline to continue</p>
      <div class="dh-urgency-selection">
        <div class="dh-urgency-option" data-urgency="yesterday">Yesterday! (we hear you)</div>
        <div class="dh-urgency-option" data-urgency="1-2-days">Within 1-2 days</div>
        <div class="dh-urgency-option" data-urgency="next-week">Within the next week</div>
        <div class="dh-urgency-option" data-urgency="no-rush">I&apos;m not in a rush</div>
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
      <h2 class="dh-step-heading">Great! We can take care of those <span id="offer-pest-type">pests</span>, usually within one business day, starting at just <span id="offer-price">$229</span>.</h2>
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
          <label class="dh-form-label">First Name</label>
          <input type="text" class="dh-form-input" id="first-name-input" placeholder="John">
        </div>
        <div class="dh-form-group">
          <label class="dh-form-label">Last Name</label>
          <input type="text" class="dh-form-input" id="last-name-input" placeholder="Smith">
        </div>
      </div>
      <div class="dh-form-group">
        <label class="dh-form-label">Email Address</label>
        <input type="email" class="dh-form-input" id="email-input" placeholder="john@example.com">
      </div>
      <div class="dh-form-group">
        <label class="dh-form-label">Cell Phone Number</label>
        <input type="tel" class="dh-form-input" id="phone-input" placeholder="(555) 123-4567">
      </div>
      <div class="dh-form-row">
        <div class="dh-form-group">
          <label class="dh-form-label">Preferred Start Date</label>
          <input type="date" class="dh-form-input" id="start-date-input">
        </div>
        <div class="dh-form-group">
          <label class="dh-form-label">Preferred Arrival Time</label>
          <select class="dh-form-input" id="arrival-time-input">
            <option value="">Select time</option>
            <option value="morning">Morning (8 AM - 12 PM)</option>
            <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
            <option value="evening">Evening (5 PM - 8 PM)</option>
            <option value="anytime">Anytime</option>
          </select>
        </div>
      </div>
      <div class="dh-form-group">
        <label class="dh-form-checkbox-label">
          <input type="checkbox" class="dh-form-checkbox" id="terms-checkbox">
          I agree with the terms and conditions and also happily agree to receive information via email, text message, phone, etc. (Don&apos;t worry, we won&apos;t overdo it.)
        </label>
      </div>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back form-submit-step-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="submitForm()" disabled id="contact-submit">Schedule My Service</button>
      </div>
    `;
        steps.push(contactStep);

        // Step 6b: Quote Contact Info (Simple form for quote path)
        const quoteContactStep = document.createElement('div');
        quoteContactStep.className = 'dh-form-step';
        quoteContactStep.id = 'dh-step-quote-contact';
        quoteContactStep.innerHTML = `
        <div class="dh-form-step-content">
      <h2 class="dh-step-heading">Let&apos;s get you a detailed quote</h2>
      <p class="dh-step-instruction">We just need a few details to prepare your personalized quote.</p>
      <div class="dh-form-row">
        <div class="dh-form-group">
          <label class="dh-form-label">First Name</label>
          <input type="text" class="dh-form-input" id="quote-first-name-input" placeholder="John">
        </div>
        <div class="dh-form-group">
          <label class="dh-form-label">Last Name</label>
          <input type="text" class="dh-form-input" id="quote-last-name-input" placeholder="Smith">
        </div>
      </div>
      <div class="dh-form-group">
        <label class="dh-form-label">Email Address</label>
        <input type="email" class="dh-form-input" id="quote-email-input" placeholder="john@example.com">
      </div>
      <div class="dh-form-group">
        <label class="dh-form-label">Phone Number</label>
        <input type="tel" class="dh-form-input" id="quote-phone-input" placeholder="(555) 123-4567">
      </div>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="proceedToQuote()" disabled id="quote-contact-submit">Get a Quote</button>
      </div>
    `;
        steps.push(quoteContactStep);

        // Step 7: Plan Comparison (for detailed quote path)
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

        // Step 7: Exit Survey
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
        <textarea class="dh-form-input" id="exit-feedback" placeholder="Any other feedback?" rows="3"></textarea>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-primary" id="survey-submit">We&apos;re done here</button>
      </div>
      </div>
    `;
        steps.push(exitSurveyStep);

        // Step 8: Plan Recommendation
        const planStep = document.createElement('div');
        planStep.className = 'dh-form-step';
        planStep.id = 'dh-step-plans';
        planStep.innerHTML = `
      <h3>Here are our recommended service plans:</h3>
      <div class="dh-plans-container" id="plans-container">
        <!-- Plans will be dynamically ordered with recommended plan first -->
      </div>
      <div class="dh-plans-footer">**initial fees may apply</div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="nextStep()">Schedule Service</button>
      </div>
    `;
        steps.push(planStep);

        // Step 7: Out of Service Area
        const outOfServiceStep = document.createElement('div');
        outOfServiceStep.className = 'dh-form-step';
        outOfServiceStep.id = 'dh-step-out-of-service';
        outOfServiceStep.innerHTML = `
        <div class="dh-form-step-content">
      <div class="dh-form-out-of-service">
        <h3>We're sorry, we don't currently service your area</h3>
        <p>Unfortunately, your location is outside our current service area. We're always expanding, so please check back with us in the future!</p>
      </div>
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" onclick="changeAddress()">Try Different Address</button>
        </div>
      </div>
    `;
        steps.push(outOfServiceStep);

        // Step 6: Complete
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

        // Step 6b: Decline Complete (for exit survey submissions)
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

        // Recovery Step: Show recovery prompt
        const recoveryStep = document.createElement('div');
        recoveryStep.className = 'dh-form-step';
        recoveryStep.id = 'dh-step-recovery';
        recoveryStep.innerHTML = `
      <div class="dh-form-recovery">
        <h3>Continue where you left off?</h3>
        <p>We found that you started this form earlier. Would you like to continue from where you left off, or start fresh?</p>
        <div class="dh-recovery-info">
          <div class="dh-recovery-detail">
            <strong>Previously entered:</strong>
            <ul id="dh-recovery-details">
              <!-- Details will be populated by JavaScript -->
            </ul>
          </div>
        </div>
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" onclick="startFresh()">Start Fresh</button>
          <button class="dh-form-btn dh-form-btn-primary" onclick="continueForm()">Continue Form</button>
        </div>
      </div>
    `;
        steps.push(recoveryStep);

        return steps;
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
        // Update header text if not overridden by data attributes
        if (
          (!config.headerText || config.headerText.trim() === '') &&
          cachedConfig.headers &&
          cachedConfig.headers.headerText &&
          cachedConfig.headers.headerText.trim() !== ''
        ) {
          elements.title.textContent = cachedConfig.headers.headerText;
        }

        // Update subtitle if not overridden by data attributes
        if (
          (!config.subHeaderText || config.subHeaderText.trim() === '') &&
          cachedConfig.headers &&
          cachedConfig.headers.subHeaderText &&
          cachedConfig.headers.subHeaderText.trim() !== ''
        ) {
          if (elements.subtitle) {
            elements.subtitle.textContent = cachedConfig.headers.subHeaderText;
          } else {
            // Create subtitle element if it doesn't exist but config provides text
            const subtitleEl = document.createElement('p');
            subtitleEl.id = 'dh-form-subtitle';
            subtitleEl.textContent = cachedConfig.headers.subHeaderText;
            elements.header.appendChild(subtitleEl);
            elements.subtitle = subtitleEl;
          }
        }

        // Update styles with resolved colors - only update colors not provided via data attributes
        if (cachedConfig.colors) {
          // Merge API colors with data attribute colors, preferring data attributes
          const mergedColors = {
            primary: config.colors.primary || cachedConfig.colors.primary,
            secondary: config.colors.secondary || cachedConfig.colors.secondary,
            background:
              config.colors.background || cachedConfig.colors.background,
            text: config.colors.text || cachedConfig.colors.text,
          };

          // Only update colors if they differ from what's already set
          const currentColors = getInitialColors();
          const hasColorChanges = Object.keys(mergedColors).some(
            key => mergedColors[key] !== currentColors[key]
          );

          if (hasColorChanges) {
            updateWidgetColors(mergedColors);
          }
        }

        // Update welcome step with messaging config
        updateWelcomeStep();

        // Update pest options with loaded config
        updatePestOptionsAfterConfigLoad();
      };

      // Update pest options after config is loaded
      const updatePestOptionsAfterConfigLoad = () => {
        const pestStep = document.getElementById('dh-step-pest-issue');
        if (pestStep && widgetState.widgetConfig?.pestOptions) {
          // Generate pest options dynamically from loaded config
          const pestOptionsHtml = widgetState.widgetConfig.pestOptions
            .map(
              pest => `
            <div class="dh-pest-option" data-pest="${pest.value}" data-category="${pest.category}">
              <div class="dh-pest-icon">${pest.icon}</div>
              <div class="dh-pest-label">${pest.label}</div>
            </div>
          `
            )
            .join('');

          // Update the pest selection HTML
          const pestSelection = pestStep.querySelector('.dh-pest-selection');
          if (pestSelection) {
            pestSelection.innerHTML = pestOptionsHtml;
            // Re-setup validation for the updated pest step
            setupStepValidation('pest-issue');
          }
        }
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

          // Update modal overflow behavior
          updateModalOverflow(stepName);

          // Update progress bar
          updateProgressBar(stepName);

          // Update dynamic text based on form data
          updateDynamicText();

          // Load plans when reaching plan selection step
          if (stepName === 'plan-selection') {
            loadSuggestedPlans();
          }
        }
      };

      // Update progress bar
      const updateProgressBar = stepName => {
        // Update the current step in widget state
        widgetState.currentStep = stepName;

        // Find and update the global progress bar
        const globalProgressBar = document.getElementById(
          'dh-global-progress-bar'
        );

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

      // Global functions for step navigation (exposed to window for onclick handlers)
      window.nextStep = async () => {
        const steps = [
          'welcome',
          'pest-issue',
          'address',
          'urgency',
          'plans',
          'contact',
          'out-of-service',
        ];
        const currentIndex = steps.indexOf(widgetState.currentStep);

        // Special handling for address step - validate service area
        if (widgetState.currentStep === 'address') {
          const addressNext = document.getElementById('address-next');

          // Show loading state
          if (addressNext) {
            addressNext.disabled = true;
            addressNext.textContent = 'Checking Service Area...';
          }

          try {
            const validationResult = await validateServiceArea();

            if (validationResult.served) {
              // User is in service area, save partial lead and proceed to contact step

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
              const completionStatus =
                progressiveFormManager.calculateStepCompletion();

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
            const completionStatus =
              progressiveFormManager.calculateStepCompletion();
            // Address step completed (fallback)

            showStep('urgency');
            setupStepValidation('urgency');
          } finally {
            // Reset button state
            if (addressNext) {
              addressNext.disabled = false;
              addressNext.textContent = 'Next';
            }
          }
          return;
        }

        // Normal step navigation for other steps
        if (currentIndex >= 0 && currentIndex < steps.length - 1) {
          const nextStep = steps[currentIndex + 1];
          showStep(nextStep);

          // Set up form validation for the new step
          setupStepValidation(nextStep);
        }
      };

      window.previousStep = () => {
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
            // If user came from "Let's Schedule" path from plan comparison
            if (
              widgetState.formData.offerChoice === 'schedule-from-comparison'
            ) {
              prevStep = 'plan-comparison';
            } else if (widgetState.formData.offerChoice === 'schedule') {
              // If user came from "Let's Schedule" path from initial offer
              prevStep = 'initial-offer';
            } else if (widgetState.formData.selectedPlanId) {
              // If user came from plan comparison (has selected a plan)
              prevStep = 'plan-comparison';
            } else {
              // Fallback to urgency if no offer choice recorded
              prevStep = 'urgency';
            }
            break;
          case 'quote-contact':
            prevStep = 'initial-offer';
            break;
          case 'plan-comparison':
            prevStep = 'quote-contact';
            break;
          case 'exit-survey':
            // Check where user came from
            if (widgetState.formData.offerChoice === 'decline') {
              prevStep = 'initial-offer';
            } else if (
              widgetState.formData.offerChoice === 'decline-comparison'
            ) {
              prevStep = 'plan-comparison';
            } else {
              prevStep = 'initial-offer'; // Default fallback
            }
            break;
          case 'plans':
            // Legacy step - go back to urgency
            prevStep = 'urgency';
            break;
          default:
            // Fallback: try to use linear progression
            const steps = [
              'welcome',
              'pest-issue',
              'address',
              'urgency',
              'initial-offer',
              'contact',
            ];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex > 0) {
              prevStep = steps[currentIndex - 1];
            }
        }

        if (prevStep) {
          showStep(prevStep);
          setupStepValidation(prevStep);
        }
      };

      // Proceed to quote function - navigate from quote-contact to plan-comparison
      window.proceedToQuote = () => {
        // Save quote contact info
        const quoteFirstName = document
          .getElementById('quote-first-name-input')
          ?.value.trim();
        const quoteLastName = document
          .getElementById('quote-last-name-input')
          ?.value.trim();
        const quoteEmail = document
          .getElementById('quote-email-input')
          ?.value.trim();
        const quotePhone = document
          .getElementById('quote-phone-input')
          ?.value.trim();

        if (quoteFirstName && quoteLastName && quoteEmail && quotePhone) {
          widgetState.formData.contactInfo = {
            firstName: quoteFirstName,
            lastName: quoteLastName,
            name: `${quoteFirstName} ${quoteLastName}`,
            email: quoteEmail,
            phone: quotePhone,
          };

          // Navigate to plan comparison
          showStep('plan-comparison');
          setupStepValidation('plan-comparison');
          updateProgressBar('plan-comparison');
        }
      };

      // Select plan function - for plan comparison step
      window.selectPlan = planId => {
        // Store selected plan
        widgetState.formData.selectedPlanId = planId;

        // Navigate to contact form for final submission
        showStep('contact');
        setupStepValidation('contact');
        updateProgressBar('contact');
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
          widgetState.formData.latitude = '';
          widgetState.formData.longitude = '';

          // Reset image state
          const loadingEl = document.getElementById('image-loading');
          const imageEl = document.getElementById('address-image');
          const errorEl = document.getElementById('image-error');
          if (loadingEl) loadingEl.style.display = 'none';
          if (imageEl) imageEl.style.display = 'none';
          if (errorEl) errorEl.style.display = 'none';

          // Navigate back to address step
          showStep('address');
          setupStepValidation('address');
        }
      };

      // Service area validation function
      window.validateServiceArea = async () => {
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

      // Partial lead save function
      window.savePartialLead = async (
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

      // Form recovery functions
      window.checkForPartialLead = async () => {
        if (!widgetState.sessionId) {
          console.warn('No session ID available for recovery check');
          return null;
        }

        try {
          const response = await fetch(
            config.baseUrl + '/api/widget/recover-form',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                companyId: config.companyId,
                sessionId: widgetState.sessionId,
              }),
            }
          );

          if (!response.ok) {
            console.error('Recovery check failed:', response.status);
            return null;
          }

          const result = await response.json();
          if (result.success && result.hasPartialLead && !result.expired) {
            return result;
          }

          return null;
        } catch (error) {
          console.error('Error checking for partial lead:', error);
          return null;
        }
      };

      window.recoverFormData = recoveryData => {
        if (!recoveryData || !recoveryData.formData) {
          console.warn('No recovery data provided');
          return false;
        }

        try {
          const formData = recoveryData.formData;

          // Restore form data to widget state
          if (formData.pestType) {
            widgetState.formData.pestType = formData.pestType;
          }

          if (formData.pestIcon) {
            widgetState.formData.pestIcon = formData.pestIcon;
          }

          if (formData.urgency) {
            widgetState.formData.urgency = formData.urgency;
          }

          if (formData.selectedPlan) {
            widgetState.formData.selectedPlan = formData.selectedPlan;
          }

          if (formData.recommendedPlan) {
            widgetState.formData.recommendedPlan = formData.recommendedPlan;
          }

          if (formData.address) {
            widgetState.formData.address = formData.address;
          }

          if (formData.addressDetails) {
            widgetState.formData.addressStreet =
              formData.addressDetails.street || '';
            widgetState.formData.addressCity =
              formData.addressDetails.city || '';
            widgetState.formData.addressState =
              formData.addressDetails.state || '';
            widgetState.formData.addressZip = formData.addressDetails.zip || '';
          }

          if (formData.latitude && formData.longitude) {
            widgetState.formData.latitude = formData.latitude;
            widgetState.formData.longitude = formData.longitude;
          }

          if (formData.contactInfo) {
            widgetState.formData.contactInfo = {
              name: formData.contactInfo.name || '',
              phone: formData.contactInfo.phone || '',
              email: formData.contactInfo.email || '',
              comments: formData.contactInfo.comments || '',
            };
          }

          // Store recovery metadata
          widgetState.recoveryData = {
            partialLeadId: recoveryData.partialLeadId,
            stepCompleted: recoveryData.stepCompleted,
            serviceAreaData: recoveryData.serviceAreaData,
            originalAttribution: recoveryData.attributionData,
            recovered: true,
          };

          return true;
        } catch (error) {
          console.error('Error recovering form data:', error);
          return false;
        }
      };

      // Recovery UI functions
      window.showRecoveryPrompt = recoveryData => {
        try {
          // Populate recovery details
          const detailsList = document.getElementById('dh-recovery-details');
          if (detailsList && recoveryData.formData) {
            detailsList.innerHTML = '';

            if (recoveryData.formData.pestType) {
              const li = document.createElement('li');
              const capitalizedPestType = recoveryData.formData.pestType
                .split(' ')
                .map(
                  word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(' ');
              li.textContent = `Pest issue: ${capitalizedPestType}`;
              detailsList.appendChild(li);
            }

            if (recoveryData.formData.address) {
              const li = document.createElement('li');
              li.textContent = `Address: ${recoveryData.formData.address}`;
              detailsList.appendChild(li);
            }

            if (
              recoveryData.formData.contactInfo &&
              (recoveryData.formData.contactInfo.name ||
                recoveryData.formData.contactInfo.email)
            ) {
              const li = document.createElement('li');
              li.textContent = 'Contact information';
              detailsList.appendChild(li);
            }
          }

          // Show the recovery step
          showStep('recovery');
        } catch (error) {
          console.error('Error showing recovery prompt:', error);
          // Fallback to welcome step
          showStep('welcome');
        }
      };

      window.startFresh = () => {
        try {
          // Clear recovery data and start fresh
          widgetState.recoveryData = null;

          // Reset form data
          widgetState.formData = {
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
          };

          // Reset progressive form manager state
          widgetState.formState = {
            lastSaved: null,
            autoSaveEnabled: true,
            autoSaveInterval: 10000,
            validationErrors: {},
            fieldCompletionStatus: {},
            stepCompletionPercentage: {},
            userEngagement: {
              startTime: new Date().toISOString(),
              returningUser: false,
              stepsVisited: [],
              timeSpentPerStep: {},
              abandonmentPoints: [],
            },
            formVersion: '2.1',
            progressiveFeatures: {
              smartSuggestions: true,
              realTimeValidation: true,
              autoSave: true,
              stepAnalytics: true,
            },
          };

          // Comprehensive localStorage cleanup
          try {
            const keysToRemove = [];

            // Collect all widget-related keys
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (
                key &&
                (key.startsWith('dh_local_form_state_' + config.companyId) ||
                  key.startsWith('dh_session_' + config.companyId) ||
                  key.startsWith('dh_attribution_' + config.companyId) ||
                  key.startsWith('dh_widget_config_' + config.companyId) ||
                  key.startsWith('dh_xd_attr_' + config.companyId) ||
                  key.startsWith('dh_gtm_gclid_' + config.companyId) ||
                  key.startsWith('dh_last_visit_' + config.companyId))
              ) {
                keysToRemove.push(key);
              }
            }

            // Remove all identified keys
            keysToRemove.forEach(key => {
              localStorage.removeItem(key);
            });
          } catch (error) {
            console.warn('Error clearing localStorage (non-critical):', error);
          }

          // Generate new session ID for fresh start
          const newSessionId = generateSessionId();
          localStorage.setItem('dh_session_' + config.companyId, newSessionId);
          widgetState.sessionId = newSessionId;

          // Reset attribution data with fresh session
          widgetState.attributionData = null;

          // Clear auto-save timer and restart
          if (progressiveFormManager.autoSaveTimer) {
            clearInterval(progressiveFormManager.autoSaveTimer);
            progressiveFormManager.autoSaveTimer = null;
          }

          showStep('welcome');
          setupStepValidation('welcome');

          // Reinitialize progressive features
          progressiveFormManager.initializeProgressiveFeatures();
        } catch (error) {
          console.error('Error starting fresh:', error);
          showStep('welcome');
        }
      };

      window.continueForm = () => {
        try {
          if (!widgetState.recoveryData) {
            console.warn('No recovery data available');
            showStep('welcome');
            return;
          }

          const stepCompleted = widgetState.recoveryData.stepCompleted;

          // Navigate to the appropriate step based on what was completed
          if (
            stepCompleted === 'address_completed' ||
            stepCompleted === 'address_validated'
          ) {
            // Address was completed, go to urgency step
            showStep('urgency');
            setTimeout(() => {
              populateAddressFields();
              setupStepValidation('urgency');
            }, 50);
          } else if (stepCompleted === 'urgency_completed') {
            // Urgency was completed, go to initial offer step
            showStep('initial-offer');
            setTimeout(() => {
              populateAddressFields();
              setupStepValidation('initial-offer');
            }, 50);
          } else if (stepCompleted === 'contact_started') {
            // Contact info was started, go to contact step
            showStep('contact');
            // Populate all fields after step is shown
            setTimeout(() => {
              populateAddressFields();
              populateContactFields();
              setupStepValidation('contact');
            }, 50);
          } else if (stepCompleted === 'pest_issue_completed') {
            // Pest issue was completed, go to address step
            showStep('address');
            setTimeout(() => {
              populatePestIssueField();
              setupStepValidation('address');
            }, 50);
          } else {
            // Default fallback - could be 'welcome' or 'pest-issue' steps
            if (widgetState.formData.pestType) {
              showStep('pest-issue');
              setTimeout(() => {
                populatePestIssueField();
                setupStepValidation('pest-issue');
              }, 50);
            } else {
              showStep('welcome');
            }
          }
        } catch (error) {
          console.error('Error continuing form:', error);
          showStep('welcome');
        }
      };

      // Form field population functions
      window.populateAddressFields = () => {
        try {
          const formData = widgetState.formData;

          // Populate address display mode fields if they exist
          const streetInput = document.getElementById('street-input');
          const cityInput = document.getElementById('city-input');
          const stateInput = document.getElementById('state-input');
          const zipInput = document.getElementById('zip-input');

          if (streetInput) streetInput.value = formData.addressStreet || '';
          if (cityInput) cityInput.value = formData.addressCity || '';
          if (stateInput) stateInput.value = formData.addressState || '';
          if (zipInput) zipInput.value = formData.addressZip || '';

          // Also ensure the address step shows display mode if we have address data
          if (formData.address) {
            const searchMode = document.getElementById('address-search-mode');
            const displayMode = document.getElementById('address-display-mode');
            const addressNext = document.getElementById('address-next');

            if (searchMode) searchMode.style.display = 'none';
            if (displayMode) displayMode.style.display = 'block';
            if (addressNext) addressNext.disabled = false;
          }
        } catch (error) {
          console.error('Error populating address fields:', error);
        }
      };

      window.populateContactFields = () => {
        try {
          const contactInfo = widgetState.formData.contactInfo;

          // Try to populate schedule form fields (contact step)
          const firstNameInput = document.getElementById('first-name-input');
          const lastNameInput = document.getElementById('last-name-input');
          const phoneInput = document.getElementById('phone-input');
          const emailInput = document.getElementById('email-input');
          const startDateInput = document.getElementById('start-date-input');
          const arrivalTimeInput =
            document.getElementById('arrival-time-input');

          if (firstNameInput)
            firstNameInput.value = contactInfo.firstName || '';
          if (lastNameInput) lastNameInput.value = contactInfo.lastName || '';
          if (phoneInput) phoneInput.value = contactInfo.phone || '';
          if (emailInput) emailInput.value = contactInfo.email || '';
          if (startDateInput)
            startDateInput.value = contactInfo.startDate || '';
          if (arrivalTimeInput)
            arrivalTimeInput.value = contactInfo.arrivalTime || '';

          // Try to populate quote form fields (quote-contact step)
          const quoteFirstNameInput = document.getElementById(
            'quote-first-name-input'
          );
          const quoteLastNameInput = document.getElementById(
            'quote-last-name-input'
          );
          const quotePhoneInput = document.getElementById('quote-phone-input');
          const quoteEmailInput = document.getElementById('quote-email-input');

          if (quoteFirstNameInput)
            quoteFirstNameInput.value = contactInfo.firstName || '';
          if (quoteLastNameInput)
            quoteLastNameInput.value = contactInfo.lastName || '';
          if (quotePhoneInput) quotePhoneInput.value = contactInfo.phone || '';
          if (quoteEmailInput) quoteEmailInput.value = contactInfo.email || '';
        } catch (error) {
          console.error('Error populating contact fields:', error);
        }
      };

      window.populatePestIssueField = () => {
        try {
          if (widgetState.formData.pestType) {
            // Find and select the pest option
            const pestOptions = document.querySelectorAll('.dh-pest-option');
            pestOptions.forEach(option => {
              if (option.dataset.pest === widgetState.formData.pestType) {
                option.classList.add('selected');
                // No need to enable next button since we removed it
              }
            });
          }
        } catch (error) {
          console.error('Error populating pest issue field:', error);
        }
      };

      // Note: Plan selection removed - plans are now informational only
      // Users proceed to contact step via navigation buttons

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
                <span class="dh-plan-price-frequency">/${plan.billing_frequency}</span>
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

              // Load Street View image
              const streetViewImg = new Image();
              const streetViewPromise = new Promise((resolve, reject) => {
                streetViewImg.onload = () => resolve(streetViewUrl);
                streetViewImg.onerror = () =>
                  reject(new Error('Street View image load failed'));
              });

              streetViewImg.src = streetViewUrl;
              const imageUrl = await streetViewPromise;

              // Display Street View image
              if (imageEl) {
                imageEl.src = imageUrl;
                imageEl.alt = `Street view of ${formatted}`;
                imageEl.style.display = 'block';
              }
              if (loadingEl) loadingEl.style.display = 'none';

              return; // Success - exit function
            } catch (streetViewError) {
              console.warn(
                'Street View image load failed despite metadata OK:',
                streetViewError
              );
              // Fall through to satellite fallback
            }
          }

          // Satellite fallback (either no Street View available or Street View failed)
          try {
            // Use center parameter with specific zoom for precise control
            const satelliteUrl =
              `https://maps.googleapis.com/maps/api/staticmap?` +
              `center=${lat},${lon}&zoom=17&size=515x260&maptype=hybrid&` +
              `markers=color:red%7Clabel:A%7C${lat},${lon}&key=${apiKey}`;

            const satelliteImg = new Image();
            const satellitePromise = new Promise((resolve, reject) => {
              satelliteImg.onload = () => resolve(satelliteUrl);
              satelliteImg.onerror = () =>
                reject(new Error('Satellite view load failed'));
            });

            satelliteImg.src = satelliteUrl;
            const satelliteImageUrl = await satellitePromise;

            // Display satellite image
            if (imageEl) {
              imageEl.src = satelliteImageUrl;
              imageEl.alt = `Satellite view of ${formatted}`;
              imageEl.style.display = 'block';
            }
            if (loadingEl) loadingEl.style.display = 'none';
          } catch (satelliteError) {
            // Both Street View and satellite failed - show error state
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'flex';
            console.warn('Satellite view also failed:', satelliteError);
          }
        } catch (error) {
          // API key or other error - show error state
          if (loadingEl) loadingEl.style.display = 'none';
          if (errorEl) errorEl.style.display = 'flex';
          console.error('Error loading address imagery:', error);
        }
      };

      // Set up form validation for each step
      const setupStepValidation = stepName => {
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
                  // Prevent double-clicking
                  if (option.classList.contains('processing')) return;

                  // Remove selected class from all options
                  pestOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.classList.remove('processing');
                  });

                  // Find the parent pest option element
                  const pestOption = e.target.closest('.dh-pest-option');
                  if (!pestOption) {
                    console.error('Could not find pest option element');
                    return;
                  }

                  // Add selected class and processing state to clicked option
                  pestOption.classList.add('selected');
                  pestOption.classList.add('processing');
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

                  // Show brief visual feedback
                  setTimeout(() => {
                    pestOption.classList.remove('processing');

                    // Update dynamic text now that pestType is set
                    updateDynamicText();

                    // Update step completion tracking
                    const completionStatus =
                      progressiveFormManager.calculateStepCompletion();

                    // Auto-advance to address validation step
                    showStep('address');
                    setupStepValidation('address');
                    updateProgressBar('address');
                  }, 300); // Brief delay for visual feedback
                });
              });
            }
            break;

          case 'address':
            const searchInput = document.getElementById('address-search-input');
            const addressNext = document.getElementById('address-next');
            const addressSuggestions = document.getElementById(
              'address-suggestions'
            );

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
                const searchMode = document.getElementById(
                  'address-search-mode'
                );
                const displayMode = document.getElementById(
                  'address-display-mode'
                );

                // Update editable form fields
                document.getElementById('street-input').value =
                  address.street || '';
                document.getElementById('city-input').value =
                  address.city || '';
                document.getElementById('state-input').value =
                  getStateCodeFromName(address.state);
                document.getElementById('zip-input').value =
                  address.postcode || '';

                // Update form data
                widgetState.formData.addressStreet = address.street || '';
                widgetState.formData.addressCity = address.city || '';
                widgetState.formData.addressState = getStateCodeFromName(
                  address.state
                );
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

          case 'urgency':
            const urgencyOptions =
              document.querySelectorAll('.dh-urgency-option');

            if (urgencyOptions) {
              urgencyOptions.forEach(option => {
                option.addEventListener('click', async e => {
                  // Prevent double-clicking
                  if (option.classList.contains('processing')) return;

                  // Remove selected class from all options
                  urgencyOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.classList.remove('processing');
                  });

                  // Add selected class and processing state to clicked option
                  e.target.classList.add('selected');
                  e.target.classList.add('processing');

                  // Store selection
                  widgetState.formData.urgency = e.target.dataset.urgency;

                  // Save progress immediately
                  try {
                    const partialSaveResult = await savePartialLead(
                      { served: false, status: 'unknown' }, // Service area unknown until address validated
                      'urgency_completed'
                    );
                    if (!partialSaveResult.success) {
                      console.warn(
                        'Failed to save urgency selection:',
                        partialSaveResult.error
                      );
                    }
                  } catch (error) {
                    console.warn('Error saving urgency selection:', error);
                  }

                  // Show brief visual feedback
                  setTimeout(() => {
                    e.target.classList.remove('processing');

                    // Update step completion tracking
                    const completionStatus =
                      progressiveFormManager.calculateStepCompletion();

                    // Auto-advance to initial offer step
                    showStep('initial-offer');
                    setupStepValidation('initial-offer');
                    updateProgressBar('initial-offer');
                  }, 300); // Brief delay for visual feedback
                });
              });
            }
            break;

          case 'initial-offer':
            const letsScheduleBtn = document.getElementById('lets-schedule');
            const detailedQuoteBtn = document.getElementById('detailed-quote');
            const noThanksBtn = document.getElementById('no-thanks');
            const offerPrice = document.getElementById('offer-price');

            // Update price based on available service plans
            if (offerPrice) {
              // Get suggested plans to show starting price
              fetch(config.baseUrl + '/api/widget/suggested-plans', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  companyId: config.companyId,
                  selectedPests: [widgetState.formData.pestType],
                }),
              })
                .then(response => response.json())
                .then(data => {
                  if (
                    data.success &&
                    data.suggestions &&
                    data.suggestions.length > 0
                  ) {
                    const lowestPrice = Math.min(
                      ...data.suggestions.map(plan => plan.initial_price)
                    );
                    offerPrice.textContent = `$${lowestPrice}`;
                  } else {
                    offerPrice.textContent = '$'; // Fallback price
                  }
                })
                .catch(error => {
                  console.warn('Error fetching plan prices:', error);
                  offerPrice.textContent = '$'; // Fallback price
                });
            }

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
                // Navigate to quote contact step first
                showStep('quote-contact');
                setupStepValidation('quote-contact');
                updateProgressBar('quote-contact');
              });
            }

            if (noThanksBtn) {
              noThanksBtn.addEventListener('click', () => {
                widgetState.formData.offerChoice = 'decline';
                // Navigate to exit survey step
                showStep('exit-survey');
                setupStepValidation('exit-survey');
                updateProgressBar('exit-survey');
              });
            }
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

                // Show loading state
                if (comparisonPlanLoading) {
                  comparisonPlanLoading.style.display = 'block';
                }

                // Get suggested plans
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
                  // Limit to first 3 plans (best matches)
                  const plans = data.suggestions.slice(0, 3);

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
                        <span class="dh-plan-price-label">Just $${plan.initial_price} to get started.</span>
                      </div>
                      <p class="dh-plan-price-detail">Service continues after the initial service at $${plan.recurring_price}/${plan.billing_frequency}.</p>
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
                  <button class="dh-form-btn dh-form-btn-primary" onclick="selectPlan('${plan.id}', '${plan.plan_name}')">
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

            // Tab switching functionality
            window.switchPlanTab = tabIndex => {
              const tabs = document.querySelectorAll('.dh-plan-tab');
              const contentContainer = document.getElementById(
                'comparison-plan-content'
              );

              if (
                !window.comparisonPlansData ||
                !window.comparisonPlansData[tabIndex]
              )
                return;

              // Update tab active states
              tabs.forEach((tab, index) => {
                if (index === tabIndex) {
                  tab.classList.add('active');
                } else {
                  tab.classList.remove('active');
                }
              });

              // Update content
              const newContent = generatePlanContent(
                window.comparisonPlansData[tabIndex]
              );
              contentContainer.innerHTML = newContent;
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

            // Load plans when the step is shown
            loadComparisonPlans();

            // Note: "No Thanks" functionality now handled by declinePlanComparison() function
            break;

          case 'exit-survey':
            const surveyOptions =
              document.querySelectorAll('.dh-survey-option');
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
                  // Enable submit button
                  if (surveySubmitBtn) surveySubmitBtn.disabled = false;
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

          case 'quote-contact':
            const quoteFirstNameInput = document.getElementById(
              'quote-first-name-input'
            );
            const quoteLastNameInput = document.getElementById(
              'quote-last-name-input'
            );
            const quoteEmailInput =
              document.getElementById('quote-email-input');
            const quotePhoneInput =
              document.getElementById('quote-phone-input');
            const quoteSubmitBtn = document.getElementById(
              'quote-contact-submit'
            );

            // Form validation for quote contact
            const validateQuoteForm = () => {
              const isValid =
                quoteFirstNameInput.value.trim() &&
                quoteLastNameInput.value.trim() &&
                quoteEmailInput.value.trim() &&
                quotePhoneInput.value.trim();

              if (quoteSubmitBtn) {
                quoteSubmitBtn.disabled = !isValid;
              }
            };

            // Add event listeners for real-time validation
            [
              quoteFirstNameInput,
              quoteLastNameInput,
              quoteEmailInput,
              quotePhoneInput,
            ].forEach(input => {
              if (input) {
                input.addEventListener('input', validateQuoteForm);
                input.addEventListener('blur', validateQuoteForm);
              }
            });

            // Initial validation
            validateQuoteForm();
            break;

          case 'contact':
            const firstNameInput = document.getElementById('first-name-input');
            const lastNameInput = document.getElementById('last-name-input');
            const phoneInput = document.getElementById('phone-input');
            const emailInput = document.getElementById('email-input');
            const startDateInput = document.getElementById('start-date-input');
            const arrivalTimeInput =
              document.getElementById('arrival-time-input');
            const termsCheckbox = document.getElementById('terms-checkbox');
            const submitBtn = document.getElementById('contact-submit');

            if (
              firstNameInput &&
              lastNameInput &&
              phoneInput &&
              emailInput &&
              submitBtn
            ) {
              // Pre-fill form fields with existing contact info (if available)
              const prefillContactForm = () => {
                const contactInfo = widgetState.formData.contactInfo;

                if (contactInfo) {
                  // Pre-fill name fields
                  if (contactInfo.firstName && !firstNameInput.value) {
                    firstNameInput.value = contactInfo.firstName;
                    firstNameInput.classList.add('dh-prefilled-field');
                  }
                  if (contactInfo.lastName && !lastNameInput.value) {
                    lastNameInput.value = contactInfo.lastName;
                    lastNameInput.classList.add('dh-prefilled-field');
                  }

                  // Pre-fill email
                  if (contactInfo.email && !emailInput.value) {
                    emailInput.value = contactInfo.email;
                    emailInput.classList.add('dh-prefilled-field');
                  }

                  // Pre-fill phone
                  if (contactInfo.phone && !phoneInput.value) {
                    phoneInput.value = contactInfo.phone;
                    phoneInput.classList.add('dh-prefilled-field');
                  }
                }

                // Note: Start date and arrival time are left empty for user to choose
              };

              // Execute pre-fill
              prefillContactForm();

              // Add event listeners to remove prefilled styling when user edits fields
              const removePrefillStyling = input => {
                input.addEventListener('input', () => {
                  input.classList.remove('dh-prefilled-field');
                });
              };

              [firstNameInput, lastNameInput, emailInput, phoneInput].forEach(
                input => {
                  if (input && input.classList.contains('dh-prefilled-field')) {
                    removePrefillStyling(input);
                  }
                }
              );
              const validateContactForm = () => {
                const firstName = firstNameInput.value.trim();
                const lastName = lastNameInput.value.trim();
                const phone = phoneInput.value.trim();
                const email = emailInput.value.trim();
                const startDate = startDateInput
                  ? startDateInput.value.trim()
                  : '';
                const arrivalTime = arrivalTimeInput
                  ? arrivalTimeInput.value.trim()
                  : '';
                const termsAccepted = termsCheckbox
                  ? termsCheckbox.checked
                  : false;

                widgetState.formData.contactInfo = {
                  firstName,
                  lastName,
                  name: `${firstName} ${lastName}`, // Legacy compatibility
                  phone,
                  email,
                  startDate,
                  arrivalTime,
                  termsAccepted,
                };

                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isValidEmail = emailRegex.test(email);

                const isValid =
                  firstName &&
                  lastName &&
                  phone &&
                  email &&
                  isValidEmail &&
                  startDate &&
                  arrivalTime &&
                  termsAccepted;
                submitBtn.disabled = !isValid;
              };

              // Add event listeners for all form fields
              [firstNameInput, lastNameInput, phoneInput, emailInput].forEach(
                input => {
                  if (input) {
                    input.addEventListener('input', validateContactForm);
                    input.addEventListener('blur', validateContactForm);
                  }
                }
              );

              if (startDateInput)
                startDateInput.addEventListener('change', validateContactForm);
              if (arrivalTimeInput)
                arrivalTimeInput.addEventListener(
                  'change',
                  validateContactForm
                );
              if (termsCheckbox)
                termsCheckbox.addEventListener('change', validateContactForm);

              // Initial validation
              validateContactForm();
            }
            break;

          case 'plans':
            // Determine recommended plan based on pest type
            const pestType = widgetState.formData.pestType;
            let recommendedPlan = 'defense'; // default

            if (pestType === 'rodents') {
              recommendedPlan = 'smartdefense';
            } else if (pestType === 'termites') {
              recommendedPlan = 'smartdefense-complete';
            }

            // Store the recommended plan
            widgetState.formData.recommendedPlan = recommendedPlan;

            // Generate plans with recommended plan first
            const generatePlanHTML = (planType, isRecommended) => {
              const planData = {
                defense: {
                  title: 'DEFENSE PLAN',
                  header: '#10b981',
                  features: [
                    'Year-Round Pest Protection',
                    '4 Seasonal Services',
                    'General Pest Control',
                    'Free Re-Treat Service',
                    {
                      text: 'SMART Monitoring System For Rodents',
                      enabled: false,
                    },
                    { text: 'Termite Monitoring', enabled: false },
                    { text: 'Termite Baiting System', enabled: false },
                  ],
                },
                smartdefense: {
                  title: 'SMARTDEFENSE',
                  header: '#06b6d4',
                  features: [
                    'Year-Round Pest Protection',
                    '4 Seasonal Services',
                    'General Pest Control',
                    'Free Re-Treat Service',
                    {
                      text: 'SMART Monitoring System For Rodents',
                      enabled: true,
                    },
                    { text: 'Termite Monitoring', enabled: false },
                    { text: 'Termite Baiting System', enabled: false },
                  ],
                },
                'smartdefense-complete': {
                  title: 'SMARTDEFENSE COMPLETE',
                  header: '#1e40af',
                  features: [
                    'Year-Round Pest Protection',
                    '4 Seasonal Services',
                    'General Pest Control',
                    'Free Re-Treat Service',
                    {
                      text: 'SMART Monitoring System For Rodents',
                      enabled: true,
                    },
                    { text: 'Termite Monitoring', enabled: true },
                    { text: 'Termite Baiting System', enabled: true },
                  ],
                },
              };

              const plan = planData[planType];
              const featuresHTML = plan.features
                .map(feature => {
                  if (typeof feature === 'string') {
                    return `<div class="dh-plan-feature">${feature}</div>`;
                  } else {
                    const className = feature.enabled
                      ? 'dh-plan-feature dh-plan-feature-enabled'
                      : 'dh-plan-feature dh-plan-feature-disabled';
                    return `<div class="${className}">${feature.text}</div>`;
                  }
                })
                .join('');

              // Add pricing text for Defense Plan when recommended
              const pricingText =
                planType === 'defense' && isRecommended
                  ? '<div class="dh-plan-pricing" style="color: #10b981; font-weight: bold; margin-bottom: 12px; text-align: center;">Starting at $49/month</div>'
                  : '';

              return `
                <div class="dh-plan-card ${isRecommended ? 'recommended' : ''}" data-plan="${planType}" id="${planType}-plan">
                  <div class="dh-plan-header">${plan.title}</div>
                  <div class="dh-plan-content">
                    ${pricingText}
                    <div class="dh-plan-included">What&apos;s included:</div>
                    ${featuresHTML}
                  </div>
                </div>
              `;
            };

            // Order plans with recommended plan first
            const allPlans = [
              'defense',
              'smartdefense',
              'smartdefense-complete',
            ];
            const orderedPlans = [
              recommendedPlan,
              ...allPlans.filter(p => p !== recommendedPlan),
            ];

            // Generate HTML with recommended plan first
            const plansHTML = orderedPlans
              .map(planType =>
                generatePlanHTML(planType, planType === recommendedPlan)
              )
              .join('');

            // Insert the dynamically ordered plans
            const plansContainer = document.getElementById('plans-container');
            if (plansContainer) {
              plansContainer.innerHTML = plansHTML;
            }
            break;
        }
      };

      // Update welcome step with messaging configuration
      const updateWelcomeStep = () => {
        const welcomeStep = document.getElementById('dh-step-welcome');
        if (welcomeStep) {
          // Clear existing content and replace with new design
          welcomeStep.innerHTML = '';
          const welcomeContent = createWelcomeScreenContent();
          welcomeStep.appendChild(welcomeContent);
        }
      };

      // Resolve initial colors from data attributes with fallbacks
      const getInitialColors = () => {
        const defaultColors = {
          primary: '#3b82f6',
          secondary: '#1e293b',
          background: '#ffffff',
          text: '#374151',
        };

        // Use data attribute colors if available, otherwise use defaults
        return {
          primary: config.colors.primary || defaultColors.primary,
          secondary: config.colors.secondary || defaultColors.secondary,
          background: config.colors.background || defaultColors.background,
          text: config.colors.text || defaultColors.text,
        };
      };

      // Initialize widget
      const init = async () => {
        try {
          // Create styles with initial colors from data attributes
          const initialColors = getInitialColors();
          createStyles(initialColors);
          elements = createWidget();

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
                'DH Widget: No script parent node available for insertion'
              );
            }
          }

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

          // Initialize attribution tracking
          initializeAttributionTracking();

          // Initialize progressive form features
          progressiveFormManager.initializeProgressiveFeatures();

          // Setup cleanup on page unload
          window.addEventListener('beforeunload', () => {
            progressiveFormManager.cleanup();
          });

          // Setup cleanup on widget close (if minimize functionality exists)
          const minimizeBtn = document.querySelector('.dh-widget-minimize');
          if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
              progressiveFormManager.recordAbandonmentPoint(
                widgetState.currentStep,
                'widget_minimized'
              );
            });
          }

          // Check for form recovery after attribution is initialized
          const recoveryData = await checkForPartialLead();
          if (recoveryData) {
            const recovered = recoverFormData(recoveryData);
            if (recovered) {
              // Show recovery prompt instead of going directly to welcome
              showRecoveryPrompt(recoveryData);
              return;
            }
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

      // iOS detection function
      const isIOS = () => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      };

      // Apply iOS-specific class for safe area handling
      const handleIOSStyles = () => {
        if (isIOS()) {
          const widgetContainer = document.getElementById(
            'dh-widget-' + config.companyId
          );
          if (widgetContainer) {
            widgetContainer.classList.add('dh-ios-device');
          }
        }
      };

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          init();
          handleIOSStyles();
        });
      } else {
        init();
        handleIOSStyles();
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
