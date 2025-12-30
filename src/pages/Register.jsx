import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Validation du nom d'utilisateur
    if (!formData.username || formData.username.length < 3) {
      errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }
    if (formData.username.length > 20) {
      errors.username = 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ et -';
    }

    // Validation de l'email
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    // Validation du mot de passe
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    // Validation de la confirmation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.register({
        username: formData.username,
        email: formData.email.toLowerCase(),
        password: formData.password
      });

      if (response.success) {
        // Connexion automatique après inscription
        const loginResponse = await api.login(formData.email.toLowerCase(), formData.password);
        if (loginResponse.token) {
          localStorage.setItem('token', loginResponse.token);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 200px)',
      paddingTop: '30px',
      paddingBottom: '30px'
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: '450px',
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <UserPlus size={48} style={{ color: '#2563eb', margin: '0 auto 15px' }} />
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Créer un compte</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Rejoignez Lumixar gratuitement
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Nom d'utilisateur */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
            Nom d'utilisateur
          </label>
          <div style={{ position: 'relative' }}>
            <User size={20} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }} />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              required
              style={{
                width: '100%',
                padding: '12px 12px 12px 45px',
                borderRadius: '8px',
                border: `1px solid ${validationErrors.username ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
          {validationErrors.username && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>
              {validationErrors.username}
            </p>
          )}
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 12px 12px 45px',
                borderRadius: '8px',
                border: `1px solid ${validationErrors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
          {validationErrors.email && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Mot de passe */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
            Mot de passe
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 45px 12px 45px',
                borderRadius: '8px',
                border: `1px solid ${validationErrors.password ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '0'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {validationErrors.password && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>
              {validationErrors.password}
            </p>
          )}
          <p style={{ color: '#64748b', fontSize: '11px', marginTop: '5px' }}>
            Au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre
          </p>
        </div>

        {/* Confirmation mot de passe */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
            Confirmer le mot de passe
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 45px 12px 45px',
                borderRadius: '8px',
                border: `1px solid ${validationErrors.confirmPassword ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '0'
              }}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </button>
        
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: '24px' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
            Se connecter
          </Link>
        </p>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <p style={{ color: '#60a5fa', fontSize: '12px', margin: 0, textAlign: 'center' }}>
            En créant un compte, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </form>
    </div>
  );
}
