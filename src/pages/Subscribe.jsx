import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Shield, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { SolanaPayment } from '../components/SolanaPayment';

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [solRate, setSolRate] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoValid, setPromoValid] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const plansData = await api.getSubscriptionPlans();
      setPlans(plansData);
      
      // Charger le taux SOL/USD (exemple: CoinGecko API)
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        setSolRate(data.solana.usd);
      } catch (err) {
        console.log('Taux SOL non disponible');
        setSolRate(100); // Fallback
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoValidation = async () => {
    if (!promoCode) return;
    
    try {
      const result = await api.validatePromoCode(promoCode);
      setPromoValid(result);
    } catch (err) {
      setPromoValid({ valid: false, error: 'Erreur de validation' });
    }
  };

  const handleSubscribe = (planId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const plan = plans[planId];
    setSelectedPlan({ ...plan, id: planId });
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (signature) => {
    setTimeout(() => {
      navigate('/payment-success?method=solana&tx=' + signature);
    }, 2000);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSelectedPlan(null);
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

  const planOrder = ['monthly', 'quarterly', 'yearly'];

  return (
    <div className="container" style={{paddingTop: '30px'}}>
      <div style={{textAlign: 'center', marginBottom: '50px'}}>
        <h1 style={{fontSize: '42px', marginBottom: '15px'}}>
          Passez au Premium
        </h1>
        <p style={{color: '#94a3b8', fontSize: '18px'}}>
          Sans publicités, qualité HD/4K, et bien plus encore
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px',
          padding: '10px 20px',
          background: 'rgba(153, 69, 255, 0.1)',
          border: '1px solid #9945FF',
          borderRadius: '8px'
        }}>
          <span style={{fontSize: '24px'}}>◎</span>
          <span style={{color: '#9945FF', fontWeight: '600'}}>
            Paiement Solana uniquement
          </span>
        </div>
      </div>

      {/* Promo Code */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 40px',
        padding: '20px',
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
          <Tag size={20} style={{color: '#22c55e'}} />
          <h3>Code Promo</h3>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value.toUpperCase());
              setPromoValid(null);
            }}
            placeholder="Entrez votre code"
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white'
            }}
          />
          <button onClick={handlePromoValidation} className="btn">
            Valider
          </button>
        </div>
        {promoValid && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            borderRadius: '8px',
            background: promoValid.valid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${promoValid.valid ? '#22c55e' : '#ef4444'}`,
            color: promoValid.valid ? '#22c55e' : '#ef4444'
          }}>
            {promoValid.valid ? (
              `✓ Code valide! -${promoValid.promo.discount}${promoValid.promo.type === 'percentage' ? '%' : '$'}`
            ) : (
              `✗ ${promoValid.error}`
            )}
          </div>
        )}
      </div>

      {/* Plans */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto 50px'
      }}>
        {planOrder.map((planId) => {
          const plan = plans[planId];
          if (!plan) return null;

          const isPopular = planId === 'yearly';
          let finalPrice = plan.price;
          
          if (promoValid?.valid) {
            if (promoValid.promo.type === 'percentage') {
              finalPrice = plan.price * (1 - promoValid.promo.discount / 100);
            } else {
              finalPrice = Math.max(0, plan.price - promoValid.promo.discount);
            }
          }

          return (
            <div
              key={planId}
              style={{
                background: isPopular 
                  ? 'linear-gradient(145deg, #7c3aed, #6d28d9)' 
                  : 'linear-gradient(145deg, #1e293b, #0f172a)',
                padding: '30px',
                borderRadius: '16px',
                border: isPopular ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
                position: 'relative',
                boxShadow: isPopular ? '0 10px 40px rgba(124, 58, 237, 0.4)' : 'none'
              }}
            >
              {isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '20px',
                  background: '#facc15',
                  color: '#000',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  MEILLEURE OFFRE
                </div>
              )}

              {plan.discount && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '20px',
                  background: '#22c55e',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  -{plan.discount}%
                </div>
              )}

              <h3 style={{fontSize: '24px', marginBottom: '10px'}}>{plan.name}</h3>
              
              <div style={{marginBottom: '20px'}}>
                <div style={{fontSize: '42px', fontWeight: 'bold', marginBottom: '5px'}}>
                  ${finalPrice.toFixed(2)}
                  {promoValid?.valid && finalPrice !== plan.price && (
                    <span style={{
                      fontSize: '20px',
                      textDecoration: 'line-through',
                      opacity: 0.5,
                      marginLeft: '10px'
                    }}>
                      ${plan.price}
                    </span>
                  )}
                </div>
                <div style={{fontSize: '14px', opacity: 0.8, marginBottom: '5px'}}>
                  ≈ {solRate ? (finalPrice / solRate).toFixed(2) : '...'} SOL
                </div>
                <div style={{fontSize: '12px', opacity: 0.6}}>
                  {plan.duration} jours
                </div>
              </div>

              <ul style={{listStyle: 'none', padding: 0, marginBottom: '30px'}}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{
                    padding: '10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Check size={20} style={{color: '#22c55e', flexShrink: 0}} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(planId)}
                className="btn"
                style={{
                  width: '100%',
                  background: isPopular ? 'white' : 'linear-gradient(135deg, #9945FF, #14F195)',
                  color: isPopular ? '#7c3aed' : 'white',
                  fontWeight: '600'
                }}
              >
                <span style={{fontSize: '20px', marginRight: '8px'}}>◎</span>
                Payer avec Solana
              </button>
            </div>
          );
        })}
      </div>

      {/* Features */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 50px',
        padding: '40px',
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{textAlign: 'center', marginBottom: '40px'}}>
          Pourquoi choisir Premium?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px'
        }}>
          <div style={{textAlign: 'center'}}>
            <Zap size={48} style={{color: '#f59e0b', margin: '0 auto 15px'}} />
            <h3 style={{marginBottom: '10px'}}>Sans Publicités</h3>
            <p style={{color: '#94a3b8'}}>
              Profitez de vos films et séries sans interruption
            </p>
          </div>
          <div style={{textAlign: 'center'}}>
            <Shield size={48} style={{color: '#3b82f6', margin: '0 auto 15px'}} />
            <h3 style={{marginBottom: '10px'}}>Paiement Sécurisé</h3>
            <p style={{color: '#94a3b8'}}>
              Transactions Solana rapides, sécurisées et à faible coût
            </p>
          </div>
          <div style={{textAlign: 'center'}}>
            <Check size={48} style={{color: '#22c55e', margin: '0 auto 15px'}} />
            <h3 style={{marginBottom: '10px'}}>Qualité Premium</h3>
            <p style={{color: '#94a3b8'}}>
              Streaming HD et 4K sur tous vos appareils
            </p>
          </div>
        </div>
      </div>

      {/* SOL Info */}
      {solRate && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'rgba(153, 69, 255, 0.1)',
          border: '1px solid #9945FF',
          borderRadius: '12px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{fontSize: '48px', margin: '0 auto 10px'}}>◎</div>
          <p style={{color: '#94a3b8', marginBottom: '5px'}}>
            Taux Solana actuel
          </p>
          <p style={{fontSize: '24px', fontWeight: 'bold', color: '#9945FF'}}>
            1 SOL = ${solRate.toLocaleString()}
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <SolanaPayment
            plan={selectedPlan}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      )}
    </div>
  );
}
