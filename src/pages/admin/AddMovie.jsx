import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AddMovie() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    imageUrl: '',
    heroImageUrl: '',
    genre: '',
    year: new Date().getFullYear(),
    duration: '',
    rating: 0
  });
  const [success, setSuccess] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.createMovie(formData);
      setSuccess(true);
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const scrapeMovieData = async () => {
    if (!scrapeUrl.trim()) {
      setScrapeError('Veuillez entrer une URL');
      return;
    }

    setScraping(true);
    setScrapeError('');

    try {
      // Use backend endpoint to avoid CORS issues
      const response = await api.scrapeUrl(scrapeUrl);
      const html = response.html;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extraction du titre
      let title = '';
      const titleElement = doc.querySelector('title');
      if (titleElement) {
        const titleText = titleElement.textContent;
        const match = titleText.match(/Miwav - (.+)/);
        if (match) {
          title = match[1].trim();
        }
      }

      // Alternative: chercher dans les headers h2 ou b avec le titre
      if (!title) {
        const headerElements = doc.querySelectorAll('b[style*="text-transform: uppercase"]');
        for (const el of headerElements) {
          const text = el.textContent.trim();
          if (text && !text.includes('DERNIERS') && !text.includes('CANEVAS')) {
            title = text.replace(/HD|VOSTFR/gi, '').trim();
            break;
          }
        }
      }

      // Extraction de la description (synopsis)
      let description = '';
      const paragraphs = doc.querySelectorAll('p[style*="text-align: left"]');
      for (const p of paragraphs) {
        const text = p.textContent.trim();
        if (text && text.length > 50 && !text.includes('CANEVAS') && !text.includes('LECTEUR')) {
          description = text;
          break;
        }
      }

      // Extraction de l'image (poster)
      let imageUrl = '';
      const images = doc.querySelectorAll('img[src*="themoviedb.org"]');
      if (images.length > 0) {
        imageUrl = images[0].src;
      }

      // Extraction de l'URL vidéo (iframe)
      let videoUrl = '';
      const iframe = doc.querySelector('iframe[src]');
      if (iframe) {
        videoUrl = iframe.src;
      }

      // Extraction du genre depuis le lien de catégorie
      let genre = '';
      const categoryLink = doc.querySelector('.categoryt a');
      if (categoryLink) {
        const categoryText = categoryLink.textContent.trim();
        const genreMap = {
          "A L'AFFICHE": "Action",
          "ANIMATION": "Animation",
          "ACTION": "Action",
          "AVENTURE": "Aventure",
          "COMEDIE": "Comédie",
          "DRAME": "Drame",
          "FANTASTIQUE": "Fantastique",
          "HORREUR": "Horreur",
          "POLICIER": "Thriller",
          "SCIENCE-FICTION": "Sci-Fi",
          "THRILLER": "Thriller",
          "DOCUMENTAIRE": "Documentaire",
          "SPECTACLE": "Comédie"
        };
        genre = genreMap[categoryText] || '';
      }

      // Extraction de l'année depuis le titre
      let year = new Date().getFullYear();
      const yearMatch = title.match(/\((\d{4})\)/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
        title = title.replace(/\(\d{4}\)/, '').trim();
      }

      // Mise à jour du formulaire avec les données extraites
      setFormData({
        ...formData,
        title: title || formData.title,
        description: description || formData.description,
        videoUrl: videoUrl || formData.videoUrl,
        imageUrl: imageUrl || formData.imageUrl,
        genre: genre || formData.genre,
        year: year
      });

      setScraping(false);
      
    } catch (error) {
      console.error('Erreur lors du scraping:', error);
      setScrapeError('Erreur: Impossible de récupérer les données. Vérifiez l\'URL ou les paramètres CORS.');
      setScraping(false);
    }
  };

  return (
    <div className="container">
      <div style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2>Ajouter un film</h2>
        
        {success && (
          <div style={{background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '15px', borderRadius: '12px', color: '#22c55e', marginBottom: '20px'}}>
            ✅ Film ajouté avec succès ! Redirection...
          </div>
        )}

        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '20px'}}>
          <h3 style={{color: '#a78bfa', marginBottom: '15px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span>🔍</span> Scraper automatique
          </h3>
          <p style={{color: '#94a3b8', fontSize: '14px', marginBottom: '15px'}}>
            Collez l'URL d'une page de film pour extraire automatiquement les informations (titre, description, image, vidéo, genre, année).
          </p>
          
          {scrapeError && (
            <div style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', color: '#ef4444', marginBottom: '15px', fontSize: '14px'}}>
              ⚠️ {scrapeError}
            </div>
          )}

          <div style={{display: 'flex', gap: '10px'}}>
            <input 
              type="url"
              placeholder="https://example.com/film-page.html"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              style={{flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)', color: 'white'}}
            />
            <button 
              type="button"
              onClick={scrapeMovieData}
              disabled={scraping}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: scraping ? '#64748b' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                fontWeight: '600',
                cursor: scraping ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap'
              }}
            >
              {scraping ? '⏳ Extraction...' : '🚀 Extraire'}
            </button>
          </div>
        </div>

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
              ✅ Enregistrer le film
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
