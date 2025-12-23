export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center', 
      padding: 'clamp(16px, 4vw, 24px) clamp(12px, 3vw, 20px)', 
      background: '#020617', 
      color: 'white',
      marginTop: 'auto'
    }}>
      <p style={{fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '10px'}}>
        © 2025 StreamBox. Tous droits réservés.
      </p>
      <div style={{display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', fontSize: 'clamp(12px, 2.5vw, 14px)'}}>
        <a href="#" style={{color: 'white', padding: '4px 8px'}}>Facebook</a>
        <span style={{color: '#64748b'}}>|</span>
        <a href="#" style={{color: 'white', padding: '4px 8px'}}>Twitter</a>
        <span style={{color: '#64748b'}}>|</span>
        <a href="#" style={{color: 'white', padding: '4px 8px'}}>Instagram</a>
      </div>
    </footer>
  );
}
