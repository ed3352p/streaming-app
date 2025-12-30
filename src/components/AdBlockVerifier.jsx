import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AdBlockVerifier({ onVerified, onBlocked }) {
  const [status, setStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 0;

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà été vérifié dans cette session
    const cachedVerification = sessionStorage.getItem('adblock_verified');
    const verificationTime = sessionStorage.getItem('adblock_verified_time');
    
    // Cache valide pendant 30 minutes
    const cacheValidDuration = 30 * 60 * 1000;
    const now = Date.now();
    
    if (cachedVerification === 'true' && verificationTime) {
      const timeSinceVerification = now - parseInt(verificationTime);
      
      if (timeSinceVerification < cacheValidDuration) {
        // Utilisateur déjà vérifié récemment, pas besoin de re-vérifier
        setStatus('verified');
        if (onVerified) onVerified();
        return;
      }
    }
    
    // Sinon, effectuer la vérification
    initializeAdBlock();
  }, []);

  const initializeAdBlock = async () => {
    try {
      setStatus('checking');
      const isBlocked = await detectAdBlockSimple();
      
      if (!isBlocked) {
        setStatus('verified');
        // Sauvegarder la vérification dans le cache
        sessionStorage.setItem('adblock_verified', 'true');
        sessionStorage.setItem('adblock_verified_time', Date.now().toString());
        if (onVerified) onVerified();
      } else {
        // Supprimer le cache si bloqué
        sessionStorage.removeItem('adblock_verified');
        sessionStorage.removeItem('adblock_verified_time');
        handleBlocked();
      }
    } catch (error) {
      sessionStorage.removeItem('adblock_verified');
      sessionStorage.removeItem('adblock_verified_time');
      handleBlocked();
    }
  };

  const detectAdBlockSimple = () => {
    return new Promise(async (resolve) => {
      let blockedCount = 0;
      let totalTests = 0;
      const tests = [];
      let adsActuallyLoaded = 0;
      
      
      // Test 0: Vérifier TOUS les scripts externes - DOIVENT se charger
      const externalScripts = [
        'https://pl28361165.effectivegatecpm.com/2968c5163418d816eb927da1c62e9d5a/invoke.js',
        'https://www.highperformanceformat.com/08c30a991ac8b80ee3ad09f4d76ffe91/invoke.js',
        'https://www.highperformanceformat.com/6c562e9ec8edf0006e2a7bae4b0af641/invoke.js',
        'https://pl28361193.effectivegatecpm.com/31/fb/42/31fb423b4c0815ba0b17d838c933a210.js'
      ];
      
      let externalScriptsSuccess = 0;
      
      // Tester chaque script avec un délai plus long pour éviter les faux positifs
      for (const scriptUrl of externalScripts) {
        totalTests++;
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = scriptUrl;
          let loaded = false;
          let resolved = false;
          
          script.onload = () => {
            loaded = true;
            adsActuallyLoaded++;
            externalScriptsSuccess++;
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };
          
          script.onerror = () => {
            if (!resolved) {
              resolved = true;
              blockedCount++;
              resolve();
            }
          };
          
          document.head.appendChild(script);
          
          // Timeout de 1000ms - plus tolérant pour connexions lentes
          setTimeout(() => {
            if (!loaded && !resolved) {
              resolved = true;
              blockedCount++;
              try { document.head.removeChild(script); } catch(e) {}
              resolve();
            }
          }, 1000);
        });
      }
      
      // Si MOINS de 2 scripts se chargent = AdBlock actif (plus tolérant)
      if (externalScriptsSuccess < 2) {
        blockedCount += 5; // Pénalité réduite
      }
      
      // NOUVEAU: Test côté serveur IMPOSSIBLE à contourner
      totalTests++;
      try {
        const tokenResponse = await fetch(`${API_URL}/api/adblock/token`);
        if (!tokenResponse.ok) {
          // Fallback client-side - ne pas pénaliser
        } else {
          const { token, challenge } = await tokenResponse.json();
          
          // Simuler le chargement d'une pub et vérifier
          const adElement = document.createElement('div');
          adElement.className = 'adsbygoogle';
          adElement.style.cssText = 'display:block;width:300px;height:250px;position:absolute;top:-9999px;';
          document.body.appendChild(adElement);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const isVisible = adElement.offsetHeight > 0 && adElement.offsetWidth > 0;
          try { document.body.removeChild(adElement); } catch(e) {}
          
          if (isVisible) {
            // Pub visible, envoyer la preuve au serveur
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(challenge + challenge);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const proof = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            const verifyResponse = await fetch(`${API_URL}/api/adblock/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, challenge, proof })
            });
            
            if (verifyResponse.ok) {
              const result = await verifyResponse.json();
              if (result.verified) {
                adsActuallyLoaded += 5; // Compte beaucoup car vérifié serveur
                // Sauvegarder le token pour les requêtes futures
                sessionStorage.setItem('server_ad_token', token);
              } else {
                blockedCount += 2;
              }
            }
          } else {
            blockedCount += 2;
          }
        }
      } catch (error) {
        // Ne pas pénaliser les erreurs réseau
      }
      
      // Test 1: Vérifier si window.adsbygoogle existe déjà
      totalTests++;
      if (!window.adsbygoogle || window.adsbygoogle.length === 0) {
        // Ne pas pénaliser immédiatement, peut ne pas être chargé encore
      } else {
        adsActuallyLoaded++;
      }
      
      // Test 2: Script AdSense principal + vérification chargement réel
      totalTests++;
      tests.push(new Promise((res) => {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        let scriptLoaded = false;
        
        script.onerror = () => {
          blockedCount++;
          res();
        };
        script.onload = () => {
          scriptLoaded = true;
          adsActuallyLoaded++;
          res();
        };
        document.head.appendChild(script);
        
        setTimeout(() => {
          if (!scriptLoaded) {
            // Déjà compté dans onerror
          }
          if (window.adsbygoogle && window.adsbygoogle.length > 0) {
            adsActuallyLoaded++;
          }
          res();
        }, 1500);
      }));
      
      // Test 3: Script Google Tag Manager
      totalTests++;
      tests.push(new Promise((res) => {
        const script = document.createElement('script');
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
        script.onerror = () => {
          blockedCount++;
          res();
        };
        script.onload = () => {
          res();
        };
        document.head.appendChild(script);
        setTimeout(() => res(), 1200);
      }));
      
      // Test 4-11: 8 éléments DOM différents (plus agressif)
      const adClasses = [
        'adsbygoogle', 'ad-banner', 'ad-container', 'advertisement',
        'ad-placement', 'sponsored', 'adsbox', 'ad-wrapper'
      ];
      adClasses.forEach(className => {
        totalTests++;
        const el = document.createElement('div');
        el.className = className;
        el.style.cssText = 'display:block!important;width:300px!important;height:250px!important;position:absolute!important;top:-9999px!important;';
        document.body.appendChild(el);
        
        setTimeout(() => {
          if (el.offsetHeight === 0 || el.offsetWidth === 0 || 
              window.getComputedStyle(el).display === 'none' ||
              window.getComputedStyle(el).visibility === 'hidden') {
            blockedCount++;
          }
          try { document.body.removeChild(el); } catch(e) {}
        }, 800);
      });
      
      // Test 12: Fetch DoubleClick
      totalTests++;
      tests.push(
        fetch('https://googleads.g.doubleclick.net/pagead/id', { 
          method: 'HEAD', 
          mode: 'no-cors' 
        })
        .then(() => {})
        .catch(() => {
          blockedCount++;
        })
      );
      
      // Test 13: Fetch Google Syndication
      totalTests++;
      tests.push(
        fetch('https://tpc.googlesyndication.com/simgad/test', { 
          method: 'HEAD', 
          mode: 'no-cors' 
        })
        .then(() => {})
        .catch(() => {
          blockedCount++;
        })
      );
      
      // Test 14: Image publicitaire
      totalTests++;
      tests.push(new Promise((res) => {
        const img = new Image();
        img.onerror = () => {
          blockedCount++;
          res();
        };
        img.onload = () => {
          adsActuallyLoaded++;
          res();
        };
        img.src = 'https://tpc.googlesyndication.com/simgad/1234567890';
        setTimeout(() => res(), 1200);
      }));
      
      // Test 15-20: Créer de VRAIES pubs AdSense et vérifier si elles se chargent
      const adSlots = [
        { width: 728, height: 90, type: 'leaderboard' },
        { width: 300, height: 250, type: 'rectangle' },
        { width: 160, height: 600, type: 'skyscraper' },
        { width: 320, height: 100, type: 'mobile' },
        { width: 970, height: 250, type: 'billboard' },
        { width: 300, height: 600, type: 'halfpage' }
      ];
      
      adSlots.forEach((slot, index) => {
        totalTests++;
        const adContainer = document.createElement('ins');
        adContainer.className = 'adsbygoogle';
        adContainer.style.cssText = `display:inline-block;width:${slot.width}px;height:${slot.height}px;position:absolute;top:-9999px;`;
        adContainer.setAttribute('data-ad-client', 'ca-pub-0000000000000000');
        adContainer.setAttribute('data-ad-slot', '0000000000');
        document.body.appendChild(adContainer);
        
        setTimeout(() => {
          const computed = window.getComputedStyle(adContainer);
          const isVisible = adContainer.offsetHeight > 0 && 
                           adContainer.offsetWidth > 0 && 
                           computed.display !== 'none' && 
                           computed.visibility !== 'hidden';
          
          if (!isVisible) {
            blockedCount++;
          } else {
            adsActuallyLoaded++;
          }
          try { document.body.removeChild(adContainer); } catch(e) {}
        }, 500);
      });
      
      // Test 21-24: Fetch vers multiples domaines publicitaires
      const adDomains = [
        'https://pagead2.googlesyndication.com/pagead/show_ads.js',
        'https://adservice.google.com/adsid/integrator.js',
        'https://www.google-analytics.com/analytics.js',
        'https://static.doubleclick.net/instream/ad_status.js'
      ];
      
      adDomains.forEach((domain, index) => {
        totalTests++;
        tests.push(
          fetch(domain, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
              adsActuallyLoaded++;
            })
            .catch(() => {
              blockedCount++;
            })
        );
      });
      
      // Test 25: Créer une iframe publicitaire
      totalTests++;
      const iframe = document.createElement('iframe');
      iframe.src = 'https://tpc.googlesyndication.com/safeframe/1-0-40/html/container.html';
      iframe.style.cssText = 'width:300px;height:250px;position:absolute;top:-9999px;';
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        if (iframe.offsetHeight === 0 || iframe.offsetWidth === 0) {
          blockedCount++;
        } else {
          adsActuallyLoaded++;
        }
        try { document.body.removeChild(iframe); } catch(e) {}
      }, 500);
      
      // Attendre tous les tests avec plus de temps
      await Promise.all(tests);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Logique de détection plus tolérante pour éviter les faux positifs
      const minAdsRequired = 8; // Minimum 8 pubs doivent se charger (réduit de 15)
      const maxBlockedAllowed = 12; // Maximum 12 tests peuvent échouer (augmenté de 5)
      
      // BLOQUÉ si:
      // - Moins de 8 pubs totales chargées ET
      // - Plus de 12 tests ont échoué
      const isBlocked = adsActuallyLoaded < minAdsRequired && blockedCount > maxBlockedAllowed;
      
      resolve(isBlocked);
    });
  };

  const handleBlocked = () => {
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        initializeAdBlock();
      }, 2000);
    } else {
      setStatus('blocked');
      if (onBlocked) onBlocked();
    }
  };

  const handleRetry = () => {
    // Supprimer le cache et réessayer la détection
    sessionStorage.removeItem('adblock_verified');
    sessionStorage.removeItem('adblock_verified_time');
    setRetryCount(0);
    setStatus('checking');
    initializeAdBlock();
  };

  if (status === 'checking') {
    // Ne rien afficher pendant la vérification
    return null;
  }

  if (status === 'blocked') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚫</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ef4444',
            marginBottom: '15px',
            fontFamily: 'Arial, sans-serif'
          }}>
            Bloqueur de Publicité Détecté
          </h2>
          <p style={{
            color: '#d1d5db',
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '20px',
            fontFamily: 'Arial, sans-serif'
          }}>
            Lumixar est gratuit grâce aux publicités. Pour continuer à profiter de nos contenus HD et 4K, 
            merci de désactiver votre bloqueur de publicité.
          </p>
          <div style={{
            backgroundColor: '#374151',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>
              <strong style={{ color: 'white' }}>Détecté :</strong> Brave, uBlock Origin, AdBlock Plus, ou autre
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>
              Sans publicité, nous ne pouvons pas maintenir ce service gratuit. 🙏
            </p>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={handleRetry}
              style={{
                width: '100%',
                backgroundColor: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
                marginBottom: '12px'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              J'ai désactivé mon AdBlock
            </button>
            <button
              onClick={() => window.location.href = '/premium'}
              style={{
                width: '100%',
                backgroundColor: '#374151',
                color: 'white',
                fontWeight: '600',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#374151'}
            >
              Passer à Premium (sans pub)
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '24px', fontFamily: 'Arial, sans-serif' }}>
            Les utilisateurs Premium peuvent profiter du contenu sans publicité
          </p>
        </div>
      </div>
    );
  }

  // Status verified - ne rien afficher
  return null;
}
