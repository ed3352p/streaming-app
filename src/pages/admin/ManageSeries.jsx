import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Tv, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ManageSeries() {
  const [series, setSeries] = useState([]);
  const [expandedSeries, setExpandedSeries] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = () => {
    const savedSeries = JSON.parse(localStorage.getItem('series') || '[]');
    setSeries(savedSeries);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette série ?')) {
      const updated = series.filter(s => s.id !== id);
      setSeries(updated);
      localStorage.setItem('series', JSON.stringify(updated));
    }
  };

  const toggleExpand = (id) => {
    setExpandedSeries(expandedSeries === id ? null : id);
  };

  const getTotalEpisodes = (s) => {
    return s.seasons?.reduce((acc, season) => acc + (season.episodes?.length || 0), 0) || 0;
  };

  return (
    <div className="container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <h2 style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <Tv style={{color: '#7c3aed'}} />
          Gérer les Séries
        </h2>
        <div style={{display: 'flex', gap: '10px'}}>
          <a href="/admin/series/add" className="btn" style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
            <Plus style={{width: '20px', height: '20px'}} />
            Ajouter une série
          </a>
          <a href="/admin" className="btn" style={{background: 'linear-gradient(135deg, #64748b, #475569)'}}>
            Retour
          </a>
        </div>
      </div>

      <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
        <h3 style={{marginBottom: '20px'}}>Séries ajoutées ({series.length})</h3>
        
        {series.length === 0 ? (
          <p style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>
            Aucune série ajoutée. Cliquez sur "Ajouter une série" pour commencer.
          </p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {series.map(s => (
              <div 
                key={s.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px 20px',
                    gap: '15px',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleExpand(s.id)}
                >
                  {s.imageUrl && (
                    <img 
                      src={s.imageUrl} 
                      alt={s.title}
                      style={{width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px'}}
                    />
                  )}
                  <div style={{flex: 1}}>
                    <h4 style={{margin: '0 0 5px 0'}}>{s.title}</h4>
                    <div style={{display: 'flex', gap: '15px', fontSize: '14px', color: '#64748b'}}>
                      <span>{s.genre || 'N/A'}</span>
                      <span>{s.year}</span>
                      <span>{s.seasons?.length || 0} saison(s)</span>
                      <span>{getTotalEpisodes(s)} épisode(s)</span>
                      {s.rating > 0 && <span style={{color: '#facc15'}}>⭐ {s.rating}</span>}
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/series/edit/${s.id}`); }}
                      style={{background: '#2563eb', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px'}}
                    >
                      <Edit style={{width: '14px', height: '14px'}} /> Modifier
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                      style={{background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px'}}
                    >
                      <Trash2 style={{width: '14px', height: '14px'}} /> Supprimer
                    </button>
                    {expandedSeries === s.id ? (
                      <ChevronUp style={{color: '#64748b'}} />
                    ) : (
                      <ChevronDown style={{color: '#64748b'}} />
                    )}
                  </div>
                </div>

                {expandedSeries === s.id && s.seasons && (
                  <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px', background: 'rgba(0,0,0,0.2)'}}>
                    {s.seasons.map((season, sIndex) => (
                      <div key={sIndex} style={{marginBottom: sIndex < s.seasons.length - 1 ? '15px' : 0}}>
                        <h5 style={{color: '#7c3aed', marginBottom: '10px'}}>Saison {season.number}</h5>
                        <div style={{display: 'grid', gap: '8px'}}>
                          {season.episodes?.map((ep, eIndex) => (
                            <div 
                              key={eIndex}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 15px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}
                            >
                              <span>
                                <span style={{color: '#64748b', marginRight: '10px'}}>Ep. {ep.number}</span>
                                {ep.title || 'Sans titre'}
                              </span>
                              <span style={{color: '#64748b', fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                {ep.videoUrl || 'Pas de lien'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
