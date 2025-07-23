import * as React from 'react';

interface ScriptOptions {
  removeOnUnmount: boolean;
}

export function useScript(src: string, options = { removeOnUnmount: true }) {
  const [status, setStatus] = React.useState('loading');
  const optionsRef = React.useRef<ScriptOptions>(options);

  React.useEffect(() => {
    let script = document.querySelector(
      `script[src="${src}"]`
    ) as HTMLScriptElement;

    const domStatus = script?.getAttribute('data-status');
    if (domStatus) {
      setStatus(domStatus);
      return;
    }

    if (script === null) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.setAttribute('data-status', 'loading');
      document.body.appendChild(script);

      const handleScriptLoad = () => {
        script.setAttribute('data-status', 'ready');
        setStatus('ready');
        removeEventListeners();
      };

      const handleScriptError = () => {
        script.setAttribute('data-status', 'error');
        setStatus('error');
        removeEventListeners();
      };

      const removeEventListeners = () => {
        script.removeEventListener('load', handleScriptLoad);
        script.removeEventListener('error', handleScriptError);
      };

      script.addEventListener('load', handleScriptLoad);
      script.addEventListener('error', handleScriptError);

      const removeOnUnmount = optionsRef.current.removeOnUnmount;

      return () => {
        if (removeOnUnmount === true) {
          script.remove();
          removeEventListeners();
        }
      };
    } else {
      setStatus('unknown');
    }
  }, [src]);

  return status;
}
