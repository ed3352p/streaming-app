import { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import api from '../services/api';
import { ExternalAdBanner } from '../components/ExternalAdBanner';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genre: searchParams.get('genre') || '',
    year: searchParams.get('year') || '',
    minRating: searchParams.get('minRating') || '',
    maxDuration: searchParams.get('maxDuration') || '',
    quality: searchParams.get('quality') || '',
    sort: searchParams.get('sort') || 'popularity'
  });

  useEffect(() => {
    if (query || Object.values(filters).some(v => v)) {
      performSearch();
    }
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        loadSuggestions();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadSuggestions = async () => {
    try {
      const data = await api.getSearchSuggestions(query);
      setSuggestions(data);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = { q: query, ...filters };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const data = await api.search(params);
      setResults(data);
      
      const newParams = new URLSearchParams(params);
      setSearchParams(newParams);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSuggestions([]);
    performSearch();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      genre: '',
      year: '',
      minRating: '',
      maxDuration: '',
      quality: '',
      sort: 'popularity'
    });
  };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/movie/${suggestion.id}`);
  };

  return (
    <div className="container" style={{paddingTop: '30px'}}>
      <h1 style={{marginBottom: '30px'}}>Recherche</h1>

      <form onSubmit={handleSearch} style={{marginBottom: '30px'}}>
        <div style={{position: 'relative'}}>
          <div style={{display: 'flex', gap: '10px'}}>
            <div style={{flex: 1, position: 'relative'}}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un film, série..."
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '16px'
                }}
              />
              <SearchIcon 
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }}
                size={20}
              />
              
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  marginTop: '5px',
                  zIndex: 10,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <div style={{fontWeight: '600'}}>{suggestion.title}</div>
                      <div style={{fontSize: '12px', color: '#64748b'}}>
                        {suggestion.type === 'movie' ? '🎬 Film' : '📺 Série'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn"
              style={{
                background: showFilters ? '#3b82f6' : 'linear-gradient(135deg, #64748b, #475569)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Filter size={20} />
              Filtres
            </button>
            
            <button type="submit" className="btn">
              Rechercher
            </button>
          </div>
        </div>
      </form>

      {showFilters && (
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '25px',
          borderRadius: '16px',
          marginBottom: '30px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3>Filtres de recherche</h3>
            <button
              onClick={clearFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <X size={16} />
              Réinitialiser
            </button>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#94a3b8'}}>Genre</label>
              <select
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              >
                <option value="">Tous</option>
                <option value="Action">Action</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Drame">Drame</option>
                <option value="Comédie">Comédie</option>
                <option value="Horreur">Horreur</option>
                <option value="Thriller">Thriller</option>
              </select>
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#94a3b8'}}>Année</label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                placeholder="2024"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#94a3b8'}}>Note minimum</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                placeholder="0-5"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#94a3b8'}}>Durée max (min)</label>
              <input
                type="number"
                value={filters.maxDuration}
                onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
                placeholder="120"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#94a3b8'}}>Qualité</label>
              <select
                value={filters.quality}
                onChange={(e) => handleFilterChange('quality', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              >
                <option value="">Toutes</option>
                <option value="SD">SD</option>
                <option value="HD">HD</option>
                <option value="Full HD">Full HD</option>
                <option value="4K">4K</option>
              </select>
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#94a3b8'}}>Trier par</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              >
                <option value="popularity">Popularité</option>
                <option value="rating">Note</option>
                <option value="year">Année</option>
                <option value="title">Titre</option>
              </select>
            </div>
          </div>

          <button
            onClick={performSearch}
            className="btn"
            style={{marginTop: '20px', width: '100%'}}
          >
            Appliquer les filtres
          </button>
        </div>
      )}

      {loading ? (
        <div style={{textAlign: 'center', padding: '50px'}}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{color: '#64748b', marginTop: '20px'}}>Recherche en cours...</p>
        </div>
      ) : results.length > 0 ? (
        <>
          <h2 style={{marginBottom: '20px'}}>
            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </h2>
          <div className="movies-grid">
            {results.map((item) => (
              <MovieCard key={`${item.type}-${item.id}`} movie={item} />
            ))}
          </div>
        </>
      ) : query || Object.values(filters).some(v => v) ? (
        <div style={{textAlign: 'center', padding: '50px'}}>
          <p style={{color: '#64748b', fontSize: '18px'}}>Aucun résultat trouvé</p>
          <p style={{color: '#64748b', marginTop: '10px'}}>Essayez avec d'autres mots-clés ou filtres</p>
        </div>
      ) : (
        <div style={{textAlign: 'center', padding: '50px'}}>
          <SearchIcon size={64} style={{color: '#64748b', margin: '0 auto 20px'}} />
          <p style={{color: '#64748b', fontSize: '18px'}}>Commencez votre recherche</p>
        </div>
      )}
    </div>
  );
}
