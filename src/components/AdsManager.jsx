import { useState, useEffect } from 'react';
import api from '../services/api';

export function AdsManager({ adsCount = 5, onFinish, ads = [], userId = null }) {
  const [currentAd, setCurrentAd] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [canContinue, setCanContinue] = useState(false);

  const displayAds = ads.slice(0, adsCount);
  const currentAdData = displayAds[currentAd];

  useEffect(() => {
    if (currentAd >= displayAds.length) {
      onFinish && onFinish();
      return;
    }

    const duration = currentAdData?.duration || 5;
    setTimeLeft(duration);
    setCanContinue(false);

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
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdown);
    };
  }, [currentAd, displayAds.length, onFinish, currentAdData, userId]);

  const handleContinue = () => {
    if (!canContinue) return;

    // Track click
    if (currentAdData?.id) {
      api.trackAdClick(currentAdData.id, userId).catch(err => 
        console.error('Failed to track click:', err)
      );
    }

    // Open link in new tab
    if (currentAdData?.link) {
      window.open(currentAdData.link, '_blank');
    }

    // Move to next ad or finish
    if (currentAd + 1 >= displayAds.length) {
      onFinish && onFinish();
    } else {
      setCurrentAd(currentAd + 1);
    }
  };

  if (currentAd >= displayAds.length) return null;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1e293b, #0f172a)',
      borderRadius: '16px',
      padding: '40px',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.1)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <span style={{
          background: '#ef4444',
          color: 'white',
          padding: '6px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          PUBLICITÉ {currentAd + 1} / {displayAds.length}
        </span>
        <span style={{color: '#94a3b8', fontSize: '16px', fontWeight: '600'}}>
          {timeLeft > 0 ? `${timeLeft}s` : '✓ Prêt'}
        </span>
      </div>

      <div style={{
        fontSize: '48px',
        marginBottom: '20px'
      }}>
        📢
      </div>

      <h3 style={{
        fontSize: '24px',
        marginBottom: '12px',
        color: '#fff',
        fontWeight: '700'
      }}>
        Publicité
      </h3>
      
      <p style={{
        color: '#94a3b8',
        fontSize: '16px',
        marginBottom: '30px',
        lineHeight: '1.6'
      }}>
        Cliquez sur "Continuer" pour ouvrir le lien publicitaire et passer à la suite
      </p>

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        style={{
          background: canContinue ? '#2563eb' : '#475569',
          color: 'white',
          border: 'none',
          padding: '16px 40px',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: canContinue ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s',
          width: '100%',
          maxWidth: '300px'
        }}
      >
        {canContinue 
          ? (currentAd + 1 >= displayAds.length ? '🎬 Regarder le film' : '➡️ Continuer') 
          : `⏳ Attendez ${timeLeft}s`
        }
      </button>

      <div style={{
        marginTop: '25px',
        display: 'flex',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {displayAds.map((_, index) => (
          <div
            key={index}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: index === currentAd ? '#2563eb' : index < currentAd ? '#22c55e' : '#475569',
              transition: 'all 0.3s'
            }}
          />
        ))}
      </div>
    </div>
  );
}
