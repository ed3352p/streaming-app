import cron from 'node-cron';
import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sendNotification, NotificationTemplates } from './notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const MOVIES_FILE = join(DATA_DIR, 'movies.json');
const CHUNKS_DIR = join(__dirname, '..', 'chunks');

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

// Check for expiring subscriptions and send notifications
function checkExpiringSubscriptions() {
  console.log('[CRON] Checking expiring subscriptions...');
  const users = readData(USERS_FILE);
  const now = new Date();
  
  users.forEach(user => {
    if (user.premium && user.premiumExpiry) {
      const expiryDate = new Date(user.premiumExpiry);
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      // Notify 7 days before expiry
      if (daysLeft === 7) {
        sendNotification(user.id, NotificationTemplates.subscriptionExpiring(7));
      }
      // Notify 3 days before expiry
      else if (daysLeft === 3) {
        sendNotification(user.id, NotificationTemplates.subscriptionExpiring(3));
      }
      // Notify 1 day before expiry
      else if (daysLeft === 1) {
        sendNotification(user.id, NotificationTemplates.subscriptionExpiring(1));
      }
      // Expire subscription
      else if (daysLeft <= 0) {
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          users[userIndex].premium = false;
          users[userIndex].premiumExpiredAt = new Date().toISOString();
        }
      }
    }
  });
  
  writeData(USERS_FILE, users);
}

// Clean up old temporary files
function cleanupTempFiles() {
  console.log('[CRON] Cleaning up temporary files...');
  
  try {
    if (existsSync(CHUNKS_DIR)) {
      const files = readdirSync(CHUNKS_DIR);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      files.forEach(file => {
        const filePath = join(CHUNKS_DIR, file);
        const stats = require('fs').statSync(filePath);
        const age = now - stats.mtimeMs;
        
        if (age > maxAge) {
          unlinkSync(filePath);
          console.log(`[CRON] Deleted old temp file: ${file}`);
        }
      });
    }
  } catch (error) {
    console.error('[CRON] Error cleaning temp files:', error);
  }
}

// Auto-verify IPTV links
async function verifyIPTVLinks() {
  console.log('[CRON] Verifying IPTV links...');
  
  const IPTV_FILE = join(DATA_DIR, 'iptv.json');
  const channels = readData(IPTV_FILE);
  
  for (const channel of channels) {
    if (channel.url) {
      try {
        const response = await fetch(channel.url, { method: 'HEAD', timeout: 5000 });
        const channelIndex = channels.findIndex(c => c.id === channel.id);
        
        if (channelIndex !== -1) {
          channels[channelIndex].lastChecked = new Date().toISOString();
          channels[channelIndex].status = response.ok ? 'online' : 'offline';
        }
      } catch (error) {
        const channelIndex = channels.findIndex(c => c.id === channel.id);
        if (channelIndex !== -1) {
          channels[channelIndex].lastChecked = new Date().toISOString();
          channels[channelIndex].status = 'offline';
        }
      }
    }
  }
  
  writeData(IPTV_FILE, channels);
}

// Delete broken movie links
function deleteDeadLinks() {
  console.log('[CRON] Checking for dead movie links...');
  
  const movies = readData(MOVIES_FILE);
  const DEAD_LINKS_FILE = join(DATA_DIR, 'dead_links.json');
  const deadLinks = readData(DEAD_LINKS_FILE);
  
  // Mark movies with dead links
  movies.forEach(movie => {
    if (deadLinks.includes(movie.id)) {
      const movieIndex = movies.findIndex(m => m.id === movie.id);
      if (movieIndex !== -1) {
        movies[movieIndex].status = 'dead_link';
        movies[movieIndex].markedDeadAt = new Date().toISOString();
      }
    }
  });
  
  writeData(MOVIES_FILE, movies);
}

// Send promotional notifications
function sendPromotionalNotifications() {
  console.log('[CRON] Sending promotional notifications...');
  
  const users = readData(USERS_FILE);
  const freeUsers = users.filter(u => !u.premium);
  
  // Send to 10% of free users randomly
  const targetCount = Math.ceil(freeUsers.length * 0.1);
  const selectedUsers = freeUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, targetCount);
  
  selectedUsers.forEach(user => {
    sendNotification(
      user.id,
      NotificationTemplates.promotion('Profitez de 30% de réduction sur Premium ce week-end !')
    );
  });
}

// Initialize all cron jobs
export function initializeCronJobs() {
  console.log('[CRON] Initializing scheduled tasks...');
  
  // Check expiring subscriptions daily at 9 AM
  cron.schedule('0 9 * * *', checkExpiringSubscriptions);
  
  // Clean up temp files daily at 3 AM
  cron.schedule('0 3 * * *', cleanupTempFiles);
  
  // Verify IPTV links every 6 hours
  cron.schedule('0 */6 * * *', verifyIPTVLinks);
  
  // Check for dead links daily at 4 AM
  cron.schedule('0 4 * * *', deleteDeadLinks);
  
  // Send promotional notifications on Fridays at 10 AM
  cron.schedule('0 10 * * 5', sendPromotionalNotifications);
  
  console.log('[CRON] All scheduled tasks initialized');
}

// Manual trigger functions for admin
export const cronTasks = {
  checkExpiringSubscriptions,
  cleanupTempFiles,
  verifyIPTVLinks,
  deleteDeadLinks,
  sendPromotionalNotifications
};
