import { spawn } from 'child_process';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class VideoProcessor {
  constructor() {
    this.uploadsDir = join(__dirname, '..', 'uploads');
    this.encodedDir = join(__dirname, '..', 'encoded');
    this.thumbnailsDir = join(__dirname, '..', 'thumbnails');
    
    [this.uploadsDir, this.encodedDir, this.thumbnailsDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async encodeVideo(inputPath, outputBaseName, resolutions = ['360p', '480p', '720p', '1080p']) {
    const resolutionMap = {
      '360p': { width: 640, height: 360, bitrate: '800k' },
      '480p': { width: 854, height: 480, bitrate: '1400k' },
      '720p': { width: 1280, height: 720, bitrate: '2800k' },
      '1080p': { width: 1920, height: 1080, bitrate: '5000k' }
    };

    const encodedFiles = [];

    for (const res of resolutions) {
      const config = resolutionMap[res];
      if (!config) continue;

      const outputPath = join(this.encodedDir, `${outputBaseName}_${res}.mp4`);
      
      try {
        await this.encodeToResolution(inputPath, outputPath, config);
        encodedFiles.push({
          resolution: res,
          path: outputPath,
          url: `/encoded/${outputBaseName}_${res}.mp4`
        });
      } catch (err) {
        console.error(`Failed to encode ${res}:`, err);
      }
    }

    return encodedFiles;
  }

  encodeToResolution(inputPath, outputPath, config) {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-vf', `scale=${config.width}:${config.height}`,
        '-c:v', 'libx264',
        '-b:v', config.bitrate,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
  }

  async generateThumbnail(videoPath, outputName, timestamp = '00:00:05') {
    const outputPath = join(this.thumbnailsDir, `${outputName}.jpg`);

    return new Promise((resolve, reject) => {
      const args = [
        '-i', videoPath,
        '-ss', timestamp,
        '-vframes', '1',
        '-vf', 'scale=1280:720',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({
            path: outputPath,
            url: `/thumbnails/${outputName}.jpg`
          });
        } else {
          reject(new Error(`FFmpeg thumbnail generation failed with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
  }

  async generateMultipleThumbnails(videoPath, outputBaseName, count = 5) {
    const thumbnails = [];
    const duration = await this.getVideoDuration(videoPath);
    const interval = duration / (count + 1);

    for (let i = 1; i <= count; i++) {
      const timestamp = this.formatTimestamp(interval * i);
      try {
        const thumb = await this.generateThumbnail(videoPath, `${outputBaseName}_${i}`, timestamp);
        thumbnails.push(thumb);
      } catch (err) {
        console.error(`Failed to generate thumbnail ${i}:`, err);
      }
    }

    return thumbnails;
  }

  getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', videoPath,
        '-show_entries', 'format=duration',
        '-v', 'quiet',
        '-of', 'csv=p=0'
      ];

      const ffprobe = spawn('ffprobe', args);
      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve(parseFloat(output.trim()));
        } else {
          reject(new Error('Failed to get video duration'));
        }
      });

      ffprobe.on('error', (err) => {
        reject(err);
      });
    });
  }

  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async processUploadedVideo(videoPath, baseName) {
    console.log(`Processing video: ${baseName}`);
    
    const [encodedFiles, thumbnails] = await Promise.all([
      this.encodeVideo(videoPath, baseName),
      this.generateMultipleThumbnails(videoPath, baseName)
    ]);

    return {
      encoded: encodedFiles,
      thumbnails,
      original: videoPath
    };
  }
}

export const videoProcessor = new VideoProcessor();
