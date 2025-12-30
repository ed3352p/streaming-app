import { useState, useEffect } from 'react';
import { parseM3U, groupChannelsByCategory, filterChannels } from '../utils/parseM3U';
import VideoPlayerIPTV from '../components/VideoPlayerIPTV';
import { ExternalAdBanner } from '../components/ExternalAdBanner';
import { AdsManager } from '../components/AdsManager';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PageBanner from '../components/PageBanner';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Iptv() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAds, setShowAds] = useState(false);
  const [ads, setAds] = useState([]);
  const [adsCount, setAdsCount] = useState(5);

  useEffect(() => {
    loadPlaylist();
  }, []);

  useEffect(() => {
    loadAdsSettings();
  }, [user]);

  const loadAdsSettings = async () => {
    try {
      const adsSettings = JSON.parse(localStorage.getItem('lumixar_ads_settings') || '{}');
      const adsEnabled = adsSettings.enabled !== false;
      const countNormal = adsSettings.countNormal || 5;

      const adsData = await api.getAds();
      const activeAds = adsData.filter(ad => ad.active);
      setAds(activeAds.length > 0 ? activeAds : []);

      // Premium et Admin: AUCUNE pub (0 pub)
      const userIsPremium = user?.premium === true || user?.role === 'admin';
      
      if (!adsEnabled || userIsPremium) {
        setAdsCount(0);
      } else {
        // Utilisateurs gratuits: X pubs
        setAdsCount(countNormal);
      }
    } catch (err) {
      console.error('Erreur chargement pubs:', err);
      setAds([]);
    }
  };

  const loadPlaylist = async () => {
    try {
      const response = await fetch('/playlist.m3u8');
      const content = await response.text();
      const parsedChannels = parseM3U(content);
      
      // Charger les modifications depuis l'API backend
      let savedModifications = [];
      try {
        const apiResponse = await fetch(`${API_URL}/api/iptv`);
        if (apiResponse.ok) {
          savedModifications = await apiResponse.json();
        }
      } catch (err) {
        console.log('API non disponible, utilisation des données locales');
      }
      
      // Appliquer les modifications aux chaînes du playlist
      const modifiedChannels = parsedChannels.map(channel => {
        const saved = savedModifications.find(s => s.id === channel.id);
        if (saved) {
          return { ...channel, ...saved };
        }
        return channel;
      });
      
      // Ajouter les chaînes personnalisées (celles qui ne sont pas dans le playlist)
      const customChannels = savedModifications.filter(s => 
        !parsedChannels.some(p => p.id === s.id)
      );
      
      const allChannels = [...customChannels, ...modifiedChannels];
      
      setChannels(allChannels);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading playlist:', error);
      setIsLoading(false);
    }
  };

  const groups = groupChannelsByCategory(channels);
  
  // Mettre les pays prioritaires en premier
  const priorityCategories = ['US', 'USA', 'Canada', 'France', 'FR', 'CA'];
  const allCategories = Object.keys(groups).sort();
  const topCategories = allCategories.filter(cat => 
    priorityCategories.some(priority => cat.includes(priority))
  );
  const otherCategories = allCategories.filter(cat => 
    !priorityCategories.some(priority => cat.includes(priority))
  );
  
  const categories = ['all', ...topCategories, ...otherCategories];

  const displayedChannels = selectedCategory === 'all' 
    ? filterChannels(channels, searchTerm)
    : filterChannels(groups[selectedCategory] || [], searchTerm);

  const handleChannelClick = (channel) => {
    if (adsCount > 0 && ads.length > 0) {
      setShowAds(true);
      setSelectedChannel(channel);
    } else {
      setSelectedChannel(channel);
    }
  };

  const handleAdsFinish = () => {
    setShowAds(false);
  };

  if (isLoading) {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <div style={{width: '60px', height: '60px', border: '4px solid #2563eb', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'}}></div>
        <p style={{color: '#cbd5e1', marginTop: '20px'}}>Chargement des chaînes IPTV...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <PageBanner containerId="iptv-banner-ad" />
      
      <h2>IPTV Live - {channels.length} chaînes</h2>
      
      {selectedChannel && (
        <>
          <style>{`
            @keyframes modalFadeIn {
              from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
            @keyframes overlayFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
          
          {/* Overlay sombre */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 999,
              animation: 'overlayFadeIn 0.2s ease forwards'
            }}
            onClick={() => setSelectedChannel(null)}
          />
          
          {/* Modal Box */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            padding: '25px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            opacity: 1,
            animation: 'modalFadeIn 0.25s ease forwards'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px'}}>
              <div style={{flex: 1}}>
                <h3 style={{margin: 0, fontSize: '24px', marginBottom: '10px'}}>📺 {selectedChannel.name}</h3>
                {selectedChannel.logo && (
                  <img src={selectedChannel.logo} alt={selectedChannel.name} style={{height: '50px', width: 'auto', maxWidth: '100px', objectFit: 'contain', borderRadius: '8px'}} onError={(e) => e.target.style.display = 'none'} />
                )}
                <p style={{color: '#64748b', marginTop: '10px', fontSize: '14px'}}>
                  📂 {selectedChannel.group}
                </p>
              </div>
              <button 
                onClick={() => setSelectedChannel(null)}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.background = '#dc2626'}
                onMouseOut={(e) => e.target.style.background = '#ef4444'}
              >
                ✕ Fermer
              </button>
            </div>
            
            {showAds ? (
              <AdsManager 
                adsCount={adsCount}
                ads={ads}
                onFinish={handleAdsFinish}
                userId={user?.id}
              />
            ) : selectedChannel.url.includes('youtube.com') || selectedChannel.url.includes('youtu.be') ? (
              <div style={{background: 'rgba(250, 204, 21, 0.1)', border: '1px solid #facc15', padding: '30px', borderRadius: '16px', textAlign: 'center'}}>
                <p style={{color: '#facc15', marginBottom: '20px', fontSize: '18px', fontWeight: '600'}}>🎥 Chaîne YouTube</p>
                <a 
                  href={selectedChannel.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn"
                  style={{display: 'inline-block', fontSize: '16px'}}
                >
                  Ouvrir sur YouTube
                </a>
              </div>
            ) : selectedChannel.url.includes('twitch.tv') ? (
              <div style={{background: 'rgba(145, 70, 255, 0.1)', border: '1px solid #9146ff', padding: '30px', borderRadius: '16px', textAlign: 'center'}}>
                <p style={{color: '#9146ff', marginBottom: '20px', fontSize: '18px', fontWeight: '600'}}>🎮 Chaîne Twitch</p>
                <a 
                  href={selectedChannel.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn"
                  style={{display: 'inline-block', background: 'linear-gradient(135deg, #9146ff, #772ce8)', fontSize: '16px'}}
                >
                  Ouvrir sur Twitch
                </a>
              </div>
            ) : (
              <div>
                <VideoPlayerIPTV 
                  src={selectedChannel.url} 
                  title={selectedChannel.name}
                />
                {(() => {
                  const user = JSON.parse(localStorage.getItem('user') || '{}');
                  const isPremium = user.premium === true || user.role === 'admin';
                  
                  return (
                    <div style={{marginTop: '15px', padding: '15px', background: isPremium ? 'rgba(34, 197, 94, 0.1)' : 'rgba(37, 99, 235, 0.1)', border: `1px solid ${isPremium ? '#22c55e' : '#2563eb'}`, borderRadius: '10px'}}>
                      {isPremium ? (
                        <>
                          <p style={{color: '#22c55e', fontSize: '14px', marginBottom: '8px', fontWeight: '600'}}>
                            ⭐ Compte Premium - Qualité maximale disponible
                          </p>
                          <p style={{color: '#cbd5e1', fontSize: '12px'}}>
                            Profitez de toutes les qualités disponibles jusqu'à 1080p/4K selon les flux.
                          </p>
                        </>
                      ) : (
                        <>
                          <p style={{color: '#cbd5e1', fontSize: '13px', marginBottom: '8px'}}>
                            💡 Si la vidéo ne se charge pas, essayez une autre chaîne ou vérifiez votre connexion.
                          </p>
                          <p style={{color: '#64748b', fontSize: '12px'}}>
                            📺 Qualité limitée à 360p pour les utilisateurs gratuits. 
                            <a href="/subscribe" style={{color: '#2563eb', marginLeft: '5px', fontWeight: '600'}}>Passez Premium</a> pour la qualité maximale (720p, 1080p, 4K) !
                          </p>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </>
      )}

      <input 
        type="text" 
        className="search-bar" 
        placeholder="Rechercher une chaîne..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="filters">
        {categories.slice(0, 15).map(cat => (
          <button 
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? `Toutes (${channels.length})` : `${cat} (${groups[cat]?.length || 0})`}
          </button>
        ))}
        {categories.length > 15 && (
          <button 
            className="filter-btn"
            style={{background: 'rgba(100, 116, 139, 0.2)', cursor: 'default'}}
            disabled
          >
            +{categories.length - 15} autres...
          </button>
        )}
      </div>

      <div style={{marginBottom: '20px', padding: '15px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid #2563eb', borderRadius: '10px'}}>
        <p style={{color: '#cbd5e1', fontSize: '14px', margin: 0}}>
          📺 Affichage de <strong>{displayedChannels.length}</strong> chaînes
          {displayedChannels.length > 100 && (
            <span style={{color: '#facc15', marginLeft: '10px'}}>
              ⚡ Utilisez les filtres pour affiner votre recherche
            </span>
          )}
        </p>
      </div>

      <ul className="iptv-list">
        {displayedChannels.slice(0, 100).map((channel, index) => (
          <li 
            key={`${channel.id}-${index}`}
            onClick={() => handleChannelClick(channel)}
            style={{cursor: 'pointer'}}
          >
            {channel.logo && <img src={channel.logo} alt="" style={{width: '30px', height: '30px', objectFit: 'contain', marginRight: '10px', borderRadius: '4px', verticalAlign: 'middle'}} onError={(e) => e.target.style.display = 'none'} />}
            📺 {channel.name} 
            <span style={{color: '#64748b', fontSize: '14px', marginLeft: '10px'}}>({channel.group})</span>
            {channel.url.includes('youtube.com') && <span style={{marginLeft: '10px'}}>🎥</span>}
            {channel.url.includes('twitch.tv') && <span style={{marginLeft: '10px'}}>🎮</span>}
          </li>
        ))}
      </ul>

      {displayedChannels.length > 100 && (
        <div style={{textAlign: 'center', marginTop: '40px', padding: '30px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px'}}>
          <p style={{color: '#ef4444', fontSize: '16px', fontWeight: '600', marginBottom: '10px'}}>
            ⚠️ Trop de chaînes à afficher ({displayedChannels.length})
          </p>
          <p style={{color: '#cbd5e1', fontSize: '14px'}}>
            Seules les 100 premières chaînes sont affichées. Utilisez les filtres par catégorie pour affiner votre recherche.
          </p>
        </div>
      )}

      {displayedChannels.length === 0 && (
        <p style={{textAlign: 'center', color: '#64748b', marginTop: '40px'}}>
          Aucune chaîne trouvée
        </p>
      )}
    </div>
  );
}
