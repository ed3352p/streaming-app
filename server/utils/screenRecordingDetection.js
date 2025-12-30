import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ScreenRecordingDetector {
  constructor() {
    this.detectionLogFile = join(__dirname, '..', 'data', 'recording_detections.json');
    this.detectionLog = this.loadDetectionLog();
    this.blockedUsers = new Set();
  }

  loadDetectionLog() {
    if (existsSync(this.detectionLogFile)) {
      try {
        return JSON.parse(readFileSync(this.detectionLogFile, 'utf-8'));
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  saveDetectionLog() {
    writeFileSync(this.detectionLogFile, JSON.stringify(this.detectionLog, null, 2));
  }

  logDetection(userId, detectionType, metadata = {}) {
    const detection = {
      userId,
      detectionType,
      timestamp: new Date().toISOString(),
      metadata,
      severity: this.getSeverity(detectionType)
    };

    this.detectionLog.push(detection);
    
    if (this.detectionLog.length > 5000) {
      this.detectionLog = this.detectionLog.slice(-5000);
    }

    this.saveDetectionLog();

    const recentDetections = this.getUserRecentDetections(userId, 5);
    if (recentDetections >= 3) {
      this.blockUser(userId);
    }

    return detection;
  }

  getSeverity(detectionType) {
    const severityMap = {
      'screen_capture_api': 'high',
      'media_recorder_api': 'high',
      'canvas_fingerprint': 'medium',
      'devtools_open': 'medium',
      'suspicious_extension': 'high',
      'hdmi_capture': 'critical',
      'obs_detected': 'critical',
      'rapid_screenshot': 'medium'
    };

    return severityMap[detectionType] || 'low';
  }

  getUserRecentDetections(userId, minutesAgo = 5) {
    const cutoffTime = Date.now() - (minutesAgo * 60 * 1000);
    return this.detectionLog.filter(d => 
      d.userId === userId && 
      new Date(d.timestamp).getTime() > cutoffTime
    ).length;
  }

  blockUser(userId) {
    this.blockedUsers.add(userId);
    console.log(`🚫 User ${userId} blocked for suspected screen recording`);
  }

  unblockUser(userId) {
    this.blockedUsers.delete(userId);
  }

  isUserBlocked(userId) {
    return this.blockedUsers.has(userId);
  }

  getDetectionStats() {
    const byType = {};
    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    
    this.detectionLog.forEach(d => {
      byType[d.detectionType] = (byType[d.detectionType] || 0) + 1;
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
    });

    return {
      total: this.detectionLog.length,
      byType,
      bySeverity,
      blockedUsers: this.blockedUsers.size
    };
  }

  getUserDetections(userId, limit = 50) {
    return this.detectionLog
      .filter(d => d.userId === userId)
      .slice(-limit)
      .reverse();
  }

  clearOldDetections(daysAgo = 30) {
    const cutoffTime = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
    const originalLength = this.detectionLog.length;
    
    this.detectionLog = this.detectionLog.filter(d => 
      new Date(d.timestamp).getTime() > cutoffTime
    );

    const removed = originalLength - this.detectionLog.length;
    if (removed > 0) {
      this.saveDetectionLog();
      console.log(`🧹 Removed ${removed} old recording detections`);
    }

    return removed;
  }
}

export const screenRecordingDetector = new ScreenRecordingDetector();
