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
      displayMode: scriptTag.getAttribute('data-display-mode') || 'inline',
      buttonText:
        scriptTag.getAttribute('data-button-text') || 'Get Free Quote',
      modalCloseOnBackdrop:
        scriptTag.getAttribute('data-modal-close-on-backdrop') !== 'false',
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
            console.log('Using cross-domain attribution data as fallback');
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

              console.log('Cross-domain linker cookies created');
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
              console.log(
                'Link decorated for cross-domain tracking:',
                link.href
              );
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
                console.log('OneTrust consent changed, updating attribution');
                cookieConsentManager.updateAttributionOnConsentChange();
              });
            }

            // Cookiebot listener
            if (typeof Cookiebot !== 'undefined') {
              window.addEventListener('CookiebotOnConsentReady', () => {
                console.log('Cookiebot consent ready, updating attribution');
                cookieConsentManager.updateAttributionOnConsentChange();
              });
            }

            // Generic consent change listener
            window.addEventListener('cookie_consent_changed', () => {
              console.log('Generic consent changed, updating attribution');
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

            console.log('Progressive form features initialized');
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
            pest_issue: widgetState.formData.pestIssue ? 100 : 0,
            address:
              (widgetState.formData.address ? 50 : 0) +
              (widgetState.formData.latitude ? 50 : 0),
            home_size: widgetState.formData.homeSize ? 100 : 0,
            contact:
              (widgetState.formData.contactInfo.name ? 34 : 0) +
              (widgetState.formData.contactInfo.email ? 33 : 0) +
              (widgetState.formData.contactInfo.phone ? 33 : 0),
          };

          const overall =
            Object.values(steps).reduce((sum, val) => sum + val, 0) /
            Object.keys(steps).length;

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
            console.log('Form state saved locally');
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
      .dh-pest-selection {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 20px 0;
      }
      .dh-pest-option {
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
      .dh-pest-option:hover {
        border-color: ${primaryColor};
        background: ${primaryFocus};
      }
      .dh-pest-option.selected {
        border-color: ${primaryColor};
        background: ${primaryColor};
        color: white;
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
      .dh-urgency-option:hover {
        border-color: ${primaryColor};
        background: ${primaryFocus};
      }
      .dh-urgency-option.selected {
        border-color: ${primaryColor};
        background: ${primaryColor};
        color: white;
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
      .dh-plan-feature {
        margin: 8px 0;
        font-size: 14px;
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
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        padding: 20px;
        box-sizing: border-box;
      }
      
      .dh-modal-content {
        border-radius: 12px;
        max-width: 100%;
        width: auto;
        max-height: 90vh;
        overflow: visible;
        position: relative;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      
      .dh-modal-body {
        max-height: 90vh;
        overflow-y: auto;
        padding: 0;
      }
      
      .dh-modal-close {
        position: absolute;
        top: -10px;
        right: -10px;
        background: #fff;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
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
        border-radius: 12px;
        padding: 0;
      }
      
      .dh-modal-body .dh-form-header {
        padding: 24px 24px 16px 24px;
        margin: 0;
      }
      
      .dh-modal-body .dh-form-content {
        padding: 0 24px 24px 24px;
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
        }
        
        .dh-modal-close {
          top: 8px;
          right: 8px;
          width: 36px;
          height: 36px;
          font-size: 20px;
        }
        
        .dh-widget-button {
          padding: 14px 28px;
          font-size: 16px;
          width: 100%;
          max-width: 300px;
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

      // Create inline form widget (renamed for clarity)
      const createInlineWidget = () => {
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
            urgency: document.getElementById('dh-step-urgency'),
            contact: document.getElementById('dh-step-contact'),
            plans: document.getElementById('dh-step-plans'),
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
      <h3>What&apos;s your main pest issue?</h3>
      <div class="dh-pest-selection">
        <div class="dh-pest-option" data-pest="ants">Ants</div>
        <div class="dh-pest-option" data-pest="spiders">Spiders</div>
        <div class="dh-pest-option" data-pest="cockroaches">Cockroaches</div>
        <div class="dh-pest-option" data-pest="rodents">Rodents (mice &amp; rats)</div>
        <div class="dh-pest-option" data-pest="termites">Termites</div>
        <div class="dh-pest-option" data-pest="wasps">Wasps</div>
        <div class="dh-pest-option" data-pest="others">Others (earwigs, boxelders, ect.)</div>
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
        <p>We need to verify that your location is within our service area. Start typing your address below and select from the suggestions.</p>
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

        // Step 4: Urgency
        const urgencyStep = document.createElement('div');
        urgencyStep.className = 'dh-form-step';
        urgencyStep.id = 'dh-step-urgency';
        urgencyStep.innerHTML = `
      <h3>Excellent. How soon are you wanting to get rid of those pesky <span id="urgency-pest-type">pests</span>?</h3>
      <div class="dh-urgency-selection">
        <div class="dh-urgency-option" data-urgency="yesterday">Yesterday! (we hear you)</div>
        <div class="dh-urgency-option" data-urgency="1-2-days">Within 1-2 days</div>
        <div class="dh-urgency-option" data-urgency="next-week">Within the next week</div>
        <div class="dh-urgency-option" data-urgency="no-rush">I&apos;m not in a rush</div>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-secondary" onclick="previousStep()">Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="nextStep()" disabled id="urgency-next">Next</button>
      </div>
    `;
        steps.push(urgencyStep);

        // Step 5: Contact Info
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
        <button class="dh-form-btn dh-form-btn-primary" onclick="submitForm()" disabled id="contact-submit">Get My Inspection</button>
      </div>
    `;
        steps.push(contactStep);

        // Step 6: Plan Recommendation
        const planStep = document.createElement('div');
        planStep.className = 'dh-form-step';
        planStep.id = 'dh-step-plans';
        planStep.innerHTML = `
      <div class="dh-success-message" style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px 0; text-align: center;">
        <div style="color: #065f46; font-weight: 600; font-size: 18px; margin-bottom: 8px;">🎉 Inspection Requested Successfully!</div>
        <div style="color: #047857; font-size: 14px;">We&apos;ll contact you soon to schedule your inspection and discuss these service options.</div>
      </div>
      <h3>Here are our recommended service plans:</h3>
      <div class="dh-plans-container" id="plans-container">
        <!-- Plans will be dynamically ordered with recommended plan first -->
      </div>
      <div class="dh-plans-footer">**initial fees may apply</div>
    `;
        steps.push(planStep);

        // Step 7: Out of Service Area
        const outOfServiceStep = document.createElement('div');
        outOfServiceStep.className = 'dh-form-step';
        outOfServiceStep.id = 'dh-step-out-of-service';
        outOfServiceStep.innerHTML = `
      <div class="dh-form-out-of-service">
        <h3>We're sorry, we don't currently service your area</h3>
        <p>Unfortunately, your location is outside our current service area. We're always expanding, so please check back with us in the future!</p>
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
          'urgency',
          'contact',
          'plans',
        ];
        const currentIndex = steps.indexOf(stepName);
        const progress = ((currentIndex + 1) / steps.length) * 100;

        const progressBar = elements.progressBar;
        if (progressBar) {
          progressBar.style.width = progress + '%';
        }
      };

      // Global functions for step navigation (exposed to window for onclick handlers)
      window.nextStep = async () => {
        const steps = [
          'welcome',
          'pest-issue',
          'address',
          'urgency',
          'contact',
          'plans',
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
                'address_validated'
              );
              if (!partialSaveResult.success) {
                console.warn(
                  'Failed to save partial lead, but continuing with form flow:',
                  partialSaveResult.error
                );
              }
              
              showStep('urgency');
              setupStepValidation('urgency');


            } else {
              // User is out of service area, do not save partial lead, show end-stop step
              showStep('out-of-service');
            }
          } catch (error) {
            console.error('Service area validation error:', error);
            // On error, allow user to proceed (graceful fallback)
            console.log('Validation failed, proceeding with graceful fallback');
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
        const steps = [
          'welcome',
          'pest-issue',
          'address',
          'urgency',
          'contact',
          'plans',
          'out-of-service',
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
          widgetState.formData.latitude = '';
          widgetState.formData.longitude = '';

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
        stepCompleted = 'address_validated'
      ) => {
        if (!widgetState.sessionId || !widgetState.attributionData) {
          console.warn(
            'Cannot save partial lead: missing session ID or attribution data'
          );
          return { success: false, error: 'Missing session data' };
        }

        const { latitude, longitude } = widgetState.formData;
        if (!latitude || !longitude) {
          console.warn('Cannot save partial lead: missing coordinates');
          return { success: false, error: 'Missing coordinates' };
        }

        try {
          const partialSaveData = {
            companyId: config.companyId,
            sessionId: widgetState.sessionId,
            stepCompleted: stepCompleted,
            formData: {
              pestType: widgetState.formData.pestType || null,
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
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              contactInfo:
                stepCompleted === 'contact_started'
                  ? {
                      name: widgetState.formData.contactInfo.name || null,
                      phone: widgetState.formData.contactInfo.phone || null,
                      email: widgetState.formData.contactInfo.email || null,
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

          console.log('Saving partial lead:', partialSaveData);

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
          console.log('Partial lead saved successfully:', result);
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

          console.log('Form data recovered successfully:', {
            stepCompleted: recoveryData.stepCompleted,
            hasAddress: !!formData.address,
            hasPestIssue: !!formData.pestIssue,
            hasContact: !!(
              formData.contactInfo &&
              (formData.contactInfo.name || formData.contactInfo.email)
            ),
          });

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

            if (recoveryData.formData.pestIssue) {
              const li = document.createElement('li');
              li.textContent = `Pest issue: ${recoveryData.formData.pestType}`;
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
            urgency: '',
            contactInfo: {
              name: '',
              phone: '',
              email: '',
            },
          };

          console.log('Starting fresh form');
          showStep('welcome');
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
          console.log('Continuing form from step:', stepCompleted);

          // Navigate to the appropriate step based on what was completed
          if (stepCompleted === 'address_validated') {
            // Address was validated, go to contact step
            showStep('contact');
            // Populate fields after step is shown (DOM elements exist)
            setTimeout(() => {
              populateAddressFields();
              setupStepValidation('contact');
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

          const nameInput = document.getElementById('name-input');
          const phoneInput = document.getElementById('phone-input');
          const emailInput = document.getElementById('email-input');

          if (nameInput) nameInput.value = contactInfo.name || '';
          if (phoneInput) phoneInput.value = contactInfo.phone || '';
          if (emailInput) emailInput.value = contactInfo.email || '';
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
                // Enable next button
                const pestNext = document.getElementById('pest-next');
                if (pestNext) pestNext.disabled = false;
              }
            });
            console.log('Pest issue field populated:', widgetState.formData.pestType);
          }
        } catch (error) {
          console.error('Error populating pest issue field:', error);
        }
      };

      window.selectPlan = (planType) => {
        try {
          // Store the selected plan
          widgetState.formData.selectedPlan = planType;
          console.log('Plan selected:', planType);
          
          // For now, just show an alert or could open a modal
          // This is where you might show plan details or handle plan selection
          alert(`You selected the ${planType.toUpperCase()} plan. Plan details coming soon!`);
        } catch (error) {
          console.error('Error selecting plan:', error);
        }
      };

      window.submitForm = async () => {
        // Prevent double submissions
        if (widgetState.isSubmitting) {
          return;
        }

        // In preview mode, just navigate to plans step without submitting
        if (config.isPreview) {
          showStep('plans');
          setupStepValidation('plans');
          return;
        }

        // Set submitting state and update UI
        widgetState.isSubmitting = true;
        updateSubmitButtonState(true);

        console.log('Starting form submission process...');

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
            
            // Navigate to plans step to show success and recommended plans
            showStep('plans');
            setupStepValidation('plans');
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
            const pestOptions = document.querySelectorAll('.dh-pest-option');
            const pestNext = document.getElementById('pest-next');

            if (pestOptions && pestNext) {
              pestOptions.forEach(option => {
                option.addEventListener('click', e => {
                  // Remove selected class from all options
                  pestOptions.forEach(opt => opt.classList.remove('selected'));
                  // Add selected class to clicked option
                  e.target.classList.add('selected');
                  // Store selection
                  widgetState.formData.pestType = e.target.dataset.pest;
                  // Enable next button
                  pestNext.disabled = false;
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

                console.log('Address selected - coordinates stored:', {
                  lat: address.lat,
                  lon: address.lon,
                  formatted: address.formatted,
                });

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

          case 'urgency':
            const urgencyOptions = document.querySelectorAll('.dh-urgency-option');
            const urgencyNext = document.getElementById('urgency-next');
            const urgencyPestType = document.getElementById('urgency-pest-type');

            // Update the pest type in the title
            if (urgencyPestType && widgetState.formData.pestType) {
              const pestTypeMap = {
                'ants': 'ants',
                'spiders': 'spiders', 
                'cockroaches': 'cockroaches',
                'rodents': 'rodents like mice and rats',
                'termites': 'termites',
                'wasps': 'wasps',
                'others': 'pests'
              };
              urgencyPestType.textContent = pestTypeMap[widgetState.formData.pestType] || 'pests';
            }

            if (urgencyOptions && urgencyNext) {
              urgencyOptions.forEach(option => {
                option.addEventListener('click', e => {
                  // Remove selected class from all options
                  urgencyOptions.forEach(opt => opt.classList.remove('selected'));
                  // Add selected class to clicked option
                  e.target.classList.add('selected');
                  // Store selection
                  widgetState.formData.urgency = e.target.dataset.urgency;
                  // Enable next button
                  urgencyNext.disabled = false;
                });
              });
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
                'defense': {
                  title: 'DEFENSE PLAN',
                  header: '#10b981',
                  features: [
                    'Year-Round Pest Protection',
                    '4 Seasonal Services', 
                    'General Pest Control',
                    'Free Re-Treat Service',
                    { text: 'SMART Monitoring System For Rodents', enabled: false },
                    { text: 'Termite Monitoring', enabled: false },
                    { text: 'Termite Baiting System', enabled: false }
                  ]
                },
                'smartdefense': {
                  title: 'SMARTDEFENSE',
                  header: '#06b6d4',
                  features: [
                    'Year-Round Pest Protection',
                    '4 Seasonal Services',
                    'General Pest Control', 
                    'Free Re-Treat Service',
                    { text: 'SMART Monitoring System For Rodents', enabled: true },
                    { text: 'Termite Monitoring', enabled: false },
                    { text: 'Termite Baiting System', enabled: false }
                  ]
                },
                'smartdefense-complete': {
                  title: 'SMARTDEFENSE COMPLETE',
                  header: '#1e40af',
                  features: [
                    'Year-Round Pest Protection',
                    '4 Seasonal Services',
                    'General Pest Control',
                    'Free Re-Treat Service',
                    { text: 'SMART Monitoring System For Rodents', enabled: true },
                    { text: 'Termite Monitoring', enabled: true },
                    { text: 'Termite Baiting System', enabled: true }
                  ]
                }
              };
              
              const plan = planData[planType];
              const featuresHTML = plan.features.map(feature => {
                if (typeof feature === 'string') {
                  return `<div class="dh-plan-feature">${feature}</div>`;
                } else {
                  const className = feature.enabled ? 'dh-plan-feature dh-plan-feature-enabled' : 'dh-plan-feature dh-plan-feature-disabled';
                  return `<div class="${className}">${feature.text}</div>`;
                }
              }).join('');
              
              return `
                <div class="dh-plan-card ${isRecommended ? 'recommended' : ''}" data-plan="${planType}" id="${planType}-plan">
                  <div class="dh-plan-header">${plan.title}</div>
                  <div class="dh-plan-content">
                    <div class="dh-plan-included">What&apos;s included:</div>
                    ${featuresHTML}
                  </div>
                  <button class="dh-plan-button" onclick="selectPlan('${planType}')">PLAN DETAILS</button>
                </div>
              `;
            };
            
            // Order plans with recommended plan first
            const allPlans = ['defense', 'smartdefense', 'smartdefense-complete'];
            const orderedPlans = [recommendedPlan, ...allPlans.filter(p => p !== recommendedPlan)];
            
            // Generate HTML with recommended plan first
            const plansHTML = orderedPlans.map(planType => 
              generatePlanHTML(planType, planType === recommendedPlan)
            ).join('');
            
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
