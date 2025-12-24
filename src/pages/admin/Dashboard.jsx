import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Plus, Edit, Trash2, Users, Tv, Megaphone, Upload, BarChart3, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Dashboard() {
  const [movies, setMovies] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Charger les films
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const data = await api.getMovies();
      setMovies(data);
    } catch (err) {
      console.error('Erreur:', err);
      const savedMovies = JSON.parse(localStorage.getItem('movies') || '[]');
      setMovies(savedMovies);
    }
  };

  const handleDeleteMovie = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce film ?')) {
      try {
        await api.deleteMovie(id);
        setMovies(movies.filter(m => m.id !== id));
        alert('Film supprimé avec succès !');
      } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur: ' + err.message);
      }
    }
  };

  const handleEditMovie = (movie) => {
    navigate(`/admin/edit/${movie.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, totalMovies: 0, totalViews: 0 });
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        const users = await api.getUsers();
        const premiumCount = users.filter(u => u.role === 'premium' || u.premium).length;
        const totalViews = movies.reduce((acc, m) => acc + (m.views || 0), 0);
        setStats({
          totalUsers: users.length,
          premiumUsers: premiumCount,
          totalMovies: movies.length,
          totalViews: totalViews
        });
      } catch (err) {
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const premiumCount = allUsers.filter(u => u.role === 'premium' || u.premium).length;
        const totalViews = movies.reduce((acc, m) => acc + (m.views || 0), 0);
        setStats({
          totalUsers: allUsers.length,
          premiumUsers: premiumCount,
          totalMovies: movies.length,
          totalViews: totalViews
        });
      }
    };
    loadStats();
  }, [movies]);

  if (!user) {
    return <div className="container">Chargement...</div>;
  }

  return (
    <div className="admin">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <h1>Admin Dashboard</h1>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <span style={{color: '#cbd5e1'}}>👤 {user.email}</span>
          <button onClick={handleLogout} className="btn" style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)'}}>
            Déconnexion
          </button>
        </div>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px'}}>
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <h3 style={{color: '#64748b', fontSize: '14px', marginBottom: '10px'}}>UTILISATEURS TOTAUX</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold', color: '#2563eb'}}>{stats.totalUsers}</p>
        </div>
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <h3 style={{color: '#64748b', fontSize: '14px', marginBottom: '10px'}}>ABONNÉS PREMIUM</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold', color: '#7c3aed'}}>{stats.premiumUsers}</p>
        </div>
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <h3 style={{color: '#64748b', fontSize: '14px', marginBottom: '10px'}}>FILMS DISPONIBLES</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold', color: '#22c55e'}}>{stats.totalMovies}</p>
        </div>
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <h3 style={{color: '#64748b', fontSize: '14px', marginBottom: '10px'}}>VUES TOTALES</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold', color: '#facc15'}}>{stats.totalViews.toLocaleString()}</p>
        </div>
      </div>

      <div style={{display: 'flex', gap: '15px', marginBottom: '40px', flexWrap: 'wrap'}}>
        <a href="/admin/add" className="btn" style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
          <Plus style={{width: '20px', height: '20px'}} />
          Ajouter un film
        </a>
        <a href="/admin/iptv" className="btn" style={{background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
          <Tv style={{width: '20px', height: '20px'}} />
          Gérer IPTV
        </a>
        <a href="/admin/users" className="btn" style={{background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
          <Users style={{width: '20px', height: '20px'}} />
          Gérer les utilisateurs
        </a>
        <a href="/admin/series" className="btn" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
          <Tv style={{width: '20px', height: '20px'}} />
          Gérer les Séries
        </a>
        <a href="/admin/ads" className="btn" style={{background: 'linear-gradient(135deg, #ec4899, #db2777)', display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
          <Megaphone style={{width: '20px', height: '20px'}} />
          Gérer les Publicités
        </a>
        <a href="/admin/analytics" className="btn" style={{background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
          <BarChart3 style={{width: '20px', height: '20px'}} />
          Analytics & Stats
        </a>
        <a href="/admin/upload" className="btn" style={{background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
          <Upload style={{width: '20px', height: '20px'}} />
          Upload Vidéo
        </a>
        <a href="/admin/access-codes" className="btn" style={{background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
          <Key style={{width: '20px', height: '20px'}} />
          Codes d'Accès
        </a>
      </div>

      <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}>
        <h3 style={{marginBottom: '20px'}}>Films ajoutés ({movies.length})</h3>
        
        {movies.length === 0 ? (
          <p style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>
            Aucun film ajouté. Cliquez sur "Ajouter un film" pour commencer.
          </p>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Titre</th>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Genre</th>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Année</th>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Note</th>
                  <th style={{padding: '12px', textAlign: 'left', color: '#64748b'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(movie => (
                  <tr key={movie.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td style={{padding: '12px'}}>{movie.title}</td>
                    <td style={{padding: '12px'}}>{movie.genre || 'N/A'}</td>
                    <td style={{padding: '12px'}}>{movie.year}</td>
                    <td style={{padding: '12px'}}>⭐ {movie.rating || 0}</td>
                    <td style={{padding: '12px', display: 'flex', gap: '5px'}}>
                      <button 
                        onClick={() => handleEditMovie(movie)}
                        style={{background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'}}
                      >
                        ✏️ Modifier
                      </button>
                      <button 
                        onClick={() => handleDeleteMovie(movie.id)}
                        style={{background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'}}
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
