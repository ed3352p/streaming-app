import { useState, useEffect } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import MovieCard from './MovieCard';
import api from '../services/api';

export default function RecommendationsEngine({ currentMovieId, genre, userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [currentMovieId, genre]);

  const loadRecommendations = async () => {
    try {
      const data = await api.getRecommendations({
        movieId: currentMovieId,
        genre,
        userId,
        limit: 6,
      });
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto',
        }} />
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div style={{ marginTop: '60px' }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <Sparkles size={28} color="#8b5cf6" />
        Recommandations pour vous
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '20px',
      }}>
        {recommendations.map(movie => (
          <MovieCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            rating={movie.rating}
            imageUrl={movie.imageUrl}
            genre={movie.genre}
            year={movie.year}
            description={movie.description}
          />
        ))}
      </div>
    </div>
  );
}
