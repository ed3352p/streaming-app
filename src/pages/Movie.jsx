import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function Movie() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovie = async () => {
      try {
        const data = await api.getMovie(id);
        setMovie(data);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMovie();
  }, [id]);

  if (loading) {
    return <div className="container">Chargement...</div>;
  }

  if (!movie) {
    return <div className="container">Film non trouvé</div>;
  }

  return (
    <div className="container">
      <div className="movie-detail-grid" style={{display: 'grid', gridTemplateColumns: 'minmax(200px, 300px) 1fr', gap: 'clamp(20px, 4vw, 40px)', marginTop: '20px'}}>
        <div>
          <img 
            src={movie.imageUrl || "https://via.placeholder.com/300x450"} 
            alt={movie.title} 
            style={{width: '100%', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}}
          />
        </div>
        
        <div>
          <h1 style={{fontSize: 'clamp(24px, 5vw, 42px)', marginBottom: '10px'}}>{movie.title}</h1>
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', fontSize: 'clamp(12px, 2vw, 16px)'}}>
            <span style={{color: '#facc15'}}>⭐ {movie.rating || 0}/5</span>
            <span style={{color: '#64748b'}}>|</span>
            <span style={{color: '#cbd5e1'}}>{movie.year}</span>
            {movie.duration && (
              <>
                <span style={{color: '#64748b'}}>|</span>
                <span style={{color: '#cbd5e1'}}>{movie.duration} min</span>
              </>
            )}
            {movie.genre && (
              <>
                <span style={{color: '#64748b'}}>|</span>
                <span style={{color: '#cbd5e1'}}>{movie.genre}</span>
              </>
            )}
          </div>
          
          <p style={{color: '#cbd5e1', lineHeight: '1.8', marginBottom: '20px'}}>
            {movie.description || 'Aucune description disponible.'}
          </p>

          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
            <a className="btn" href={`/player/${movie.id}`}>▶ Regarder</a>
            <a className="btn btn-premium" href="/subscribe">⭐ Premium sans pub</a>
          </div>
          
          <p className="premium" style={{marginTop: '15px'}}>
            Abonné Premium ? Lecture immédiate sans publicité !
          </p>
        </div>
      </div>
    </div>
  );
}
