import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

export default function AddSeries() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    heroImageUrl: '',
    genre: '',
    year: new Date().getFullYear(),
    rating: 0
  });
  const [seasons, setSeasons] = useState([
    { number: 1, episodes: [{ number: 1, title: '', videoUrl: '' }] }
  ]);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingSeries = JSON.parse(localStorage.getItem('series') || '[]');
    
    const newSeries = {
      id: Date.now(),
      ...formData,
      seasons: seasons,
      createdAt: new Date().toISOString()
    };
    
    existingSeries.push(newSeries);
    localStorage.setItem('series', JSON.stringify(existingSeries));
    
    setSuccess(true);
    
    setTimeout(() => {
      window.location.href = '/admin/series';
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addSeason = () => {
    setSeasons([
      ...seasons,
      { number: seasons.length + 1, episodes: [{ number: 1, title: '', videoUrl: '' }] }
    ]);
  };

  const removeSeason = (seasonIndex) => {
    if (seasons.length > 1) {
      const updated = seasons.filter((_, i) => i !== seasonIndex);
      setSeasons(updated.map((s, i) => ({ ...s, number: i + 1 })));
    }
  };

  const addEpisode = (seasonIndex) => {
    const updated = [...seasons];
    updated[seasonIndex].episodes.push({
      number: updated[seasonIndex].episodes.length + 1,
      title: '',
      videoUrl: ''
    });
    setSeasons(updated);
  };

  const removeEpisode = (seasonIndex, episodeIndex) => {
    const updated = [...seasons];
    if (updated[seasonIndex].episodes.length > 1) {
      updated[seasonIndex].episodes = updated[seasonIndex].episodes.filter((_, i) => i !== episodeIndex);
      updated[seasonIndex].episodes = updated[seasonIndex].episodes.map((ep, i) => ({ ...ep, number: i + 1 }));
      setSeasons(updated);
    }
  };

  const updateEpisode = (seasonIndex, episodeIndex, field, value) => {
    const updated = [...seasons];
    updated[seasonIndex].episodes[episodeIndex][field] = value;
    setSeasons(updated);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'white'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: '#cbd5e1',
    fontWeight: '500'
  };

  return (
    <div className="container">
      <div style={{maxWidth: '900px', margin: '0 auto'}}>
        <h2>Ajouter une série</h2>
        
        {success && (
          <div style={{background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '15px', borderRadius: '12px', color: '#22c55e', marginBottom: '20px'}}>
            ✅ Série ajoutée avec succès ! Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
          
          <div style={{marginBottom: '20px'}}>
            <label style={labelStyle}>Titre de la série *</label>
            <input 
              type="text"
              name="title"
              placeholder="Ex: Breaking Bad" 
              value={formData.title}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={{marginBottom: '20px'}}>
            <label style={labelStyle}>Description *</label>
            <textarea 
              name="description"
              placeholder="Description de la série..." 
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              style={{...inputStyle, resize: 'vertical'}}
            />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
            <div>
              <label style={labelStyle}>URL Image (Poster) *</label>
              <input 
                type="url"
                name="imageUrl"
                placeholder="https://example.com/poster.jpg" 
                value={formData.imageUrl}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>URL Image Hero (Optionnel)</label>
              <input 
                type="url"
                name="heroImageUrl"
                placeholder="https://example.com/hero.jpg" 
                value={formData.heroImageUrl}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px'}}>
            <div>
              <label style={labelStyle}>Genre</label>
              <select 
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Sélectionner</option>
                <option value="Action">Action</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Drame">Drame</option>
                <option value="Comédie">Comédie</option>
                <option value="Horreur">Horreur</option>
                <option value="Thriller">Thriller</option>
                <option value="Aventure">Aventure</option>
                <option value="Fantastique">Fantastique</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Année</label>
              <input 
                type="number"
                name="year"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Note (0-5)</label>
              <input 
                type="number"
                name="rating"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '25px', marginBottom: '25px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{margin: 0}}>Saisons et Épisodes</h3>
              <button 
                type="button" 
                onClick={addSeason}
                className="btn"
                style={{background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', padding: '8px 16px', fontSize: '14px'}}
              >
                <Plus style={{width: '16px', height: '16px', display: 'inline', marginRight: '5px'}} />
                Ajouter une saison
              </button>
            </div>

            {seasons.map((season, seasonIndex) => (
              <div 
                key={seasonIndex} 
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '15px'
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <h4 style={{margin: 0, color: '#7c3aed'}}>Saison {season.number}</h4>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button 
                      type="button" 
                      onClick={() => addEpisode(seasonIndex)}
                      style={{background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'}}
                    >
                      + Épisode
                    </button>
                    {seasons.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeSeason(seasonIndex)}
                        style={{background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'}}
                      >
                        <Trash2 style={{width: '14px', height: '14px'}} />
                      </button>
                    )}
                  </div>
                </div>

                {season.episodes.map((episode, episodeIndex) => (
                  <div 
                    key={episodeIndex}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 2fr auto',
                      gap: '10px',
                      alignItems: 'center',
                      marginBottom: '10px',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{color: '#64748b', fontSize: '14px'}}>Ep. {episode.number}</span>
                    <input
                      type="text"
                      placeholder="Titre de l'épisode"
                      value={episode.title}
                      onChange={(e) => updateEpisode(seasonIndex, episodeIndex, 'title', e.target.value)}
                      style={{...inputStyle, padding: '8px'}}
                    />
                    <input
                      type="url"
                      placeholder="URL vidéo (VOE, YouTube, etc.)"
                      value={episode.videoUrl}
                      onChange={(e) => updateEpisode(seasonIndex, episodeIndex, 'videoUrl', e.target.value)}
                      required
                      style={{...inputStyle, padding: '8px'}}
                    />
                    {season.episodes.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeEpisode(seasonIndex, episodeIndex)}
                        style={{background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '5px'}}
                      >
                        <Trash2 style={{width: '16px', height: '16px'}} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{display: 'flex', gap: '15px'}}>
            <button type="submit" className="btn" style={{flex: 1}}>
              ✅ Enregistrer la série
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/admin')}
              className="btn" 
              style={{background: 'linear-gradient(135deg, #64748b, #475569)'}}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
