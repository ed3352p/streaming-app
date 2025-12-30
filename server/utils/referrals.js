import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REFERRALS_FILE = join(__dirname, '..', 'data', 'referrals.json');
const USERS_FILE = join(__dirname, '..', 'data', 'users.json');

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

// Generate unique referral code
export function generateReferralCode(userId) {
  const hash = crypto.createHash('sha256').update(`${userId}-${Date.now()}`).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

// Create or get user's referral code
export function getUserReferralCode(userId) {
  const users = readData(USERS_FILE);
  const user = users.find(u => u.id === userId);
  
  if (!user) return null;
  
  if (!user.referralCode) {
    user.referralCode = generateReferralCode(userId);
    writeData(USERS_FILE, users);
  }
  
  return user.referralCode;
}

// Process referral when new user signs up
export function processReferral(referralCode, newUserId) {
  const users = readData(USERS_FILE);
  const referrer = users.find(u => u.referralCode === referralCode);
  
  if (!referrer) return null;
  
  const referrals = readData(REFERRALS_FILE);
  
  // Create referral record
  const referral = {
    id: Date.now(),
    referrerId: referrer.id,
    referredUserId: newUserId,
    code: referralCode,
    reward: 7, // 7 days premium
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  
  referrals.push(referral);
  writeData(REFERRALS_FILE, referrals);
  
  // Add premium days to referrer
  const referrerIndex = users.findIndex(u => u.id === referrer.id);
  if (referrerIndex !== -1) {
    const currentExpiry = users[referrerIndex].premiumExpiry 
      ? new Date(users[referrerIndex].premiumExpiry)
      : new Date();
    
    // Add 7 days
    currentExpiry.setDate(currentExpiry.getDate() + 7);
    users[referrerIndex].premiumExpiry = currentExpiry.toISOString();
    users[referrerIndex].premium = true;
    
    writeData(USERS_FILE, users);
  }
  
  return referral;
}

// Get user's referrals
export function getUserReferrals(userId) {
  const referrals = readData(REFERRALS_FILE);
  const users = readData(USERS_FILE);
  
  return referrals
    .filter(r => r.referrerId === userId)
    .map(r => {
      const referredUser = users.find(u => u.id === r.referredUserId);
      return {
        ...r,
        username: referredUser?.username,
        joinedAt: referredUser?.createdAt
      };
    });
}

// Get referral stats
export function getReferralStats(userId) {
  const referrals = getUserReferrals(userId);
  
  return {
    totalReferrals: referrals.length,
    totalRewards: referrals.reduce((sum, r) => sum + (r.reward || 0), 0),
    activeReferrals: referrals.filter(r => r.status === 'completed').length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length
  };
}

// Validate referral code
export function validateReferralCode(code) {
  const users = readData(USERS_FILE);
  return users.some(u => u.referralCode === code);
}

// Get leaderboard
export function getReferralLeaderboard(limit = 10) {
  const referrals = readData(REFERRALS_FILE);
  const users = readData(USERS_FILE);
  
  // Count referrals per user
  const counts = {};
  referrals.forEach(r => {
    counts[r.referrerId] = (counts[r.referrerId] || 0) + 1;
  });
  
  // Create leaderboard
  return Object.entries(counts)
    .map(([userId, count]) => {
      const user = users.find(u => u.id === parseInt(userId));
      return {
        userId: parseInt(userId),
        username: user?.username,
        referralCount: count,
        totalRewards: count * 7
      };
    })
    .sort((a, b) => b.referralCount - a.referralCount)
    .slice(0, limit);
}
