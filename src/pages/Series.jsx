import { Tv } from 'lucide-react';

export default function Series() {
  return (
    <div className="container">
      <div style={{
        textAlign: 'center',
        padding: '100px 20px',
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Tv style={{width: 'clamp(50px, 10vw, 80px)', height: 'clamp(50px, 10vw, 80px)', color: '#7c3aed', margin: '0 auto 30px'}} />
        <h1 style={{fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: '900', marginBottom: '20px'}}>
          Séries TV
        </h1>
        <p style={{color: '#94a3b8', fontSize: 'clamp(14px, 3vw, 20px)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', padding: '0 10px'}}>
          La section Séries arrive bientôt ! Restez connectés pour découvrir nos séries exclusives.
        </p>
        <div style={{display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 10px'}}>
          <a href="/films" className="btn">
            Voir les Films
          </a>
          <a href="/iptv" className="btn" style={{background: 'linear-gradient(135deg, #7c3aed, #6d28d9)'}}>
            Regarder IPTV
          </a>
        </div>
      </div>
    </div>
  );
}
