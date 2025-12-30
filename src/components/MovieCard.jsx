import { useState, memo } from 'react';

const MovieCard = memo(function MovieCard({ title, rating = 4.5, id = 1, imageUrl, genre, year, description }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleWatch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/player/${id}`;
  };

  const handleDetails = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/movie/${id}`;
  };

  return (
    <div 
      className="movie-card-poster"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleDetails}
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '2/3',
        background: '#0f172a',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      {imageUrl && !imageError ? (
        <img 
          src={imageUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: isHovered ? 'brightness(0.4)' : 'brightness(1)',
            transition: 'filter 0.3s ease'
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
          filter: isHovered ? 'brightness(0.4)' : 'brightness(1)',
          transition: 'filter 0.3s ease'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '15px',
            opacity: 0.3
          }}>
            🎬
          </div>
          <div style={{
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '1.4',
            wordBreak: 'break-word',
            maxWidth: '90%'
          }}>
            {title}
          </div>
        </div>
      )}
      
      {/* Overlay avec infos au hover */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.95))',
        padding: '60px 15px 15px',
        transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease',
        opacity: isHovered ? 1 : 0
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '700',
          marginBottom: '6px',
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>{title}</h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          fontSize: '12px',
          color: '#cbd5e1'
        }}>
          <span style={{color: '#facc15'}}>⭐ {rating}/5</span>
          {year && <span>• {year}</span>}
          {genre && <span>• {genre}</span>}
        </div>
        
        <button 
          className="btn" 
          onClick={handleWatch} 
          type="button"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          ▶ Regarder
        </button>
      </div>

      {/* Badge rating toujours visible */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#facc15',
        backdropFilter: 'blur(4px)'
      }}>
        ⭐ {rating}
      </div>
    </div>
  );
});

export default MovieCard;
