import { useState, useEffect } from 'react';
import { Clock, Heart, History, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import api from '../services/api';

export default function Watchlist() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('watchlist');
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'watchlist') {
        const data = await api.getWatchlist();
        setWatchlist(data);
      } else if (activeTab === 'favorites') {
        const data = await api.getFavorites();
        setFavorites(data);
      } else if (activeTab === 'history') {
        const data = await api.getHistory();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id, type) => {
    try {
      if (type === 'watchlist') {
        await api.removeFromWatchlist(id);
        setWatchlist(watchlist.filter(item => item.id !== id));
      } else if (type === 'favorites') {
        await api.removeFromFavorites(id);
        setFavorites(favorites.filter(item => item.id !== id));
      } else if (type === 'history') {
        await api.removeFromHistory(id);
        setHistory(history.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Erreur: ' + err.message);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2>Connexion requise</h2>
        <p style={{color: '#64748b', marginTop: '20px'}}>
          Vous devez être connecté pour accéder à cette page
        </p>
        <a href="/login" className="btn" style={{marginTop: '20px'}}>
          Se connecter
        </a>
      </div>
    );
  }

  const currentData = activeTab === 'watchlist' ? watchlist : activeTab === 'favorites' ? favorites : history;

  return (
    <div className="container" style={{paddingTop: '30px'}}>
      <h1 style={{marginBottom: '30px'}}>Ma Collection</h1>

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('watchlist')}
          style={{
            background: activeTab === 'watchlist' ? '#3b82f6' : 'transparent',
            color: activeTab === 'watchlist' ? 'white' : '#94a3b8',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}
        >
          <Clock size={20} />
          À regarder ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          style={{
            background: activeTab === 'favorites' ? '#3b82f6' : 'transparent',
            color: activeTab === 'favorites' ? 'white' : '#94a3b8',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}
        >
          <Heart size={20} />
          Favoris ({favorites.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            background: activeTab === 'history' ? '#3b82f6' : 'transparent',
            color: activeTab === 'history' ? 'white' : '#94a3b8',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}
        >
          <History size={20} />
          Historique ({history.length})
        </button>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '50px'}}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{color: '#64748b', marginTop: '20px'}}>Chargement...</p>
        </div>
      ) : currentData.length > 0 ? (
        <div className="movies-grid">
          {currentData.map((item) => (
            <div key={item.id} style={{position: 'relative'}}>
              <MovieCard 
                movie={{
                  id: item.contentId,
                  title: item.title,
                  imageUrl: item.imageUrl,
                  type: item.contentType
                }} 
              />
              <button
                onClick={() => handleRemove(item.id, activeTab)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
                title="Retirer"
              >
                <Trash2 size={16} />
              </button>
              {activeTab === 'history' && item.progress && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.8)',
                  borderRadius: '4px',
                  padding: '5px',
                  zIndex: 2
                }}>
                  <div style={{
                    height: '4px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: '#3b82f6',
                      width: `${(item.progress || 0) * 100}%`
                    }} />
                  </div>
                  <div style={{fontSize: '10px', color: '#94a3b8', marginTop: '2px'}}>
                    {Math.round((item.progress || 0) * 100)}% visionné
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{textAlign: 'center', padding: '50px'}}>
          {activeTab === 'watchlist' && <Clock size={64} style={{color: '#64748b', margin: '0 auto 20px'}} />}
          {activeTab === 'favorites' && <Heart size={64} style={{color: '#64748b', margin: '0 auto 20px'}} />}
          {activeTab === 'history' && <History size={64} style={{color: '#64748b', margin: '0 auto 20px'}} />}
          <p style={{color: '#64748b', fontSize: '18px'}}>
            {activeTab === 'watchlist' && 'Votre liste est vide'}
            {activeTab === 'favorites' && 'Aucun favori pour le moment'}
            {activeTab === 'history' && 'Aucun historique de visionnage'}
          </p>
          <p style={{color: '#64748b', marginTop: '10px'}}>
            Parcourez le catalogue et ajoutez des contenus
          </p>
          <a href="/films" className="btn" style={{marginTop: '20px'}}>
            Découvrir des films
          </a>
        </div>
      )}
    </div>
  );
}
