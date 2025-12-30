import express from 'express';
import { 
  saveSubscription, 
  deleteSubscription, 
  sendNotification, 
  getUserNotifications, 
  markNotificationAsRead,
  NotificationTemplates 
} from '../utils/notifications.js';
import { 
  getMovieRecommendations, 
  getUserRecommendations, 
  getTrendingByCountry,
  getBecauseYouWatched 
} from '../utils/recommendations.js';
import { 
  getUserReferralCode, 
  processReferral, 
  getUserReferrals, 
  getReferralStats,
  validateReferralCode,
  getReferralLeaderboard 
} from '../utils/referrals.js';
import { 
  checkAndAwardBadges, 
  getUserBadges, 
  getBadgeProgress,
  calculateUserStats 
} from '../utils/badges.js';
import { 
  canShowAd, 
  trackAdImpression as trackAdFrequency, 
  getUserAdStats,
  grantAdReward,
  hasActiveAdReward 
} from '../utils/adFrequency.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { epgManager } from '../utils/epgManager.js';
import { cloudDVR } from '../utils/cloudDVR.js';
import { channelStatsManager } from '../utils/channelStats.js';
import { parentalControlsManager } from '../utils/parentalControls.js';
import { contentModerationManager } from '../utils/contentModeration.js';
import { termsManager } from '../utils/termsManager.js';
import { deviceFingerprintManager } from '../utils/deviceFingerprint.js';
import { vpnDetector } from '../utils/vpnDetection.js';
import { screenRecordingDetector } from '../utils/screenRecordingDetection.js';
import { loadBalancer } from '../utils/loadBalancer.js';
import { videoPreloader } from '../utils/videoPreloader.js';
import { backupManager } from '../utils/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const DATA_DIR = join(__dirname, '..', 'data');
const RATINGS_FILE = join(DATA_DIR, 'ratings.json');
const COMMENTS_FILE = join(DATA_DIR, 'comments.json');

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

// ============ NOTIFICATIONS ============

