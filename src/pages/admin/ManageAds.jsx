import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const defaultAds = [
  {
    id: 1,
    title: 'StreamBox Premium',
    description: 'Profitez de StreamBox sans publicités !',
    imageUrl: 'https://via.placeholder.com/728x90/2563eb/ffffff?text=StreamBox+Premium+-+Sans+Pubs',
    link: '/subscribe',
    duration: 5,
    active: true
  },
  {
    id: 2,
    title: 'Nouveaux Films',
    description: 'Découvrez les dernières sorties',
    imageUrl: 'https://via.placeholder.com/728x90/ef4444/ffffff?text=Nouveaux+Films+Chaque+Semaine',
    link: '/films',
    duration: 5,
    active: true
  },
  {
    id: 3,
    title: 'IPTV Live',
    description: 'Regardez la TV en direct',
    imageUrl: 'https://via.placeholder.com/728x90/22c55e/ffffff?text=IPTV+Live+-+TV+en+Direct',
    link: '/iptv',
    duration: 5,
    active: true
  },
  {
    id: 4,
    title: 'Séries Exclusives',
    description: 'Les meilleures séries en streaming',
    imageUrl: 'https://via.placeholder.com/728x90/a855f7/ffffff?text=Series+Exclusives+en+Streaming',
    link: '/series',
    duration: 5,
    active: true
  },
  {
    id: 5,
    title: 'Abonnez-vous',
    description: 'Créez votre compte gratuitement',
    imageUrl: 'https://via.placeholder.com/728x90/f59e0b/ffffff?text=Creez+Votre+Compte+Gratuit',
    link: '/login',
    duration: 5,
    active: true
  }
];

