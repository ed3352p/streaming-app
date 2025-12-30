import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export function LeaderboardBanner({ position = 'in-feed' }) {
  const { user } = useAuth();
  const adContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Premium et Admin: AUCUNE pub
  const isPremiumOrAdmin = user?.premium === true || user?.role === 'admin';
  
  if (isPremiumOrAdmin) {
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
      padding: '20px 0',
      background: position === 'in-feed' ? 'rgba(0,0,0,0.2)' : 'transparent',
      borderRadius: '8px'
    }}>
      <div 
        ref={adContainerRef}
        style={{
          minHeight: '90px',
          minWidth: '728px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    </div>
  );
}
