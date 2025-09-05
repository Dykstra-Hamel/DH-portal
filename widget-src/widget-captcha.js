/**
 * DH Widget - Captcha helper (Cloudflare Turnstile)
 * Just-in-time token generation for multi-user support
 */

(function () {
  'use strict';

  // Minimal state
  let scriptLoaded = false;
  let scriptLoadPromise = null;
  let siteKey = null;
  let isExecuting = false;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  function loadScriptOnce() {
    if (scriptLoaded) return Promise.resolve();
    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        console.error('Turnstile: Failed to load script');
        reject(new Error('Failed to load Turnstile script'));
      };
      document.head.appendChild(script);
    });

    return scriptLoadPromise;
  }

  function createFreshContainer() {
    // Remove any existing containers
    const existingContainer = document.getElementById('dh-turnstile-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create fresh container
    const container = document.createElement('div');
    container.id = 'dh-turnstile-container';
    container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden;';
    document.body.appendChild(container);
    
    console.log('Turnstile: Fresh container created');
    return container;
  }

  function cleanupWidget(widgetId, container) {
    try {
      if (widgetId && window.turnstile && typeof window.turnstile.remove === 'function') {
        window.turnstile.remove(widgetId);
        console.log('Turnstile: Widget removed:', widgetId);
      }
    } catch (error) {
      console.warn('Turnstile: Error removing widget:', error);
    }

    try {
      if (container && container.parentNode) {
        container.remove();
        console.log('Turnstile: Container removed');
      }
    } catch (error) {
      console.warn('Turnstile: Error removing container:', error);
    }
  }

  async function getTokenWithRetry() {
    if (retryCount >= MAX_RETRIES) {
      console.error('Turnstile: Max retries exceeded');
      throw new Error('Turnstile max retries exceeded');
    }

    try {
      return await getTokenInternal();
    } catch (error) {
      retryCount++;
      console.warn(`Turnstile: Attempt ${retryCount} failed:`, error.message);
      
      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
      console.log(`Turnstile: Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return getTokenWithRetry();
    }
  }

  async function getTokenInternal() {
    if (!siteKey) {
      throw new Error('Captcha not initialized');
    }

    await loadScriptOnce();

    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      throw new Error('Turnstile not available');
    }

    // Create fresh container and widget for this token request
    const container = createFreshContainer();
    let widgetId = null;

    return new Promise((resolve, reject) => {
      try {
        console.log('Turnstile: Creating fresh widget for token generation');
        
        // Create widget with callback-based approach
        widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          size: 'invisible',
          callback: (token) => {
            console.log('Turnstile: Token received via callback');
            retryCount = 0; // Reset retry count on success
            
            // Clean up immediately after getting token
            cleanupWidget(widgetId, container);
            resolve(token);
          },
          'error-callback': (error) => {
            console.error('Turnstile: Widget error callback:', error);
            cleanupWidget(widgetId, container);
            
            // Check for specific error types
            if (error && error.includes && error.includes('rate-limited')) {
              reject(new Error('Rate limited - will retry'));
            } else {
              reject(new Error(`Turnstile error: ${error || 'Unknown error'}`));
            }
          },
          'expired-callback': () => {
            console.warn('Turnstile: Token expired');
            cleanupWidget(widgetId, container);
            reject(new Error('Turnstile token expired'));
          },
          'timeout-callback': () => {
            console.warn('Turnstile: Token timeout');
            cleanupWidget(widgetId, container);
            reject(new Error('Turnstile timeout'));
          },
        });

        if (!widgetId) {
          cleanupWidget(widgetId, container);
          reject(new Error('Failed to create Turnstile widget'));
          return;
        }

        console.log('Turnstile: Widget created with ID:', widgetId);

        // Set timeout for the entire process
        setTimeout(() => {
          cleanupWidget(widgetId, container);
          reject(new Error('Turnstile token generation timeout'));
        }, 30000); // 30 second timeout

      } catch (error) {
        cleanupWidget(widgetId, container);
        reject(error);
      }
    });
  }

  async function getToken() {
    console.log('Turnstile: getToken called, isExecuting:', isExecuting);
    
    // Prevent multiple simultaneous executions
    if (isExecuting) {
      console.log('Turnstile: Already executing, rejecting duplicate call');
      throw new Error('Turnstile already executing');
    }
    
    isExecuting = true;
    
    try {
      const token = await getTokenWithRetry();
      isExecuting = false;
      return token;
    } catch (error) {
      isExecuting = false;
      throw error;
    }
  }

  window.dhCaptcha = {
    init: async (provider, inputSiteKey) => {
      
      if (provider !== 'turnstile' || !inputSiteKey) {
        console.log('Turnstile: Not initializing - provider:', provider, 'siteKey present:', !!inputSiteKey);
        return;
      }
      
      siteKey = inputSiteKey;
      retryCount = 0; // Reset retry count
      
      try {
        // Only load script, don't pre-render widgets
        await loadScriptOnce();
      } catch (error) {
        console.error('Turnstile: Init failed:', error);
      }
    },
    getToken,
  };
})();

