import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Variable globale pour s'assurer que le script n'est chargé qu'une seule fois
let socialBarScriptLoaded = false;

export function SocialBar() {
  const { user } = useAuth();

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  // Vérifier si la social bar est activée
  const adsSettings = JSON.parse(localStorage.getItem('lumixar_ads_settings') || '{}');
  const socialBarEnabled = adsSettings.socialBar !== false;
  
  if (isPremiumOrAdmin || !socialBarEnabled) {
    return null;
  }

  useEffect(() => {
    // Charger le script Social Bar une seule fois globalement
    if (!socialBarScriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://pl28361195.effectivegatecpm.com/8a/d6/ea/8ad6eaaa13cc12c7c19288fe70635cf0.js';
      script.type = 'text/javascript';
      
      // Charger dans le head pour une meilleure compatibilité
      document.head.appendChild(script);
      socialBarScriptLoaded = true;
      
      console.log('Social Bar script loaded');
    }
  }, []);

  return null; // Ce composant n'affiche rien visuellement (la barre est injectée par le script)
}
