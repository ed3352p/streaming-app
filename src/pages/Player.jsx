import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AdsManager } from '../components/AdsManager';
import { useViewTracking } from '../utils/useTracking';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Player() {
  const { id } = useParams();
  const { user } = useAuth();
  const [showAds, setShowAds] = useState(true);
  const [showEndAd, setShowEndAd] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [adsCount, setAdsCount] = useState(5);
  const [ads, setAds] = useState([]);
  const playerRef = useRef(null);

  useViewTracking(movie?.id, 'movie', movie?.title, movie?.genre);

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les paramètres des pubs
        const adsSettings = JSON.parse(localStorage.getItem('streambox_ads_settings') || '{}');
        const adsEnabled = adsSettings.enabled !== false;
        const countNormal = adsSettings.countNormal || 5;
        const countPremium = adsSettings.countPremium || 1;

        // Charger les publicités depuis l'API
        const adsData = await api.getAds();
        const activeAds = adsData.filter(ad => ad.active);
        setAds(activeAds.length > 0 ? activeAds : []);

        // Vérifier si l'utilisateur est premium ou admin
        const userIsPremium = user?.premium === true || user?.role === 'admin';
        setIsPremium(userIsPremium);
        
        // Admins et Premium: jamais de pubs
        if (!adsEnabled || userIsPremium) {
          setShowAds(false);
          setVideoStarted(true);
          setAdsCount(0);
        } else {
          // Normal: X pubs au début
          setShowAds(countNormal > 0);
          setVideoStarted(countNormal === 0);
          setAdsCount(countNormal);
        }

        // Charger les infos du film depuis l'API
        const data = await api.getMovie(id);
        setMovie(data);
      } catch (err) {
        console.error('Erreur chargement:', err);
        const movies = JSON.parse(localStorage.getItem('movies') || '[]');
        const foundMovie = movies.find(m => m.id === parseInt(id));
        setMovie(foundMovie);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user]);

  const handleAdsFinish = () => {
    setShowAds(false);
    setVideoStarted(true);
  };

  const handleEndAdFinish = () => {
    setShowEndAd(false);
  };

  const handleVideoEnd = () => {
    // Pas de pub de fin pour les premium
    // Les non-premium n'ont pas de pub de fin non plus
  };

  if (loading) {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <div style={{width: '50px', height: '50px', border: '4px solid #2563eb', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'}}></div>
        <p style={{color: '#64748b', marginTop: '20px'}}>Chargement...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2>Film non trouvé</h2>
        <p style={{color: '#64748b', marginTop: '20px'}}>Ce film n'existe pas ou a été supprimé.</p>
        <a href="/" className="btn" style={{marginTop: '20px'}}>Retour à l'accueil</a>
      </div>
    );
  }

  return (
    <div className="player">
      {showEndAd ? (
        <div>
          <AdsManager adsCount={1} onFinish={handleEndAdFinish} />
          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <p style={{color: '#94a3b8', fontSize: '14px'}}>
              Merci d'avoir regardé ce film sur StreamBox !
            </p>
          </div>
        </div>
      ) : showAds ? (
        <div>
          <AdsManager adsCount={adsCount} onFinish={handleAdsFinish} ads={ads} userId={user?.id} />
          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <p style={{color: '#cbd5e1', marginBottom: '10px'}}>Veuillez patienter pendant les publicités...</p>
            <p style={{color: '#22c55e', fontSize: '14px'}}>
              Abonnez-vous au Premium pour réduire les pubs ! 
              <a href="/subscribe" style={{color: '#2563eb', marginLeft: '5px'}}>En savoir plus</a>
            </p>
          </div>
        </div>
      ) : (
        <div>
          {movie.videoUrl && (
            movie.videoUrl.includes('youtube.com') || 
            movie.videoUrl.includes('youtu.be') ||
            movie.videoUrl.includes('iframe') ||
            movie.videoUrl.includes('bramtiv.com') ||
            movie.videoUrl.includes('embed') ||
            movie.videoUrl.includes('voe.sx') ||
            movie.videoUrl.includes('sharecloudy.com') ||
            movie.videoUrl.includes('streamtape') ||
            movie.videoUrl.includes('doodstream') ||
            movie.videoUrl.includes('mixdrop')
          ) ? (
            // Lecteur iframe
            <div ref={playerRef} style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              borderRadius: '16px',
              background: '#000'
            }}>
              <iframe
                src={
                  movie.videoUrl.includes('youtube.com/watch?v=') 
                    ? movie.videoUrl.replace('watch?v=', 'embed/').split('&')[0]
                    : movie.videoUrl.includes('youtu.be/') 
                    ? movie.videoUrl.replace('youtu.be/', 'youtube.com/embed/')
                    : movie.videoUrl
                }
                title={movie.title}
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                referrerPolicy="no-referrer"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
          ) : (
            // Lecteur vidéo standard
            <video 
              controls 
              autoPlay 
              style={{width: '100%', borderRadius: '16px', background: '#000'}}
              onError={(e) => {
                console.error('Erreur de lecture vidéo:', e);
              }}
            >
              <source src={movie.videoUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"} type="application/x-mpegURL" />
              <source src={movie.videoUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}
          {!movie.videoUrl && (
            <div style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '15px', borderRadius: '12px', marginTop: '15px'}}>
              <p style={{color: '#ef4444', fontSize: '14px', margin: 0}}>
                ⚠️ Aucune URL vidéo n'a été définie pour ce film. Veuillez ajouter une URL vidéo depuis l'admin.
              </p>
            </div>
          )}
          <div style={{marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
            <h3 style={{marginBottom: '10px'}}>{movie.title}</h3>
            <div style={{display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center'}}>
              {movie.rating > 0 && <span style={{color: '#facc15'}}>⭐ {movie.rating}/5</span>}
              {movie.year && <span style={{color: '#64748b'}}>|</span>}
              {movie.year && <span style={{color: '#cbd5e1'}}>{movie.year}</span>}
              {movie.duration && <span style={{color: '#64748b'}}>|</span>}
              {movie.duration && <span style={{color: '#cbd5e1'}}>{movie.duration} min</span>}
              {movie.genre && <span style={{color: '#64748b'}}>|</span>}
              {movie.genre && <span style={{color: '#cbd5e1'}}>{movie.genre}</span>}
            </div>
            <p style={{color: '#cbd5e1', fontSize: '14px'}}>
              {movie.description || "Profitez de ce film en streaming."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
