import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Tv, CreditCard, User, LogOut, Shield, Film, Menu, X, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar-mobile.css';

export default function NavbarComponent() {
  const { user, logout, isAdmin, isPremium } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu mobile quand la route change
  useEffect(() => {
    console.log('[NAV] Route changed to:', location.pathname);
    console.log('[NAV] Closing menu due to route change');
    setMobileMenuOpen(false);
  }, [location]);

  // Log menu state changes
  useEffect(() => {
    console.log('[NAV] Menu state updated:', mobileMenuOpen ? 'OPEN' : 'CLOSED');
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    console.log('[NAV] Toggle menu clicked, current state:', mobileMenuOpen);
    setMobileMenuOpen(prev => {
      console.log('[NAV] Menu state changing from', prev, 'to', !prev);
      return !prev;
    });
  };

  const handleMobileNavClick = (href) => {
    console.log('[NAV] Mobile nav clicked, navigating to:', href);
    console.log('[NAV] Current menu state before closing:', mobileMenuOpen);
    setMobileMenuOpen(false);
    console.log('[NAV] Menu closed, waiting before navigation...');
    setTimeout(() => {
      console.log('[NAV] Navigating now to:', href);
      navigate(href);
    }, 100);
  };

  return (
    <>
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: scrolled 
        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))'
        : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
      backdropFilter: 'blur(20px)',
      borderBottom: scrolled ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: scrolled ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      padding: scrolled ? '12px 20px' : '16px 20px'
    }}
    className="navbar-main">
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo Lumixar */}
        <div 
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img 
            src="/logo.svg" 
            alt="Lumixar Logo" 
            style={{
              height: '50px',
              width: 'auto',
              filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.4))'
            }}
            onError={(e) => {
              // Fallback si l'image ne charge pas
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div style={{
            display: 'none',
            position: 'relative',
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
            borderRadius: '12px',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
          }}>
            <Play style={{width: '24px', height: '24px', color: 'white'}} fill="white" />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="mobile-menu-btn"
          aria-label="Menu de navigation"
          aria-expanded={mobileMenuOpen}
          style={{
            display: 'none',
            background: mobileMenuOpen ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            border: '1px solid',
            borderColor: mobileMenuOpen ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
            color: 'white',
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            minHeight: '44px',
            minWidth: '44px',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {mobileMenuOpen ? <X style={{width: '24px', height: '24px'}} /> : <Menu style={{width: '24px', height: '24px'}} />}
        </button>

        {/* Navigation */}
        <div className="nav-links" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <NavLink 
            href="/" 
            icon={Play} 
            label="Accueil" 
            active={isActive('/')}
          />
          <NavLink 
            href="/films" 
            icon={Film} 
            label="Films" 
            active={isActive('/films')}
          />
          <NavLink 
            href="/series" 
            icon={Tv} 
            label="Séries" 
            active={isActive('/series')}
          />
          <NavLink 
            href="/iptv" 
            icon={Tv} 
            label="IPTV Live" 
            active={isActive('/iptv')}
          />
          <NavLink 
            href="/subscribe" 
            icon={CreditCard} 
            label="Premium" 
            active={isActive('/subscribe')}
            premium
          />
          <NavLink 
            href="/redeem-code" 
            icon={Key} 
            label="Code" 
            active={isActive('/redeem-code')}
          />
          
          {user ? (
            <>
              {isAdmin && (
                <NavLink 
                  href="/admin" 
                  icon={Shield} 
                  label="Admin" 
                  active={isActive('/admin')}
                  admin
                />
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginLeft: '8px',
                paddingLeft: '16px',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <User style={{width: '16px', height: '16px'}} />
                  {user.name || user.username || 'Profil'}
                  {isPremium && (
                    <span style={{
                      background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#000'
                    }}>⭐ PRO</span>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.target.style.borderColor = '#ef4444';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    e.target.style.color = '#ef4444';
                  }}
                >
                  <LogOut style={{width: '16px', height: '16px'}} />
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <a 
              href="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '700',
                marginLeft: '12px',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.4)';
              }}
            >
              <User style={{width: '16px', height: '16px'}} />
              Connexion
            </a>
          )}
        </div>
      </div>
    </nav>

    {/* Mobile Menu Overlay */}
    {mobileMenuOpen && (
      <div 
        className="mobile-menu-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 98,
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={() => setMobileMenuOpen(false)}
      />
    )}

    {/* Mobile Menu */}
    {mobileMenuOpen && (
    <div 
      className="mobile-menu"
      style={{
        position: 'fixed',
        top: scrolled ? '64px' : '70px',
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
        backdropFilter: 'blur(20px)',
        padding: '16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        maxHeight: 'calc(100vh - 70px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        animation: 'slideDown 0.3s ease'
      }}
    >
      <MobileNavButton href="/" icon={Play} label="Accueil" active={isActive('/')} onClick={() => handleMobileNavClick('/')} />
      <MobileNavButton href="/films" icon={Film} label="Films" active={isActive('/films')} onClick={() => handleMobileNavClick('/films')} />
      <MobileNavButton href="/series" icon={Tv} label="Séries" active={isActive('/series')} onClick={() => handleMobileNavClick('/series')} />
      <MobileNavButton href="/iptv" icon={Tv} label="IPTV Live" active={isActive('/iptv')} onClick={() => handleMobileNavClick('/iptv')} />
      <MobileNavButton href="/subscribe" icon={CreditCard} label="Premium" active={isActive('/subscribe')} premium onClick={() => handleMobileNavClick('/subscribe')} />
      
      {user ? (
        <>
          {isAdmin && (
            <MobileNavButton href="/admin" icon={Shield} label="Admin" active={isActive('/admin')} admin onClick={() => handleMobileNavClick('/admin')} />
          )}
          <div style={{borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', marginTop: '8px'}}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                marginBottom: '8px'
              }}
            >
              <User style={{width: '20px', height: '20px'}} />
              {user.name || user.username || 'Profil'}
              {isPremium && (
                <span style={{
                  background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#000'
                }}>⭐ PRO</span>
              )}
            </div>
            <button 
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '12px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              <LogOut style={{width: '20px', height: '20px'}} />
              Déconnexion
            </button>
          </div>
        </>
      ) : (
        <a 
          href="/login"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            padding: '14px 24px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '700',
            marginTop: '8px',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
          }}
        >
          <User style={{width: '20px', height: '20px'}} />
          Connexion
        </a>
      )}
    </div>
    )}
    </>
  );
}

