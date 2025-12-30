import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ContentModerationManager {
  constructor() {
    this.moderationFile = join(__dirname, '..', 'data', 'content_moderation.json');
    this.warningsFile = join(__dirname, '..', 'data', 'content_warnings.json');
    this.moderation = this.loadModeration();
    this.warnings = this.loadWarnings();
  }

  loadModeration() {
    if (existsSync(this.moderationFile)) {
      try {
        return JSON.parse(readFileSync(this.moderationFile, 'utf-8'));
      } catch (error) {
        return { content: {} };
      }
    }
    return { content: {} };
  }

  loadWarnings() {
    if (existsSync(this.warningsFile)) {
      try {
        return JSON.parse(readFileSync(this.warningsFile, 'utf-8'));
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  saveModeration() {
    writeFileSync(this.moderationFile, JSON.stringify(this.moderation, null, 2));
  }

  saveWarnings() {
    writeFileSync(this.warningsFile, JSON.stringify(this.warnings, null, 2));
  }

  flagContent(contentId, contentType, flags) {
    this.moderation.content[contentId] = {
      contentId,
      contentType,
      flags: {
        violence: flags.violence || false,
        nudity: flags.nudity || false,
        language: flags.language || false,
        drugs: flags.drugs || false,
        horror: flags.horror || false,
        discrimination: flags.discrimination || false,
        ...flags
      },
      severity: this.calculateSeverity(flags),
      requiresBlur: flags.requiresBlur || false,
      requiresWarning: flags.requiresWarning !== false,
      ageRestriction: flags.ageRestriction || null,
      flaggedAt: new Date().toISOString(),
      flaggedBy: flags.flaggedBy || 'system'
    };

    this.saveModeration();
    return this.moderation.content[contentId];
  }

  calculateSeverity(flags) {
    const severityWeights = {
      violence: 3,
      nudity: 4,
      language: 1,
      drugs: 2,
      horror: 2,
      discrimination: 4
    };

    let totalSeverity = 0;
    let flagCount = 0;

    for (const [flag, value] of Object.entries(flags)) {
      if (value && severityWeights[flag]) {
        totalSeverity += severityWeights[flag];
        flagCount++;
      }
    }

    if (flagCount === 0) return 'none';
    
    const avgSeverity = totalSeverity / flagCount;
    
    if (avgSeverity >= 3.5) return 'critical';
    if (avgSeverity >= 2.5) return 'high';
    if (avgSeverity >= 1.5) return 'medium';
    return 'low';
  }

  createWarning(contentId, warningData) {
    this.warnings[contentId] = {
      contentId,
      title: warningData.title || 'Avertissement de contenu',
      message: warningData.message,
      warnings: warningData.warnings || [],
      showBefore: warningData.showBefore !== false,
      requireAcknowledgment: warningData.requireAcknowledgment !== false,
      ageGate: warningData.ageGate || null,
      customStyle: warningData.customStyle || null,
      createdAt: new Date().toISOString()
    };

    this.saveWarnings();
    return this.warnings[contentId];
  }

  getContentModeration(contentId) {
    return this.moderation.content[contentId] || null;
  }

  getContentWarning(contentId) {
    return this.warnings[contentId] || null;
  }

  shouldBlurContent(contentId, userAge = null) {
    const moderation = this.moderation.content[contentId];
    if (!moderation) return false;

    if (moderation.requiresBlur) return true;

    if (moderation.ageRestriction && userAge) {
      return userAge < moderation.ageRestriction;
    }

    return moderation.severity === 'critical' || moderation.severity === 'high';
  }

  generateAutoWarning(contentId) {
    const moderation = this.moderation.content[contentId];
    if (!moderation) return null;

    const warnings = [];
    const flags = moderation.flags;

    if (flags.violence) warnings.push('Scènes de violence');
    if (flags.nudity) warnings.push('Nudité');
    if (flags.language) warnings.push('Langage grossier');
    if (flags.drugs) warnings.push('Usage de drogues');
    if (flags.horror) warnings.push('Contenu effrayant');
    if (flags.discrimination) warnings.push('Contenu discriminatoire');

    if (warnings.length === 0) return null;

    const severityMessages = {
      critical: 'Ce contenu contient des éléments très sensibles.',
      high: 'Ce contenu contient des éléments sensibles.',
      medium: 'Ce contenu peut contenir des éléments sensibles.',
      low: 'Ce contenu peut ne pas convenir à tous les publics.'
    };

    return this.createWarning(contentId, {
      title: 'Avertissement de contenu',
      message: severityMessages[moderation.severity] || severityMessages.medium,
      warnings,
      ageGate: moderation.ageRestriction,
      requireAcknowledgment: moderation.severity === 'critical' || moderation.severity === 'high'
    });
  }

  updateContentFlags(contentId, flags) {
    if (!this.moderation.content[contentId]) {
      return this.flagContent(contentId, 'unknown', flags);
    }

    this.moderation.content[contentId].flags = {
      ...this.moderation.content[contentId].flags,
      ...flags
    };
    this.moderation.content[contentId].severity = this.calculateSeverity(
      this.moderation.content[contentId].flags
    );
    this.moderation.content[contentId].updatedAt = new Date().toISOString();

    this.saveModeration();
    return this.moderation.content[contentId];
  }

  removeContentFlags(contentId) {
    delete this.moderation.content[contentId];
    delete this.warnings[contentId];
    this.saveModeration();
    this.saveWarnings();
    return { success: true };
  }

  getFlaggedContent(severity = null) {
    let content = Object.values(this.moderation.content);
    
    if (severity) {
      content = content.filter(c => c.severity === severity);
    }

    return content.sort((a, b) => 
      new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime()
    );
  }

  getModerationStats() {
    const content = Object.values(this.moderation.content);
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      none: 0
    };

    const byFlag = {
      violence: 0,
      nudity: 0,
      language: 0,
      drugs: 0,
      horror: 0,
      discrimination: 0
    };

    content.forEach(c => {
      bySeverity[c.severity]++;
      
      Object.keys(c.flags).forEach(flag => {
        if (c.flags[flag] && byFlag.hasOwnProperty(flag)) {
          byFlag[flag]++;
        }
      });
    });

    return {
      totalFlagged: content.length,
      totalWarnings: Object.keys(this.warnings).length,
      bySeverity,
      byFlag,
      requireBlur: content.filter(c => c.requiresBlur).length,
      ageRestricted: content.filter(c => c.ageRestriction).length
    };
  }

  bulkFlagContent(contentList) {
    const results = [];

    for (const item of contentList) {
      const result = this.flagContent(item.contentId, item.contentType, item.flags);
      results.push(result);
      
      if (item.autoGenerateWarning) {
        this.generateAutoWarning(item.contentId);
      }
    }

    return results;
  }
}

export const contentModerationManager = new ContentModerationManager();
