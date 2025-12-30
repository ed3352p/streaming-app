import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class EPGManager {
  constructor() {
    this.epgFile = join(__dirname, '..', 'data', 'epg.json');
    this.epgData = this.loadEPG();
  }

  loadEPG() {
    if (existsSync(this.epgFile)) {
      try {
        return JSON.parse(readFileSync(this.epgFile, 'utf-8'));
      } catch (error) {
        return { channels: {}, lastUpdate: null };
      }
    }
    return { channels: {}, lastUpdate: null };
  }

  saveEPG() {
    writeFileSync(this.epgFile, JSON.stringify(this.epgData, null, 2));
  }

  async fetchEPGData(channelId, source = 'xmltv') {
    try {
      const epgUrl = process.env.EPG_SOURCE_URL || 'https://iptv-org.github.io/epg/guides/';
      
      const mockPrograms = this.generateMockEPG(channelId);
      
      this.epgData.channels[channelId] = {
        programs: mockPrograms,
        lastUpdate: new Date().toISOString()
      };
      
      this.saveEPG();
      return mockPrograms;
    } catch (error) {
      console.error('EPG fetch error:', error);
      return [];
    }
  }

  generateMockEPG(channelId) {
    const programs = [];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const programTemplates = [
      { title: 'Journal télévisé', duration: 30, type: 'news' },
      { title: 'Météo', duration: 10, type: 'weather' },
      { title: 'Film du soir', duration: 120, type: 'movie' },
      { title: 'Série TV', duration: 45, type: 'series' },
      { title: 'Documentaire', duration: 60, type: 'documentary' },
      { title: 'Sport en direct', duration: 90, type: 'sports' },
      { title: 'Émission de divertissement', duration: 60, type: 'entertainment' },
      { title: 'Débat politique', duration: 75, type: 'talk' }
    ];

    let currentTime = startOfDay.getTime();
    const endOfDay = startOfDay.getTime() + (48 * 60 * 60 * 1000);

    while (currentTime < endOfDay) {
      const template = programTemplates[Math.floor(Math.random() * programTemplates.length)];
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime + template.duration * 60 * 1000);

      programs.push({
        id: `prog_${channelId}_${currentTime}`,
        title: template.title,
        description: `Description de ${template.title}`,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        duration: template.duration,
        type: template.type,
        rating: Math.random() > 0.5 ? 'all' : '12+',
        image: null
      });

      currentTime = endTime.getTime();
    }

    return programs;
  }

  getCurrentProgram(channelId) {
    const channelEPG = this.epgData.channels[channelId];
    if (!channelEPG) return null;

    const now = new Date().toISOString();
    return channelEPG.programs.find(p => p.start <= now && p.end > now);
  }

  getNextProgram(channelId) {
    const channelEPG = this.epgData.channels[channelId];
    if (!channelEPG) return null;

    const now = new Date().toISOString();
    return channelEPG.programs.find(p => p.start > now);
  }

  getProgramSchedule(channelId, startDate, endDate) {
    const channelEPG = this.epgData.channels[channelId];
    if (!channelEPG) return [];

    return channelEPG.programs.filter(p => 
      p.start >= startDate && p.start <= endDate
    );
  }

  searchPrograms(query, channelId = null) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    const channelsToSearch = channelId 
      ? [channelId] 
      : Object.keys(this.epgData.channels);

    for (const chId of channelsToSearch) {
      const channelEPG = this.epgData.channels[chId];
      if (!channelEPG) continue;

      const matches = channelEPG.programs.filter(p => 
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
      );

      results.push(...matches.map(p => ({ ...p, channelId: chId })));
    }

    return results;
  }

  updateEPGForAllChannels(channels) {
    const promises = channels.map(channel => 
      this.fetchEPGData(channel.id)
    );
    
    return Promise.all(promises);
  }

  getEPGStats() {
    const channelCount = Object.keys(this.epgData.channels).length;
    let totalPrograms = 0;
    
    for (const channelId in this.epgData.channels) {
      totalPrograms += this.epgData.channels[channelId].programs.length;
    }

    return {
      channelCount,
      totalPrograms,
      lastUpdate: this.epgData.lastUpdate,
      averageProgramsPerChannel: channelCount > 0 ? (totalPrograms / channelCount).toFixed(2) : 0
    };
  }
}

export const epgManager = new EPGManager();
