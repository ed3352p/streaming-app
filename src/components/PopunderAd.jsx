import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Variable globale pour s'assurer que le script n'est chargé qu'une seule fois
let popunderScriptLoaded = false;

export function PopunderAd() {
  const { user } = useAuth();

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  // Vérifier si le popunder est activé
  const adsSettings = JSON.parse(localStorage.getItem('lumixar_ads_settings') || '{}');
  const popunderEnabled = adsSettings.popunder !== false;
  
  if (isPremiumOrAdmin || !popunderEnabled) {
    return null;
  }

  useEffect(() => {
    // Charger le script Popunder une seule fois globalement
    if (!popunderScriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://pl28361193.effectivegatecpm.com/31/fb/42/31fb423b4c0815ba0b17d838c933a210.js';
      script.type = 'text/javascript';
      
      // Charger dans le head pour une meilleure compatibilité
      document.head.appendChild(script);
      popunderScriptLoaded = true;
      
      console.log('Popunder script loaded');
    }
  }, []);

  return null; // Ce composant n'affiche rien visuellement
}
