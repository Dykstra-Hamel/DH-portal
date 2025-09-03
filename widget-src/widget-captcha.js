/**
 * DH Widget - Captcha helper (Cloudflare Turnstile)
 */

(function () {
  'use strict';

  // Minimal state - only what we need
  let scriptLoaded = false;
  let scriptLoadPromise = null;
  let siteKey = null;
  let widgetId = null;
  let isExecuting = false;

  function loadScriptOnce() {
    console.log('Turnstile: loadScriptOnce called, scriptLoaded:', scriptLoaded);
    if (scriptLoaded) return Promise.resolve();
    if (scriptLoadPromise) return scriptLoadPromise;

    console.log('Turnstile: Loading script from Cloudflare...');
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Turnstile: Script loaded successfully');
        scriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        console.error('Turnstile: Failed to load script');
        reject(new Error('Failed to load Turnstile script'));
      };
      document.head.appendChild(script);
      console.log('Turnstile: Script element added to head');
    });

    return scriptLoadPromise;
  }

  function ensureContainer() {
    console.log('Turnstile: ensureContainer called');
    let el = document.getElementById('dh-turnstile-container');
    if (!el) {
      console.log('Turnstile: Creating container element');
      el = document.createElement('div');
      el.id = 'dh-turnstile-container';
      el.style.cssText = 'position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden;';
      document.body.appendChild(el);
      console.log('Turnstile: Container added to DOM');
    } else {
      console.log('Turnstile: Container already exists');
    }
    return el;
  }

  async function renderWidget() {
    console.log('Turnstile: renderWidget called with siteKey:', siteKey?.substring(0, 20) + '...');
    await loadScriptOnce();
    const container = ensureContainer();
    
    if (widgetId) {
      console.log('Turnstile: Widget already exists, returning existing ID:', widgetId);
      return widgetId;
    }
    
    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      console.error('Turnstile: window.turnstile not available or render function missing');
      throw new Error('Turnstile not available');
    }
    
    console.log('Turnstile: Rendering widget...');
    widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      size: 'invisible',
      retry: 'auto',
      'error-callback': () => {
        console.error('Turnstile: Widget error callback triggered');
      },
    });
    
    console.log('Turnstile: Widget rendered with ID:', widgetId);
    return widgetId;
  }

  async function getToken() {
    console.log('Turnstile: getToken called, isExecuting:', isExecuting);
    
    // Prevent multiple simultaneous executions
    if (isExecuting) {
      console.log('Turnstile: Already executing, rejecting duplicate call');
      throw new Error('Turnstile already executing');
    }
    
    if (!siteKey) {
      throw new Error('Captcha not initialized');
    }
    
    isExecuting = true;
    
    try {
      // Widget should already be rendered from init
      if (!widgetId) {
        throw new Error('Widget not initialized - call dhCaptcha.init() first');
      }
      
      // Execute pre-rendered widget immediately
      console.log('Turnstile: Executing pre-rendered widget for token');
      window.turnstile.execute(widgetId, { async: true });
      
      // Poll for token
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 15 seconds max
        
        const checkForToken = () => {
          attempts++;
          try {
            const token = window.turnstile.getResponse(widgetId);
            if (token) {
              console.log('Turnstile: Token received via polling');
              isExecuting = false;
              resolve(token);
              return;
            }
          } catch (e) {
            // getResponse may not be available, continue polling
          }
          
          if (attempts >= maxAttempts) {
            console.error('Turnstile: Token timeout after', attempts, 'attempts');
            isExecuting = false;
            reject(new Error('Turnstile token timeout'));
            return;
          }
          
          setTimeout(checkForToken, 500);
        };
        
        // Start polling after brief delay
        setTimeout(checkForToken, 500);
      });
      
    } catch (error) {
      isExecuting = false;
      throw error;
    }
  }

  window.dhCaptcha = {
    init: async (provider, inputSiteKey) => {
      console.log('Turnstile: dhCaptcha.init called with provider:', provider, 'siteKey:', inputSiteKey?.substring(0, 20) + '...');
      
      if (provider !== 'turnstile' || !inputSiteKey) {
        console.log('Turnstile: Not initializing - provider:', provider, 'siteKey present:', !!inputSiteKey);
        return;
      }
      
      siteKey = inputSiteKey;
      console.log('Turnstile: Initializing with siteKey...');
      
      try {
        await loadScriptOnce(); // Load script first
        await renderWidget(); // Pre-render widget for instant execution
        console.log('Turnstile: Initialization complete (widget pre-rendered)');
      } catch (error) {
        console.error('Turnstile: Init failed:', error);
      }
    },
    getToken,
  };
})();

