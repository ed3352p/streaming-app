import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USER_BADGES_FILE = join(__dirname, '..', 'data', 'user_badges.json');
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

function writeData(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// Badge definitions
export const BADGES = {
  FIRST_WATCH: {
    id: 'first_watch',
    name: 'Premier pas',
    description: 'Regarder votre premier film',
    icon: '🎬',
    condition: (stats) => stats.moviesWatched >= 1
  },
  MOVIE_BUFF: {
    id: 'movie_buff',
    name: 'Cinéphile',
    description: 'Regarder 10 films',
    icon: '🍿',
    condition: (stats) => stats.moviesWatched >= 10
  },
  MARATHON: {
    id: 'marathon',
    name: 'Marathon',
    description: 'Regarder 50 films',
    icon: '🏃',
    condition: (stats) => stats.moviesWatched >= 50
  },
  LEGEND: {
    id: 'legend',
    name: 'Légende',
    description: 'Regarder 100 films',
    icon: '👑',
    condition: (stats) => stats.moviesWatched >= 100
  },
  CRITIC: {
    id: 'critic',
    name: 'Critique',
    description: 'Noter 20 films',
    icon: '⭐',
    condition: (stats) => stats.ratingsGiven >= 20
  },
  NIGHT_OWL: {
    id: 'night_owl',
    name: 'Oiseau de nuit',
    description: 'Regarder un film après minuit',
    icon: '🦉',
    condition: (stats) => stats.lateNightWatches >= 1
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Lève-tôt',
    description: 'Regarder un film avant 6h',
    icon: '🌅',
    condition: (stats) => stats.earlyMorningWatches >= 1
  },
  BINGE_WATCHER: {
    id: 'binge_watcher',
    name: 'Binge Watcher',
    description: 'Regarder 5 films en une journée',
    icon: '📺',
    condition: (stats) => stats.maxMoviesPerDay >= 5
  },
  GENRE_MASTER: {
    id: 'genre_master',
    name: 'Maître du genre',
    description: 'Regarder 20 films du même genre',
    icon: '🎭',
    condition: (stats) => Object.values(stats.genreCounts || {}).some(count => count >= 20)
  },
  STREAK_7: {
    id: 'streak_7',
    name: 'Semaine parfaite',
    description: '7 jours consécutifs',
    icon: '🔥',
    condition: (stats) => stats.streakDays >= 7
  },
  STREAK_30: {
    id: 'streak_30',
    name: 'Mois parfait',
    description: '30 jours consécutifs',
    icon: '💯',
    condition: (stats) => stats.streakDays >= 30
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Papillon social',
    description: 'Parrainer 5 amis',
    icon: '🦋',
    condition: (stats) => stats.referrals >= 5
  },
  PREMIUM_MEMBER: {
    id: 'premium_member',
    name: 'Membre Premium',
    description: 'Devenir membre Premium',
    icon: '💎',
    condition: (stats) => stats.isPremium
  }
};

// Calculate user stats for badge checking
export function calculateUserStats(userId) {
  const history = readData(HISTORY_FILE).filter(h => h.userId === userId);
  const ratings = readData(RATINGS_FILE).filter(r => r.userId === userId);
  
  // Count movies watched
  const moviesWatched = new Set(history.map(h => h.contentId)).size;
  
  // Count ratings given
  const ratingsGiven = ratings.length;
  
  // Check for late night watches (after midnight)
  const lateNightWatches = history.filter(h => {
    const hour = new Date(h.watchedAt).getHours();
    return hour >= 0 && hour < 6;
  }).length;
  
  // Check for early morning watches (before 6am)
  const earlyMorningWatches = lateNightWatches;
  
  // Calculate max movies per day
  const watchesByDay = {};
  history.forEach(h => {
    const day = new Date(h.watchedAt).toDateString();
    watchesByDay[day] = (watchesByDay[day] || 0) + 1;
  });
  const maxMoviesPerDay = Math.max(...Object.values(watchesByDay), 0);
  
  // Count by genre
  const genreCounts = {};
  history.forEach(h => {
    if (h.genre) {
      genreCounts[h.genre] = (genreCounts[h.genre] || 0) + 1;
    }
  });
  
  // Calculate streak
  const sortedDates = [...new Set(history.map(h => new Date(h.watchedAt).toDateString()))]
    .sort((a, b) => new Date(b) - new Date(a));
  
  let streakDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const dateStr of sortedDates) {
    const watchDate = new Date(dateStr);
    const diffDays = Math.floor((currentDate - watchDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streakDays) {
      streakDays++;
    } else {
      break;
    }
  }
  
  return {
    moviesWatched,
    ratingsGiven,
    lateNightWatches,
    earlyMorningWatches,
    maxMoviesPerDay,
    genreCounts,
    streakDays
  };
}

// Check and award badges
export function checkAndAwardBadges(userId, additionalStats = {}) {
  const stats = { ...calculateUserStats(userId), ...additionalStats };
  const userBadges = readData(USER_BADGES_FILE);
  const currentBadges = userBadges.filter(b => b.userId === userId);
  const currentBadgeIds = new Set(currentBadges.map(b => b.badgeId));
  
  const newBadges = [];
  
  Object.values(BADGES).forEach(badge => {
    if (!currentBadgeIds.has(badge.id) && badge.condition(stats)) {
      const newBadge = {
        id: Date.now() + Math.random(),
        userId,
        badgeId: badge.id,
        unlockedAt: new Date().toISOString()
      };
      userBadges.push(newBadge);
      newBadges.push({ ...badge, ...newBadge });
    }
  });
  
  if (newBadges.length > 0) {
    writeData(USER_BADGES_FILE, userBadges);
  }
  
  return newBadges;
}

// Get user's badges
export function getUserBadges(userId) {
  const userBadges = readData(USER_BADGES_FILE).filter(b => b.userId === userId);
  
  return Object.values(BADGES).map(badge => {
    const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
    return {
      ...badge,
      unlocked: !!userBadge,
      unlockedAt: userBadge?.unlockedAt
    };
  });
}

// Get badge progress
export function getBadgeProgress(userId) {
  const stats = calculateUserStats(userId);
  
  return Object.values(BADGES).map(badge => {
    const unlocked = badge.condition(stats);
    
    // Calculate progress percentage (simplified)
    let progress = 0;
    if (badge.id.includes('watch')) {
      const target = parseInt(badge.description.match(/\d+/)?.[0] || 1);
      progress = Math.min(100, (stats.moviesWatched / target) * 100);
    } else if (badge.id === 'critic') {
      progress = Math.min(100, (stats.ratingsGiven / 20) * 100);
    } else if (badge.id.includes('streak')) {
      const target = parseInt(badge.id.split('_')[1]);
      progress = Math.min(100, (stats.streakDays / target) * 100);
    }
    
    return {
      ...badge,
      unlocked,
      progress: Math.round(progress)
    };
  });
}
