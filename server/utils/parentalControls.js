import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ParentalControlsManager {
  constructor() {
    this.controlsFile = join(__dirname, '..', 'data', 'parental_controls.json');
    this.profilesFile = join(__dirname, '..', 'data', 'user_profiles.json');
    this.controls = this.loadControls();
    this.profiles = this.loadProfiles();
  }

  loadControls() {
    if (existsSync(this.controlsFile)) {
      try {
        return JSON.parse(readFileSync(this.controlsFile, 'utf-8'));
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  loadProfiles() {
    if (existsSync(this.profilesFile)) {
      try {
        return JSON.parse(readFileSync(this.profilesFile, 'utf-8'));
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  saveControls() {
    writeFileSync(this.controlsFile, JSON.stringify(this.controls, null, 2));
  }

  saveProfiles() {
    writeFileSync(this.profilesFile, JSON.stringify(this.profiles, null, 2));
  }

  async setupParentalControls(userId, pin, settings = {}) {
    const pinHash = await bcrypt.hash(pin, 10);

    this.controls[userId] = {
      enabled: true,
      pinHash,
      settings: {
        maxRating: settings.maxRating || 'PG-13',
        blockedCategories: settings.blockedCategories || [],
        allowedHours: settings.allowedHours || { start: '06:00', end: '22:00' },
        requirePinForPurchase: settings.requirePinForPurchase !== false,
        requirePinForMatureContent: settings.requirePinForMatureContent !== false,
        screenTimeLimit: settings.screenTimeLimit || null,
        ...settings
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveControls();
    return this.controls[userId];
  }

  async verifyPin(userId, pin) {
    const control = this.controls[userId];
    if (!control || !control.enabled) {
      return { valid: false, reason: 'Parental controls not enabled' };
    }

    const isValid = await bcrypt.compare(pin, control.pinHash);
    return { valid: isValid, reason: isValid ? null : 'Invalid PIN' };
  }

  async updatePin(userId, oldPin, newPin) {
    const verification = await this.verifyPin(userId, oldPin);
    if (!verification.valid) {
      return { success: false, error: 'Invalid current PIN' };
    }

    const newPinHash = await bcrypt.hash(newPin, 10);
    this.controls[userId].pinHash = newPinHash;
    this.controls[userId].updatedAt = new Date().toISOString();
    this.saveControls();

    return { success: true };
  }

  updateSettings(userId, settings) {
    if (!this.controls[userId]) {
      return { success: false, error: 'Parental controls not set up' };
    }

    this.controls[userId].settings = {
      ...this.controls[userId].settings,
      ...settings
    };
    this.controls[userId].updatedAt = new Date().toISOString();
    this.saveControls();

    return { success: true, settings: this.controls[userId].settings };
  }

  createChildProfile(userId, profileData) {
    const profileId = `${userId}_${Date.now()}`;

    this.profiles[profileId] = {
      id: profileId,
      parentUserId: userId,
      name: profileData.name,
      avatar: profileData.avatar || null,
      birthYear: profileData.birthYear || null,
      isChild: true,
      restrictions: {
        maxRating: profileData.maxRating || 'G',
        blockedCategories: profileData.blockedCategories || ['horror', 'violence', 'adult'],
        allowedChannels: profileData.allowedChannels || [],
        screenTimeLimit: profileData.screenTimeLimit || 120,
        allowedHours: profileData.allowedHours || { start: '08:00', end: '20:00' }
      },
      watchHistory: [],
      screenTime: {
        today: 0,
        week: 0,
        lastReset: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    };

    this.saveProfiles();
    return this.profiles[profileId];
  }

  getChildProfiles(userId) {
    return Object.values(this.profiles).filter(p => p.parentUserId === userId);
  }

  updateChildProfile(profileId, userId, updates) {
    const profile = this.profiles[profileId];
    
    if (!profile || profile.parentUserId !== userId) {
      return { success: false, error: 'Profile not found or unauthorized' };
    }

    this.profiles[profileId] = {
      ...profile,
      ...updates,
      id: profileId,
      parentUserId: userId,
      isChild: true,
      updatedAt: new Date().toISOString()
    };

    this.saveProfiles();
    return { success: true, profile: this.profiles[profileId] };
  }

  deleteChildProfile(profileId, userId) {
    const profile = this.profiles[profileId];
    
    if (!profile || profile.parentUserId !== userId) {
      return { success: false, error: 'Profile not found or unauthorized' };
    }

    delete this.profiles[profileId];
    this.saveProfiles();
    return { success: true };
  }

  isContentAllowed(profileId, content) {
    const profile = this.profiles[profileId];
    if (!profile || !profile.isChild) {
      return { allowed: true };
    }

    const restrictions = profile.restrictions;
    const reasons = [];

    const ratingOrder = ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'];
    const contentRatingIndex = ratingOrder.indexOf(content.rating || 'PG');
    const maxRatingIndex = ratingOrder.indexOf(restrictions.maxRating);

    if (contentRatingIndex > maxRatingIndex) {
      reasons.push('Content rating exceeds allowed level');
    }

    if (content.categories) {
      const blockedFound = content.categories.some(cat => 
        restrictions.blockedCategories.includes(cat.toLowerCase())
      );
      if (blockedFound) {
        reasons.push('Content category is blocked');
      }
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime < restrictions.allowedHours.start || currentTime > restrictions.allowedHours.end) {
      reasons.push('Outside allowed viewing hours');
    }

    if (restrictions.screenTimeLimit) {
      if (profile.screenTime.today >= restrictions.screenTimeLimit) {
        reasons.push('Screen time limit reached');
      }
    }

    return {
      allowed: reasons.length === 0,
      reasons
    };
  }

  trackScreenTime(profileId, minutes) {
    const profile = this.profiles[profileId];
    if (!profile) return;

    const lastReset = new Date(profile.screenTime.lastReset);
    const now = new Date();

    if (now.toDateString() !== lastReset.toDateString()) {
      profile.screenTime.today = 0;
      profile.screenTime.lastReset = now.toISOString();
    }

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    if (lastReset < weekStart) {
      profile.screenTime.week = 0;
    }

    profile.screenTime.today += minutes;
    profile.screenTime.week += minutes;

    this.saveProfiles();
  }

  getScreenTimeReport(profileId) {
    const profile = this.profiles[profileId];
    if (!profile) return null;

    return {
      profileId,
      profileName: profile.name,
      today: profile.screenTime.today,
      week: profile.screenTime.week,
      limit: profile.restrictions.screenTimeLimit,
      remaining: Math.max(0, profile.restrictions.screenTimeLimit - profile.screenTime.today),
      percentUsed: profile.restrictions.screenTimeLimit 
        ? ((profile.screenTime.today / profile.restrictions.screenTimeLimit) * 100).toFixed(2)
        : 0
    };
  }

  disableParentalControls(userId) {
    if (this.controls[userId]) {
      this.controls[userId].enabled = false;
      this.saveControls();
      return { success: true };
    }
    return { success: false, error: 'Parental controls not found' };
  }

  getParentalControlsStatus(userId) {
    const control = this.controls[userId];
    if (!control) {
      return { enabled: false };
    }

    return {
      enabled: control.enabled,
      settings: control.settings,
      childProfiles: this.getChildProfiles(userId).length,
      createdAt: control.createdAt,
      updatedAt: control.updatedAt
    };
  }
}

export const parentalControlsManager = new ParentalControlsManager();
