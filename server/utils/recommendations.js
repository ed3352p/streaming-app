import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MOVIES_FILE = join(__dirname, '..', 'data', 'movies.json');
const HISTORY_FILE = join(__dirname, '..', 'data', 'history.json');
const RATINGS_FILE = join(__dirname, '..', 'data', 'ratings.json');

function readData(file) {
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

// Calculate similarity score between two movies
function calculateSimilarity(movie1, movie2) {
  let score = 0;
  
  // Genre match (highest weight)
  if (movie1.genre === movie2.genre) score += 5;
  
  // Year proximity
  const yearDiff = Math.abs((movie1.year || 2020) - (movie2.year || 2020));
  if (yearDiff <= 2) score += 3;
  else if (yearDiff <= 5) score += 2;
  else if (yearDiff <= 10) score += 1;
  
  // Rating proximity
  const ratingDiff = Math.abs((movie1.rating || 0) - (movie2.rating || 0));
  if (ratingDiff <= 0.5) score += 2;
  else if (ratingDiff <= 1) score += 1;
  
  return score;
}

// Get recommendations based on a specific movie
export function getMovieRecommendations(movieId, limit = 6) {
  const movies = readData(MOVIES_FILE);
  const currentMovie = movies.find(m => m.id === parseInt(movieId));
  
  if (!currentMovie) return [];
  
  // Calculate similarity scores for all other movies
  const recommendations = movies
    .filter(m => m.id !== currentMovie.id)
    .map(movie => ({
      ...movie,
      similarityScore: calculateSimilarity(currentMovie, movie)
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
  
  return recommendations;
}

// Get personalized recommendations based on user history
export function getUserRecommendations(userId, limit = 10) {
  const movies = readData(MOVIES_FILE);
  const history = readData(HISTORY_FILE).filter(h => h.userId === userId);
  const ratings = readData(RATINGS_FILE).filter(r => r.userId === userId);
  
  if (history.length === 0 && ratings.length === 0) {
    // New user - return trending/popular movies
    return movies
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit);
  }
  
  // Get user's favorite genres
  const genrePreferences = {};
  history.forEach(h => {
    const movie = movies.find(m => m.id === h.contentId);
    if (movie?.genre) {
      genrePreferences[movie.genre] = (genrePreferences[movie.genre] || 0) + 1;
    }
  });
  
  // Get highly rated movies by user
  const highlyRated = ratings
    .filter(r => r.rating >= 4)
    .map(r => movies.find(m => m.id === r.contentId))
    .filter(Boolean);
  
  // Calculate recommendation scores
  const watchedIds = new Set(history.map(h => h.contentId));
  const recommendations = movies
    .filter(m => !watchedIds.has(m.id))
    .map(movie => {
      let score = 0;
      
      // Genre preference
      score += (genrePreferences[movie.genre] || 0) * 3;
      
      // Similarity to highly rated movies
      highlyRated.forEach(ratedMovie => {
        score += calculateSimilarity(movie, ratedMovie);
      });
      
      // Popularity boost
      score += (movie.views || 0) * 0.001;
      
      // Rating boost
      score += (movie.rating || 0) * 0.5;
      
      return { ...movie, recommendationScore: score };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);
  
  return recommendations;
}

// Get trending content by country
export function getTrendingByCountry(country, limit = 10) {
  const movies = readData(MOVIES_FILE);
  const history = readData(HISTORY_FILE);
  
  // Filter views by country in the last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const countryViews = history.filter(h => 
    h.country === country && 
    new Date(h.watchedAt).getTime() > weekAgo
  );
  
  // Count views per movie
  const viewCounts = {};
  countryViews.forEach(h => {
    viewCounts[h.contentId] = (viewCounts[h.contentId] || 0) + 1;
  });
  
  // Sort movies by view count
  return movies
    .map(movie => ({
      ...movie,
      trendingScore: viewCounts[movie.id] || 0
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
}

// Get "because you watched" recommendations
export function getBecauseYouWatched(userId, limit = 6) {
  const history = readData(HISTORY_FILE).filter(h => h.userId === userId);
  
  if (history.length === 0) return [];
  
  // Get the most recently watched movie
  const lastWatched = history.sort((a, b) => 
    new Date(b.watchedAt) - new Date(a.watchedAt)
  )[0];
  
  return getMovieRecommendations(lastWatched.contentId, limit);
}

// Get similar movies based on tags/keywords
export function getSimilarByTags(movieId, limit = 6) {
  const movies = readData(MOVIES_FILE);
  const currentMovie = movies.find(m => m.id === parseInt(movieId));
  
  if (!currentMovie || !currentMovie.tags) {
    return getMovieRecommendations(movieId, limit);
  }
  
  const currentTags = new Set(currentMovie.tags || []);
  
  return movies
    .filter(m => m.id !== currentMovie.id && m.tags)
    .map(movie => {
      const movieTags = new Set(movie.tags || []);
      const commonTags = [...currentTags].filter(tag => movieTags.has(tag));
      
      return {
        ...movie,
        tagMatchScore: commonTags.length
      };
    })
    .filter(m => m.tagMatchScore > 0)
    .sort((a, b) => b.tagMatchScore - a.tagMatchScore)
    .slice(0, limit);
}
