import webpush from 'web-push';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUBSCRIPTIONS_FILE = join(__dirname, '..', 'data', 'push_subscriptions.json');
const NOTIFICATIONS_FILE = join(__dirname, '..', 'data', 'notifications.json');

// Configure web-push (you should set these in environment variables)
// Only initialize if VAPID keys are properly configured
let webPushConfigured = false;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@streambox.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    webPushConfigured = true;
    console.log('✅ Web Push notifications configured');
  } catch (error) {
    console.warn('⚠️  Web Push configuration failed:', error.message);
    console.warn('💡 Push notifications will be disabled. Generate VAPID keys with: npx web-push generate-vapid-keys');
  }
} else {
  console.warn('⚠️  VAPID keys not configured. Push notifications disabled.');
  console.warn('💡 Generate VAPID keys with: npx web-push generate-vapid-keys');
  console.warn('💡 Then add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to your .env file');
}

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

export function saveSubscription(userId, subscription) {
  const subscriptions = readData(SUBSCRIPTIONS_FILE);
  const existing = subscriptions.findIndex(s => s.userId === userId);
  
  if (existing !== -1) {
    subscriptions[existing] = { userId, subscription, updatedAt: new Date().toISOString() };
  } else {
    subscriptions.push({ userId, subscription, createdAt: new Date().toISOString() });
  }
  
  writeData(SUBSCRIPTIONS_FILE, subscriptions);
  return true;
}

export function getSubscription(userId) {
  const subscriptions = readData(SUBSCRIPTIONS_FILE);
  return subscriptions.find(s => s.userId === userId)?.subscription;
}

export function deleteSubscription(userId) {
  const subscriptions = readData(SUBSCRIPTIONS_FILE);
  const filtered = subscriptions.filter(s => s.userId !== userId);
  writeData(SUBSCRIPTIONS_FILE, filtered);
  return true;
}

export async function sendNotification(userId, payload) {
  // Save notification to database regardless of push capability
  const notifications = readData(NOTIFICATIONS_FILE);
  notifications.push({
    id: Date.now(),
    userId,
    ...payload,
    sent: webPushConfigured,
    createdAt: new Date().toISOString()
  });
  writeData(NOTIFICATIONS_FILE, notifications);

  // Only attempt to send push notification if configured
  if (!webPushConfigured) {
    return true; // Still return true as notification was saved
  }

  const subscription = getSubscription(userId);
  if (!subscription) return false;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Remove invalid subscription
    if (error.statusCode === 410) {
      deleteSubscription(userId);
    }
    
    return false;
  }
}

export async function sendBulkNotification(userIds, payload) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendNotification(userId, payload))
  );
  
  return {
    sent: results.filter(r => r.status === 'fulfilled' && r.value).length,
    failed: results.filter(r => r.status === 'rejected' || !r.value).length
  };
}

export function getUserNotifications(userId, limit = 50) {
  const notifications = readData(NOTIFICATIONS_FILE);
  return notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export function markNotificationAsRead(notificationId, userId) {
  const notifications = readData(NOTIFICATIONS_FILE);
  const index = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
  
  if (index !== -1) {
    notifications[index].read = true;
    writeData(NOTIFICATIONS_FILE, notifications);
    return true;
  }
  
  return false;
}

// Notification templates
export const NotificationTemplates = {
  newContent: (title, type) => ({
    title: '🎬 Nouveau contenu disponible',
    body: `${title} est maintenant disponible sur la plateforme`,
    icon: '/logo.svg',
    tag: 'new-content',
    data: { type, title }
  }),
  
  subscriptionExpiring: (daysLeft) => ({
    title: '⚠️ Abonnement bientôt expiré',
    body: `Votre abonnement Premium expire dans ${daysLeft} jours`,
    icon: '/logo.svg',
    tag: 'subscription-expiring',
    data: { daysLeft }
  }),
  
  promotion: (offer) => ({
    title: '🎁 Offre spéciale Premium',
    body: offer,
    icon: '/logo.svg',
    tag: 'promotion',
    data: { offer }
  }),
  
  newEpisode: (seriesTitle, episode) => ({
    title: '📺 Nouvel épisode disponible',
    body: `${seriesTitle} - ${episode}`,
    icon: '/logo.svg',
    tag: 'new-episode',
    data: { seriesTitle, episode }
  }),
  
  referralSuccess: (username) => ({
    title: '🎉 Nouveau parrainage',
    body: `${username} s'est inscrit avec votre code. Vous avez gagné 7 jours Premium !`,
    icon: '/logo.svg',
    tag: 'referral',
    data: { username }
  })
};