// NavLink pour le desktop
function NavLink({ href, icon: Icon, label, active, premium, admin }) {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(href)}
      className="nav-link-item"
      style={{
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderRadius: '10px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        background: active 
          ? premium 
            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(109, 40, 217, 0.2))'
            : admin
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))'
            : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(29, 78, 216, 0.2))'
          : 'transparent',
        border: active 
          ? premium
            ? '1px solid rgba(124, 58, 237, 0.4)'
            : admin
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(37, 99, 235, 0.4)'
          : '1px solid transparent',
        color: active ? 'white' : '#cbd5e1'
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#cbd5e1';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <Icon style={{width: '18px', height: '18px'}} />
      <span className="nav-link-label">{label}</span>
      {active && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '2px',
          background: premium 
            ? 'linear-gradient(90deg, transparent, #7c3aed, transparent)'
            : admin
            ? 'linear-gradient(90deg, transparent, #ef4444, transparent)'
            : 'linear-gradient(90deg, transparent, #2563eb, transparent)',
          borderRadius: '2px'
        }} />
      )}
    </button>
  );
}

// Nouveau composant MobileNavButton qui utilise un button au lieu d'un lien
function MobileNavButton({ icon: Icon, label, active, premium, admin, onClick }) {
  const handleClick = (e) => {
    console.log('[NAV-BUTTON] Button clicked:', label);
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      console.log('[NAV-BUTTON] Calling onClick handler');
      onClick();
    }
  };
  
  return (
    <button
      onClick={handleClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        minHeight: '52px',
        textAlign: 'left',
        background: active 
          ? premium 
            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(109, 40, 217, 0.2))'
            : admin
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))'
            : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(29, 78, 216, 0.2))'
          : 'rgba(255, 255, 255, 0.02)',
        border: active 
          ? premium
            ? '1px solid rgba(124, 58, 237, 0.4)'
            : admin
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(37, 99, 235, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.05)',
        color: active ? 'white' : '#cbd5e1'
      }}
    >
      <Icon style={{width: '22px', height: '22px', flexShrink: 0}} />
      {label}
    </button>
  );
}
