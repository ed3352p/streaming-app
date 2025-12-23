import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false, requirePremium = false }) {
  const { user, loading, isAdmin, isPremium } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        color: '#cbd5e1'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(239, 68, 68, 0.2)',
            borderTopColor: '#ef4444',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p>Chargement...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Accès refusé</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
            Cette page est réservée aux administrateurs.
          </p>
          <a href="/" className="btn">Retour à l'accueil</a>
        </div>
      </div>
    );
  }

  if (requirePremium && !isPremium) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⭐</div>
          <h2 style={{ color: '#7c3aed', marginBottom: '16px' }}>Contenu Premium</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
            Ce contenu est réservé aux membres Premium.
          </p>
          <a href="/subscribe" className="btn" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            Devenir Premium
          </a>
        </div>
      </div>
    );
  }

  return children;
}
