import { useState, useEffect } from 'react';
import { Film, Tv, TrendingUp, Users, Play, Star } from 'lucide-react';
import MovieCard from "../components/MovieCard";
import api from '../services/api';
import { ExternalAdBanner } from '../components/ExternalAdBanner';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Charger les films depuis l'API
    api.getMovies()
      .then(data => setMovies(data))
      .catch(err => {
        console.error('Erreur chargement films:', err);
        // Fallback localStorage si API non disponible
        const savedMovies = JSON.parse(localStorage.getItem('movies') || '[]');
        setMovies(savedMovies);
      });
  }, []);

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || movie.genre === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { icon: Film, label: 'Films', value: movies.length, color: '#3b82f6' },
    { icon: Tv, label: 'Chaînes IPTV', value: '500+', color: '#8b5cf6' },
    { icon: Users, label: 'Utilisateurs', value: '10K+', color: '#10b981' },
    { icon: TrendingUp, label: 'Vues', value: '1M+', color: '#f59e0b' }
  ];

  return (
    <div>
      {/* Bannière publicitaire en haut */}
      <ExternalAdBanner position="top" />

      {/* Hero Section - Nouveau design */}
      <div className="hero-section" style={{
        position: 'relative',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: !movies.find(m => m.heroImageUrl) 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
          : undefined
      }}>
        {/* Image hero en background */}
        {(() => {
          const heroMovie = movies.find(m => m.heroImageUrl);
          return heroMovie && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${heroMovie.heroImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0
            }}>
              {/* Overlay gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)',
                zIndex: 1
              }}></div>
            </div>
          );
        })()}
        
        {/* Fond animé (seulement si pas d'image hero) */}
        {!movies.find(m => m.heroImageUrl) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            zIndex: 0
          }}></div>
        )}

        <div className="container" style={{position: 'relative', zIndex: 1}}>
          <div className="hero-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            alignItems: 'center'
          }}>
            {/* Colonne gauche - Texte */}
            <div>
              <div style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '50px',
                marginBottom: '24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#a78bfa'
              }}>
                ✨ Plateforme de streaming N°1
              </div>
              <h1 className="hero-title" style={{
                fontSize: 'clamp(36px, 8vw, 64px)',
                fontWeight: '900',
                lineHeight: '1.1',
                marginBottom: '24px',
                background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-2px'
              }}>
                Streaming<br/>Illimité
              </h1>
              <p className="hero-desc" style={{
                fontSize: 'clamp(14px, 3vw, 20px)',
                color: '#94a3b8',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                Accédez à des milliers de films, séries et chaînes IPTV en direct. Qualité HD/4K, sans publicité avec Premium.
              </p>
              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                <a href="/films" className="btn" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '16px',
                  padding: '16px 36px'
                }}>
                  <Play style={{width: '22px', height: '22px'}} />
                  Commencer à regarder
                </a>
                <a href="/subscribe" className="btn" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '16px',
                  padding: '16px 36px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <Star style={{width: '22px', height: '22px'}} />
                  Découvrir Premium
                </a>
              </div>
            </div>

            {/* Colonne droite - Cartes flottantes */}
            <div className="hero-cards" style={{position: 'relative', height: '400px'}}>
              {[
                {icon: Film, label: 'Films HD', count: movies.length || '1000+', color: '#3b82f6', top: '0%', left: '0%'},
                {icon: Tv, label: 'IPTV Live', count: '500+', color: '#8b5cf6', top: '20%', left: '40%'},
                {icon: Users, label: 'Utilisateurs', count: '10K+', color: '#10b981', top: '50%', left: '10%'}
              ].map((item, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: item.top,
                  left: item.left,
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(20px)',
                  padding: '24px',
                  borderRadius: '20px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                  minWidth: '180px',
                  animation: `float ${3 + i}s ease-in-out infinite`
                }}>
                  <item.icon style={{width: '32px', height: '32px', color: item.color, marginBottom: '12px'}} />
                  <div style={{fontSize: '28px', fontWeight: '900', color: item.color, marginBottom: '4px'}}>{item.count}</div>
                  <div style={{fontSize: '14px', color: '#94a3b8', fontWeight: '600'}}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @media (max-width: 768px) {
          .hero-section {
            min-height: auto !important;
            padding: 40px 0 !important;
          }
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          .hero-cards {
            display: none !important;
          }
          .hero-title {
            text-align: center;
          }
          .hero-desc {
            text-align: center;
          }
        }
        
        @media (max-width: 480px) {
          .hero-section {
            padding: 30px 0 !important;
          }
        }
      `}</style>

      {/* Section Catégories */}
      <div className="container" style={{marginTop: '80px'}}>
        <div style={{textAlign: 'center', marginBottom: '60px'}}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: '900',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Explorez notre contenu
          </h2>
          <p style={{fontSize: '18px', color: '#64748b'}}>
            Films, séries, IPTV et bien plus encore
          </p>
        </div>

        {/* Grille de catégories */}
        <div className="categories-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '80px'
        }}>
          {[
            {title: 'Films', desc: `${movies.length} films disponibles`, icon: Film, color: '#3b82f6', link: '/films'},
            {title: 'Séries TV', desc: 'Bientôt disponible', icon: Tv, color: '#8b5cf6', link: '/series'},
            {title: 'IPTV Live', desc: '500+ chaînes en direct', icon: Play, color: '#10b981', link: '/iptv'}
          ].map((item, i) => (
            <a key={i} href={item.link} style={{
              textDecoration: 'none',
              background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}05 100%)`,
              border: `1px solid ${item.color}30`,
              borderRadius: '24px',
              padding: '40px 32px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = item.color + '60';
              e.currentTarget.style.boxShadow = `0 20px 40px -10px ${item.color}40`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = item.color + '30';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <item.icon style={{width: '56px', height: '56px', color: item.color, marginBottom: '20px'}} />
              <h3 style={{fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#fff'}}>{item.title}</h3>
              <p style={{color: '#94a3b8', fontSize: '15px', marginBottom: '24px'}}>{item.desc}</p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: item.color,
                fontSize: '15px',
                fontWeight: '600'
              }}>
                Explorer
                <span style={{fontSize: '20px'}}>→</span>
              </div>
            </a>
          ))}
        </div>

        {/* Section Films récents */}
        {movies.length > 0 && (
          <div style={{marginBottom: '80px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px'}}>
              <div>
                <h2 style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Films récents
                </h2>
                <p style={{color: '#64748b', fontSize: '16px'}}>
                  Découvrez les derniers ajouts
                </p>
              </div>
              <a href="/films" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#3b82f6',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.gap = '12px'}
              onMouseOut={(e) => e.currentTarget.style.gap = '8px'}>
                Voir tout
                <span style={{fontSize: '20px'}}>→</span>
              </a>
            </div>

            <div className="grid">
              {movies.slice(0, 6).map(movie => (
                <MovieCard 
                  key={movie.id} 
                  id={movie.id}
                  title={movie.title} 
                  rating={movie.rating || 0}
                  imageUrl={movie.imageUrl}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section Premium */}
        <div className="premium-section" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: '24px',
          padding: 'clamp(30px, 5vw, 60px) clamp(20px, 4vw, 48px)',
          marginBottom: '60px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }}></div>
          
          <div style={{position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '700px', margin: '0 auto'}}>
            <div style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '50px',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#a78bfa',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              ⭐ Premium
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: '900',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px'
            }}>
              Passez à Premium
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#94a3b8',
              marginBottom: '40px',
              lineHeight: '1.6'
            }}>
              Profitez de la qualité HD/4K, sans publicité, et accédez à du contenu exclusif. Streaming illimité sur tous vos appareils.
            </p>
            <div style={{display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap'}}>
              <a href="/subscribe" className="btn btn-premium" style={{
                fontSize: '16px',
                padding: '18px 40px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Star style={{width: '22px', height: '22px'}} />
                Découvrir les offres
              </a>
            </div>
            
            <div className="premium-features" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '24px',
              marginTop: '40px'
            }}>
              {[
                {icon: '🎬', title: 'HD/4K', desc: 'Qualité maximale'},
                {icon: '🚫', title: 'Sans pub', desc: 'Zéro interruption'},
                {icon: '📱', title: 'Multi-écrans', desc: 'Tous vos appareils'}
              ].map((item, i) => (
                <div key={i} style={{textAlign: 'center'}}>
                  <div style={{fontSize: '40px', marginBottom: '12px'}}>{item.icon}</div>
                  <h4 style={{fontSize: '18px', fontWeight: '700', marginBottom: '4px', color: '#fff'}}>{item.title}</h4>
                  <p style={{fontSize: '14px', color: '#94a3b8'}}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
