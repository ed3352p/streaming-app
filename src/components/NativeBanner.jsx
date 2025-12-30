import { useEffect, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';

export const NativeBanner = memo(function NativeBanner({ position = 'in-feed', isHomePage = false }) {
  const { user } = useAuth();
  const adContainerRef = useRef(null);

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  // Vérifier si les pubs native sont activées
  const adsSettings = JSON.parse(localStorage.getItem('lumixar_ads_settings') || '{}');
  const nativeAdsEnabled = adsSettings.nativeAds !== false;
  
  if (isPremiumOrAdmin || !nativeAdsEnabled) {
    return null;
  }

  useEffect(() => {
    const container = adContainerRef.current;
    if (!container) return;

    // Créer le container avec l'ID requis
    const adDiv = document.createElement('div');
    adDiv.id = 'container-2968c5163418d816eb927da1c62e9d5a';
    adDiv.style.minHeight = '100px';
    adDiv.style.width = '100%';
    adDiv.style.display = 'flex';
    adDiv.style.justifyContent = 'space-evenly';
    adDiv.style.alignItems = 'center';
    adDiv.style.flexWrap = 'wrap';
    adDiv.style.gap = '15px';

    // Créer et injecter le script dans ce container spécifique
    const script = document.createElement('script');
    script.src = 'https://pl28361165.effectivegatecpm.com/2968c5163418d816eb927da1c62e9d5a/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    container.appendChild(adDiv);
    container.appendChild(script);

    return () => {
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: position === 'in-feed' ? (isHomePage ? '32px 0' : '0') : '15px 0',
      margin: position === 'in-feed' ? (isHomePage ? '40px 0' : '-2% 0 -2% 0') : '0'
    }}>
      <div className="native-banner-container" style={{
        width: '100%',
        maxWidth: '1400px',
        padding: '32px 24px',
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))',
        borderRadius: '20px',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s ease'
      }}>
        {/* Effet de brillance en arrière-plan */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        {/* Label "Contenu Sponsorisé" */}
        <div className="native-banner-label" style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          fontSize: '11px',
          fontWeight: '700',
          color: 'rgba(167, 139, 250, 0.9)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.2))',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
          zIndex: 10
        }}>
          ✨ Contenu Sponsorisé
        </div>
        
        <div 
          ref={adContainerRef}
          className="native-banner-content"
          style={{
            minHeight: '120px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            paddingTop: '20px',
            animation: 'slideUp 0.6s ease-out',
            position: 'relative',
            zIndex: 5
          }}
        />
        
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @media (max-width: 768px) {
            .native-banner-container {
              padding: 24px 16px !important;
              border-radius: 16px !important;
              margin: 32px 0 !important;
            }
            
            .native-banner-label {
              font-size: 10px !important;
              padding: 5px 12px !important;
            }
            
            .native-banner-content {
              gap: 15px !important;
              padding-top: 15px !important;
            }
          }
          
          @media (max-width: 480px) {
            .native-banner-container {
              padding: 20px 12px !important;
              border-radius: 12px !important;
              margin: 24px 0 !important;
            }
            
            .native-banner-label {
              font-size: 9px !important;
              padding: 4px 10px !important;
              letter-spacing: 1px !important;
            }
            
            .native-banner-content {
              gap: 12px !important;
              padding-top: 12px !important;
              min-height: 80px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
});
