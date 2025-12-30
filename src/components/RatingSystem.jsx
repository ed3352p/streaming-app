import { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingSystem({ contentId, contentType, initialRating, onRate }) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hover, setHover] = useState(0);

  const handleRate = async (value) => {
    setRating(value);
    if (onRate) {
      await onRate(value);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            transition: 'transform 0.2s',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Star
            size={24}
            fill={(hover || rating) >= star ? '#fbbf24' : 'none'}
            color={(hover || rating) >= star ? '#fbbf24' : '#64748b'}
            style={{ transition: 'all 0.2s' }}
          />
        </button>
      ))}
      {rating > 0 && (
        <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '14px' }}>
          {rating}/5
        </span>
      )}
    </div>
  );
}
