import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Download, Trash2, Copy, CheckCircle, Key, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AccessCodes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [duration, setDuration] = useState(7);
  const [quantity, setQuantity] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [codesData, statsData] = await Promise.all([
        api.getAccessCodes(),
        api.getAccessCodesStats()
      ]);
      setCodes(codesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (quantity < 1 || quantity > 100) {
      alert('Quantité invalide (1-100)');
      return;
    }

    setGenerating(true);
    try {
      const result = await api.generateAccessCodes(duration, quantity);
      setGeneratedCodes(result.codes);
      await loadData();
      alert(`${result.count} code(s) généré(s) avec succès!`);
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce code?')) return;

    try {
      await api.deleteAccessCode(id);
      await loadData();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleDeleteUsed = async () => {
    if (!confirm('Supprimer tous les codes utilisés?')) return;

    try {
      const result = await api.deleteUsedAccessCodes();
      alert(result.message);
      await loadData();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleExport = async () => {
    try {
      await api.exportAccessCodes();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const durationOptions = [
    { value: 1, label: '1 Jour' },
    { value: 7, label: '1 Semaine' },
    { value: 30, label: '1 Mois' },
    { value: 90, label: '3 Mois' },
    { value: 365, label: '1 An' }
  ];

  return (
    <div style={{minHeight: '100vh', background: '#0f172a'}}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '20px'
      }}>
        <div style={{maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button onClick={() => navigate('/admin')} style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'}}>
              <ArrowLeft size={24} />
            </button>
            <h1 style={{fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <Key style={{color: '#3b82f6'}} />
              Codes d'Accès Premium
            </h1>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span style={{color: '#94a3b8'}}>{user?.email}</span>
            <button onClick={handleLogout} className="btn" style={{background: '#ef4444'}}>Déconnexion</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth: '1400px', margin: '0 auto', padding: '30px 20px'}}>
        
        {/* Stats */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(145deg, #1e293b, #0f172a)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                <Key size={20} style={{color: '#3b82f6'}} />
                <span style={{color: '#94a3b8', fontSize: '14px'}}>Total</span>
              </div>
              <p style={{fontSize: '32px', fontWeight: 'bold'}}>{stats.total}</p>
            </div>

            <div style={{
              background: 'linear-gradient(145deg, #1e293b, #0f172a)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                <CheckCircle size={20} style={{color: '#22c55e'}} />
                <span style={{color: '#94a3b8', fontSize: '14px'}}>Utilisés</span>
              </div>
              <p style={{fontSize: '32px', fontWeight: 'bold', color: '#22c55e'}}>{stats.used}</p>
            </div>

            <div style={{
              background: 'linear-gradient(145deg, #1e293b, #0f172a)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                <Calendar size={20} style={{color: '#f59e0b'}} />
                <span style={{color: '#94a3b8', fontSize: '14px'}}>Disponibles</span>
              </div>
              <p style={{fontSize: '32px', fontWeight: 'bold', color: '#f59e0b'}}>{stats.unused}</p>
            </div>
          </div>
        )}

        {/* Generate Form */}
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '25px',
          borderRadius: '16px',
          marginBottom: '30px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Plus size={24} style={{color: '#3b82f6'}} />
            Générer des Codes
          </h2>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#94a3b8'}}>Durée</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#1e293b',
                  color: 'white'
                }}
              >
                {durationOptions.map(opt => (
                  <option key={opt.value} value={opt.value} style={{background: '#1e293b', color: 'white'}}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '8px', color: '#94a3b8'}}>Quantité (max 100)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
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

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn"
            style={{
              background: generating ? '#64748b' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              width: '100%'
            }}
          >
            {generating ? 'Génération...' : `Générer ${quantity} code(s)`}
          </button>

          {/* Generated Codes Display */}
          {generatedCodes.length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid #22c55e',
              borderRadius: '12px'
            }}>
              <h3 style={{color: '#22c55e', marginBottom: '15px'}}>
                ✓ {generatedCodes.length} code(s) généré(s)
              </h3>
              <div style={{display: 'grid', gap: '10px'}}>
                {generatedCodes.map((code) => (
                  <div key={code.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                  }}>
                    <code style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#22c55e',
                      letterSpacing: '2px'
                    }}>
                      {code.code}
                    </code>
                    <button
                      onClick={() => handleCopy(code.code)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedCode === code.code ? '#22c55e' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '8px'
                      }}
                    >
                      {copiedCode === code.code ? <CheckCircle size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <button onClick={handleExport} className="btn" style={{background: '#3b82f6'}}>
            <Download size={20} style={{marginRight: '8px'}} />
            Exporter CSV
          </button>
          <button onClick={handleDeleteUsed} className="btn" style={{background: '#ef4444'}}>
            <Trash2 size={20} style={{marginRight: '8px'}} />
            Supprimer codes utilisés
          </button>
        </div>

        {/* Codes Table */}
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '25px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{marginBottom: '20px'}}>Tous les Codes ({codes.length})</h2>

          {loading ? (
            <div style={{textAlign: 'center', padding: '40px'}}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(59, 130, 246, 0.2)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
            </div>
          ) : codes.length === 0 ? (
            <p style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>
              Aucun code généré
            </p>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                    <th style={{padding: '12px', textAlign: 'left', color: '#94a3b8'}}>Code</th>
                    <th style={{padding: '12px', textAlign: 'left', color: '#94a3b8'}}>Durée</th>
                    <th style={{padding: '12px', textAlign: 'left', color: '#94a3b8'}}>Statut</th>
                    <th style={{padding: '12px', textAlign: 'left', color: '#94a3b8'}}>Utilisé par</th>
                    <th style={{padding: '12px', textAlign: 'left', color: '#94a3b8'}}>Date création</th>
                    <th style={{padding: '12px', textAlign: 'left', color: '#94a3b8'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                      <td style={{padding: '12px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <code style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: code.used ? '#64748b' : '#3b82f6',
                            letterSpacing: '1px'
                          }}>
                            {code.code}
                          </code>
                          <button
                            onClick={() => handleCopy(code.code)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedCode === code.code ? '#22c55e' : '#64748b',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            {copiedCode === code.code ? <CheckCircle size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </td>
                      <td style={{padding: '12px', color: '#cbd5e1'}}>
                        {code.duration} jour{code.duration > 1 ? 's' : ''}
                      </td>
                      <td style={{padding: '12px'}}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: code.used ? 'rgba(34, 197, 94, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                          color: code.used ? '#22c55e' : '#f97316'
                        }}>
                          {code.used ? 'Utilisé' : 'Disponible'}
                        </span>
                      </td>
                      <td style={{padding: '12px', color: '#94a3b8'}}>
                        {code.usedBy || '-'}
                      </td>
                      <td style={{padding: '12px', color: '#94a3b8', fontSize: '14px'}}>
                        {new Date(code.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{padding: '12px'}}>
                        <button
                          onClick={() => handleDelete(code.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '8px'
                          }}
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
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
    </div>
  );
}
