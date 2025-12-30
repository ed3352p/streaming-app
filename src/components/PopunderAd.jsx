import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Variable globale pour charger le script une seule fois
let popunderScriptLoaded = false;

export function PopunderAd() {
  const { user } = useAuth();

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  // Vérifier si les pubs sont activées globalement et si le popunder est activé
  const adsSettings = JSON.parse(localStorage.getItem('lumixar_ads_settings') || '{}');
  const adsEnabled = adsSettings.enabled !== false;
  const popunderEnabled = adsSettings.popunder !== false;
  
  if (isPremiumOrAdmin || !adsEnabled || !popunderEnabled) {
    return null;
  }

  useEffect(() => {
    // PopunderAd désactivé - le script pl28361193 est maintenant utilisé par NativeBanner
  }, []);

  return null; // Composant invisible
}
