import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Eye, DollarSign, Globe, Clock, BarChart3, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Analytics() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('24h');
  const [analytics, setAnalytics] = useState(null);
  const [popular, setPopular] = useState([]);
  const [genreStats, setGenreStats] = useState({});
  const [peakHours, setPeakHours] = useState([]);
  const [trends, setTrends] = useState([]);
  const [realtime, setRealtime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadRealtime, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, popularData, genreData, peakData, trendsData, realtimeData] = await Promise.all([
        api.getAnalytics(timeRange),
        api.getPopularContent(10),
        api.getStatsByGenre(),
        api.getPeakHours(),
        api.getTrends(7),
        api.getRealtimeStats()
      ]);
      
      setAnalytics(analyticsData);
      setPopular(popularData);
      setGenreStats(genreData);
      setPeakHours(peakData);
      setTrends(trendsData);
      setRealtime(realtimeData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtime = async () => {
    try {
      const realtimeData = await api.getRealtimeStats();
      setRealtime(realtimeData);
    } catch (err) {
      console.error('Error loading realtime:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: '#cbd5e1'}}>Chargement des analytics...</div>
      </div>
    );
  }

  const totalViews = analytics?.views?.length || 0;
  const totalImpressions = analytics?.adImpressions?.length || 0;
  const totalClicks = analytics?.adClicks?.length || 0;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

  const uniqueCountries = new Set(analytics?.views?.map(v => v.country).filter(Boolean)).size;
  const avgWatchTime = analytics?.views?.length > 0 
    ? (analytics.views.reduce((sum, v) => sum + (v.watchTime || 0), 0) / analytics.views.length / 60).toFixed(1)
    : 0;

  return (
    <div style={{minHeight: '100vh', background: '#0f172a'}}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '20px'
      }}>
        <div style={{maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button onClick={() => navigate('/admin')} style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'}}>
              <ArrowLeft size={24} />
            </button>
            <h1 style={{fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <BarChart3 style={{color: '#3b82f6'}} />
              Analytics & Monitoring
            </h1>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={{padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white'}}
            >
              <option value="1h">Dernière heure</option>
              <option value="24h">24 heures</option>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
            </select>
            <span style={{color: '#94a3b8'}}>{user?.email}</span>
            <button onClick={handleLogout} className="btn" style={{background: '#ef4444'}}>Déconnexion</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth: '1400px', margin: '0 auto', padding: '30px 20px'}}>
        
        {/* Real-time Stats */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          <div style={{textAlign: 'center'}}>
            <Activity size={32} style={{marginBottom: '10px'}} />
            <h3 style={{fontSize: '28px', marginBottom: '5px'}}>{realtime?.activeSessions || 0}</h3>
            <p style={{color: 'rgba(255,255,255,0.8)', fontSize: '14px'}}>Sessions actives</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <Eye size={32} style={{marginBottom: '10px'}} />
            <h3 style={{fontSize: '28px', marginBottom: '5px'}}>{realtime?.recentViews || 0}</h3>
            <p style={{color: 'rgba(255,255,255,0.8)', fontSize: '14px'}}>Vues (1h)</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <TrendingUp size={32} style={{marginBottom: '10px'}} />
            <h3 style={{fontSize: '28px', marginBottom: '5px'}}>{realtime?.bandwidthMB || 0} MB</h3>
            <p style={{color: 'rgba(255,255,255,0.8)', fontSize: '14px'}}>Bande passante (1h)</p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
              <Eye size={20} style={{color: '#3b82f6'}} />
              <h3 style={{color: '#64748b', fontSize: '14px'}}>VUES TOTALES</h3>
            </div>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#3b82f6'}}>{totalViews.toLocaleString()}</p>
          </div>

          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
              <DollarSign size={20} style={{color: '#22c55e'}} />
              <h3 style={{color: '#64748b', fontSize: '14px'}}>IMPRESSIONS PUB</h3>
            </div>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#22c55e'}}>{totalImpressions.toLocaleString()}</p>
          </div>

          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
              <TrendingUp size={20} style={{color: '#f59e0b'}} />
              <h3 style={{color: '#64748b', fontSize: '14px'}}>CLICS PUB</h3>
            </div>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#f59e0b'}}>{totalClicks.toLocaleString()}</p>
          </div>

          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
              <BarChart3 size={20} style={{color: '#a855f7'}} />
              <h3 style={{color: '#64748b', fontSize: '14px'}}>CTR</h3>
            </div>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#a855f7'}}>{ctr}%</p>
          </div>

          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
              <Globe size={20} style={{color: '#06b6d4'}} />
              <h3 style={{color: '#64748b', fontSize: '14px'}}>PAYS</h3>
            </div>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#06b6d4'}}>{uniqueCountries}</p>
          </div>

          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
              <Clock size={20} style={{color: '#ec4899'}} />
              <h3 style={{color: '#64748b', fontSize: '14px'}}>TEMPS MOYEN</h3>
            </div>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#ec4899'}}>{avgWatchTime}m</p>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
          
          {/* Popular Content */}
          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <TrendingUp size={20} style={{color: '#f59e0b'}} />
              Contenu Populaire
            </h3>
            {popular.length === 0 ? (
              <p style={{color: '#64748b', textAlign: 'center', padding: '20px'}}>Aucune donnée disponible</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {popular.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{fontWeight: '600', marginBottom: '4px'}}>{item.title}</div>
                      <div style={{fontSize: '12px', color: '#64748b'}}>
                        {item.contentType === 'movie' ? '🎬 Film' : '📺 Série'}
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: '18px', fontWeight: 'bold', color: '#3b82f6'}}>{item.views}</div>
                      <div style={{fontSize: '12px', color: '#64748b'}}>vues</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Genre Stats */}
          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <BarChart3 size={20} style={{color: '#a855f7'}} />
              Statistiques par Genre
            </h3>
            {Object.keys(genreStats).length === 0 ? (
              <p style={{color: '#64748b', textAlign: 'center', padding: '20px'}}>Aucune donnée disponible</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {Object.entries(genreStats).map(([genre, stats]) => (
                  <div key={genre}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                      <span style={{fontWeight: '600'}}>{genre}</span>
                      <span style={{color: '#3b82f6'}}>{stats.views} vues</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                        width: `${Math.min((stats.views / Math.max(...Object.values(genreStats).map(s => s.views))) * 100, 100)}%`
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px'}}>
          <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Clock size={20} style={{color: '#22c55e'}} />
            Heures de Pointe (7 derniers jours)
          </h3>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px'}}>
            {peakHours.map((item) => {
              const maxCount = Math.max(...peakHours.map(h => h.count));
              const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={item.hour} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                  <div style={{
                    width: '100%',
                    height: `${height}%`,
                    background: 'linear-gradient(180deg, #22c55e, #16a34a)',
                    borderRadius: '4px 4px 0 0',
                    position: 'relative',
                    minHeight: height > 0 ? '4px' : '0'
                  }}>
                    {item.count > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '10px',
                        color: '#94a3b8',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.count}
                      </div>
                    )}
                  </div>
                  <div style={{fontSize: '10px', color: '#64748b'}}>{item.hour}h</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trends */}
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <TrendingUp size={20} style={{color: '#06b6d4'}} />
            Tendances (7 derniers jours)
          </h3>
          {trends.length === 0 ? (
            <p style={{color: '#64748b', textAlign: 'center', padding: '20px'}}>Aucune donnée disponible</p>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                    <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Date</th>
                    <th style={{padding: '12px', textAlign: 'right', color: '#64748b'}}>Vues</th>
                    <th style={{padding: '12px', textAlign: 'right', color: '#64748b'}}>Utilisateurs Uniques</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((trend, index) => (
                    <tr key={index} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding: '12px'}}>{new Date(trend.date).toLocaleDateString('fr-FR')}</td>
                      <td style={{padding: '12px', textAlign: 'right', color: '#3b82f6', fontWeight: '600'}}>{trend.views}</td>
                      <td style={{padding: '12px', textAlign: 'right', color: '#22c55e', fontWeight: '600'}}>{trend.uniqueUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        {realtime?.sessions && realtime.sessions.length > 0 && (
          <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '30px'}}>
            <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <Users size={20} style={{color: '#ec4899'}} />
              Sessions Actives
            </h3>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                    <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Utilisateur</th>
                    <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Pays</th>
                    <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Ville</th>
                    <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Dernière activité</th>
                  </tr>
                </thead>
                <tbody>
                  {realtime.sessions.slice(0, 10).map((session, index) => (
                    <tr key={index} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding: '12px'}}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#22c55e',
                          marginRight: '8px'
                        }} />
                        {session.userId ? `User #${session.userId}` : 'Anonyme'}
                      </td>
                      <td style={{padding: '12px'}}>{session.country || 'Unknown'}</td>
                      <td style={{padding: '12px'}}>{session.city || 'Unknown'}</td>
                      <td style={{padding: '12px', color: '#64748b'}}>
                        {new Date(session.lastActivity).toLocaleTimeString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
