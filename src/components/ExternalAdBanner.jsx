import { useEffect, useRef } from 'react';

export function ExternalAdBanner({ position = 'top' }) {
  const adContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const container = adContainerRef.current;
    if (!container) return;

    const configScript = document.createElement('script');
    configScript.innerHTML = `
      atOptions = {
        'key' : '08c30a991ac8b80ee3ad09f4d76ffe91',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/08c30a991ac8b80ee3ad09f4d76ffe91/invoke.js';
    invokeScript.async = true;

    container.appendChild(configScript);
    container.appendChild(invokeScript);
    scriptLoadedRef.current = true;

    return () => {
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
      scriptLoadedRef.current = false;
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px 0',
      background: position === 'top' ? 'transparent' : 'rgba(0,0,0,0.2)',
      borderRadius: '8px'
    }}>
      <div 
        ref={adContainerRef}
        style={{
          minHeight: '90px',
          minWidth: '728px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    </div>
  );
}
