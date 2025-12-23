import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

export default function EditMovie() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    imageUrl: '',
    genre: '',
    year: new Date().getFullYear(),
    duration: '',
    rating: 0
  });
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMovie = async () => {
      try {
        const movie = await api.getMovie(id);
        setFormData({
          title: movie.title || '',
          description: movie.description || '',
          videoUrl: movie.videoUrl || '',
          imageUrl: movie.imageUrl || '',
          heroImageUrl: movie.heroImageUrl || '',
          genre: movie.genre || '',
          year: movie.year || new Date().getFullYear(),
          duration: movie.duration || '',
          rating: movie.rating || 0
        });
      } catch (err) {
        console.error('Erreur:', err);
        alert('Film non trouvé');
        navigate('/admin');
      }
    };
    loadMovie();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.updateMovie(id, formData);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur: ' + err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container">
      <div style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2>Modifier le film</h2>
        
        {success && (
          <div style={{background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '15px', borderRadius: '12px', color: '#22c55e', marginBottom: '20px'}}>
            ✅ Film modifié avec succès ! Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>Titre du film *</label>
            <input 
              type="text"
              name="title"
              placeholder="Ex: Horizon Final" 
              value={formData.title}
              onChange={handleChange}
              required
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
            />
          </div>

          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>Description *</label>
            <textarea 
              name="description"
              placeholder="Description du film..." 
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', resize: 'vertical'}}
            />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>URL Vidéo *</label>
              <input 
                type="url"
                name="videoUrl"
                placeholder="https://example.com/video.m3u8 ou .mp4" 
                value={formData.videoUrl}
                onChange={handleChange}
                required
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
              />
              <p style={{color: '#64748b', fontSize: '12px', marginTop: '5px'}}>
                Formats: .m3u8, .mp4, .webm, YouTube, iframes (bramtiv.com/iframe/...)
              </p>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>URL Image (Poster)</label>
              <input 
                type="url"
                name="imageUrl"
                placeholder="https://example.com/poster.jpg" 
                value={formData.imageUrl}
                onChange={handleChange}
                required
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>URL Image Hero (Optionnel)</label>
              <input 
                type="url"
                name="heroImageUrl"
                placeholder="https://example.com/hero-background.jpg" 
                value={formData.heroImageUrl || ''}
                onChange={handleChange}
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
              />
              <p style={{color: '#64748b', fontSize: '12px', marginTop: '5px'}}>
                Image horizontale affichée en arrière-plan du hero (1920x600px recommandé)
              </p>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>Genre</label>
              <select 
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
              >
                <option value="">Sélectionner</option>
                <option value="Action">Action</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Drame">Drame</option>
                <option value="Comédie">Comédie</option>
                <option value="Horreur">Horreur</option>
                <option value="Thriller">Thriller</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>Année</label>
              <input 
                type="number"
                name="year"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={handleChange}
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>Durée (min)</label>
              <input 
                type="number"
                name="duration"
                placeholder="120"
                value={formData.duration}
                onChange={handleChange}
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
              />
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>Note (0-5)</label>
            <input 
              type="number"
              name="rating"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={handleChange}
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
            />
          </div>

          <div style={{display: 'flex', gap: '15px'}}>
            <button type="submit" className="btn" style={{flex: 1}}>
              ✅ Enregistrer les modifications
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
