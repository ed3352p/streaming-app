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

    // Fonction pour déplacer les pubs dans le conteneur
    const moveAdsToContainer = () => {
      // Chercher TOUS les conteneurs de pubs créés par les scripts
      const adElements = document.querySelectorAll('div[class*="container-"][class*="__stand"]');
      
      adElements.forEach((adElement) => {
        // Vérifier si l'élément n'est pas déjà dans notre conteneur
        if (!container.contains(adElement)) {
          // Déplacer l'élément dans notre conteneur
          try {
            container.appendChild(adElement);
            adElement.style.cssText = `
              display: flex !important;
              width: 100%;
              justify-content: space-evenly;
              gap: 15px;
              flex-wrap: wrap;
              position: relative;
              visibility: visible !important;
              opacity: 1 !important;
            `;
            
            // Styliser chaque carte de pub individuellement
            const bnContainers = adElement.querySelectorAll('[class*="__bn-container"]');
            bnContainers.forEach(bnContainer => {
              bnContainer.style.cssText = 'width: 250px !important; margin: 10px !important; display: inline-block !important;';
              
              const bn = bnContainer.querySelector('[class*="__bn"]');
              if (bn) {
                bn.style.cssText = 'width: 100% !important; background: white !important; border-radius: 8px !important; overflow: hidden !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; position: relative !important; display: block !important;';
              }
              
              const imgContainer = bnContainer.querySelector('[class*="__img-container"]');
              if (imgContainer) {
                imgContainer.style.cssText = 'width: 100% !important; height: 200px !important; overflow: hidden !important; display: block !important;';
              }
              
              const img = bnContainer.querySelector('[class*="__img"]');
              if (img) {
                img.style.cssText = 'width: 100% !important; height: 100% !important; background-size: cover !important; background-position: center !important; display: block !important;';
              }
              
              const title = bnContainer.querySelector('[class*="__title"]');
              if (title) {
                title.style.cssText = 'padding: 15px !important; font-size: 14px !important; font-weight: bold !important; color: #333 !important; text-align: center !important; display: block !important;';
              }
              
              const reportContainer = bnContainer.querySelector('[class*="__report-container"]');
              if (reportContainer) {
                reportContainer.style.display = 'none !important';
              }
            });
          } catch (e) {
            console.error('Erreur déplacement pub:', e);
          }
        }
      });
    };

    // Charger le CSS du réseau publicitaire
    const style = document.createElement('style');
    style.textContent = `
      [class*="__bn-container"] {
        width: 250px !important;
        margin: 10px !important;
      }
      [class*="__bn"] {
        width: 100% !important;
        height: auto !important;
        min-height: 300px !important;
        background: white !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        position: relative !important;
      }
      [class*="__img-container"] {
        width: 100% !important;
        height: 200px !important;
        overflow: hidden !important;
      }
      [class*="__img"] {
        width: 100% !important;
        height: 100% !important;
        background-size: cover !important;
        background-position: center !important;
      }
      [class*="__title"] {
        padding: 15px !important;
        font-size: 14px !important;
        font-weight: bold !important;
        color: #333 !important;
        text-align: center !important;
      }
      [class*="__cancel-btn"] {
        position: absolute !important;
        top: 5px !important;
        right: 5px !important;
        width: 20px !important;
        height: 20px !important;
        background: rgba(0,0,0,0.5) !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        z-index: 10 !important;
      }
      [class*="__report-container"] {
        display: none !important;
      }
      [class*="__link"] {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 5 !important;
      }
    `;
    document.head.appendChild(style);

    // Charger le script
    const script = document.createElement('script');
    script.src = 'https://pl28361193.effectivegatecpm.com/31/fb/42/31fb423b4c0815ba0b17d838c933a210.js';
    script.async = true;
    script.type = 'text/javascript';
    
    // Déplacer les pubs après le chargement du script
    script.onload = () => {
      setTimeout(moveAdsToContainer, 1000);
      setTimeout(moveAdsToContainer, 2000);
      setTimeout(moveAdsToContainer, 3000);
    };
    
    document.body.appendChild(script);

    // Observer pour déplacer les pubs en temps réel
    const observer = new MutationObserver((mutations) => {
      setTimeout(moveAdsToContainer, 500);
    });

    // Observer les changements dans le body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      if (script.parentElement) {
        script.parentElement.removeChild(script);
      }
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px 0',
      margin: '20px 0'
    }}>
      <div className="native-banner-container" style={{
        width: '100%',
        maxWidth: '1400px',
        padding: '40px 24px',
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))',
        borderRadius: '20px',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.4s ease',
        minHeight: '200px'
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
