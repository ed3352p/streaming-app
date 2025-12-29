import { useState, useEffect } from 'react';
import { Film, Search } from 'lucide-react';
import MovieCard from "../components/MovieCard";
import api from '../services/api';
import { ExternalAdBanner } from '../components/ExternalAdBanner';

export default function Films() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

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

  // Pagination
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMovies = filteredMovies.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  return (
    <div className="container">
      <ExternalAdBanner position="top" />
      
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

          {/* Pagination info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '15px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div style={{color: '#94a3b8', fontSize: '14px'}}>
              Affichage de <strong style={{color: '#a78bfa'}}>{startIndex + 1}</strong> à <strong style={{color: '#a78bfa'}}>{Math.min(endIndex, filteredMovies.length)}</strong> sur <strong style={{color: '#a78bfa'}}>{filteredMovies.length}</strong> films
            </div>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <label style={{color: '#94a3b8', fontSize: '14px'}}>Films par page:</label>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: '#a78bfa',
                  cursor: 'pointer'
                }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '25px'
          }}>
            {currentMovies.map(movie => (
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

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              marginTop: '40px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === 1 ? '#334155' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                ← Précédent
              </button>

              <div style={{
                display: 'flex',
                gap: '5px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '10px 15px',
                        borderRadius: '8px',
                        border: 'none',
                        background: currentPage === pageNum ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'rgba(139, 92, 246, 0.1)',
                        color: currentPage === pageNum ? 'white' : '#a78bfa',
                        fontWeight: currentPage === pageNum ? '700' : '500',
                        cursor: 'pointer',
                        minWidth: '45px',
                        transition: 'all 0.2s',
                        boxShadow: currentPage === pageNum ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === totalPages ? '#334155' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Suivant →
              </button>
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
