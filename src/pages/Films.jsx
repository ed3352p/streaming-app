import { useState, useEffect } from 'react';
import { Film, Search } from 'lucide-react';
import MovieCard from "../components/MovieCard";
import api from '../services/api';

export default function Films() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getMovies()
      .then(data => setMovies(data))
      .catch(err => {
        console.error('Erreur:', err);
        const savedMovies = JSON.parse(localStorage.getItem('movies') || '[]');
        setMovies(savedMovies);
      });
  }, []);

  // Extract unique genres from movies
  const availableGenres = ['all', ...new Set(movies.map(m => m.genre).filter(Boolean))];

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || movie.genre === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container">
      <div style={{marginBottom: '40px'}}>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 48px)',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #fff, #cbd5e1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <Film style={{width: 'clamp(32px, 5vw, 48px)', height: 'clamp(32px, 5vw, 48px)', color: '#2563eb'}} />
          Films
        </h1>
        <p style={{color: '#94a3b8', fontSize: 'clamp(14px, 3vw, 18px)'}}>
          Découvrez notre catalogue de {movies.length} films en streaming
        </p>
      </div>

      {movies.length > 0 ? (
        <>
          <div style={{position: 'relative', marginBottom: '30px'}}>
            <Search style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#64748b'}} />
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Rechercher un film..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{paddingLeft: '50px'}}
            />
          </div>

          <div className="filters">
            {availableGenres.map(genre => {
              const count = genre === 'all' ? movies.length : movies.filter(m => m.genre === genre).length;
              return (
                <button 
                  key={genre}
                  className={`filter-btn ${filter === genre ? 'active' : ''}`} 
                  onClick={() => setFilter(genre)}
                >
                  {genre === 'all' ? 'Tous' : genre} ({count})
                </button>
              );
            })}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '25px'
          }}>
            {filteredMovies.map(movie => (
              <MovieCard 
                key={movie.id} 
                id={movie.id}
                title={movie.title} 
                rating={movie.rating || 0}
                imageUrl={movie.imageUrl}
                genre={movie.genre}
                year={movie.year}
                description={movie.description}
              />
            ))}
          </div>

          {filteredMovies.length === 0 && (
            <div style={{textAlign: 'center', padding: '60px 20px'}}>
              <Film style={{width: '64px', height: '64px', color: '#64748b', margin: '0 auto 20px'}} />
              <p style={{color: '#64748b', fontSize: '18px'}}>Aucun film trouvé</p>
            </div>
          )}
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Film style={{width: '64px', height: '64px', color: '#64748b', margin: '0 auto 20px'}} />
          <h3 style={{fontSize: '24px', marginBottom: '10px'}}>Aucun film disponible</h3>
          <p style={{color: '#64748b', marginBottom: '30px'}}>
            Les administrateurs peuvent ajouter des films depuis le dashboard
          </p>
          <a href="/login" className="btn">
            Se connecter en tant qu'admin
          </a>
        </div>
      )}
    </div>
  );
}
