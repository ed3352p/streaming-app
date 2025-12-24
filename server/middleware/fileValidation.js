import crypto from 'crypto';
import { readFileSync } from 'fs';

// Magic numbers for file type validation
const FILE_SIGNATURES = {
  // Video formats
  'video/mp4': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
    [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70]
  ],
  'video/avi': [[0x52, 0x49, 0x46, 0x46]], // RIFF
  'video/x-matroska': [[0x1A, 0x45, 0xDF, 0xA3]], // MKV
  'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]], // WebM
  'video/quicktime': [[0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]], // MOV
  
  // Image formats
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]]
};

// Validate file by magic number (not just extension)
export function validateFileType(filePath, expectedMimeType) {
  try {
    const buffer = readFileSync(filePath);
    const signatures = FILE_SIGNATURES[expectedMimeType];
    
    if (!signatures) {
      return false;
    }
    
    for (const signature of signatures) {
      let match = true;
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    
    return false;
  } catch (err) {
    console.error('File validation error:', err);
    return false;
  }
}

// Generate secure filename
export function generateSecureFilename(originalName) {
  const ext = originalName.split('.').pop().toLowerCase();
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  
  // Whitelist allowed extensions
  const allowedExtensions = [
    'mp4', 'avi', 'mkv', 'webm', 'mov',
    'jpg', 'jpeg', 'png', 'gif', 'webp'
  ];
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Extension de fichier non autorisée');
  }
  
  return `${timestamp}_${hash}.${ext}`;
}

// Scan for malicious content in filename
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .substring(0, 255);
}

// Check if file is potentially malicious
export function isSuspiciousFile(filename, mimetype) {
  const suspiciousExtensions = [
    'exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'js', 'jar',
    'app', 'deb', 'rpm', 'dmg', 'pkg', 'msi', 'dll', 'so'
  ];
  
  const ext = filename.split('.').pop().toLowerCase();
  
  if (suspiciousExtensions.includes(ext)) {
    return true;
  }
  
  // Check for double extensions
  const parts = filename.split('.');
  if (parts.length > 2) {
    for (let i = 0; i < parts.length - 1; i++) {
      if (suspiciousExtensions.includes(parts[i].toLowerCase())) {
        return true;
      }
    }
  }
  
  // Check MIME type mismatch
  if (mimetype && !mimetype.startsWith('video/') && !mimetype.startsWith('image/')) {
    return true;
  }
  
  return false;
}

// Validate video file metadata
export async function validateVideoMetadata(filePath) {
  // This would use ffprobe in production
  // For now, basic validation
  try {
    const stats = await import('fs').then(fs => fs.promises.stat(filePath));
    
    // Check file size (max 10GB)
    if (stats.size > 10 * 1024 * 1024 * 1024) {
      return { valid: false, error: 'Fichier trop volumineux (max 10GB)' };
    }
    
    // Check if file is empty
    if (stats.size === 0) {
      return { valid: false, error: 'Fichier vide' };
    }
    
    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Impossible de lire le fichier' };
  }
}

// Calculate file hash for integrity check
export function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const fs = require('fs');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Quarantine suspicious files
export function quarantineFile(filePath) {
  const fs = require('fs');
  const path = require('path');
  
  const quarantineDir = path.join(path.dirname(filePath), 'quarantine');
  
  if (!fs.existsSync(quarantineDir)) {
    fs.mkdirSync(quarantineDir, { recursive: true });
  }
  
  const filename = path.basename(filePath);
  const quarantinePath = path.join(quarantineDir, `${Date.now()}_${filename}`);
  
  fs.renameSync(filePath, quarantinePath);
  
  console.warn(`[SECURITY] File quarantined: ${filename} -> ${quarantinePath}`);
  
  return quarantinePath;
}
