import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SiteAds() {
  const { isAdmin, isPremium } = useAuth();

  useEffect(() => {
    if (isAdmin || isPremium) {
      return;
    }

    const loadAdScripts = () => {
      const scripts = [
        {
          id: 'ad-script-3',
          src: 'https://publishoccur.com/2968c5163418d816eb927da1c62e9d5a/invoke.js',
          async: true,
          dataCfasync: false
        }
      ];

      scripts.forEach(({ id, src, async, dataCfasync }) => {
        if (!document.getElementById(id)) {
          const script = document.createElement('script');
          script.id = id;
          script.src = src;
          if (async) script.async = true;
          if (dataCfasync !== undefined) script.setAttribute('data-cfasync', dataCfasync);
          document.body.appendChild(script);
        }
      });
    };

    loadAdScripts();

    return () => {
      const scriptIds = ['ad-script-3'];
      scriptIds.forEach(id => {
        const script = document.getElementById(id);
        if (script) {
          script.remove();
        }
      });
    };
  }, [isAdmin, isPremium]);

  if (isAdmin || isPremium) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      padding: '0',
      marginBottom: '60px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            <span>✨</span>
            <span>Sponsorisé</span>
          </div>
          
          <div id="container-2968c5163418d816eb927da1c62e9d5a" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            width: '100%',
            justifyContent: 'space-between'
          }}></div>
        </div>
      </div>
    </div>
  );
}
