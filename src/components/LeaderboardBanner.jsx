import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export function LeaderboardBanner({ position = 'in-feed' }) {
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
        'key' : '6c562e9ec8edf0006e2a7bae4b0af641',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/6c562e9ec8edf0006e2a7bae4b0af641/invoke.js';
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
      background: position === 'in-feed' ? 'rgba(0,0,0,0.2)' : 'transparent',
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
