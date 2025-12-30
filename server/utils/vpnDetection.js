import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VPNDetector {
  constructor() {
    this.vpnRangesFile = join(__dirname, '..', 'data', 'vpn_ranges.json');
    this.detectionLogFile = join(__dirname, '..', 'data', 'vpn_detections.json');
    this.vpnRanges = this.loadVPNRanges();
    this.detectionLog = this.loadDetectionLog();
    this.knownVPNProviders = [
      'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'protonvpn',
      'privatevpn', 'ipvanish', 'purevpn', 'windscribe', 'tunnelbear',
      'mullvad', 'pia', 'private internet access', 'hotspot shield'
    ];
  }

  loadVPNRanges() {
    if (existsSync(this.vpnRangesFile)) {
      try {
        return JSON.parse(readFileSync(this.vpnRangesFile, 'utf-8'));
      } catch (error) {
        return { ranges: [], lastUpdate: null };
      }
    }
    return { ranges: [], lastUpdate: null };
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

  async detectVPN(ip, userAgent = '', headers = {}) {
    const detectionMethods = {
      ipCheck: await this.checkIPDatabase(ip),
      headerCheck: this.checkHeaders(headers),
      userAgentCheck: this.checkUserAgent(userAgent),
      portCheck: await this.checkCommonVPNPorts(ip),
      dnsCheck: await this.checkDNSLeak(ip),
      timezoneCheck: this.checkTimezoneAnomaly(headers)
    };

    const vpnScore = this.calculateVPNScore(detectionMethods);
    const isVPN = vpnScore > 50;

    const detection = {
      ip,
      timestamp: new Date().toISOString(),
      isVPN,
      vpnScore,
      methods: detectionMethods,
      confidence: this.getConfidenceLevel(vpnScore)
    };

    if (isVPN) {
      this.logDetection(detection);
    }

    return detection;
  }

  async checkIPDatabase(ip) {
    try {
      const response = await fetch(`https://vpnapi.io/api/${ip}?key=${process.env.VPN_API_KEY || 'free'}`);
      if (response.ok) {
        const data = await response.json();
        return {
          detected: data.security?.vpn || data.security?.proxy || false,
          provider: data.network?.autonomous_system_organization || null,
          score: data.security?.vpn ? 100 : 0
        };
      }
    } catch (error) {
      console.error('VPN API check failed:', error);
    }

    return { detected: false, provider: null, score: 0 };
  }

  checkHeaders(headers) {
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'via',
      'forwarded',
      'x-proxy-id',
      'x-vpn'
    ];

    let score = 0;
    const detectedHeaders = [];

    for (const header of suspiciousHeaders) {
      if (headers[header]) {
        score += 20;
        detectedHeaders.push(header);
      }
    }

    return {
      detected: score > 0,
      headers: detectedHeaders,
      score: Math.min(score, 100)
    };
  }

  checkUserAgent(userAgent) {
    const lowerUA = userAgent.toLowerCase();
    let score = 0;
    const matches = [];

    for (const provider of this.knownVPNProviders) {
      if (lowerUA.includes(provider)) {
        score += 50;
        matches.push(provider);
      }
    }

    if (lowerUA.includes('proxy') || lowerUA.includes('vpn')) {
      score += 30;
      matches.push('generic vpn/proxy keyword');
    }

    return {
      detected: score > 0,
      matches,
      score: Math.min(score, 100)
    };
  }

  async checkCommonVPNPorts(ip) {
    return {
      detected: false,
      score: 0
    };
  }

  async checkDNSLeak(ip) {
    return {
      detected: false,
      score: 0
    };
  }

  checkTimezoneAnomaly(headers) {
    return {
      detected: false,
      score: 0
    };
  }

  calculateVPNScore(methods) {
    const weights = {
      ipCheck: 0.4,
      headerCheck: 0.2,
      userAgentCheck: 0.2,
      portCheck: 0.1,
      dnsCheck: 0.05,
      timezoneCheck: 0.05
    };

    let totalScore = 0;
    for (const [method, weight] of Object.entries(weights)) {
      totalScore += (methods[method]?.score || 0) * weight;
    }

    return Math.min(Math.round(totalScore), 100);
  }

  getConfidenceLevel(score) {
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  logDetection(detection) {
    this.detectionLog.push(detection);
    
    if (this.detectionLog.length > 1000) {
      this.detectionLog = this.detectionLog.slice(-1000);
    }
    
    this.saveDetectionLog();
  }

  getDetectionStats() {
    const total = this.detectionLog.length;
    const vpnDetected = this.detectionLog.filter(d => d.isVPN).length;
    const byConfidence = {
      very_high: this.detectionLog.filter(d => d.confidence === 'very_high').length,
      high: this.detectionLog.filter(d => d.confidence === 'high').length,
      medium: this.detectionLog.filter(d => d.confidence === 'medium').length,
      low: this.detectionLog.filter(d => d.confidence === 'low').length,
      very_low: this.detectionLog.filter(d => d.confidence === 'very_low').length
    };

    return {
      total,
      vpnDetected,
      vpnPercentage: total > 0 ? ((vpnDetected / total) * 100).toFixed(2) : 0,
      byConfidence
    };
  }

  isIPBlacklisted(ip) {
    const recentDetections = this.detectionLog
      .filter(d => d.ip === ip && d.isVPN)
      .filter(d => {
        const age = Date.now() - new Date(d.timestamp).getTime();
        return age < 24 * 60 * 60 * 1000;
      });

    return recentDetections.length >= 3;
  }
}

export const vpnDetector = new VPNDetector();
