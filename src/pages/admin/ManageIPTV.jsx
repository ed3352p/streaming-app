import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { parseM3U } from '../../utils/parseM3U';
import api from '../../services/api';

export default function ManageIPTV() {
  const [customChannels, setCustomChannels] = useState([]);
  const [playlistChannels, setPlaylistChannels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [activeTab, setActiveTab] = useState('playlist'); // 'playlist' ou 'custom'
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    logo: '',
    category: ''
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadChannels();
    loadPlaylist();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await api.getIPTV();
      setCustomChannels(data);
    } catch (err) {
      console.error('Erreur chargement IPTV:', err);
      const savedChannels = JSON.parse(localStorage.getItem('customChannels') || '[]');
      setCustomChannels(savedChannels);
    }
  };

  const loadPlaylist = async () => {
    try {
      const response = await fetch('/playlist.m3u8');
      const content = await response.text();
      const parsed = parseM3U(content);
      
      // Charger les modifications sauvegardées depuis l'API
      try {
        const savedChannels = await api.getIPTV();
        // Appliquer les modifications aux chaînes du playlist
        const modifiedChannels = parsed.map(channel => {
          const saved = savedChannels.find(s => s.id === channel.id);
          if (saved) {
            return { ...channel, ...saved };
          }
          return channel;
        });
        setPlaylistChannels(modifiedChannels);
      } catch {
        setPlaylistChannels(parsed);
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    }
  };

  // Filtrer les chaînes selon la recherche
  const filteredPlaylistChannels = playlistChannels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const channels = activeTab === 'playlist' ? filteredPlaylistChannels : customChannels;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingChannel) {
      // Mode édition via API
      try {
        const channelData = {
          name: formData.name,
          url: formData.url,
          logo: formData.logo,
          group: formData.category || editingChannel.group
        };
        
        console.log('Saving channel:', channelData);
        
        await api.updateIPTV(editingChannel.id, channelData);
        
        // Mettre à jour l'affichage local
        if (activeTab === 'playlist') {
          setPlaylistChannels(prev => prev.map(c =>
            c.id === editingChannel.id ? { ...c, ...channelData } : c
          ));
        } else {
          setCustomChannels(prev => prev.map(c =>
            c.id === editingChannel.id ? { ...c, ...channelData } : c
          ));
        }
        
        setEditingChannel(null);
        alert('Chaîne modifiée avec succès !');
      } catch (err) {
        console.error('Erreur modification:', err);
        alert('Erreur: ' + err.message);
      }
    } else {
      // Mode ajout via API
      try {
        const channelData = {
          name: formData.name,
          url: formData.url,
          logo: formData.logo || '',
          group: formData.category || 'Custom'
        };
        
        const newChannel = await api.createIPTV(channelData);
        setCustomChannels(prev => [...prev, newChannel]);
        alert('Chaîne ajoutée avec succès !');
      } catch (err) {
        console.error('Erreur ajout:', err);
        alert('Erreur: ' + err.message);
      }
    }

    setFormData({ name: '', url: '', logo: '', category: '' });
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette chaîne ?')) {
      try {
        await api.deleteIPTV(id);
        setCustomChannels(prev => prev.filter(c => c.id !== id));
        alert('Chaîne supprimée avec succès !');
      } catch (err) {
        console.error('Erreur suppression:', err);
        alert('Erreur: ' + err.message);
      }
    }
  };

  const handleEdit = (channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      url: channel.url,
      logo: channel.logo || '',
      category: channel.group || ''
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingChannel(null);
    setFormData({ name: '', url: '', logo: '', category: '' });
    setShowAddForm(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <h1 style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <Tv style={{width: '36px', height: '36px'}} />
          Gestion IPTV
        </h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <span style={{color: '#cbd5e1'}}>👤 {user?.email || user?.username}</span>
          <a href="/admin" className="btn" style={{background: 'linear-gradient(135deg, #64748b, #475569)'}}>
            ← Dashboard
          </a>
          <button onClick={handleLogout} className="btn" style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)'}}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px'}}>
        <div 
          onClick={() => setActiveTab('custom')}
          style={{background: activeTab === 'custom' ? 'linear-gradient(145deg, #7c3aed20, #7c3aed10)' : 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: activeTab === 'custom' ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.3s'}}
        >
          <h3 style={{color: '#64748b', fontSize: '14px', marginBottom: '10px'}}>CHAÎNES PERSONNALISÉES</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold', color: '#7c3aed'}}>{customChannels.length}</p>
        </div>
        <div 
          onClick={() => setActiveTab('playlist')}
          style={{background: activeTab === 'playlist' ? 'linear-gradient(145deg, #2563eb20, #2563eb10)' : 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: activeTab === 'playlist' ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.3s'}}
        >
          <h3 style={{color: '#64748b', fontSize: '14px', marginBottom: '10px'}}>CHAÎNES PLAYLIST.M3U8</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold', color: '#2563eb'}}>{playlistChannels.length}</p>
        </div>
      </div>

      {/* Barre de recherche pour playlist */}
      {activeTab === 'playlist' && (
        <div style={{marginBottom: '20px', position: 'relative'}}>
          <Search style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#64748b'}} />
          <input
            type="text"
            placeholder="Rechercher une chaîne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{width: '100%', padding: '12px 12px 12px 50px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px'}}
          />
        </div>
      )}

      {/* Bouton Ajouter */}
      <div style={{marginBottom: '30px'}}>
        <button 
          onClick={() => {
            if (showAddForm) {
              handleCancelEdit();
            } else {
              setShowAddForm(true);
            }
          }}
          className="btn"
          style={{display: 'flex', alignItems: 'center', gap: '8px'}}
        >
          <Plus style={{width: '20px', height: '20px'}} />
          {showAddForm ? 'Annuler' : 'Ajouter une chaîne'}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px'}}>
          <h3 style={{marginBottom: '20px'}}>{editingChannel ? '✏️ Modifier la chaîne' : 'Nouvelle chaîne IPTV'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>Nom de la chaîne *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Ex: Ma Chaîne TV"
                  style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>Catégorie</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Ex: Sport, News, Films..."
                  style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
                />
              </div>
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>URL du flux *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                required
                placeholder="https://..."
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
              />
            </div>

            <div style={{marginBottom: '25px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>URL du logo</label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => setFormData({...formData, logo: e.target.value})}
                placeholder="https://..."
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
              />
            </div>

            <button type="submit" className="btn" style={{width: '100%'}}>
              {editingChannel ? '✅ Enregistrer les modifications' : '✅ Ajouter la chaîne'}
            </button>
          </form>
        </div>
      )}

      {/* Liste des chaînes */}
      <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
        <h3 style={{marginBottom: '20px'}}>
          {activeTab === 'playlist' ? `Chaînes playlist (${channels.length})` : `Chaînes personnalisées (${channels.length})`}
        </h3>
        
        {channels.length === 0 ? (
          <p style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>
            {activeTab === 'playlist' ? 'Aucune chaîne trouvée.' : 'Aucune chaîne personnalisée. Cliquez sur "Ajouter une chaîne" pour commencer.'}
          </p>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Logo</th>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Nom</th>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Catégorie</th>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>URL</th>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {channels.slice(0, 50).map(channel => (
                  <tr key={channel.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td style={{padding: '12px'}}>
                      <img 
                        src={channel.logo || ''} 
                        alt="" 
                        style={{
                          width: '40px', 
                          height: '40px', 
                          objectFit: 'contain',
                          borderRadius: '6px', 
                          background: 'rgba(255,255,255,0.1)'
                        }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }} 
                      />
                    </td>
                    <td style={{padding: '12px'}}>{channel.name}</td>
                    <td style={{padding: '12px'}}>{channel.group}</td>
                    <td style={{padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontSize: '12px'}}>
                      {channel.url}
                    </td>
                    <td style={{padding: '12px', display: 'flex', gap: '5px'}}>
                      <button
                        onClick={() => handleEdit(channel)}
                        style={{background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'}}
                      >
                        <Edit style={{width: '14px', height: '14px'}} />
                        Modifier
                      </button>
                      {activeTab === 'custom' && (
                        <button
                          onClick={() => handleDelete(channel.id)}
                          style={{background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'}}
                        >
                          <Trash2 style={{width: '14px', height: '14px'}} />
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {channels.length > 30 && (
              <p style={{textAlign: 'center', color: '#facc15', padding: '20px', fontSize: '14px'}}>
                ⚠️ Affichage limité aux 30 premières chaînes. Utilisez la recherche pour trouver une chaîne spécifique.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
