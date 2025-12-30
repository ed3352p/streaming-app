import { useEffect, useRef, useMemo, memo } from 'react';
import { useAuth } from '../context/AuthContext';

export const ExternalAdBanner = memo(function ExternalAdBanner({ position = 'top', isHomePage = false }) {
  const { user } = useAuth();
  const adContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  
  // Générer un ID unique pour chaque instance
  const uniqueId = useMemo(() => `ad-${Math.random().toString(36).substr(2, 9)}`, []);

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  // Vérifier si les pubs sont activées globalement et si les pubs header sont activées
  const adsSettings = JSON.parse(localStorage.getItem('lumixar_ads_settings') || '{}');
  const adsEnabled = adsSettings.enabled !== false;
  const headerAdsEnabled = adsSettings.headerAds !== false;
  
  if (isPremiumOrAdmin || !adsEnabled || !headerAdsEnabled) {
    return null;
  }

  useEffect(() => {
    // Scripts de publicité désactivés pour éviter les popups
  }, []);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: position === 'top' ? (isHomePage ? '1% 0 0% 0' : '1% 0 1% 0') : '20px 0',
      marginBottom: position === 'top' ? (isHomePage ? '-2%' : '0') : '0'
    }}>
      <div className="external-ad-banner-container" style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
        borderRadius: '16px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Label "Publicité" */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '12px',
          fontSize: '10px',
          fontWeight: '600',
          color: 'rgba(139, 92, 246, 0.8)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          background: 'rgba(139, 92, 246, 0.1)',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          Publicité
        </div>
        
        <div 
          ref={adContainerRef}
          style={{
            minHeight: '90px',
            width: '100%',
            maxWidth: '728px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fadeIn 0.5s ease-in'
          }}
        />
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @media (max-width: 768px) {
            .external-ad-banner-container {
              padding: 10px !important;
              border-radius: 12px !important;
            }
          }
          
          @media (max-width: 480px) {
            .external-ad-banner-container {
              padding: 8px !important;
              border-radius: 8px !important;
              max-width: 100% !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
});
