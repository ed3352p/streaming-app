import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BackupManager {
  constructor() {
    this.backupDir = join(__dirname, '..', 'backups');
    this.dataDir = join(__dirname, '..', 'data');
    this.maxBackups = 30;
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}`;
      const backupPath = join(this.backupDir, backupName);

      mkdirSync(backupPath, { recursive: true });

      if (existsSync(this.dataDir)) {
        const files = readdirSync(this.dataDir);
        for (const file of files) {
          if (file.endsWith('.json') || file.startsWith('.')) {
            const srcPath = join(this.dataDir, file);
            const destPath = join(backupPath, file);
            copyFileSync(srcPath, destPath);
          }
        }
      }

      const metadata = {
        timestamp: new Date().toISOString(),
        files: readdirSync(backupPath),
        size: this.calculateDirSize(backupPath)
      };

      writeFileSync(
        join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      this.cleanOldBackups();

      console.log(`✅ Backup created: ${backupName}`);
      return { success: true, backupName, metadata };
    } catch (error) {
      console.error('Backup error:', error);
      return { success: false, error: error.message };
    }
  }

  calculateDirSize(dirPath) {
    let totalSize = 0;
    const files = readdirSync(dirPath);
    for (const file of files) {
      const filePath = join(dirPath, file);
      try {
        const stats = require('fs').statSync(filePath);
        totalSize += stats.size;
      } catch (error) {
        console.error(`Error calculating size for ${file}:`, error);
      }
    }
    return totalSize;
  }

  cleanOldBackups() {
    try {
      const backups = readdirSync(this.backupDir)
        .filter(name => name.startsWith('backup_'))
        .sort()
        .reverse();

      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        for (const backup of toDelete) {
          const backupPath = join(this.backupDir, backup);
          this.deleteDirectory(backupPath);
          console.log(`🗑️  Deleted old backup: ${backup}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }

  deleteDirectory(dirPath) {
    if (existsSync(dirPath)) {
      const files = readdirSync(dirPath);
      for (const file of files) {
        const filePath = join(dirPath, file);
        require('fs').unlinkSync(filePath);
      }
      require('fs').rmdirSync(dirPath);
    }
  }

  async restoreBackup(backupName) {
    try {
      const backupPath = join(this.backupDir, backupName);
      
      if (!existsSync(backupPath)) {
        return { success: false, error: 'Backup not found' };
      }

      const files = readdirSync(backupPath);
      for (const file of files) {
        if (file !== 'metadata.json') {
          const srcPath = join(backupPath, file);
          const destPath = join(this.dataDir, file);
          copyFileSync(srcPath, destPath);
        }
      }

      console.log(`✅ Backup restored: ${backupName}`);
      return { success: true, backupName };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, error: error.message };
    }
  }

  listBackups() {
    try {
      const backups = readdirSync(this.backupDir)
        .filter(name => name.startsWith('backup_'))
        .map(name => {
          const backupPath = join(this.backupDir, name);
          const metadataPath = join(backupPath, 'metadata.json');
          
          let metadata = null;
          if (existsSync(metadataPath)) {
            metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
          }

          return {
            name,
            path: backupPath,
            metadata
          };
        })
        .sort((a, b) => {
          const timeA = a.metadata?.timestamp || '';
          const timeB = b.metadata?.timestamp || '';
          return timeB.localeCompare(timeA);
        });

      return backups;
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  scheduleAutoBackup(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    setInterval(() => {
      console.log('🔄 Running scheduled backup...');
      this.createBackup();
    }, intervalMs);

    this.createBackup();
    console.log(`📅 Auto-backup scheduled every ${intervalHours} hours`);
  }
}

export const backupManager = new BackupManager();
