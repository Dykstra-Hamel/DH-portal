'use client';

import styles from './WidgetPreview.module.scss';
import { useEffect } from 'react';

interface WidgetPreviewProps {
  companyId: string;
}

interface WindowWithWidget extends Window {
  DHWidgetLoaded?: boolean;
}

const EmbedPreview: React.FC<WidgetPreviewProps> = ({ companyId }) => {
  useEffect(() => {
    const script = document.createElement('script');

    script.src = `/widget.js?v=${Date.now()}`;
    script.async = true;
    script.setAttribute('data-base-url', window.location.origin);
    script.setAttribute('data-company-id', companyId);
    script.setAttribute('data-script-id', 'widget-preview');
    script.setAttribute('data-preview', 'true');
    script.setAttribute('data-container-id', 'widget-preview-container');

    // Append the script to the body
    document.body.appendChild(script);

    return () => {
      // Find the script by a stable attribute, not the src which is now dynamic
      const scriptToRemove = document.querySelector(
        "script[data-script-id='widget-preview']"
      );
      if (scriptToRemove) {
        document.body.removeChild(scriptToRemove);
      }
      if ((window as WindowWithWidget).DHWidgetLoaded) {
        (window as WindowWithWidget).DHWidgetLoaded = false;
      }
    };
  }, [companyId]);

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewBadge}>🎭 Preview Mode</div>

      {/* Widget container - React hands-off approach */}
      <div id="widget-preview-container" className={styles.widgetContainer}>
        {/* Widget will be injected here */}
      </div>
    </div>
  );
};

export default EmbedPreview;
