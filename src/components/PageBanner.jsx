import { useEffect, useRef } from 'react';

export default function PageBanner({ containerId = 'page-banner-ad' }) {
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container || scriptLoadedRef.current) return;

    // Nettoyer le conteneur avant d'ajouter les scripts
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Créer et ajouter le script de configuration
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.innerHTML = `
      atOptions = {
        'key' : '6c562e9ec8edf0006e2a7bae4b0af641',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    container.appendChild(configScript);

    // Créer et ajouter le script d'invocation
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://publishoccur.com/6c562e9ec8edf0006e2a7bae4b0af641/invoke.js';
    invokeScript.async = true;
    
    invokeScript.onload = () => {
      scriptLoadedRef.current = true;
    };

    container.appendChild(invokeScript);

    return () => {
      // Nettoyer lors du démontage
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
      scriptLoadedRef.current = false;
    };
  }, [containerId]);

  return (
    <div className="container" style={{
      marginTop: '1px',
      marginBottom: '-40px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        borderRadius: '12px',
        padding: '12px 12px 10px 12px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '760px',
        margin: '0 auto'
      }}>
        <div style={{
          fontSize: '10px',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>✨</span>
          <span>Sponsorisé</span>
        </div>
        
        <div 
          ref={containerRef}
          id={containerId} 
          style={{
            maxWidth: '728px',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            minHeight: '90px'
          }}
        ></div>
      </div>
    </div>
  );
}
