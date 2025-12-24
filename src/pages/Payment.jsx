import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bitcoin, Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Payment() {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadPayment();
  }, [paymentId, user]);

  useEffect(() => {
    if (payment && payment.status === 'pending') {
      const interval = setInterval(() => {
        const expires = new Date(payment.expiresAt);
        const now = new Date();
        const diff = expires - now;
        
        if (diff <= 0) {
          setTimeLeft('Expiré');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [payment]);

  const loadPayment = async () => {
    try {
      const data = await api.getPayment(paymentId);
      setPayment(data);
    } catch (err) {
      console.error('Error loading payment:', err);
      alert('Paiement non trouvé');
      navigate('/subscribe');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!txHash || txHash.length !== 64) {
      alert('Hash de transaction invalide (doit être 64 caractères)');
      return;
    }

    setVerifying(true);
    try {
      const result = await api.verifyPayment(paymentId, txHash);
      if (result.success) {
        setPayment(result.payment);
        setTimeout(() => {
          navigate('/payment/success');
        }, 2000);
      }
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <p style={{color: '#64748b', marginTop: '20px'}}>Chargement...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <AlertCircle size={64} style={{color: '#ef4444', margin: '0 auto 20px'}} />
        <h2>Paiement non trouvé</h2>
        <a href="/subscribe" className="btn" style={{marginTop: '20px'}}>
          Retour aux abonnements
        </a>
      </div>
    );
  }

  if (payment.status === 'confirmed') {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <CheckCircle size={64} style={{color: '#22c55e', margin: '0 auto 20px'}} />
        <h2>Paiement confirmé!</h2>
        <p style={{color: '#94a3b8', marginTop: '20px'}}>
          Votre abonnement Premium est maintenant actif
        </p>
        <a href="/" className="btn" style={{marginTop: '20px'}}>
          Retour à l'accueil
        </a>
      </div>
    );
  }

  if (payment.status === 'expired') {
    return (
      <div className="container" style={{textAlign: 'center', paddingTop: '100px'}}>
        <Clock size={64} style={{color: '#f59e0b', margin: '0 auto 20px'}} />
        <h2>Paiement expiré</h2>
        <p style={{color: '#94a3b8', marginTop: '20px'}}>
          Ce paiement a expiré. Veuillez créer un nouveau paiement.
        </p>
        <a href="/subscribe" className="btn" style={{marginTop: '20px'}}>
          Retour aux abonnements
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{paddingTop: '30px'}}>
      <div style={{maxWidth: '800px', margin: '0 auto'}}>
        
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <Bitcoin size={64} style={{color: '#f97316', margin: '0 auto 20px'}} />
          <h1 style={{marginBottom: '10px'}}>Paiement Bitcoin</h1>
          <p style={{color: '#94a3b8'}}>
            Envoyez exactement le montant indiqué à l'adresse ci-dessous
          </p>
        </div>

        {/* Timer */}
        {timeLeft && timeLeft !== 'Expiré' && (
          <div style={{
            textAlign: 'center',
            padding: '15px',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid #f97316',
            borderRadius: '12px',
            marginBottom: '30px'
          }}>
            <Clock size={24} style={{color: '#f97316', margin: '0 auto 10px'}} />
            <p style={{color: '#f97316', fontSize: '24px', fontWeight: 'bold'}}>
              {timeLeft}
            </p>
            <p style={{color: '#94a3b8', fontSize: '14px'}}>
              Temps restant pour effectuer le paiement
            </p>
          </div>
        )}

        {/* Payment Details */}
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '30px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{marginBottom: '20px'}}>Détails du paiement</h3>
          
          <div style={{marginBottom: '20px'}}>
            <p style={{color: '#64748b', marginBottom: '5px'}}>Plan</p>
            <p style={{fontSize: '18px', fontWeight: '600'}}>{payment.plan}</p>
          </div>

          <div style={{marginBottom: '20px'}}>
            <p style={{color: '#64748b', marginBottom: '5px'}}>Montant</p>
            <div style={{display: 'flex', alignItems: 'baseline', gap: '10px'}}>
              <p style={{fontSize: '32px', fontWeight: 'bold', color: '#f97316'}}>
                {payment.amountBTC} BTC
              </p>
              <p style={{color: '#64748b'}}>
                (≈ ${payment.amountUSD})
              </p>
            </div>
            {payment.discount > 0 && (
              <p style={{color: '#22c55e', fontSize: '14px', marginTop: '5px'}}>
                ✓ Réduction de ${payment.discount.toFixed(2)} appliquée
              </p>
            )}
          </div>

          <div>
            <p style={{color: '#64748b', marginBottom: '10px'}}>Adresse Bitcoin</p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '15px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <code style={{
                flex: 1,
                fontSize: '14px',
                wordBreak: 'break-all',
                color: '#3b82f6'
              }}>
                {payment.btcAddress}
              </code>
              <button
                onClick={() => handleCopy(payment.btcAddress)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copied ? '#22c55e' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '8px'
                }}
                title="Copier l'adresse"
              >
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '30px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{marginBottom: '20px'}}>QR Code</h3>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            display: 'inline-block'
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:${payment.btcAddress}?amount=${payment.amountBTC}`}
              alt="QR Code Bitcoin"
              style={{display: 'block'}}
            />
          </div>
          <p style={{color: '#64748b', marginTop: '15px', fontSize: '14px'}}>
            Scannez ce QR code avec votre wallet Bitcoin
          </p>
        </div>

        {/* Verification */}
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '30px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{marginBottom: '20px'}}>Vérification de la transaction</h3>
          <p style={{color: '#94a3b8', marginBottom: '20px'}}>
            Après avoir envoyé le paiement, entrez le hash de votre transaction pour vérification:
          </p>
          
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Hash de transaction (64 caractères)"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleVerify}
              disabled={verifying || !txHash}
              className="btn"
              style={{
                background: verifying ? '#64748b' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                opacity: !txHash ? 0.5 : 1
              }}
            >
              {verifying ? 'Vérification...' : 'Vérifier'}
            </button>
          </div>

          <div style={{
            padding: '15px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            borderRadius: '8px'
          }}>
            <p style={{color: '#3b82f6', fontSize: '14px', marginBottom: '10px'}}>
              ℹ️ Comment trouver le hash de transaction?
            </p>
            <ul style={{color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px'}}>
              <li>Dans votre wallet, cherchez les détails de la transaction</li>
              <li>Le hash (ou TxID) est une chaîne de 64 caractères</li>
              <li>Vous pouvez aussi le trouver sur un explorateur blockchain</li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid #f97316',
          borderRadius: '12px'
        }}>
          <h4 style={{color: '#f97316', marginBottom: '15px'}}>⚠️ Important</h4>
          <ul style={{color: '#94a3b8', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px'}}>
            <li>Envoyez <strong>exactement</strong> le montant indiqué en BTC</li>
            <li>N'envoyez que du Bitcoin (BTC) à cette adresse</li>
            <li>Le paiement expire dans 30 minutes</li>
            <li>Après confirmation, votre abonnement sera activé automatiquement</li>
            <li>Les confirmations blockchain peuvent prendre 10-60 minutes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
