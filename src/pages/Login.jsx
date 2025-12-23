import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sanitizeInput } from '../utils/crypto';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  // Redirect if already logged in - use replace to avoid history issues
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirectTo = user?.role === 'admin' ? '/admin' : (location.state?.from?.pathname || '/');
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate, location.state]);

  // Check lockout status
  useEffect(() => {
    const savedLockout = localStorage.getItem('loginLockout');
    if (savedLockout) {
      const lockoutTime = new Date(savedLockout);
      if (lockoutTime > new Date()) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('loginLockout');
        localStorage.removeItem('loginAttempts');
      }
    }
    const savedAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
    setAttempts(savedAttempts);
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutUntil) {
      const timer = setInterval(() => {
        if (new Date() >= lockoutUntil) {
          setLockoutUntil(null);
          setAttempts(0);
          localStorage.removeItem('loginLockout');
          localStorage.removeItem('loginAttempts');
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if locked out
    if (lockoutUntil && new Date() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - new Date()) / 1000);
      setError(`Trop de tentatives. Réessayez dans ${remainingSeconds} secondes.`);
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const sanitizedIdentifier = sanitizeInput(identifier.trim());
      const userData = await login(sanitizedIdentifier, password);
      
      // Reset attempts on success
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockout');
      
      const redirectTo = userData.role === 'admin' ? '/admin' : (location.state?.from?.pathname || '/');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());
      
      // Lock out after 5 failed attempts
      if (newAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        setLockoutUntil(lockoutTime);
        localStorage.setItem('loginLockout', lockoutTime.toISOString());
        setError('Trop de tentatives. Compte bloqué pendant 5 minutes.');
      } else {
        setError(err.message || 'Identifiant ou mot de passe incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockoutUntil && new Date() < lockoutUntil;

  return (
    <div className="container" style={{ maxWidth: '450px', margin: '0 auto', padding: '40px 20px' }}>
      <form 
        className="form" 
        onSubmit={handleSubmit}
        style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
          }}>
            <Lock style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '28px' }}>Connexion</h2>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Accédez à votre compte StreamBox</p>
        </div>
        
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '14px 16px',
            borderRadius: '10px',
            color: '#ef4444',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
            Email ou nom d'utilisateur
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              width: '18px', 
              height: '18px', 
              color: '#64748b' 
            }} />
            <input 
              type="text"
              placeholder="Entrez votre email ou username" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={isLocked || loading}
              autoComplete="username"
              style={{
                width: '100%',
                padding: '14px 14px 14px 46px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '15px',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
            Mot de passe
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              width: '18px', 
              height: '18px', 
              color: '#64748b' 
            }} />
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Entrez votre mot de passe" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLocked || loading}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '14px 46px 14px 46px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '15px',
                transition: 'all 0.3s ease'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px'
              }}
            >
              {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn"
          disabled={isLocked || loading}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            opacity: (isLocked || loading) ? 0.6 : 1,
            cursor: (isLocked || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Connexion en cours...' : isLocked ? 'Compte bloqué' : 'Se connecter'}
        </button>
        
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: '24px' }}>
          Pas encore de compte ?{' '}
          <Link to="/subscribe" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
            S'inscrire
          </Link>
        </p>

        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: 'rgba(37, 99, 235, 0.1)', 
          borderRadius: '10px',
          border: '1px solid rgba(37, 99, 235, 0.2)'
        }}>
          <p style={{ color: '#60a5fa', fontSize: '13px', margin: 0, textAlign: 'center' }}>
            <strong>Comptes de test :</strong><br />
            Admin: admin@streambox.com / Admin123!<br />
            User: test@streambox.com / Test1234!
          </p>
        </div>
      </form>
    </div>
  );
}
