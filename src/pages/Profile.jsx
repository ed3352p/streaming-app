import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Clock, Star, Film, TrendingUp, Award, Users, Gift } from 'lucide-react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [badges, setBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [statsData, historyData, favoritesData, referralsData, badgesData] = await Promise.all([
        api.getUserStats(),
        api.getHistory(),
        api.getFavorites(),
        api.getReferrals(),
        api.getUserBadges(),
      ]);
      setStats(statsData);
      setHistory(historyData);
      setFavorites(favoritesData);
      setReferrals(referralsData);
      setBadges(badgesData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: '700',
            color: 'white',
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
              {user?.name || user?.username}
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '12px' }}>@{user?.username}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{
                background: user?.premium ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(139, 92, 246, 0.2)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
              }}>
                {user?.premium ? '⭐ Premium' : '🆓 Gratuit'}
              </span>
              {user?.role === 'admin' && (
                <span style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  👑 Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto' }}>
        {['stats', 'history', 'favorites', 'referrals', 'badges'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'rgba(139, 92, 246, 0.1)',
              color: activeTab === tab ? 'white' : '#cbd5e1',
              cursor: 'pointer',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'stats' && '📊 Statistiques'}
            {tab === 'history' && '🕐 Historique'}
            {tab === 'favorites' && '❤️ Favoris'}
            {tab === 'referrals' && '🎁 Parrainages'}
            {tab === 'badges' && '🏆 Badges'}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
            <Clock size={32} color="#8b5cf6" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Temps total regardé</h3>
            <p style={{ fontSize: '28px', fontWeight: '700' }}>{formatDuration(stats.totalWatchTime || 0)}</p>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}>
            <Film size={32} color="#3b82f6" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Films regardés</h3>
            <p style={{ fontSize: '28px', fontWeight: '700' }}>{stats.moviesWatched || 0}</p>
          </div>

          <div style={{
            background: 'rgba(236, 72, 153, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(236, 72, 153, 0.3)',
          }}>
            <Star size={32} color="#ec4899" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Note moyenne donnée</h3>
            <p style={{ fontSize: '28px', fontWeight: '700' }}>{(stats.averageRating || 0).toFixed(1)} ⭐</p>
          </div>

          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}>
            <TrendingUp size={32} color="#22c55e" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Jours consécutifs</h3>
            <p style={{ fontSize: '28px', fontWeight: '700' }}>{stats.streakDays || 0} 🔥</p>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
              Aucun historique pour le moment
            </p>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                    Regardé le {new Date(item.watchedAt).toLocaleDateString('fr-FR')}
                  </p>
                  {item.progress && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        height: '4px',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
                          height: '100%',
                          width: `${(item.progress / item.duration) * 100}%`,
                        }} />
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {Math.round((item.progress / item.duration) * 100)}% terminé
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {favorites.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px', gridColumn: '1 / -1' }}>
              Aucun favori pour le moment
            </p>
          ) : (
            favorites.map(item => (
              <div key={item.id} style={{ cursor: 'pointer' }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '12px', marginBottom: '8px' }}
                />
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</h4>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'referrals' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
              🎁 Programme de parrainage
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
              Parrainez vos amis et gagnez des jours Premium gratuits !
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <code style={{ fontSize: '18px', fontWeight: '600', color: '#8b5cf6' }}>
                {user?.referralCode || 'LOADING...'}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.referralCode}`);
                }}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Copier le lien
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <Users size={32} color="#8b5cf6" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '24px', fontWeight: '700' }}>{referrals?.length || 0}</p>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>Amis parrainés</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Gift size={32} color="#22c55e" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '24px', fontWeight: '700' }}>{(referrals?.length || 0) * 7}</p>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>Jours Premium gagnés</p>
              </div>
            </div>
          </div>

          {referrals && referrals.length > 0 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Vos parrainages
              </h3>
              {referrals.map(ref => (
                <div
                  key={ref.id}
                  style={{
                    background: 'rgba(139, 92, 246, 0.05)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{ref.username}</span>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {new Date(ref.joinedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
          {badges && badges.length > 0 ? (
            badges.map(badge => (
              <div
                key={badge.id}
                style={{
                  background: badge.unlocked ? 'rgba(139, 92, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  border: `1px solid ${badge.unlocked ? 'rgba(139, 92, 246, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                  opacity: badge.unlocked ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{badge.icon}</div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{badge.name}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>{badge.description}</p>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px', gridColumn: '1 / -1' }}>
              Regardez des films pour débloquer des badges !
            </p>
          )}
        </div>
      )}
    </div>
  );
}
