import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TermsManager {
  constructor() {
    this.termsFile = join(__dirname, '..', 'data', 'terms_acceptance.json');
    this.acceptances = this.loadAcceptances();
  }

  loadAcceptances() {
    if (existsSync(this.termsFile)) {
      try {
        return JSON.parse(readFileSync(this.termsFile, 'utf-8'));
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  saveAcceptances() {
    writeFileSync(this.termsFile, JSON.stringify(this.acceptances, null, 2));
  }

  recordAcceptance(userId, acceptanceData) {
    if (!this.acceptances[userId]) {
      this.acceptances[userId] = [];
    }

    const acceptance = {
      termsVersion: acceptanceData.termsVersion || '1.0',
      privacyVersion: acceptanceData.privacyVersion || '1.0',
      cookieVersion: acceptanceData.cookieVersion || '1.0',
      acceptedTerms: acceptanceData.acceptedTerms !== false,
      acceptedPrivacy: acceptanceData.acceptedPrivacy !== false,
      acceptedCookies: acceptanceData.acceptedCookies !== false,
      marketingConsent: acceptanceData.marketingConsent || false,
      dataProcessingConsent: acceptanceData.dataProcessingConsent !== false,
      ip: acceptanceData.ip,
      userAgent: acceptanceData.userAgent,
      timestamp: new Date().toISOString()
    };

    this.acceptances[userId].push(acceptance);
    this.saveAcceptances();

    return acceptance;
  }

  hasAcceptedLatestTerms(userId, currentVersions = {}) {
    const userAcceptances = this.acceptances[userId];
    if (!userAcceptances || userAcceptances.length === 0) {
      return false;
    }

    const latestAcceptance = userAcceptances[userAcceptances.length - 1];

    const termsVersion = currentVersions.terms || '1.0';
    const privacyVersion = currentVersions.privacy || '1.0';
    const cookieVersion = currentVersions.cookie || '1.0';

    return (
      latestAcceptance.acceptedTerms &&
      latestAcceptance.acceptedPrivacy &&
      latestAcceptance.termsVersion === termsVersion &&
      latestAcceptance.privacyVersion === privacyVersion &&
      latestAcceptance.cookieVersion === cookieVersion
    );
  }

  getUserAcceptances(userId) {
    return this.acceptances[userId] || [];
  }

  getLatestAcceptance(userId) {
    const acceptances = this.getUserAcceptances(userId);
    return acceptances.length > 0 ? acceptances[acceptances.length - 1] : null;
  }

  revokeConsent(userId, consentType) {
    const latest = this.getLatestAcceptance(userId);
    if (!latest) return { success: false, error: 'No acceptance found' };

    const revocation = {
      ...latest,
      [`${consentType}Revoked`]: true,
      revokedAt: new Date().toISOString()
    };

    this.acceptances[userId].push(revocation);
    this.saveAcceptances();

    return { success: true, revocation };
  }

  getAcceptanceStats() {
    const totalUsers = Object.keys(this.acceptances).length;
    let totalAcceptances = 0;
    let marketingConsent = 0;
    let dataProcessingConsent = 0;

    for (const userId in this.acceptances) {
      const userAcceptances = this.acceptances[userId];
      totalAcceptances += userAcceptances.length;

      const latest = userAcceptances[userAcceptances.length - 1];
      if (latest.marketingConsent) marketingConsent++;
      if (latest.dataProcessingConsent) dataProcessingConsent++;
    }

    return {
      totalUsers,
      totalAcceptances,
      averageAcceptancesPerUser: totalUsers > 0 ? (totalAcceptances / totalUsers).toFixed(2) : 0,
      marketingConsentRate: totalUsers > 0 ? ((marketingConsent / totalUsers) * 100).toFixed(2) : 0,
      dataProcessingConsentRate: totalUsers > 0 ? ((dataProcessingConsent / totalUsers) * 100).toFixed(2) : 0
    };
  }

  exportUserData(userId) {
    return {
      userId,
      acceptances: this.getUserAcceptances(userId),
      exportedAt: new Date().toISOString()
    };
  }

  deleteUserData(userId) {
    if (this.acceptances[userId]) {
      delete this.acceptances[userId];
      this.saveAcceptances();
      return { success: true };
    }
    return { success: false, error: 'User data not found' };
  }
}

export const termsManager = new TermsManager();
