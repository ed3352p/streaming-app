import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Variable globale pour s'assurer que le script n'est chargé qu'une seule fois
let socialBarScriptLoaded = false;

export function SocialBar() {
  const { user } = useAuth();

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  // Vérifier si les pubs sont activées globalement et si la social bar est activée
  const adsSettings = JSON.parse(localStorage.getItem('lumixar_ads_settings') || '{}');
  const adsEnabled = adsSettings.enabled !== false;
  const socialBarEnabled = adsSettings.socialBar !== false;
  
  if (isPremiumOrAdmin || !adsEnabled || !socialBarEnabled) {
    return null;
  }

  useEffect(() => {
    // SocialBar désactivé - publicités uniquement avant films et IPTV
  }, []);

  return null; // Ce composant n'affiche rien visuellement (la barre est injectée par le script)
}
