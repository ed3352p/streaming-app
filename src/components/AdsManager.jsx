import { useState, useEffect } from 'react';
import api from '../services/api';

const defaultAds = [
  {
    id: 1,
    title: 'Lumixar Premium',
    description: 'Profitez de Lumixar sans publicités !',
    imageUrl: 'https://via.placeholder.com/728x90/2563eb/ffffff?text=Lumixar+Premium+-+Sans+Pubs',
    link: '/subscribe',
    duration: 5
  },
  {
    id: 2,
    title: 'Nouveaux Films',
    description: 'Découvrez les dernières sorties',
    imageUrl: 'https://via.placeholder.com/728x90/ef4444/ffffff?text=Nouveaux+Films+Chaque+Semaine',
    link: '/films',
    duration: 5
  },
  {
    id: 3,
    title: 'IPTV Live',
    description: 'Regardez la TV en direct',
    imageUrl: 'https://via.placeholder.com/728x90/22c55e/ffffff?text=IPTV+Live+-+TV+en+Direct',
    link: '/iptv',
    duration: 5
  },
  {
    id: 4,
    title: 'Séries Exclusives',
    description: 'Les meilleures séries en streaming',
    imageUrl: 'https://via.placeholder.com/728x90/a855f7/ffffff?text=Series+Exclusives+en+Streaming',
    link: '/series',
    duration: 5
  },
  {
    id: 5,
    title: 'Abonnez-vous',
    description: 'Créez votre compte gratuitement',
    imageUrl: 'https://via.placeholder.com/728x90/f59e0b/ffffff?text=Creez+Votre+Compte+Gratuit',
    link: '/login',
    duration: 5
  }
];

export function AdsManager({ adsCount = 5, onFinish, ads = defaultAds, userId = null }) {
  const [currentAd, setCurrentAd] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  const displayAds = ads.slice(0, adsCount);
  const currentAdData = displayAds[currentAd];

  useEffect(() => {
    if (currentAd >= displayAds.length) {
      onFinish && onFinish();
      return;
    }

    const duration = currentAdData?.duration || 5;
    setTimeLeft(duration);
    setCanSkip(false);

    // Track impression
    if (currentAdData?.id) {
      api.trackAdImpression(currentAdData.id, userId).catch(err => 
        console.error('Failed to track impression:', err)
      );
    }

    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 3000);

    return () => {
      clearInterval(countdown);
      clearTimeout(skipTimer);
    };
  }, [currentAd, displayAds.length, onFinish, currentAdData, userId]);

  const handleSkip = () => {
    if (canSkip) {
      if (currentAd + 1 >= displayAds.length) {
        onFinish && onFinish();
      } else {
        setCurrentAd(currentAd + 1);
      }
    }
  };

  const handleAdClick = () => {
    if (currentAdData?.id) {
      api.trackAdClick(currentAdData.id, userId).catch(err => 
        console.error('Failed to track click:', err)
      );
    }
    if (currentAdData?.link) {
      window.open(currentAdData.link, '_blank');
    }
  };

  if (currentAd >= displayAds.length) return null;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1e293b, #0f172a)',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <span style={{
          background: '#ef4444',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          PUBLICITÉ {currentAd + 1} / {displayAds.length}
        </span>
        <span style={{color: '#94a3b8', fontSize: '14px'}}>
          {timeLeft > 0 ? `${timeLeft}s` : 'Prêt'}
        </span>
      </div>

      <div 
        onClick={handleAdClick}
        style={{
          cursor: 'pointer',
          marginBottom: '15px',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <img 
          src={currentAdData?.imageUrl || 'https://via.placeholder.com/728x90/333/fff?text=Publicite'}
          alt={currentAdData?.title || 'Publicité'}
          style={{
            width: '100%',
            maxHeight: '200px',
            objectFit: 'cover',
            borderRadius: '12px'
          }}
        />
      </div>

      <h3 style={{
        fontSize: '18px',
        marginBottom: '8px',
        color: '#fff'
      }}>
        {currentAdData?.title || 'Publicité'}
      </h3>
      <p style={{
        color: '#94a3b8',
        fontSize: '14px',
        marginBottom: '20px'
      }}>
        {currentAdData?.description || ''}
      </p>

      <button
        onClick={handleSkip}
        disabled={!canSkip}
        style={{
          background: canSkip ? '#2563eb' : '#475569',
          color: 'white',
          border: 'none',
          padding: '12px 30px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: canSkip ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s'
        }}
      >
        {canSkip ? (currentAd + 1 >= displayAds.length ? 'Regarder le film' : 'Passer la pub') : `Attendez ${timeLeft}s`}
      </button>

      <div style={{
        marginTop: '15px',
        display: 'flex',
        justifyContent: 'center',
        gap: '6px'
      }}>
        {displayAds.map((_, index) => (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: index === currentAd ? '#2563eb' : index < currentAd ? '#22c55e' : '#475569'
            }}
          />
        ))}
      </div>
    </div>
  );
}
