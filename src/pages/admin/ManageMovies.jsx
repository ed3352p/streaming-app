import { useState, useEffect } from 'react';
import { Film, Search, Trash2, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ManageMovies() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState(new Set());

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const data = await api.getMovies();
      setMovies(data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce film ?')) return;
    
    try {
      await api.deleteMovie(id);
      setMovies(movies.filter(m => m.id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleDeleteAll = async () => {
    const confirmMsg = `⚠️ ATTENTION : Vous êtes sur le point de supprimer TOUS les ${movies.length} films de la base de données.\n\nCette action est IRRÉVERSIBLE !\n\nTapez "SUPPRIMER TOUT" pour confirmer :`;
    const userInput = prompt(confirmMsg);
    
    if (userInput !== 'SUPPRIMER TOUT') {
      alert('Suppression annulée');
      return;
    }

    setDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const movie of movies) {
      try {
        await api.deleteMovie(movie.id);
        successCount++;
      } catch (err) {
        console.error(`Erreur suppression ${movie.title}:`, err);
        failCount++;
      }
    }

    setDeleting(false);
    alert(`✅ Suppression terminée !\n${successCount} films supprimés\n${failCount} échecs`);
    loadMovies();
  };

  const handleDeleteSelected = async () => {
    if (selectedMovies.size === 0) {
      alert('Veuillez sélectionner au moins un film');
      return;
    }

    if (!confirm(`Supprimer ${selectedMovies.size} film(s) sélectionné(s) ?`)) return;

    setDeleting(true);
    for (const id of selectedMovies) {
      try {
        await api.deleteMovie(id);
      } catch (err) {
        console.error('Erreur:', err);
      }
    }
    setDeleting(false);
    setSelectedMovies(new Set());
    loadMovies();
  };

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedMovies);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedMovies(newSelection);
  };

  const selectAll = () => {
    setSelectedMovies(new Set(filteredMovies.map(m => m.id)));
  };

  const deselectAll = () => {
    setSelectedMovies(new Set());
  };

  // Extract unique genres and years
  const genres = ['all', ...new Set(movies.map(m => m.genre).filter(Boolean))];
  const years = ['all', ...Array.from(new Set(movies.map(m => m.year).filter(Boolean))).sort((a, b) => b - a)];

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === 'all' || movie.genre === genreFilter;
    const matchesYear = yearFilter === 'all' || movie.year === parseInt(yearFilter);
    return matchesSearch && matchesGenre && matchesYear;
  });

  if (loading) {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <div style={{width: '50px', height: '50px', border: '4px solid #2563eb', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'}}></div>
        <p style={{color: '#64748b', marginTop: '20px'}}>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{marginBottom: '30px'}}>
        <h2 style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px'}}>
          <Film style={{width: '32px', height: '32px', color: '#2563eb'}} />
          Gestion des films
        </h2>
        <p style={{color: '#94a3b8'}}>
          {movies.length} film(s) au total • {filteredMovies.length} affiché(s)
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px'}}>
        <div style={{position: 'relative', marginBottom: '15px'}}>
          <Search style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#64748b'}} />
          <input 
            type="text" 
            placeholder="Rechercher un film..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{width: '100%', padding: '12px 12px 12px 50px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white'}}
          />
        </div>

        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px'}}>
          <select 
            value={genreFilter} 
            onChange={(e) => setGenreFilter(e.target.value)}
            style={{padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer'}}
          >
            {genres.map(genre => (
              <option key={genre} value={genre}>
                {genre === 'all' ? 'Tous les genres' : genre}
              </option>
            ))}
          </select>

          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(e.target.value)}
            style={{padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer'}}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year === 'all' ? 'Toutes les années' : year}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
          <button 
            onClick={selectAll}
            disabled={deleting}
            style={{padding: '8px 16px', borderRadius: '6px', border: '1px solid #2563eb', background: 'transparent', color: '#2563eb', cursor: 'pointer', fontSize: '14px'}}
          >
            Tout sélectionner
          </button>
          <button 
            onClick={deselectAll}
            disabled={deleting}
            style={{padding: '8px 16px', borderRadius: '6px', border: '1px solid #64748b', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '14px'}}
          >
            Désélectionner
          </button>
          {selectedMovies.size > 0 && (
            <button 
              onClick={handleDeleteSelected}
              disabled={deleting}
              style={{padding: '8px 16px', borderRadius: '6px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '600'}}
            >
              <Trash2 style={{width: '14px', height: '14px', display: 'inline', marginRight: '6px'}} />
              Supprimer ({selectedMovies.size})
            </button>
          )}
          <button 
            onClick={handleDeleteAll}
            disabled={deleting || movies.length === 0}
            style={{padding: '8px 16px', borderRadius: '6px', border: '2px solid #dc2626', background: 'rgba(220, 38, 38, 0.2)', color: '#dc2626', cursor: movies.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '700', marginLeft: 'auto'}}
          >
            <Trash2 style={{width: '14px', height: '14px', display: 'inline', marginRight: '6px'}} />
            {deleting ? 'Suppression...' : 'SUPPRIMER TOUT'}
          </button>
        </div>
      </div>

      {/* Movies List */}
      {filteredMovies.length > 0 ? (
        <div style={{display: 'grid', gap: '12px'}}>
          {filteredMovies.map(movie => (
            <div 
              key={movie.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '15px',
                background: selectedMovies.has(movie.id) ? 'rgba(37, 99, 235, 0.1)' : 'linear-gradient(145deg, #1e293b, #0f172a)',
                borderRadius: '12px',
                border: selectedMovies.has(movie.id) ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s'
              }}
            >
              <input 
                type="checkbox"
                checked={selectedMovies.has(movie.id)}
                onChange={() => toggleSelection(movie.id)}
                disabled={deleting}
                style={{width: '18px', height: '18px', cursor: 'pointer'}}
              />
              
              <img 
                src={movie.imageUrl || 'https://via.placeholder.com/80x120'} 
                alt={movie.title}
                style={{width: '60px', height: '90px', borderRadius: '8px', objectFit: 'cover'}}
              />
              
              <div style={{flex: 1}}>
                <h3 style={{fontSize: '16px', marginBottom: '5px'}}>{movie.title}</h3>
                <div style={{display: 'flex', gap: '10px', fontSize: '13px', color: '#94a3b8'}}>
                  <span>{movie.genre}</span>
                  <span>•</span>
                  <span>{movie.year}</span>
                  {movie.rating > 0 && (
                    <>
                      <span>•</span>
                      <span>⭐ {movie.rating}/5</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  onClick={() => window.open(`/movie/${movie.id}`, '_blank')}
                  style={{padding: '8px', borderRadius: '6px', border: '1px solid #2563eb', background: 'transparent', color: '#2563eb', cursor: 'pointer'}}
                  title="Voir"
                >
                  <Eye style={{width: '16px', height: '16px'}} />
                </button>
                <button 
                  onClick={() => navigate(`/admin/edit-movie/${movie.id}`)}
                  style={{padding: '8px', borderRadius: '6px', border: '1px solid #22c55e', background: 'transparent', color: '#22c55e', cursor: 'pointer'}}
                  title="Modifier"
                >
                  <Edit style={{width: '16px', height: '16px'}} />
                </button>
                <button 
                  onClick={() => handleDelete(movie.id)}
                  disabled={deleting}
                  style={{padding: '8px', borderRadius: '6px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer'}}
                  title="Supprimer"
                >
                  <Trash2 style={{width: '16px', height: '16px'}} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(145deg, #1e293b, #0f172a)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <Film style={{width: '64px', height: '64px', color: '#64748b', margin: '0 auto 20px'}} />
          <p style={{color: '#64748b', fontSize: '18px'}}>Aucun film trouvé</p>
        </div>
      )}
    </div>
  );
}
