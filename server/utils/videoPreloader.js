import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VideoPreloader {
  constructor() {
    this.preloadCache = new Map();
    this.popularVideos = [];
    this.cacheFile = join(__dirname, '..', 'data', 'preload_cache.json');
    this.maxCacheSize = 10;
    this.loadCache();
  }

  loadCache() {
    if (existsSync(this.cacheFile)) {
      try {
        const data = JSON.parse(readFileSync(this.cacheFile, 'utf-8'));
        this.popularVideos = data.popularVideos || [];
      } catch (error) {
        console.error('Error loading preload cache:', error);
      }
    }
  }

  saveCache() {
    try {
      writeFileSync(this.cacheFile, JSON.stringify({
        popularVideos: this.popularVideos,
        lastUpdate: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      console.error('Error saving preload cache:', error);
    }
  }

  updatePopularVideos(analytics) {
    const sortedByViews = Object.entries(analytics.contentViews || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.maxCacheSize)
      .map(([id, views]) => ({ id, views }));

    this.popularVideos = sortedByViews;
    this.saveCache();
  }

  getPreloadList() {
    return this.popularVideos.map(v => v.id);
  }

  shouldPreload(videoId) {
    return this.popularVideos.some(v => v.id === videoId);
  }

  addToPreloadQueue(videoId, priority = 'normal') {
    if (!this.preloadCache.has(videoId)) {
      this.preloadCache.set(videoId, {
        id: videoId,
        priority,
        addedAt: new Date().toISOString(),
        status: 'queued'
      });
    }
  }

  getPreloadStatus(videoId) {
    return this.preloadCache.get(videoId) || null;
  }

  markAsPreloaded(videoId) {
    const item = this.preloadCache.get(videoId);
    if (item) {
      item.status = 'preloaded';
      item.preloadedAt = new Date().toISOString();
    }
  }

  clearCache() {
    this.preloadCache.clear();
  }

  getStats() {
    return {
      totalPopular: this.popularVideos.length,
      queuedForPreload: Array.from(this.preloadCache.values()).filter(v => v.status === 'queued').length,
      preloaded: Array.from(this.preloadCache.values()).filter(v => v.status === 'preloaded').length
    };
  }
}

export const videoPreloader = new VideoPreloader();