export default function ManageAds() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [adsCountNormal, setAdsCountNormal] = useState(5);
  const [adsCountPremium, setAdsCountPremium] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    duration: 5
  });

  useEffect(() => {
    loadAds();
    loadSettings();
  }, []);

  const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('streambox_ads_settings') || '{}');
    setAdsEnabled(settings.enabled !== false);
    setAdsCountNormal(settings.countNormal || 5);
    setAdsCountPremium(settings.countPremium || 1);
  };

  const saveSettings = (enabled, countNormal, countPremium) => {
    const settings = { enabled, countNormal, countPremium };
    localStorage.setItem('streambox_ads_settings', JSON.stringify(settings));
    setAdsEnabled(enabled);
    setAdsCountNormal(countNormal);
    setAdsCountPremium(countPremium);
  };

  const loadAds = async () => {
    try {
      const adsData = await api.getAds();
      if (adsData.length > 0) {
        setAds(adsData);
      } else {
        setAds(defaultAds);
      }
    } catch (err) {
      console.error('Error loading ads:', err);
      setAds(defaultAds);
    }
  };

  const saveAds = (newAds) => {
    setAds(newAds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAd) {
        await api.updateAd(editingAd.id, formData);
        setEditingAd(null);
      } else {
        await api.createAd(formData);
      }
      
      await loadAds();
      setFormData({ title: '', description: '', imageUrl: '', link: '', duration: 5 });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving ad:', err);
      alert('Erreur: ' + err.message);
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      link: ad.link,
      duration: ad.duration
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette publicité ?')) {
      try {
        await api.deleteAd(id);
        await loadAds();
      } catch (err) {
        console.error('Error deleting ad:', err);
        alert('Erreur: ' + err.message);
      }
    }
  };

  const toggleActive = async (id) => {
    try {
      const ad = ads.find(a => a.id === id);
      if (ad) {
        await api.updateAd(id, { ...ad, active: !ad.active });
        await loadAds();
      }
    } catch (err) {
      console.error('Error toggling ad:', err);
      alert('Erreur: ' + err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{minHeight: '100vh', background: '#0f172a'}}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '20px'
      }}>
        <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button onClick={() => navigate('/admin')} style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'}}>
              <ArrowLeft size={24} />
            </button>
            <h1 style={{fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <Megaphone style={{color: '#f59e0b'}} />
              Gestion des Publicités
            </h1>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span style={{color: '#94a3b8'}}>{user?.email}</span>
            <button onClick={handleLogout} className="btn" style={{background: '#ef4444'}}>Déconnexion</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '30px 20px'}}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '20px', borderRadius: '12px'}}>
            <h3 style={{fontSize: '32px', marginBottom: '5px'}}>{ads.length}</h3>
            <p style={{color: 'rgba(255,255,255,0.8)'}}>Total Pubs</p>
          </div>
          <div style={{background: 'linear-gradient(135deg, #22c55e, #16a34a)', padding: '20px', borderRadius: '12px'}}>
            <h3 style={{fontSize: '32px', marginBottom: '5px'}}>{ads.filter(a => a.active).length}</h3>
            <p style={{color: 'rgba(255,255,255,0.8)'}}>Actives</p>
          </div>
          <div style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '20px', borderRadius: '12px'}}>
            <h3 style={{fontSize: '32px', marginBottom: '5px'}}>{ads.filter(a => !a.active).length}</h3>
            <p style={{color: 'rgba(255,255,255,0.8)'}}>Inactives</p>
          </div>
        </div>

        {/* Settings Panel */}
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            ⚙️ Paramètres des Publicités
          </h3>
          
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'center'}}>
            {/* Toggle Global */}
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <span style={{color: '#94a3b8'}}>Publicités:</span>
              <button
                onClick={() => saveSettings(!adsEnabled, adsCountNormal, adsCountPremium)}
                style={{
                  background: adsEnabled ? '#22c55e' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 25px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '120px'
                }}
              >
                {adsEnabled ? '✓ ACTIVÉES' : '✕ DÉSACTIVÉES'}
              </button>
            </div>

            {/* Nombre de pubs pour users normaux */}
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span style={{color: '#94a3b8'}}>Pubs (normal):</span>
              <input
                type="number"
                min="0"
                max="10"
                value={adsCountNormal}
                onChange={(e) => saveSettings(adsEnabled, parseInt(e.target.value) || 0, adsCountPremium)}
                style={{
                  width: '60px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: 'white',
                  textAlign: 'center'
                }}
              />
            </div>

            {/* Nombre de pubs pour premium */}
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span style={{color: '#94a3b8'}}>Pubs (premium):</span>
              <input
                type="number"
                min="0"
                max="5"
                value={adsCountPremium}
                onChange={(e) => saveSettings(adsEnabled, adsCountNormal, parseInt(e.target.value) || 0)}
                style={{
                  width: '60px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: 'white',
                  textAlign: 'center'
                }}
              />
            </div>
          </div>

          <p style={{color: '#64748b', fontSize: '12px', marginTop: '15px'}}>
            {adsEnabled 
              ? `Les utilisateurs normaux verront ${adsCountNormal} pub(s) avant le film. Les premium verront ${adsCountPremium} pub(s) à la fin.`
              : 'Toutes les publicités sont désactivées pour tous les utilisateurs.'
            }
          </p>
        </div>

        <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'flex-end'}}>
          <button 
            onClick={() => { setShowAddForm(true); setEditingAd(null); setFormData({ title: '', description: '', imageUrl: '', link: '', duration: 5 }); }}
            className="btn"
            style={{display: 'flex', alignItems: 'center', gap: '8px'}}
          >
            <Plus size={20} /> Ajouter une pub
          </button>
        </div>

        {showAddForm && (
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            borderRadius: '16px',
            padding: '25px',
            marginBottom: '30px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{marginBottom: '20px'}}>{editingAd ? 'Modifier la publicité' : 'Nouvelle publicité'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', color: '#94a3b8'}}>Titre</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', color: '#94a3b8'}}>Lien (URL)</label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white'}}
                  />
                </div>
                <div style={{gridColumn: 'span 2'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#94a3b8'}}>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white'}}
                  />
                </div>
                <div style={{gridColumn: 'span 2'}}>
                  <label style={{display: 'block', marginBottom: '5px', color: '#94a3b8'}}>URL Image (728x90 recommandé)</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', color: '#94a3b8'}}>Durée (secondes)</label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white'}}
                  />
                </div>
              </div>
              <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                <button type="submit" className="btn">{editingAd ? 'Modifier' : 'Ajouter'}</button>
                <button type="button" onClick={() => { setShowAddForm(false); setEditingAd(null); }} className="btn" style={{background: '#475569'}}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: 'rgba(255,255,255,0.05)'}}>
                <th style={{padding: '15px', textAlign: 'left', color: '#94a3b8'}}>Aperçu</th>
                <th style={{padding: '15px', textAlign: 'left', color: '#94a3b8'}}>Titre</th>
                <th style={{padding: '15px', textAlign: 'left', color: '#94a3b8'}}>Durée</th>
                <th style={{padding: '15px', textAlign: 'left', color: '#94a3b8'}}>Statut</th>
                <th style={{padding: '15px', textAlign: 'right', color: '#94a3b8'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map(ad => (
                <tr key={ad.id} style={{borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding: '15px'}}>
                    <img 
                      src={ad.imageUrl} 
                      alt={ad.title}
                      style={{width: '120px', height: '40px', objectFit: 'cover', borderRadius: '4px', background: '#334155'}}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </td>
                  <td style={{padding: '15px'}}>
                    <div style={{fontWeight: '600'}}>{ad.title}</div>
                    <div style={{fontSize: '12px', color: '#64748b'}}>{ad.description}</div>
                  </td>
                  <td style={{padding: '15px', color: '#94a3b8'}}>{ad.duration}s</td>
                  <td style={{padding: '15px'}}>
                    <button
                      onClick={() => toggleActive(ad.id)}
                      style={{
                        background: ad.active ? '#22c55e' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {ad.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{padding: '15px', textAlign: 'right'}}>
                    <button onClick={() => handleEdit(ad)} style={{background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px'}}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(ad.id)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
