import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export function MobileBanner({ position = 'in-feed' }) {
  const { user } = useAuth();
  const adContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  if (isPremiumOrAdmin) {
    return null;
  }

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const container = adContainerRef.current;
    if (!container) return;

    const configScript = document.createElement('script');
    configScript.innerHTML = `
      atOptions = {
        'key' : '15b669b3aded17687abf412fb52b6e43',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/15b669b3aded17687abf412fb52b6e43/invoke.js';
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
      padding: '15px 0',
      background: position === 'in-feed' ? 'rgba(0,0,0,0.2)' : 'transparent',
      borderRadius: '8px'
    }}>
      <div 
        ref={adContainerRef}
        style={{
          minHeight: '50px',
          minWidth: '320px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    </div>
  );
}
