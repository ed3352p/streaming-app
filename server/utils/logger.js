import { writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGS_DIR = join(__dirname, '..', 'logs');

if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  SECURITY: 'SECURITY'
};

class Logger {
  constructor() {
    this.logFile = join(LOGS_DIR, `app_${this.getDateString()}.log`);
    this.securityLogFile = join(LOGS_DIR, `security_${this.getDateString()}.log`);
    this.errorLogFile = join(LOGS_DIR, `error_${this.getDateString()}.log`);
  }

  getDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatLog(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level,
      message,
      ...meta
    }) + '\n';
  }

  log(level, message, meta = {}) {
    const logEntry = this.formatLog(level, message, meta);
    
    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m',
      WARN: '\x1b[33m',
      INFO: '\x1b[36m',
      DEBUG: '\x1b[90m',
      SECURITY: '\x1b[35m'
    };
    
    console.log(`${colors[level] || ''}[${level}]\x1b[0m ${message}`, meta);
    
    // Write to main log file
    try {
      appendFileSync(this.logFile, logEntry);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
    
    // Write to specific log files
    if (level === LOG_LEVELS.SECURITY) {
      try {
        appendFileSync(this.securityLogFile, logEntry);
      } catch (err) {
        console.error('Failed to write to security log:', err);
      }
    }
    
    if (level === LOG_LEVELS.ERROR) {
      try {
        appendFileSync(this.errorLogFile, logEntry);
      } catch (err) {
        console.error('Failed to write to error log:', err);
      }
    }
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }

  security(message, meta = {}) {
    this.log(LOG_LEVELS.SECURITY, message, meta);
  }

  // Security-specific logging methods
  logFailedLogin(ip, identifier) {
    this.security('Failed login attempt', { ip, identifier });
  }

  logSuccessfulLogin(ip, userId, username) {
    this.security('Successful login', { ip, userId, username });
  }

  logPasswordChange(userId, ip) {
    this.security('Password changed', { userId, ip });
  }

  logSuspiciousActivity(ip, activity, details = {}) {
    this.security('Suspicious activity detected', { ip, activity, ...details });
  }

  logFileUpload(userId, filename, size, ip) {
    this.info('File uploaded', { userId, filename, size, ip });
  }

  logRateLimitExceeded(ip, endpoint) {
    this.security('Rate limit exceeded', { ip, endpoint });
  }

  logUnauthorizedAccess(ip, endpoint, userId = null) {
    this.security('Unauthorized access attempt', { ip, endpoint, userId });
  }

  logDataBreach(type, details) {
    this.error('POTENTIAL DATA BREACH', { type, ...details });
    // In production, this should trigger alerts
  }
}

export const logger = new Logger();
export default logger;
