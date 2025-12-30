import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LoadBalancer {
  constructor() {
    this.servers = [];
    this.currentIndex = 0;
    this.healthCheckInterval = null;
    this.configFile = join(__dirname, '..', 'data', 'server_nodes.json');
    this.loadConfig();
  }

  loadConfig() {
    if (existsSync(this.configFile)) {
      try {
        const data = JSON.parse(readFileSync(this.configFile, 'utf-8'));
        this.servers = data.servers || [];
      } catch (error) {
        console.error('Error loading server config:', error);
        this.initDefaultServers();
      }
    } else {
      this.initDefaultServers();
    }
  }

  initDefaultServers() {
    this.servers = [
      {
        id: 'primary',
        url: process.env.PRIMARY_SERVER_URL || 'http://localhost:3001',
        priority: 1,
        healthy: true,
        lastCheck: new Date().toISOString(),
        load: 0,
        maxLoad: 100
      },
      {
        id: 'secondary',
        url: process.env.SECONDARY_SERVER_URL || 'http://localhost:3002',
        priority: 2,
        healthy: false,
        lastCheck: new Date().toISOString(),
        load: 0,
        maxLoad: 100
      }
    ];
    this.saveConfig();
  }

  saveConfig() {
    try {
      writeFileSync(this.configFile, JSON.stringify({ servers: this.servers }, null, 2));
    } catch (error) {
      console.error('Error saving server config:', error);
    }
  }

  async checkHealth(server) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${server.url}/health`, {
        signal: controller.signal,
        method: 'GET'
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async performHealthChecks() {
    for (const server of this.servers) {
      const isHealthy = await this.checkHealth(server);
      server.healthy = isHealthy;
      server.lastCheck = new Date().toISOString();
    }
    this.saveConfig();
  }

  startHealthChecks(intervalMs = 30000) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);
    
    this.performHealthChecks();
  }

  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  getNextServer() {
    const healthyServers = this.servers
      .filter(s => s.healthy && s.load < s.maxLoad)
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.load - b.load;
      });

    if (healthyServers.length === 0) {
      return this.servers.find(s => s.priority === 1) || this.servers[0];
    }

    this.currentIndex = (this.currentIndex + 1) % healthyServers.length;
    return healthyServers[this.currentIndex];
  }

  incrementLoad(serverId) {
    const server = this.servers.find(s => s.id === serverId);
    if (server) {
      server.load++;
      this.saveConfig();
    }
  }

  decrementLoad(serverId) {
    const server = this.servers.find(s => s.id === serverId);
    if (server) {
      server.load = Math.max(0, server.load - 1);
      this.saveConfig();
    }
  }

  getServerStats() {
    return this.servers.map(s => ({
      id: s.id,
      url: s.url,
      healthy: s.healthy,
      load: s.load,
      maxLoad: s.maxLoad,
      lastCheck: s.lastCheck
    }));
  }
}

export const loadBalancer = new LoadBalancer();
