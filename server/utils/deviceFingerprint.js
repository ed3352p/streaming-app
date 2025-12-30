import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DeviceFingerprintManager {
  constructor() {
    this.deviceFile = join(__dirname, '..', 'data', 'devices.json');
    this.sessionFile = join(__dirname, '..', 'data', 'sessions.json');
    this.devices = this.loadDevices();
    this.sessions = this.loadSessions();
  }

  loadDevices() {
    if (existsSync(this.deviceFile)) {
      try {
        return JSON.parse(readFileSync(this.deviceFile, 'utf-8'));
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  loadSessions() {
    if (existsSync(this.sessionFile)) {
      try {
        return JSON.parse(readFileSync(this.sessionFile, 'utf-8'));
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  saveDevices() {
    writeFileSync(this.deviceFile, JSON.stringify(this.devices, null, 2));
  }

  saveSessions() {
    writeFileSync(this.sessionFile, JSON.stringify(this.sessions, null, 2));
  }

  generateFingerprint(data) {
    const {
      userAgent,
      language,
      platform,
      screenResolution,
      timezone,
      canvas,
      webgl,
      fonts,
      plugins,
      audioContext,
      hardwareConcurrency,
      deviceMemory,
      touchSupport
    } = data;

    const fingerprintString = JSON.stringify({
      userAgent,
      language,
      platform,
      screenResolution,
      timezone,
      canvas,
      webgl,
      fonts: fonts?.sort(),
      plugins: plugins?.sort(),
      audioContext,
      hardwareConcurrency,
      deviceMemory,
      touchSupport
    });

    return crypto.createHash('sha256').update(fingerprintString).digest('hex');
  }

  registerDevice(userId, fingerprint, deviceInfo, ip) {
    const deviceId = `${userId}_${fingerprint}`;
    
    if (!this.devices[deviceId]) {
      this.devices[deviceId] = {
        userId,
        fingerprint,
        deviceInfo,
        registeredIp: ip,
        registeredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        trusted: false,
        loginCount: 1
      };
    } else {
      this.devices[deviceId].lastSeen = new Date().toISOString();
      this.devices[deviceId].loginCount++;
    }

    this.saveDevices();
    return this.devices[deviceId];
  }

  createSession(userId, fingerprint, ip, token) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    this.sessions[sessionId] = {
      userId,
      fingerprint,
      ip,
      token,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      active: true
    };

    this.saveSessions();
    return sessionId;
  }

  validateSession(sessionId, fingerprint, ip) {
    const session = this.sessions[sessionId];
    
    if (!session || !session.active) {
      return { valid: false, reason: 'Session not found or inactive' };
    }

    if (session.fingerprint !== fingerprint) {
      this.invalidateSession(sessionId);
      return { valid: false, reason: 'Device fingerprint mismatch' };
    }

    if (session.ip !== ip) {
      this.invalidateSession(sessionId);
      return { valid: false, reason: 'IP address changed' };
    }

    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000;
    
    if (sessionAge > maxAge) {
      this.invalidateSession(sessionId);
      return { valid: false, reason: 'Session expired' };
    }

    session.lastActivity = new Date().toISOString();
    this.saveSessions();

    return { valid: true, session };
  }

  invalidateSession(sessionId) {
    if (this.sessions[sessionId]) {
      this.sessions[sessionId].active = false;
      this.sessions[sessionId].invalidatedAt = new Date().toISOString();
      this.saveSessions();
    }
  }

  invalidateAllUserSessions(userId) {
    Object.keys(this.sessions).forEach(sessionId => {
      if (this.sessions[sessionId].userId === userId) {
        this.invalidateSession(sessionId);
      }
    });
  }

  getUserDevices(userId) {
    return Object.values(this.devices).filter(d => d.userId === userId);
  }

  getUserActiveSessions(userId) {
    return Object.entries(this.sessions)
      .filter(([_, session]) => session.userId === userId && session.active)
      .map(([id, session]) => ({ id, ...session }));
  }

  isDeviceTrusted(userId, fingerprint) {
    const deviceId = `${userId}_${fingerprint}`;
    return this.devices[deviceId]?.trusted || false;
  }

  trustDevice(userId, fingerprint) {
    const deviceId = `${userId}_${fingerprint}`;
    if (this.devices[deviceId]) {
      this.devices[deviceId].trusted = true;
      this.saveDevices();
    }
  }

  removeDevice(userId, fingerprint) {
    const deviceId = `${userId}_${fingerprint}`;
    delete this.devices[deviceId];
    this.saveDevices();
  }

  detectAnomalies(userId, fingerprint, ip) {
    const device = this.devices[`${userId}_${fingerprint}`];
    const anomalies = [];

    if (device) {
      if (device.registeredIp !== ip) {
        anomalies.push({
          type: 'ip_change',
          severity: 'medium',
          message: 'IP address changed from registered device'
        });
      }

      const hoursSinceLastSeen = (Date.now() - new Date(device.lastSeen).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSeen < 0.1 && device.loginCount > 10) {
        anomalies.push({
          type: 'rapid_login',
          severity: 'high',
          message: 'Rapid login attempts detected'
        });
      }
    }

    const userDevices = this.getUserDevices(userId);
    if (userDevices.length > 5) {
      anomalies.push({
        type: 'too_many_devices',
        severity: 'high',
        message: 'Too many devices registered for this user'
      });
    }

    return anomalies;
  }

  cleanupOldSessions(maxAgeDays = 7) {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let cleaned = 0;

    Object.keys(this.sessions).forEach(sessionId => {
      const session = this.sessions[sessionId];
      const age = now - new Date(session.lastActivity).getTime();
      
      if (age > maxAgeMs) {
        delete this.sessions[sessionId];
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.saveSessions();
      console.log(`🧹 Cleaned ${cleaned} old sessions`);
    }

    return cleaned;
  }
}

export const deviceFingerprintManager = new DeviceFingerprintManager();