router.post('/notifications/subscribe', (req, res) => {
  try {
    const { userId, subscription } = req.body;
    saveSubscription(userId, subscription);
    res.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/notifications/unsubscribe/:userId', (req, res) => {
  try {
    deleteSubscription(parseInt(req.params.userId));
    res.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/notifications/:userId', (req, res) => {
  try {
    const notifications = getUserNotifications(parseInt(req.params.userId));
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/notifications/:id/read', (req, res) => {
  try {
    const { userId } = req.body;
    markNotificationAsRead(parseInt(req.params.id), userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/notifications/send', (req, res) => {
  try {
    const { userId, type, data } = req.body;
    let payload;
    
    switch(type) {
      case 'newContent':
        payload = NotificationTemplates.newContent(data.title, data.contentType);
        break;
      case 'subscriptionExpiring':
        payload = NotificationTemplates.subscriptionExpiring(data.daysLeft);
        break;
      case 'promotion':
        payload = NotificationTemplates.promotion(data.offer);
        break;
      default:
        payload = data;
    }
    
    sendNotification(userId, payload);
    res.json({ success: true });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ RECOMMENDATIONS ============

router.get('/recommendations', (req, res) => {
  try {
    const { movieId, userId, genre, country, limit } = req.query;
    
    let recommendations;
    if (movieId) {
      recommendations = getMovieRecommendations(parseInt(movieId), parseInt(limit) || 6);
    } else if (userId) {
      recommendations = getUserRecommendations(parseInt(userId), parseInt(limit) || 10);
    } else if (country) {
      recommendations = getTrendingByCountry(country, parseInt(limit) || 10);
    } else {
      recommendations = [];
    }
    
    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/recommendations/because-you-watched/:userId', (req, res) => {
  try {
    const recommendations = getBecauseYouWatched(parseInt(req.params.userId));
    res.json(recommendations);
  } catch (error) {
    console.error('Get because you watched error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ RATINGS ============

router.post('/ratings', (req, res) => {
  try {
    const { userId, contentId, contentType, rating } = req.body;
    const ratings = readData(RATINGS_FILE);
    
    const existingIndex = ratings.findIndex(r => 
      r.userId === userId && r.contentId === contentId && r.contentType === contentType
    );
    
    if (existingIndex >= 0) {
      ratings[existingIndex].rating = rating;
      ratings[existingIndex].updatedAt = new Date().toISOString();
    } else {
      ratings.push({
        id: Date.now(),
        userId,
        contentId,
        contentType,
        rating,
        createdAt: new Date().toISOString()
      });
    }
    
    writeData(RATINGS_FILE, ratings);
    
    // Check for badges
    checkAndAwardBadges(userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Rate error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/ratings/:contentId', (req, res) => {
  try {
    const { contentType } = req.query;
    const ratings = readData(RATINGS_FILE);
    const contentRatings = ratings.filter(r => 
      r.contentId === parseInt(req.params.contentId) && 
      r.contentType === contentType
    );
    
    const average = contentRatings.length > 0
      ? contentRatings.reduce((sum, r) => sum + r.rating, 0) / contentRatings.length
      : 0;
    
    res.json({
      average: average.toFixed(1),
      count: contentRatings.length,
      ratings: contentRatings
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ COMMENTS ============

router.get('/comments/:contentId', (req, res) => {
  try {
    const { contentType } = req.query;
    const comments = readData(COMMENTS_FILE);
    const contentComments = comments
      .filter(c => c.contentId === parseInt(req.params.contentId) && c.contentType === contentType)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(contentComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/comments', (req, res) => {
  try {
    const { userId, username, contentId, contentType, text } = req.body;
    const comments = readData(COMMENTS_FILE);
    
    const newComment = {
      id: Date.now(),
      userId,
      username,
      contentId,
      contentType,
      text: text.substring(0, 500),
      likes: 0,
      createdAt: new Date().toISOString()
    };
    
    comments.push(newComment);
    writeData(COMMENTS_FILE, comments);
    
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/comments/:id/like', (req, res) => {
  try {
    const { userId } = req.body;
    const comments = readData(COMMENTS_FILE);
    const commentIndex = comments.findIndex(c => c.id === parseInt(req.params.id));
    
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }
    
    if (!comments[commentIndex].likedBy) {
      comments[commentIndex].likedBy = [];
    }
    
    const likedIndex = comments[commentIndex].likedBy.indexOf(userId);
    if (likedIndex >= 0) {
      comments[commentIndex].likedBy.splice(likedIndex, 1);
      comments[commentIndex].likes = Math.max(0, (comments[commentIndex].likes || 0) - 1);
    } else {
      comments[commentIndex].likedBy.push(userId);
      comments[commentIndex].likes = (comments[commentIndex].likes || 0) + 1;
    }
    
    writeData(COMMENTS_FILE, comments);
    res.json({ success: true, likes: comments[commentIndex].likes });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/comments/:id', (req, res) => {
  try {
    const { userId } = req.body;
    const comments = readData(COMMENTS_FILE);
    const comment = comments.find(c => c.id === parseInt(req.params.id));
    
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }
    
    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    const filtered = comments.filter(c => c.id !== parseInt(req.params.id));
    writeData(COMMENTS_FILE, filtered);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/comments/:id/report', (req, res) => {
  try {
    // In a real app, you'd store reports and review them
    res.json({ success: true, message: 'Commentaire signalé' });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ REFERRALS ============

router.get('/referrals/code/:userId', (req, res) => {
  try {
    const code = getUserReferralCode(parseInt(req.params.userId));
    res.json({ code });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/referrals/process', (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    const referral = processReferral(referralCode, newUserId);
    res.json(referral);
  } catch (error) {
    console.error('Process referral error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/referrals/:userId', (req, res) => {
  try {
    const referrals = getUserReferrals(parseInt(req.params.userId));
    res.json(referrals);
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/referrals/:userId/stats', (req, res) => {
  try {
    const stats = getReferralStats(parseInt(req.params.userId));
    res.json(stats);
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/referrals/validate/:code', (req, res) => {
  try {
    const isValid = validateReferralCode(req.params.code);
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/referrals/leaderboard', (req, res) => {
  try {
    const leaderboard = getReferralLeaderboard(parseInt(req.query.limit) || 10);
    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ BADGES ============

router.get('/badges/:userId', (req, res) => {
  try {
    const badges = getUserBadges(parseInt(req.params.userId));
    res.json(badges);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/badges/:userId/progress', (req, res) => {
  try {
    const progress = getBadgeProgress(parseInt(req.params.userId));
    res.json(progress);
  } catch (error) {
    console.error('Get badge progress error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/stats/:userId', (req, res) => {
  try {
    const stats = calculateUserStats(parseInt(req.params.userId));
    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ AD FREQUENCY ============

router.post('/ads/can-show', (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    const result = canShowAd(userId, sessionId);
    res.json(result);
  } catch (error) {
    console.error('Can show ad error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/ads/track-impression', (req, res) => {
  try {
    const { userId, adId, sessionId } = req.body;
    trackAdFrequency(userId, adId, sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Track ad impression error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/ads/stats/:userId', (req, res) => {
  try {
    const stats = getUserAdStats(parseInt(req.params.userId));
    res.json(stats);
  } catch (error) {
    console.error('Get ad stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/ads/reward', (req, res) => {
  try {
    const { userId, rewardType } = req.body;
    const reward = grantAdReward(userId, rewardType);
    res.json(reward);
  } catch (error) {
    console.error('Grant ad reward error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/ads/reward/:userId/:rewardType', (req, res) => {
  try {
    const hasReward = hasActiveAdReward(parseInt(req.params.userId), req.params.rewardType);
    res.json({ hasReward });
  } catch (error) {
    console.error('Check ad reward error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ EPG (Electronic Program Guide) ============

router.get('/epg/channel/:channelId', async (req, res) => {
  try {
    const { date } = req.query;
    const channelId = req.params.channelId;
    
    await epgManager.fetchEPGData(channelId);
    
    const current = epgManager.getCurrentProgram(channelId);
    const next = epgManager.getNextProgram(channelId);
    
    let schedule = [];
    if (date) {
      const startDate = new Date(date).toISOString();
      const endDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString();
      schedule = epgManager.getProgramSchedule(channelId, startDate, endDate);
    }
    
    res.json({ current, next, schedule });
  } catch (error) {
    console.error('EPG error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/epg/search', (req, res) => {
  try {
    const { q, channelId } = req.query;
    const results = epgManager.searchPrograms(q, channelId);
    res.json(results);
  } catch (error) {
    console.error('EPG search error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ CLOUD DVR ============

router.post('/dvr/schedule', (req, res) => {
  try {
    const { userId, channelId, programId, programInfo } = req.body;
    const recording = cloudDVR.scheduleRecording(userId, channelId, programId, programInfo);
    res.json(recording);
  } catch (error) {
    console.error('Schedule recording error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/dvr/schedule/:recordingId', (req, res) => {
  try {
    const { userId } = req.body;
    const result = cloudDVR.cancelScheduledRecording(req.params.recordingId, userId);
    res.json(result);
  } catch (error) {
    console.error('Cancel recording error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/dvr/recordings/:userId', (req, res) => {
  try {
    const recordings = cloudDVR.getUserRecordings(parseInt(req.params.userId));
    res.json(recordings);
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/dvr/scheduled/:userId', (req, res) => {
  try {
    const scheduled = cloudDVR.getUserScheduled(parseInt(req.params.userId));
    res.json(scheduled);
  } catch (error) {
    console.error('Get scheduled error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/dvr/storage/:userId', (req, res) => {
  try {
    const usage = cloudDVR.getUserStorageUsage(parseInt(req.params.userId));
    res.json(usage);
  } catch (error) {
    console.error('Get storage error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ CHANNEL STATS ============

router.post('/channels/track-view', (req, res) => {
  try {
    const { channelId, userId, duration } = req.body;
    channelStatsManager.trackView(channelId, userId, duration);
    res.json({ success: true });
  } catch (error) {
    console.error('Track channel view error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/channels/stats/:channelId', (req, res) => {
  try {
    const stats = channelStatsManager.getChannelStats(req.params.channelId);
    res.json(stats);
  } catch (error) {
    console.error('Get channel stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/channels/top', (req, res) => {
  try {
    const { limit, metric } = req.query;
    const top = channelStatsManager.getTopChannels(parseInt(limit) || 10, metric || 'totalViews');
    res.json(top);
  } catch (error) {
    console.error('Get top channels error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ PARENTAL CONTROLS ============

router.post('/parental-controls/setup', async (req, res) => {
  try {
    const { userId, pin, settings } = req.body;
    const controls = await parentalControlsManager.setupParentalControls(userId, pin, settings);
    res.json(controls);
  } catch (error) {
    console.error('Setup parental controls error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/parental-controls/verify-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    const result = await parentalControlsManager.verifyPin(userId, pin);
    res.json(result);
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/parental-controls/profiles', (req, res) => {
  try {
    const { userId, profileData } = req.body;
    const profile = parentalControlsManager.createChildProfile(userId, profileData);
    res.json(profile);
  } catch (error) {
    console.error('Create child profile error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/parental-controls/profiles/:userId', (req, res) => {
  try {
    const profiles = parentalControlsManager.getChildProfiles(parseInt(req.params.userId));
    res.json(profiles);
  } catch (error) {
    console.error('Get child profiles error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/parental-controls/check-content', (req, res) => {
  try {
    const { profileId, content } = req.body;
    const result = parentalControlsManager.isContentAllowed(profileId, content);
    res.json(result);
  } catch (error) {
    console.error('Check content error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ CONTENT MODERATION ============

router.post('/moderation/flag', (req, res) => {
  try {
    const { contentId, contentType, flags } = req.body;
    const moderation = contentModerationManager.flagContent(contentId, contentType, flags);
    res.json(moderation);
  } catch (error) {
    console.error('Flag content error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/moderation/:contentId', (req, res) => {
  try {
    const moderation = contentModerationManager.getContentModeration(req.params.contentId);
    const warning = contentModerationManager.getContentWarning(req.params.contentId);
    res.json({ moderation, warning });
  } catch (error) {
    console.error('Get moderation error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/moderation/warning', (req, res) => {
  try {
    const { contentId, warningData } = req.body;
    const warning = contentModerationManager.createWarning(contentId, warningData);
    res.json(warning);
  } catch (error) {
    console.error('Create warning error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ TERMS & LEGAL ============

router.post('/terms/accept', (req, res) => {
  try {
    const { userId, ...acceptanceData } = req.body;
    const acceptance = termsManager.recordAcceptance(userId, acceptanceData);
    res.json(acceptance);
  } catch (error) {
    console.error('Terms acceptance error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/terms/status/:userId', (req, res) => {
  try {
    const hasAccepted = termsManager.hasAcceptedLatestTerms(parseInt(req.params.userId));
    res.json({ hasAccepted });
  } catch (error) {
    console.error('Terms status error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ SECURITY ============

router.post('/security/fingerprint', (req, res) => {
  try {
    const { userId, fingerprint, deviceInfo, ip } = req.body;
    const device = deviceFingerprintManager.registerDevice(userId, fingerprint, deviceInfo, ip);
    const sessionId = deviceFingerprintManager.createSession(userId, fingerprint, ip, req.headers.authorization);
    res.json({ device, sessionId });
  } catch (error) {
    console.error('Fingerprint error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/security/validate-session', (req, res) => {
  try {
    const { sessionId, fingerprint, ip } = req.body;
    const result = deviceFingerprintManager.validateSession(sessionId, fingerprint, ip);
    res.json(result);
  } catch (error) {
    console.error('Validate session error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/security/vpn-detect', async (req, res) => {
  try {
    const { ip, userAgent, headers } = req.body;
    const detection = await vpnDetector.detectVPN(ip, userAgent, headers);
    res.json(detection);
  } catch (error) {
    console.error('VPN detection error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/security/recording-detection', (req, res) => {
  try {
    const { userId, detectionType, metadata } = req.body;
    const detection = screenRecordingDetector.logDetection(userId, detectionType, metadata);
    const blocked = screenRecordingDetector.isUserBlocked(userId);
    res.json({ detection, blocked, warning: !blocked });
  } catch (error) {
    console.error('Recording detection error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ INFRASTRUCTURE ============

router.get('/infrastructure/servers', (req, res) => {
  try {
    const stats = loadBalancer.getServerStats();
    res.json(stats);
  } catch (error) {
    console.error('Server stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/infrastructure/preload', (req, res) => {
  try {
    const stats = videoPreloader.getStats();
    const list = videoPreloader.getPreloadList();
    res.json({ stats, list });
  } catch (error) {
    console.error('Preload stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/infrastructure/backup', async (req, res) => {
  try {
    const result = await backupManager.createBackup();
    res.json(result);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/infrastructure/backups', (req, res) => {
  try {
    const backups = backupManager.listBackups();
    res.json(backups);
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
