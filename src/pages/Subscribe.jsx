export default function Subscribe() {
  return (
    <div className="container">
      <h2 style={{textAlign: 'center', marginBottom: '50px'}}>Choisissez votre forfait</h2>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto'}}>
        
        {/* Forfait Gratuit */}
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <h3 style={{fontSize: '24px', marginBottom: '10px'}}>Gratuit</h3>
          <p style={{fontSize: '36px', fontWeight: 'bold', marginBottom: '20px'}}>0 $<span style={{fontSize: '16px', color: '#64748b'}}>/mois</span></p>
          <ul style={{listStyle: 'none', padding: 0, marginBottom: '30px'}}>
            <li style={{padding: '10px 0', color: '#cbd5e1'}}>✔ Accès aux films</li>
            <li style={{padding: '10px 0', color: '#cbd5e1'}}>✔ IPTV basique</li>
            <li style={{padding: '10px 0', color: '#64748b'}}>✘ Avec publicités</li>
            <li style={{padding: '10px 0', color: '#64748b'}}>✘ Qualité SD</li>
          </ul>
          <button className="btn" style={{width: '100%'}}>Continuer gratuitement</button>
        </div>

        {/* Forfait Premium */}
        <div style={{background: 'linear-gradient(145deg, #7c3aed, #6d28d9)', padding: '30px', borderRadius: '16px', border: '2px solid #7c3aed', position: 'relative', boxShadow: '0 10px 40px rgba(124, 58, 237, 0.4)'}}>
          <div style={{position: 'absolute', top: '-15px', right: '20px', background: '#facc15', color: '#000', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'}}>
            POPULAIRE
          </div>
          <h3 style={{fontSize: '24px', marginBottom: '10px'}}>Premium</h3>
          <p style={{fontSize: '36px', fontWeight: 'bold', marginBottom: '20px'}}>10 $<span style={{fontSize: '16px', opacity: 0.8}}>/mois</span></p>
          <ul style={{listStyle: 'none', padding: 0, marginBottom: '30px'}}>
            <li style={{padding: '10px 0'}}>✔ Sans publicité</li>
            <li style={{padding: '10px 0'}}>✔ Tous les films + IPTV</li>
            <li style={{padding: '10px 0'}}>✔ Qualité HD & 4K</li>
            <li style={{padding: '10px 0'}}>✔ Téléchargement hors ligne</li>
            <li style={{padding: '10px 0'}}>✔ Support prioritaire</li>
          </ul>
          <button className="btn" style={{width: '100%', background: 'white', color: '#7c3aed'}}>S'abonner maintenant</button>
        </div>

        {/* Forfait Famille */}
        <div style={{background: 'linear-gradient(145deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <h3 style={{fontSize: '24px', marginBottom: '10px'}}>Famille</h3>
          <p style={{fontSize: '36px', fontWeight: 'bold', marginBottom: '20px'}}>15 $<span style={{fontSize: '16px', color: '#64748b'}}>/mois</span></p>
          <ul style={{listStyle: 'none', padding: 0, marginBottom: '30px'}}>
            <li style={{padding: '10px 0', color: '#cbd5e1'}}>✔ Tout du Premium</li>
            <li style={{padding: '10px 0', color: '#cbd5e1'}}>✔ Jusqu'à 4 profils</li>
            <li style={{padding: '10px 0', color: '#cbd5e1'}}>✔ Visionnage simultané</li>
            <li style={{padding: '10px 0', color: '#cbd5e1'}}>✔ Contrôle parental</li>
          </ul>
          <button className="btn" style={{width: '100%'}}>S'abonner</button>
        </div>
      </div>

      <div style={{textAlign: 'center', marginTop: '60px', padding: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px'}}>
        <h3 style={{marginBottom: '15px'}}>Garantie satisfait ou remboursé 30 jours</h3>
        <p style={{color: '#cbd5e1'}}>Essayez sans risque. Annulez à tout moment.</p>
      </div>
    </div>
  );
}
