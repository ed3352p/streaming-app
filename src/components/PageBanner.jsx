import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PageBanner({ containerId = 'page-banner-ad' }) {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  // Vérifier si les pubs sont activées globalement
  const adsSettings = JSON.parse(localStorage.getItem('lumixar_ads_settings') || '{}');
  const adsEnabled = adsSettings.enabled !== false;
  
  if (isPremiumOrAdmin || !adsEnabled) {
    return null;
  }

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
    
    // Détecter si mobile et ajuster les dimensions
    const isMobile = window.innerWidth <= 768;
    const adWidth = isMobile ? 320 : 728;
    const adHeight = isMobile ? 50 : 90;
    
    configScript.innerHTML = `
      atOptions = {
        'key' : '6c562e9ec8edf0006e2a7bae4b0af641',
        'format' : 'iframe',
        'height' : ${adHeight},
        'width' : ${adWidth},
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
    <>
      <style>{`
        @media (max-width: 768px) {
          .page-banner-container {
            padding: 0 8px !important;
            margin-bottom: 20px !important;
          }
          
          .page-banner-wrapper {
            padding: 8px !important;
          }
          
          .page-banner-ad {
            min-height: 50px !important;
            overflow: hidden !important;
          }
          
          .page-banner-ad iframe {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
      
      <div className="page-banner-container container" style={{
        marginTop: '1px',
        marginBottom: '-40px'
      }}>
        <div className="page-banner-wrapper" style={{
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
            className="page-banner-ad"
            style={{
              maxWidth: '728px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              minHeight: '90px',
              overflow: 'hidden'
            }}
          ></div>
        </div>
      </div>
    </>
  );
}
