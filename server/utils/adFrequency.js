import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AD_IMPRESSIONS_FILE = join(__dirname, '..', 'data', 'ad_impressions.json');

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

// Ad frequency cap configuration
const FREQUENCY_CAPS = {
  perHour: 10,      // Max 10 ads per hour
  perDay: 50,       // Max 50 ads per day
  perSession: 5,    // Max 5 ads per session
  minInterval: 300  // Min 5 minutes between ads (in seconds)
};

// Track ad impression
export function trackAdImpression(userId, adId, sessionId) {
  const impressions = readData(AD_IMPRESSIONS_FILE);
  
  const impression = {
    id: Date.now(),
    userId,
    adId,
    sessionId,
    timestamp: new Date().toISOString()
  };
  
  impressions.push(impression);
  
  // Clean old impressions (older than 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = impressions.filter(imp => 
    new Date(imp.timestamp).getTime() > oneDayAgo
  );
  
  writeData(AD_IMPRESSIONS_FILE, filtered);
  
  return impression;
}

// Check if user can see ad (frequency cap)
export function canShowAd(userId, sessionId) {
  const impressions = readData(AD_IMPRESSIONS_FILE);
  const userImpressions = impressions.filter(imp => imp.userId === userId);
  
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  // Check hourly cap
  const hourlyCount = userImpressions.filter(imp => 
    new Date(imp.timestamp).getTime() > oneHourAgo
  ).length;
  
  if (hourlyCount >= FREQUENCY_CAPS.perHour) {
    return { allowed: false, reason: 'hourly_cap', nextAvailable: oneHourAgo + 60 * 60 * 1000 };
  }
  
  // Check daily cap
  const dailyCount = userImpressions.filter(imp => 
    new Date(imp.timestamp).getTime() > oneDayAgo
  ).length;
  
  if (dailyCount >= FREQUENCY_CAPS.perDay) {
    return { allowed: false, reason: 'daily_cap', nextAvailable: oneDayAgo + 24 * 60 * 60 * 1000 };
  }
  
  // Check session cap
  const sessionCount = userImpressions.filter(imp => 
    imp.sessionId === sessionId
  ).length;
  
  if (sessionCount >= FREQUENCY_CAPS.perSession) {
    return { allowed: false, reason: 'session_cap' };
  }
  
  // Check minimum interval
  const lastImpression = userImpressions
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  
  if (lastImpression) {
    const timeSinceLastAd = (now - new Date(lastImpression.timestamp).getTime()) / 1000;
    if (timeSinceLastAd < FREQUENCY_CAPS.minInterval) {
      return { 
        allowed: false, 
        reason: 'interval_cap', 
        nextAvailable: new Date(lastImpression.timestamp).getTime() + FREQUENCY_CAPS.minInterval * 1000 
      };
    }
  }
  
  return { allowed: true };
}

// Get ad stats for user
export function getUserAdStats(userId) {
  const impressions = readData(AD_IMPRESSIONS_FILE);
  const userImpressions = impressions.filter(imp => imp.userId === userId);
  
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  return {
    totalImpressions: userImpressions.length,
    lastHour: userImpressions.filter(imp => new Date(imp.timestamp).getTime() > oneHourAgo).length,
    last24Hours: userImpressions.filter(imp => new Date(imp.timestamp).getTime() > oneDayAgo).length,
    caps: FREQUENCY_CAPS
  };
}

// Get country-specific ads
export function getAdsByCountry(country) {
  // This would integrate with your ad system
  // Return ads targeted for specific countries
  return {
    country,
    targetedAds: true
  };
}

// Reward system: watch ad for premium content
export function grantAdReward(userId, rewardType) {
  const rewards = readData(join(__dirname, '..', 'data', 'ad_rewards.json'));
  
  const reward = {
    id: Date.now(),
    userId,
    type: rewardType, // 'hd_access', 'premium_day', etc.
    grantedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
  };
  
  rewards.push(reward);
  writeData(join(__dirname, '..', 'data', 'ad_rewards.json'), rewards);
  
  return reward;
}

// Check if user has active ad reward
export function hasActiveAdReward(userId, rewardType) {
  const rewards = readData(join(__dirname, '..', 'data', 'ad_rewards.json'));
  const now = new Date();
  
  return rewards.some(r => 
    r.userId === userId && 
    r.type === rewardType && 
    new Date(r.expiresAt) > now
  );
}
