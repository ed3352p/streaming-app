import { useEffect, useRef, useState, useCallback, memo } from 'react';
import Hls from 'hls.js';
import api from '../services/api';

const VideoPlayerIPTV = memo(function VideoPlayerIPTV({ src, title }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quality, setQuality] = useState('720p');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQualityLevel, setCurrentQualityLevel] = useState(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setIsLoading(true);
    let hls = null;

    // Vérification sécurisée côté serveur (anti-bypass)
    const initPlayer = async () => {
      // Appel API sécurisé pour vérifier le statut premium
      const premiumStatus = await api.verifyPremium();
      const maxQualityAllowed = premiumStatus.maxQuality || 360;
      const isPremium = premiumStatus.isPremium === true;
      
      console.log('IPTV - Premium Status (from server):', premiumStatus);
      console.log('IPTV - Max Quality Allowed:', maxQualityAllowed);

      // Vérifier si c'est un flux HLS
      if (src.includes('.m3u8')) {
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            manifestLoadingTimeOut: 20000,
            manifestLoadingMaxRetry: 4,
            levelLoadingTimeOut: 20000,
            levelLoadingMaxRetry: 4,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            startLevel: -1,
            capLevelToPlayerSize: false,
          });
          
          hls.loadSource(src);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS Levels disponibles:', hls.levels);
            
            const qualities = hls.levels.map((level, index) => ({
              index,
              height: level.height,
              width: level.width,
              bitrate: level.bitrate,
              label: `${level.height}p`
            }));
            qualities.sort((a, b) => b.height - a.height);
            
            // Filtrer selon la qualité max autorisée par le serveur
            const filteredQualities = isPremium 
              ? qualities 
              : qualities.filter(q => q.height <= maxQualityAllowed);
            
            if (filteredQualities.length === 0 && qualities.length > 0) {
              filteredQualities.push(qualities[qualities.length - 1]);
            }
            
            setAvailableQualities([
              { index: -1, label: 'Auto', height: 0 },
              ...filteredQualities
            ]);
            hlsRef.current = hls;
            
            if (filteredQualities.length > 0) {
              const maxQuality = filteredQualities[0];
              hls.currentLevel = maxQuality.index;
              setQuality(`${maxQuality.height}p`);
              setCurrentQualityLevel(maxQuality.index);
              console.log(`Qualité définie sur: ${maxQuality.height}p (max autorisé: ${maxQualityAllowed}p)`);
            }
            
            video.play().catch(() => {
              console.log('Erreur de lecture automatique');
            });
            setIsLoading(false);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (data.fatal) {
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setError('Erreur réseau - Tentative de reconnexion...');
                  setTimeout(() => {
                    hls.startLoad();
                    setError(null);
                  }, 2000);
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setError('Erreur média - Récupération...');
                  hls.recoverMediaError();
                  setTimeout(() => setError(null), 2000);
                  break;
                default:
                  setError('Flux indisponible');
                  setIsLoading(false);
                  hls.destroy();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Support natif pour Safari
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => console.log('Autoplay prevented'));
          });
          video.addEventListener('error', () => {
            setError('Flux indisponible');
            setIsLoading(false);
          });
        } else {
          setError('HLS non supporté sur ce navigateur');
          setIsLoading(false);
        }
      } else {
        // Vidéo directe (MP4, etc.)
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
        });
        video.addEventListener('error', () => {
          setError('Flux indisponible');
          setIsLoading(false);
        });
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => console.log('Autoplay prevented'));
      }
    };

    // Lancer l'initialisation
    initPlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
      hlsRef.current = null;
    };
  }, [src]);

const handleQualityChange = useCallback((qualityIndex) => {
  const hls = hlsRef.current;
  if (!hls) return;

  // Vérifier si la qualité demandée est autorisée
  const targetQuality = availableQualities.find(q => q.index === qualityIndex);
  if (!targetQuality) {
    console.log('Qualité non autorisée');
    return;
  }

  if (qualityIndex === -1) {
    hls.currentLevel = -1;
    setQuality('Auto');
  } else {
    hls.currentLevel = qualityIndex;
    hls.loadLevel = qualityIndex;
    setQuality(`${targetQuality.height}p`);
  }
  
  setCurrentQualityLevel(qualityIndex);
  setShowQualityMenu(false);
}, [availableQualities]);

  return (
    <div style={{position: 'relative', width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden'}}>
      {title && (
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
          color: 'white',
          padding: '10px 18px',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '700',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          🔴 {title}
        </div>
      )}
      
      {quality && !isLoading && availableQualities.length > 0 && (
        <div style={{position: 'absolute', top: '15px', right: '15px', zIndex: 10}}>
          <button
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚙️ {quality}</span>
            <span style={{fontSize: '10px'}}>{showQualityMenu ? '▲' : '▼'}</span>
          </button>
          
          {showQualityMenu && (
            <div style={{
              position: 'absolute',
              top: '45px',
              right: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              borderRadius: '8px',
              padding: '8px',
              minWidth: '150px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}>
              {availableQualities.map((q) => (
                <button
                  key={q.index}
                  onClick={() => handleQualityChange(q.index)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: currentQualityLevel === q.index ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: currentQualityLevel === q.index ? '#ef4444' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: currentQualityLevel === q.index ? '600' : '400',
                    marginBottom: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (currentQualityLevel !== q.index) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentQualityLevel !== q.index) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  {currentQualityLevel === q.index && '✓ '}{q.label}
                  {q.index === -1 && ' (Recommandé)'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(239, 68, 68, 0.3)',
            borderTop: '4px solid #ef4444',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }}></div>
          <p style={{color: '#cbd5e1', fontSize: '14px'}}>Chargement du flux...</p>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid #ef4444',
          color: '#ef4444',
          padding: '20px 30px',
          borderRadius: '12px',
          zIndex: 5,
          textAlign: 'center',
          maxWidth: '80%'
        }}>
          <p style={{fontSize: '16px', fontWeight: '600', marginBottom: '5px'}}>⚠️ {error}</p>
          <p style={{fontSize: '12px', color: '#cbd5e1'}}>Essayez une autre chaîne</p>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        playsInline
        preload="auto"
        style={{
          width: '100%',
          minHeight: '400px',
          maxHeight: '550px',
          background: '#000',
          display: 'block'
        }}
      >
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
    </div>
  );
});

export default VideoPlayerIPTV;
