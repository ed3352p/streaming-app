import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ChannelStatsManager {
  constructor() {
    this.statsFile = join(__dirname, '..', 'data', 'channel_stats.json');
    this.stats = this.loadStats();
  }

  loadStats() {
    if (existsSync(this.statsFile)) {
      try {
        return JSON.parse(readFileSync(this.statsFile, 'utf-8'));
      } catch (error) {
        return { channels: {}, global: {} };
      }
    }
    return { channels: {}, global: {} };
  }

  saveStats() {
    writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
  }

  trackView(channelId, userId, duration = 0) {
    if (!this.stats.channels[channelId]) {
      this.stats.channels[channelId] = {
        totalViews: 0,
        uniqueViewers: new Set(),
        totalWatchTime: 0,
        viewsByHour: {},
        viewsByDay: {},
        peakViewers: 0,
        currentViewers: 0,
        lastViewed: null
      };
    }

    const channel = this.stats.channels[channelId];
    channel.totalViews++;
    channel.uniqueViewers.add(userId);
    channel.totalWatchTime += duration;
    channel.lastViewed = new Date().toISOString();

    const hour = new Date().getHours();
    const day = new Date().toISOString().split('T')[0];

    channel.viewsByHour[hour] = (channel.viewsByHour[hour] || 0) + 1;
    channel.viewsByDay[day] = (channel.viewsByDay[day] || 0) + 1;

    this.saveStats();
  }

  incrementCurrentViewers(channelId) {
    if (!this.stats.channels[channelId]) {
      this.trackView(channelId, null, 0);
    }

    const channel = this.stats.channels[channelId];
    channel.currentViewers++;
    
    if (channel.currentViewers > channel.peakViewers) {
      channel.peakViewers = channel.currentViewers;
    }

    this.saveStats();
  }

  decrementCurrentViewers(channelId) {
    if (this.stats.channels[channelId]) {
      this.stats.channels[channelId].currentViewers = Math.max(
        0,
        this.stats.channels[channelId].currentViewers - 1
      );
      this.saveStats();
    }
  }

  getChannelStats(channelId) {
    const channel = this.stats.channels[channelId];
    if (!channel) return null;

    return {
      channelId,
      totalViews: channel.totalViews,
      uniqueViewers: channel.uniqueViewers.size || Array.from(channel.uniqueViewers || []).length,
      totalWatchTime: channel.totalWatchTime,
      totalWatchTimeHours: (channel.totalWatchTime / 3600).toFixed(2),
      averageWatchTime: channel.totalViews > 0 
        ? (channel.totalWatchTime / channel.totalViews).toFixed(2) 
        : 0,
      currentViewers: channel.currentViewers,
      peakViewers: channel.peakViewers,
      lastViewed: channel.lastViewed,
      viewsByHour: channel.viewsByHour,
      viewsByDay: channel.viewsByDay
    };
  }

  getTopChannels(limit = 10, metric = 'totalViews') {
    const channels = Object.keys(this.stats.channels).map(channelId => ({
      channelId,
      ...this.getChannelStats(channelId)
    }));

    return channels
      .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
      .slice(0, limit);
  }

  getPeakViewingHours() {
    const hourlyViews = {};

    for (const channelId in this.stats.channels) {
      const channel = this.stats.channels[channelId];
      for (const hour in channel.viewsByHour) {
        hourlyViews[hour] = (hourlyViews[hour] || 0) + channel.viewsByHour[hour];
      }
    }

    return Object.entries(hourlyViews)
      .map(([hour, views]) => ({ hour: parseInt(hour), views }))
      .sort((a, b) => b.views - a.views);
  }

  getViewingTrends(days = 7) {
    const trends = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const channelId in this.stats.channels) {
      const channel = this.stats.channels[channelId];
      
      for (const day in channel.viewsByDay) {
        if (new Date(day) >= cutoffDate) {
          if (!trends[day]) trends[day] = 0;
          trends[day] += channel.viewsByDay[day];
        }
      }
    }

    return Object.entries(trends)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getCurrentViewersTotal() {
    let total = 0;
    for (const channelId in this.stats.channels) {
      total += this.stats.channels[channelId].currentViewers || 0;
    }
    return total;
  }

  getGlobalStats() {
    let totalViews = 0;
    let totalWatchTime = 0;
    let totalChannels = Object.keys(this.stats.channels).length;
    const allUniqueViewers = new Set();

    for (const channelId in this.stats.channels) {
      const channel = this.stats.channels[channelId];
      totalViews += channel.totalViews;
      totalWatchTime += channel.totalWatchTime;
      
      const viewers = channel.uniqueViewers instanceof Set 
        ? channel.uniqueViewers 
        : new Set(channel.uniqueViewers || []);
      
      viewers.forEach(v => allUniqueViewers.add(v));
    }

    return {
      totalChannels,
      totalViews,
      totalWatchTime,
      totalWatchTimeHours: (totalWatchTime / 3600).toFixed(2),
      uniqueViewers: allUniqueViewers.size,
      currentViewers: this.getCurrentViewersTotal(),
      averageViewsPerChannel: totalChannels > 0 ? (totalViews / totalChannels).toFixed(2) : 0
    };
  }

  resetChannelStats(channelId) {
    if (this.stats.channels[channelId]) {
      delete this.stats.channels[channelId];
      this.saveStats();
      return true;
    }
    return false;
  }

  exportStats() {
    return {
      channels: Object.keys(this.stats.channels).map(channelId => 
        this.getChannelStats(channelId)
      ),
      global: this.getGlobalStats(),
      exportedAt: new Date().toISOString()
    };
  }
}

export const channelStatsManager = new ChannelStatsManager();
