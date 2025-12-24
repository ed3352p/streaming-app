import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const confetti = () => {
      const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
      document.body.appendChild(container);

      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          confetti.style.cssText = `
            position:absolute;
            width:10px;
            height:10px;
            background:${colors[Math.floor(Math.random() * colors.length)]};
            left:${Math.random() * 100}%;
            top:-10px;
            opacity:1;
            transform:rotate(${Math.random() * 360}deg);
          `;
          container.appendChild(confetti);

          const animation = confetti.animate([
            { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(${window.innerHeight + 10}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
          ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          });

          animation.onfinish = () => confetti.remove();
        }, i * 30);
      }

      setTimeout(() => container.remove(), 6000);
    };

    confetti();
  }, []);

  return (
    <div className="container" style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'center',
        padding: '40px',
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        borderRadius: '24px',
        border: '2px solid #22c55e',
        boxShadow: '0 20px 60px rgba(34, 197, 94, 0.3)'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 30px',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <CheckCircle size={60} style={{color: 'white'}} />
        </div>

        <h1 style={{
          fontSize: '36px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Paiement Confirmé!
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#94a3b8',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          Félicitations! Votre abonnement Premium est maintenant actif.
          Profitez de tous les avantages sans publicités.
        </p>

        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid #22c55e',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px'}}>
            <Sparkles size={24} style={{color: '#22c55e'}} />
            <h3 style={{color: '#22c55e'}}>Avantages Premium Activés</h3>
          </div>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            color: '#cbd5e1',
            fontSize: '14px',
            lineHeight: '2'
          }}>
            <li>✓ Accès illimité sans publicités</li>
            <li>✓ Qualité HD et 4K</li>
            <li>✓ Téléchargement hors ligne</li>
            <li>✓ Multi-devices (5 appareils)</li>
            <li>✓ Support prioritaire</li>
          </ul>
        </div>

        <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
          <button
            onClick={() => navigate('/')}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Commencer à regarder
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => navigate('/watchlist')}
            className="btn"
            style={{background: '#64748b'}}
          >
            Ma Collection
          </button>
        </div>

        <p style={{
          marginTop: '30px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          Un email de confirmation a été envoyé à votre adresse
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
