import { createWriteStream, existsSync, mkdirSync, unlinkSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class UploadHandler {
  constructor() {
    this.uploadsDir = join(__dirname, '..', 'uploads');
    this.chunksDir = join(__dirname, '..', 'chunks');
    
    [this.uploadsDir, this.chunksDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    this.activeUploads = new Map();
  }

  generateUploadId() {
    return crypto.randomBytes(16).toString('hex');
  }

  initializeUpload(filename, totalChunks, fileSize) {
    const uploadId = this.generateUploadId();
    const uploadDir = join(this.chunksDir, uploadId);
    
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    this.activeUploads.set(uploadId, {
      filename,
      totalChunks,
      fileSize,
      uploadedChunks: new Set(),
      uploadDir,
      createdAt: Date.now()
    });

    return uploadId;
  }

  async saveChunk(uploadId, chunkIndex, chunkData) {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw new Error('Upload not found');
    }

    const chunkPath = join(upload.uploadDir, `chunk_${chunkIndex}`);
    await this.writeFile(chunkPath, chunkData);
    
    upload.uploadedChunks.add(chunkIndex);

    return {
      uploadId,
      chunkIndex,
      uploadedChunks: upload.uploadedChunks.size,
      totalChunks: upload.totalChunks,
      progress: (upload.uploadedChunks.size / upload.totalChunks) * 100
    };
  }

  async finalizeUpload(uploadId) {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      throw new Error('Upload not found');
    }

    if (upload.uploadedChunks.size !== upload.totalChunks) {
      throw new Error('Not all chunks uploaded');
    }

    const finalPath = join(this.uploadsDir, upload.filename);
    const writeStream = createWriteStream(finalPath);

    for (let i = 0; i < upload.totalChunks; i++) {
      const chunkPath = join(upload.uploadDir, `chunk_${i}`);
      const chunkData = await this.readFile(chunkPath);
      writeStream.write(chunkData);
      unlinkSync(chunkPath);
    }

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        this.cleanupUpload(uploadId);
        resolve({
          uploadId,
          filename: upload.filename,
          path: finalPath,
          size: upload.fileSize
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

      writeStream.end();
    });
  }

  cleanupUpload(uploadId) {
    const upload = this.activeUploads.get(uploadId);
    if (upload && existsSync(upload.uploadDir)) {
      try {
        const fs = require('fs');
        fs.rmSync(upload.uploadDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Failed to cleanup upload directory:', err);
      }
    }
    this.activeUploads.delete(uploadId);
  }

  getUploadStatus(uploadId) {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) {
      return null;
    }

    return {
      uploadId,
      filename: upload.filename,
      uploadedChunks: upload.uploadedChunks.size,
      totalChunks: upload.totalChunks,
      progress: (upload.uploadedChunks.size / upload.totalChunks) * 100,
      createdAt: upload.createdAt
    };
  }

  writeFile(path, data) {
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(path);
      writeStream.write(data);
      writeStream.end();
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  readFile(path) {
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      fs.readFile(path, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  cleanupOldUploads(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [uploadId, upload] of this.activeUploads.entries()) {
      if (now - upload.createdAt > maxAge) {
        this.cleanupUpload(uploadId);
      }
    }
  }
}

export const uploadHandler = new UploadHandler();

setInterval(() => {
  uploadHandler.cleanupOldUploads();
}, 60 * 60 * 1000);
