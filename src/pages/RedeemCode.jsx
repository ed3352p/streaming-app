import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, CheckCircle, AlertCircle, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function RedeemCode() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setShowRegister(true);
      return;
    }

    if (!code || code.length < 8) {
      setResult({ success: false, error: 'Code invalide' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.redeemAccessCode(code.toUpperCase());
      setResult(response);
      
      if (response.success) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      setResult({ success: false, error: err.message || 'Erreur lors de l\'activation' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithCode = async (e) => {
    e.preventDefault();

    if (!code || code.length < 8) {
      setResult({ success: false, error: 'Code invalide' });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setResult({ success: false, error: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (registerData.password.length < 8) {
      setResult({ success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Créer le compte
      const registerResponse = await api.register(
        registerData.username,
        registerData.email,
        registerData.password
      );

      if (registerResponse.token) {
        // Sauvegarder le token
        localStorage.setItem('token', registerResponse.token);

        // Activer le code
        const redeemResponse = await api.redeemAccessCode(code.toUpperCase());
        
        if (redeemResponse.success) {
          setResult({
            success: true,
            message: 'Compte créé et code activé avec succès!',
            duration: redeemResponse.duration,
            expiresAt: redeemResponse.expiresAt
          });

          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        } else {
          setResult({ success: false, error: redeemResponse.error });
        }
      }
    } catch (err) {
      setResult({ success: false, error: err.message || 'Erreur lors de la création du compte' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '30px'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        padding: '40px',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Key size={40} style={{color: 'white'}} />
          </div>
          <h1 style={{fontSize: '32px', marginBottom: '10px'}}>
            Activer un Code Premium
          </h1>
          <p style={{color: '#94a3b8', fontSize: '16px'}}>
            Entrez votre code d'accès pour activer votre abonnement Premium
          </p>
        </div>

        {/* Form */}
        {!showRegister ? (
          <form onSubmit={handleSubmit} style={{marginBottom: '30px'}}>
            <div style={{marginBottom: '20px'}}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                color: '#cbd5e1',
                fontWeight: '600'
              }}>
                Code d'Accès
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC1234567"
                maxLength={10}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace'
                }}
                disabled={loading}
              />
              <p style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#64748b',
                textAlign: 'center'
              }}>
                Le code contient 10 caractères (lettres et chiffres)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !code}
              className="btn"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                fontWeight: '600',
                background: loading || !code 
                  ? '#64748b' 
                  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                opacity: !code ? 0.5 : 1,
                cursor: !code ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Activation en cours...' : user ? 'Activer le Code' : 'Créer un Compte'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterWithCode} style={{marginBottom: '30px'}}>
            <div style={{
              padding: '15px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid #3b82f6',
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <UserPlus size={24} style={{color: '#3b82f6', margin: '0 auto 10px'}} />
              <p style={{color: '#3b82f6', fontSize: '14px', fontWeight: '600'}}>
                Créez votre compte pour activer le code: <strong>{code}</strong>
              </p>
            </div>

            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px'}}>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                placeholder="johndoe"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </div>

            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px'}}>
                Email
              </label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                placeholder="john@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </div>

            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px'}}>
                Mot de passe
              </label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                placeholder="••••••••"
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px'}}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                fontWeight: '600',
                background: loading ? '#64748b' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                marginBottom: '10px'
              }}
            >
              {loading ? 'Création en cours...' : 'Créer le Compte et Activer'}
            </button>

            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8'
              }}
            >
              Retour
            </button>
          </form>
        )}

        {/* Result */}
        {result && (
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            background: result.success 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            border: `2px solid ${result.success ? '#22c55e' : '#ef4444'}`,
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: result.success ? '15px' : '0'
            }}>
              {result.success ? (
                <CheckCircle size={24} style={{color: '#22c55e', flexShrink: 0}} />
              ) : (
                <AlertCircle size={24} style={{color: '#ef4444', flexShrink: 0}} />
              )}
              <div style={{flex: 1}}>
                <h3 style={{
                  color: result.success ? '#22c55e' : '#ef4444',
                  marginBottom: '5px',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  {result.success ? 'Code Activé!' : 'Erreur'}
                </h3>
                {result.success ? (
                  <div>
                    <p style={{color: '#cbd5e1', marginBottom: '10px'}}>
                      Votre abonnement Premium a été activé avec succès!
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#94a3b8'
                    }}>
                      <Sparkles size={16} style={{color: '#22c55e'}} />
                      <span>
                        Durée: <strong style={{color: '#22c55e'}}>
                          {result.duration} jour{result.duration > 1 ? 's' : ''}
                        </strong>
                      </span>
                    </div>
                    <p style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      Expire le: {new Date(result.expiresAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                ) : (
                  <p style={{color: '#fca5a5'}}>
                    {result.error}
                  </p>
                )}
              </div>
            </div>

            {result.success && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#cbd5e1',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  ✨ Avantages Premium Activés:
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontSize: '14px',
                  color: '#94a3b8',
                  lineHeight: '1.8'
                }}>
                  <li>✓ Sans publicités</li>
                  <li>✓ Qualité HD/4K</li>
                  <li>✓ Téléchargement hors ligne</li>
                  <li>✓ Multi-devices</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div style={{
          padding: '20px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid #3b82f6',
          borderRadius: '12px'
        }}>
          <h4 style={{
            color: '#3b82f6',
            marginBottom: '10px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            ℹ️ Comment obtenir un code?
          </h4>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: 0
          }}>
            Les codes d'accès Premium sont distribués lors de promotions spéciales ou 
            peuvent être achetés auprès de nos partenaires autorisés. Chaque code est 
            unique et ne peut être utilisé qu'une seule fois.
          </p>
        </div>

        {/* Actions */}
        <div style={{
          marginTop: '30px',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => navigate('/')}
            className="btn"
            style={{background: '#64748b'}}
          >
            Retour à l'accueil
          </button>
          {!user?.premium && (
            <button
              onClick={() => navigate('/subscribe')}
              className="btn"
              style={{background: 'linear-gradient(135deg, #3b82f6, #2563eb)'}}
            >
              Voir les Abonnements
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
