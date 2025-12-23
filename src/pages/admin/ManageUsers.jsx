import { useState, useEffect } from 'react';
import { Users, Trash2, UserPlus, Shield, Crown, Edit, X, Key, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'user',
    premium: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const { user: currentUser } = useAuth();

  const passwordRequirements = [
    { test: (p) => p.length >= 8, label: '8+ caractères' },
    { test: (p) => /[A-Z]/.test(p), label: 'Majuscule' },
    { test: (p) => /[a-z]/.test(p), label: 'Minuscule' },
    { test: (p) => /[0-9]/.test(p), label: 'Chiffre' },
    { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'Spécial' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.createUser({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        name: formData.name || formData.username,
        role: formData.role,
        premium: formData.premium || formData.role === 'admin'
      });
      
      setSuccess(`Utilisateur ${formData.username} créé avec succès !`);
      setFormData({ username: '', email: '', password: '', name: '', role: 'user', premium: false });
      setShowAddForm(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (currentUser?.id === userId) {
      setError('Vous ne pouvez pas supprimer votre propre compte !');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${username} ?`)) {
      try {
        await api.deleteUser(userId);
        setSuccess(`Utilisateur ${username} supprimé`);
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message || 'Erreur lors de la suppression');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      name: user.name || '',
      role: user.role || 'user',
      premium: user.premium || false
    });
    setShowAddForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const updateData = {
        email: formData.email,
        name: formData.name || formData.username,
        role: formData.role,
        premium: formData.premium || formData.role === 'admin'
      };
      
      await api.updateUser(editingUser.id, updateData);
      setSuccess(`Utilisateur ${formData.username} modifié avec succès !`);
      setFormData({ username: '', email: '', password: '', name: '', role: 'user', premium: false });
      setShowAddForm(false);
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId, username) => {
    if (confirm(`Réinitialiser le mot de passe de ${username} ?`)) {
      try {
        const result = await api.resetUserPassword(userId);
        setTempPassword({ username, password: result.temporaryPassword });
        setSuccess(`Mot de passe de ${username} réinitialisé`);
        setTimeout(() => setSuccess(''), 5000);
      } catch (err) {
        setError(err.message || 'Erreur lors de la réinitialisation');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const togglePremium = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    try {
      await api.updateUser(userId, { premium: !user.premium });
      loadUsers();
      setSuccess('Statut premium mis à jour !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="container" style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
      <div style={{marginBottom: '40px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '900',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              <Users style={{width: '36px', height: '36px', display: 'inline', marginRight: '12px', color: '#3b82f6'}} />
              Gestion des utilisateurs
            </h1>
            <p style={{color: '#64748b', fontSize: '16px'}}>
              {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <UserPlus style={{width: '20px', height: '20px'}} />
            Ajouter un utilisateur
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            padding: '15px 20px',
            borderRadius: '12px',
            color: '#ef4444',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            padding: '15px 20px',
            borderRadius: '12px',
            color: '#22c55e',
            marginBottom: '20px'
          }}>
            ✅ {success}
          </div>
        )}

        {tempPassword && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid #fbbf24',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={18} />
                  Mot de passe temporaire pour {tempPassword.username}
                </h4>
                <p style={{ color: '#fcd34d', fontSize: '14px', marginBottom: '12px' }}>
                  Communiquez ce mot de passe à l'utilisateur. Il devra le changer à sa première connexion.
                </p>
                <code style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  display: 'inline-block'
                }}>
                  {tempPassword.password}
                </code>
              </div>
              <button
                onClick={() => setTempPassword(null)}
                style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={editingUser ? handleUpdate : handleSubmit} style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            padding: '30px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '30px'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{fontSize: '20px', color: '#fff'}}>
                {editingUser ? `Modifier ${editingUser.username}` : 'Nouvel utilisateur'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddForm(false); setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'user' }); }}
                style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'}}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  disabled={editingUser}
                  placeholder="johndoe"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: editingUser ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                    color: editingUser ? '#64748b' : 'white'
                  }}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="user@example.com"
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
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
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
              {!editingUser && (
                <div>
                  <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>
                    Mot de passe *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      placeholder="Min. 8 caractères"
                      style={{
                        width: '100%',
                        padding: '12px 44px 12px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white'
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
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {passwordRequirements.map((req, i) => (
                        <span key={i} style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: req.test(formData.password) ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                          color: req.test(formData.password) ? '#22c55e' : '#64748b'
                        }}>
                          {req.test(formData.password) ? '✓' : '○'} {req.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {editingUser && (
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleResetPassword(editingUser.id, editingUser.username)}
                    style={{
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      color: '#fbbf24',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <Key size={18} />
                    Réinitialiser le mot de passe
                  </button>
                </div>
              )}
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: '500'}}>
                Rôle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#1e293b',
                  color: 'white'
                }}
              >
                <option value="user" style={{background: '#1e293b', color: 'white'}}>Utilisateur</option>
                <option value="premium" style={{background: '#1e293b', color: 'white'}}>Premium</option>
                <option value="admin" style={{background: '#1e293b', color: 'white'}}>Administrateur</option>
              </select>
            </div>

            <div style={{display: 'flex', gap: '12px'}}>
              <button type="submit" className="btn" style={{flex: 1}}>
                {editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'user' }); }}
                className="btn"
                style={{background: 'linear-gradient(135deg, #64748b, #475569)'}}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <th style={{padding: '16px 20px', textAlign: 'left', color: '#cbd5e1', fontWeight: '600'}}>Utilisateur</th>
              <th style={{padding: '16px 20px', textAlign: 'left', color: '#cbd5e1', fontWeight: '600'}}>Rôle</th>
              <th style={{padding: '16px 20px', textAlign: 'left', color: '#cbd5e1', fontWeight: '600'}}>Date de création</th>
              <th style={{padding: '16px 20px', textAlign: 'right', color: '#cbd5e1', fontWeight: '600'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
                  Aucun utilisateur enregistré
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding: '16px 20px', color: '#e2e8f0'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '16px'
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span style={{fontWeight: '500'}}>{user.username}</span>
                    </div>
                  </td>
                  <td style={{padding: '16px 20px'}}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: user.role === 'admin' 
                        ? 'rgba(139, 92, 246, 0.2)' 
                        : user.role === 'premium' 
                          ? 'rgba(250, 204, 21, 0.2)' 
                          : 'rgba(59, 130, 246, 0.2)',
                      color: user.role === 'admin' 
                        ? '#a78bfa' 
                        : user.role === 'premium' 
                          ? '#facc15' 
                          : '#60a5fa'
                    }}>
                      {user.role === 'admin' && <Shield style={{width: '14px', height: '14px'}} />}
                      {user.role === 'premium' && <Crown style={{width: '14px', height: '14px'}} />}
                      {user.role === 'admin' ? 'Admin' : user.role === 'premium' ? 'Premium' : 'User'}
                    </span>
                  </td>
                  <td style={{padding: '16px 20px', color: '#94a3b8'}}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td style={{padding: '16px 20px', textAlign: 'right'}}>
                    <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                      {/* Toggle Premium */}
                      <button
                        onClick={() => togglePremium(user.id)}
                        style={{
                          background: user.premium ? 'rgba(250, 204, 21, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                          border: `1px solid ${user.premium ? 'rgba(250, 204, 21, 0.5)' : 'rgba(100, 116, 139, 0.5)'}`,
                          color: user.premium ? '#facc15' : '#94a3b8',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <Crown style={{width: '14px', height: '14px'}} />
                        {user.premium ? 'Retirer Premium' : 'Ajouter Premium'}
                      </button>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(user)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#3b82f6',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <Edit style={{width: '14px', height: '14px'}} />
                        Modifier
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <Trash2 style={{width: '14px', height: '14px'}} />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
