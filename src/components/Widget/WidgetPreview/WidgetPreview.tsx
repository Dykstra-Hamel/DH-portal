'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './WidgetPreview.module.scss';

interface WidgetConfig {
  branding: {
    primaryColor: string;
    logo?: string;
    companyName: string;
  };
  messaging: {
    welcome: string;
    fallback: string;
  };
}

interface WidgetPreviewProps {
  config: WidgetConfig;
  companyId: string;
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({ config, companyId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const initializationRef = useRef<boolean>(false);
  
  // Generate unique container ID
  const [containerId] = useState(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `widget-preview-container-${timestamp}-${random}`;
  });

  // Get container element - use state-based ref
  const getContainerElement = useCallback(() => {
    return containerElement;
  }, [containerElement]);

  // Callback ref to capture container element immediately when it mounts
  const containerRef = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      setContainerElement(element);
    } else {
      setContainerElement(null);
    }
  }, []);

  // Fallback container detection if callback ref fails
  useEffect(() => {
    if (containerElement) {
      return;
    }
    
    const fallbackContainer = document.getElementById(containerId);
    if (fallbackContainer) {
      setContainerElement(fallbackContainer as HTMLDivElement);
    } else {
      // Try again after a short delay in case DOM isn't ready
      const timeout = setTimeout(() => {
        const retryContainer = document.getElementById(containerId);
        if (retryContainer) {
          setContainerElement(retryContainer as HTMLDivElement);
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [containerId, containerElement]);

  const cleanup = useCallback(() => {
    try {
      // Safe widget element cleanup
      const existingWidgets = document.querySelectorAll('[id^="dh-"], .dh-form-widget, #dh-widget-styles');
      existingWidgets.forEach(element => {
        try {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        } catch (e) {
          // Silent cleanup
        }
      });
      
      // Safe script cleanup
      if (scriptRef.current) {
        try {
          if (scriptRef.current.parentNode) {
            scriptRef.current.parentNode.removeChild(scriptRef.current);
          }
        } catch (e) {
          // Silent cleanup
        } finally {
          scriptRef.current = null;
        }
      }
      
      // Safe container cleanup
      const container = getContainerElement();
      if (container) {
        try {
          container.id = '';
          container.innerHTML = '';
        } catch (e) {
          // Silent cleanup
        }
      }
      
      // Safe global cleanup
      const globalFunctions = ['nextStep', 'previousStep', 'submitForm'];
      globalFunctions.forEach(funcName => {
        try {
          if ((window as any)[funcName]) {
            delete (window as any)[funcName];
          }
        } catch (e) {
          // Silent cleanup
        }
      });
      
      try {
        if ((window as any).DHWidgetLoaded) {
          delete (window as any).DHWidgetLoaded;
        }
      } catch (e) {
        // Silent cleanup
      }
    } catch (error) {
      // Silent cleanup
    }
  }, [getContainerElement]);

  const loadWidget = useCallback(async () => {
    try {
      cleanup();
      setIsLoading(true);
      setLoadingError(null);

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 11);
      const widgetContainerId = `dh-widget-container-${timestamp}-${random}`;
      const scriptId = `dh-widget-script-${timestamp}-${random}`;
      const scriptUrl = `${window.location.origin}/widget.js?v=${timestamp}`;
      
      const container = getContainerElement();
      if (!container) {
        throw new Error('Container element not available');
      }
      
      container.id = widgetContainerId;

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptUrl;
      script.setAttribute('data-company-id', companyId);
      script.setAttribute('data-base-url', window.location.origin);
      script.setAttribute('data-preview', 'true');
      script.setAttribute('data-auto-open', 'true');
      script.setAttribute('data-container-id', widgetContainerId);
      script.setAttribute('data-script-id', scriptId);

      const loadTimeout = setTimeout(() => {
        setLoadingError('Widget loading timed out.');
        setIsLoading(false);
      }, 10000);

      script.onload = () => {
        clearTimeout(loadTimeout);
        
        let attempts = 0;
        const checkWidget = () => {
          const widget = document.querySelector(`#${widgetContainerId} .dh-form-widget`);
          attempts++;
          
          if (widget) {
            setIsLoading(false);
            setLoadingError(null);
          } else if (attempts < 25) {
            setTimeout(checkWidget, 200);
          } else {
            setLoadingError('Widget failed to initialize. Check console for errors.');
            setIsLoading(false);
          }
        };
        
        setTimeout(checkWidget, 300);
      };

      script.onerror = () => {
        clearTimeout(loadTimeout);
        setLoadingError('Script failed to load.');
        setIsLoading(false);
      };

      document.head.appendChild(script);
      scriptRef.current = script;

    } catch (error) {
      setLoadingError(`Widget loading error: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  }, [cleanup, companyId, getContainerElement]);

  // Effect to load widget when container becomes available
  useEffect(() => {
    if (!containerElement) {
      return;
    }

    // StrictMode protection - prevent double initialization
    if (initializationRef.current) {
      return;
    }

    // Mark as initializing
    initializationRef.current = true;

    // Simple deduplication - skip if widget already exists anywhere in DOM
    const existingWidget = document.querySelector('.dh-form-widget');
    if (existingWidget) {
      setIsLoading(false);
      return;
    }

    // Load widget now that container is available
    loadWidget();

    // Cleanup on unmount
    return () => {
      initializationRef.current = false;
      cleanup();
    };
  }, [containerElement, companyId, loadWidget, cleanup]);


  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewBadge}>
        🎭 Preview Mode
      </div>
      
      {/* Loading/Error states managed by React */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading widget preview...</p>
          <p className={styles.loadingHint}>Loading the actual widget...</p>
        </div>
      )}
      
      {loadingError && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Widget Preview Error</h3>
          <p>{loadingError}</p>
          <button 
            className={styles.retryButton}
            onClick={() => {
              setIsLoading(true);
              setLoadingError(null);
              // Reset the container content before retry
              if (containerElement) {
                containerElement.innerHTML = '';
              }
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Widget container - React hands-off approach */}
      <div 
        ref={containerRef} 
        id={containerId}
        className={styles.widgetContainer}
        style={{ display: (isLoading || loadingError) ? 'none' : 'block' }}
        dangerouslySetInnerHTML={{ __html: '' }}
      >
        {/* Widget script will inject content here - React won't manage this content */}
      </div>
    </div>
  );
};

export default WidgetPreview;