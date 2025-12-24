import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ANALYTICS_FILE = join(__dirname, '..', 'data', 'analytics.json');

function readAnalytics() {
  if (!existsSync(ANALYTICS_FILE)) {
    return { views: [], adImpressions: [], adClicks: [], sessions: [], bandwidth: [] };
  }
  try {
    return JSON.parse(readFileSync(ANALYTICS_FILE, 'utf-8'));
  } catch {
    return { views: [], adImpressions: [], adClicks: [], sessions: [], bandwidth: [] };
  }
}

function writeAnalytics(data) {
  writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

export function trackView(data) {
  const analytics = readAnalytics();
  analytics.views.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  if (analytics.views.length > 10000) {
    analytics.views = analytics.views.slice(-10000);
  }
  
  writeAnalytics(analytics);
}

export function trackAdImpression(data) {
  const analytics = readAnalytics();
  analytics.adImpressions.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  if (analytics.adImpressions.length > 50000) {
    analytics.adImpressions = analytics.adImpressions.slice(-50000);
  }
  
  writeAnalytics(analytics);
}

export function trackAdClick(data) {
  const analytics = readAnalytics();
  analytics.adClicks.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  if (analytics.adClicks.length > 50000) {
    analytics.adClicks = analytics.adClicks.slice(-50000);
  }
  
  writeAnalytics(analytics);
}

export function trackSession(data) {
  const analytics = readAnalytics();
  const existingIndex = analytics.sessions.findIndex(s => s.sessionId === data.sessionId);
  
  if (existingIndex >= 0) {
    analytics.sessions[existingIndex] = {
      ...analytics.sessions[existingIndex],
      ...data,
      lastActivity: new Date().toISOString()
    };
  } else {
    analytics.sessions.push({
      ...data,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });
  }
  
  const oneHourAgo = Date.now() - 3600000;
  analytics.sessions = analytics.sessions.filter(s => 
    new Date(s.lastActivity).getTime() > oneHourAgo
  );
  
  writeAnalytics(analytics);
}

export function trackBandwidth(data) {
  const analytics = readAnalytics();
  analytics.bandwidth.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  if (analytics.bandwidth.length > 10000) {
    analytics.bandwidth = analytics.bandwidth.slice(-10000);
  }
  
  writeAnalytics(analytics);
}

export function getAnalytics(timeRange = '24h') {
  const analytics = readAnalytics();
  const now = Date.now();
  let cutoff;
  
  switch(timeRange) {
    case '1h': cutoff = now - 3600000; break;
    case '24h': cutoff = now - 86400000; break;
    case '7d': cutoff = now - 604800000; break;
    case '30d': cutoff = now - 2592000000; break;
    default: cutoff = now - 86400000;
  }
  
  return {
    views: analytics.views.filter(v => new Date(v.timestamp).getTime() > cutoff),
    adImpressions: analytics.adImpressions.filter(a => new Date(a.timestamp).getTime() > cutoff),
    adClicks: analytics.adClicks.filter(a => new Date(a.timestamp).getTime() > cutoff),
    sessions: analytics.sessions,
    bandwidth: analytics.bandwidth.filter(b => new Date(b.timestamp).getTime() > cutoff)
  };
}

export function getPopularContent(limit = 10) {
  const analytics = readAnalytics();
  const last30Days = Date.now() - 2592000000;
  
  const recentViews = analytics.views.filter(v => 
    new Date(v.timestamp).getTime() > last30Days
  );
  
  const contentStats = {};
  recentViews.forEach(view => {
    const key = `${view.contentType}_${view.contentId}`;
    if (!contentStats[key]) {
      contentStats[key] = {
        contentId: view.contentId,
        contentType: view.contentType,
        title: view.title,
        views: 0,
        totalWatchTime: 0,
        completionRate: []
      };
    }
    contentStats[key].views++;
    contentStats[key].totalWatchTime += view.watchTime || 0;
    if (view.progress) {
      contentStats[key].completionRate.push(view.progress);
    }
  });
  
  return Object.values(contentStats)
    .map(stat => ({
      ...stat,
      avgCompletionRate: stat.completionRate.length > 0 
        ? stat.completionRate.reduce((a, b) => a + b, 0) / stat.completionRate.length 
        : 0
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export function getStatsByGenre() {
  const analytics = readAnalytics();
  const last30Days = Date.now() - 2592000000;
  
  const recentViews = analytics.views.filter(v => 
    new Date(v.timestamp).getTime() > last30Days && v.genre
  );
  
  const genreStats = {};
  recentViews.forEach(view => {
    if (!genreStats[view.genre]) {
      genreStats[view.genre] = { views: 0, watchTime: 0 };
    }
    genreStats[view.genre].views++;
    genreStats[view.genre].watchTime += view.watchTime || 0;
  });
  
  return genreStats;
}

export function getPeakHours() {
  const analytics = readAnalytics();
  const last7Days = Date.now() - 604800000;
  
  const recentViews = analytics.views.filter(v => 
    new Date(v.timestamp).getTime() > last7Days
  );
  
  const hourStats = Array(24).fill(0);
  recentViews.forEach(view => {
    const hour = new Date(view.timestamp).getHours();
    hourStats[hour]++;
  });
  
  return hourStats.map((count, hour) => ({ hour, count }));
}

export function getTrends(days = 7) {
  const analytics = readAnalytics();
  const cutoff = Date.now() - (days * 86400000);
  
  const recentViews = analytics.views.filter(v => 
    new Date(v.timestamp).getTime() > cutoff
  );
  
  const dailyStats = {};
  recentViews.forEach(view => {
    const date = new Date(view.timestamp).toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { views: 0, uniqueUsers: new Set() };
    }
    dailyStats[date].views++;
    if (view.userId) {
      dailyStats[date].uniqueUsers.add(view.userId);
    }
  });
  
  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    views: stats.views,
    uniqueUsers: stats.uniqueUsers.size
  })).sort((a, b) => a.date.localeCompare(b.date));
}
