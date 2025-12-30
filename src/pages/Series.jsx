import { useEffect } from 'react';
import { Tv } from 'lucide-react';
import { ExternalAdBanner } from '../components/ExternalAdBanner';

function PageBanner() {
  useEffect(() => {
    const container = document.getElementById('page-banner-ad-series');
    if (!container) return;

    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.innerHTML = `
      atOptions = {
        'key' : '6c562e9ec8edf0006e2a7bae4b0af641',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    container.appendChild(configScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://publishoccur.com/6c562e9ec8edf0006e2a7bae4b0af641/invoke.js';
    container.appendChild(invokeScript);

    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div className="container" style={{
      marginTop: '1px',
      marginBottom: '-40px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        borderRadius: '12px',
        padding: '12px 12px 10px 12px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '760px',
        margin: '0 auto'
      }}>
        <div style={{
          fontSize: '10px',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>✨</span>
          <span>Sponsorisé</span>
        </div>
        
        <div id="page-banner-ad-series" style={{
          maxWidth: '728px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}></div>
      </div>
    </div>
  );
}

export default function Series() {
  return (
    <div className="container">
      <PageBanner />
      
      <div style={{
        textAlign: 'center',
        padding: '100px 20px',
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Tv style={{width: 'clamp(50px, 10vw, 80px)', height: 'clamp(50px, 10vw, 80px)', color: '#7c3aed', margin: '0 auto 30px'}} />
        <h1 style={{fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: '900', marginBottom: '20px'}}>
          Séries TV
        </h1>
        <p style={{color: '#94a3b8', fontSize: 'clamp(14px, 3vw, 20px)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', padding: '0 10px'}}>
          La section Séries arrive bientôt ! Restez connectés pour découvrir nos séries exclusives.
        </p>
        <div style={{display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 10px'}}>
          <a href="/films" className="btn">
            Voir les Films
          </a>
          <a href="/iptv" className="btn" style={{background: 'linear-gradient(135deg, #7c3aed, #6d28d9)'}}>
            Regarder IPTV
          </a>
        </div>
      </div>
    </div>
  );
}
