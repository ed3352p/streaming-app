import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CloudDVR {
  constructor() {
    this.recordingsFile = join(__dirname, '..', 'data', 'dvr_recordings.json');
    this.scheduledFile = join(__dirname, '..', 'data', 'dvr_scheduled.json');
    this.recordingsDir = join(__dirname, '..', 'recordings');
    this.recordings = this.loadRecordings();
    this.scheduled = this.loadScheduled();
    this.ensureRecordingsDir();
  }

  ensureRecordingsDir() {
    if (!existsSync(this.recordingsDir)) {
      mkdirSync(this.recordingsDir, { recursive: true });
    }
  }

  loadRecordings() {
    if (existsSync(this.recordingsFile)) {
      try {
        return JSON.parse(readFileSync(this.recordingsFile, 'utf-8'));
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  loadScheduled() {
    if (existsSync(this.scheduledFile)) {
      try {
        return JSON.parse(readFileSync(this.scheduledFile, 'utf-8'));
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  saveRecordings() {
    writeFileSync(this.recordingsFile, JSON.stringify(this.recordings, null, 2));
  }

  saveScheduled() {
    writeFileSync(this.scheduledFile, JSON.stringify(this.scheduled, null, 2));
  }

  scheduleRecording(userId, channelId, programId, programInfo) {
    const recordingId = crypto.randomBytes(16).toString('hex');
    
    const recording = {
      id: recordingId,
      userId,
      channelId,
      programId,
      programTitle: programInfo.title,
      programDescription: programInfo.description,
      scheduledStart: programInfo.start,
      scheduledEnd: programInfo.end,
      duration: programInfo.duration,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    this.scheduled.push(recording);
    this.saveScheduled();

    return recording;
  }

  cancelScheduledRecording(recordingId, userId) {
    const index = this.scheduled.findIndex(r => 
      r.id === recordingId && r.userId === userId
    );

    if (index === -1) {
      return { success: false, error: 'Recording not found' };
    }

    this.scheduled.splice(index, 1);
    this.saveScheduled();

    return { success: true };
  }

  startRecording(recordingId) {
    const scheduled = this.scheduled.find(r => r.id === recordingId);
    if (!scheduled) return null;

    scheduled.status = 'recording';
    scheduled.actualStart = new Date().toISOString();
    this.saveScheduled();

    return scheduled;
  }

  completeRecording(recordingId, fileInfo) {
    const index = this.scheduled.findIndex(r => r.id === recordingId);
    if (index === -1) return null;

    const recording = this.scheduled[index];
    recording.status = 'completed';
    recording.actualEnd = new Date().toISOString();
    recording.fileSize = fileInfo.size;
    recording.filePath = fileInfo.path;
    recording.format = fileInfo.format || 'mp4';

    this.recordings.push(recording);
    this.scheduled.splice(index, 1);

    this.saveRecordings();
    this.saveScheduled();

    return recording;
  }

  failRecording(recordingId, error) {
    const index = this.scheduled.findIndex(r => r.id === recordingId);
    if (index === -1) return null;

    const recording = this.scheduled[index];
    recording.status = 'failed';
    recording.error = error;
    recording.failedAt = new Date().toISOString();

    this.recordings.push(recording);
    this.scheduled.splice(index, 1);

    this.saveRecordings();
    this.saveScheduled();

    return recording;
  }

  getUserRecordings(userId, status = null) {
    let recordings = this.recordings.filter(r => r.userId === userId);
    
    if (status) {
      recordings = recordings.filter(r => r.status === status);
    }

    return recordings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getUserScheduled(userId) {
    return this.scheduled
      .filter(r => r.userId === userId)
      .sort((a, b) => 
        new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
      );
  }

  deleteRecording(recordingId, userId) {
    const index = this.recordings.findIndex(r => 
      r.id === recordingId && r.userId === userId
    );

    if (index === -1) {
      return { success: false, error: 'Recording not found' };
    }

    this.recordings.splice(index, 1);
    this.saveRecordings();

    return { success: true };
  }

  getUserStorageUsage(userId) {
    const userRecordings = this.recordings.filter(r => 
      r.userId === userId && r.status === 'completed'
    );

    const totalSize = userRecordings.reduce((sum, r) => sum + (r.fileSize || 0), 0);
    const count = userRecordings.length;

    return {
      count,
      totalSize,
      totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      recordings: userRecordings
    };
  }

  getUpcomingRecordings(minutesAhead = 60) {
    const now = new Date();
    const futureTime = new Date(now.getTime() + minutesAhead * 60 * 1000);

    return this.scheduled.filter(r => {
      const startTime = new Date(r.scheduledStart);
      return startTime >= now && startTime <= futureTime && r.status === 'scheduled';
    });
  }

  processScheduledRecordings() {
    const upcoming = this.getUpcomingRecordings(5);
    
    for (const recording of upcoming) {
      const startTime = new Date(recording.scheduledStart);
      const now = new Date();
      
      if (startTime <= now && recording.status === 'scheduled') {
        console.log(`🔴 Starting recording: ${recording.programTitle}`);
        this.startRecording(recording.id);
      }
    }
  }

  getDVRStats() {
    const totalRecordings = this.recordings.length;
    const totalScheduled = this.scheduled.length;
    const completed = this.recordings.filter(r => r.status === 'completed').length;
    const failed = this.recordings.filter(r => r.status === 'failed').length;
    const recording = this.scheduled.filter(r => r.status === 'recording').length;

    const totalStorage = this.recordings
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.fileSize || 0), 0);

    return {
      totalRecordings,
      totalScheduled,
      completed,
      failed,
      recording,
      totalStorageGB: (totalStorage / (1024 * 1024 * 1024)).toFixed(2)
    };
  }
}

export const cloudDVR = new CloudDVR();
