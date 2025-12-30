import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Enhanced rate limiting for authentication - ENABLED
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 login attempts per 15 minutes
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Trop de tentatives. Réessayez dans 15 minutes.',
      retryAfter: 900
    });
  }
});

// Strict rate limiting for registration - ENABLED
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 account creations per hour per IP
  message: 'Trop de créations de compte. Réessayez dans 1 heure.',
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de créations de compte. Réessayez dans 1 heure.',
      retryAfter: 3600
    });
  }
});

// API rate limiting - ENABLED
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Trop de requêtes. Réessayez plus tard.',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de requêtes. Réessayez plus tard.',
      retryAfter: 900
    });
  }
});

// Payment rate limiting - ENABLED
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per 15 minutes
  message: 'Trop de tentatives de paiement.',
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de tentatives de paiement. Réessayez dans 15 minutes.',
      retryAfter: 900
    });
  }
});

// Upload rate limiting - ENABLED
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour per IP
  message: 'Limite d\'uploads atteinte. Réessayez dans 1 heure.',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Limite d\'uploads atteinte. Réessayez dans 1 heure.',
      retryAfter: 3600
    });
  }
});

// CSRF Token generation and validation
const csrfTokens = new Map();

export function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now()
  });
  
  // Clean old tokens (> 1 hour)
  for (const [id, data] of csrfTokens.entries()) {
    if (Date.now() - data.createdAt > 3600000) {
      csrfTokens.delete(id);
    }
  }
  
  return token;
}

export function validateCSRFToken(sessionId, token) {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (Date.now() - stored.createdAt > 3600000) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

// Input validation middleware
export function validateInput(schema) {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      if (rules.required && !value) {
        errors.push(`${field} est requis`);
        continue;
      }
      
      if (value) {
        if (rules.type === 'email' && !isValidEmail(value)) {
          errors.push(`${field} doit être un email valide`);
        }
        
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} doit être une chaîne de caractères`);
        }
        
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} doit contenir au moins ${rules.minLength} caractères`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} ne peut pas dépasser ${rules.maxLength} caractères`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} a un format invalide`);
        }
        
        if (rules.min && value < rules.min) {
          errors.push(`${field} doit être supérieur ou égal à ${rules.min}`);
        }
        
        if (rules.max && value > rules.max) {
          errors.push(`${field} doit être inférieur ou égal à ${rules.max}`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('. ') });
    }
    
    next();
  };
}

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Security headers middleware
export function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove powered by header
  res.removeHeader('X-Powered-By');
  
  next();
}

// Request logging for security
export function securityLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      console.warn('[SECURITY]', JSON.stringify(log));
    }
    
    // Log slow requests (potential DoS)
    if (duration > 5000) {
      console.warn('[PERFORMANCE]', JSON.stringify(log));
    }
  });
  
  next();
}

// File upload validation
export function validateFileUpload(allowedTypes, maxSize) {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }
    
    const file = req.file;
    
    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      });
    }
    
    // Check file size
    if (maxSize && file.size > maxSize) {
      return res.status(400).json({
        error: `Fichier trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`
      });
    }
    
    // Check for malicious file names
    if (file.originalname.includes('..') || file.originalname.includes('/')) {
      return res.status(400).json({
        error: 'Nom de fichier invalide'
      });
    }
    
    next();
  };
}

// SQL Injection protection (even though we use JSON)
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/eval\(/gi, '')
    .replace(/script/gi, '')
    .trim()
    .substring(0, 10000);
}

// Password strength validator
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  // Check for common passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Ce mot de passe est trop commun');
  }
  
  return errors;
}

// Prevent timing attacks on password comparison
export function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// IP Blacklist management
const ipBlacklist = new Set();
const failedAttempts = new Map();

export function checkBlacklist(req, res, next) {
  const ip = req.ip;
  
  if (ipBlacklist.has(ip)) {
    console.warn(`[SECURITY] Blocked request from blacklisted IP: ${ip}`);
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  next();
}

export function recordFailedAttempt(ip) {
  const attempts = failedAttempts.get(ip) || { count: 0, firstAttempt: Date.now() };
  attempts.count++;
  
  if (attempts.count >= 10) {
    ipBlacklist.add(ip);
    console.error(`[SECURITY] IP blacklisted after 10 failed attempts: ${ip}`);
    
    // Auto-remove from blacklist after 24 hours
    setTimeout(() => {
      ipBlacklist.delete(ip);
      failedAttempts.delete(ip);
    }, 24 * 60 * 60 * 1000);
  }
  
  failedAttempts.set(ip, attempts);
}

// Clean up old failed attempts
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of failedAttempts.entries()) {
    if (now - data.firstAttempt > 3600000) { // 1 hour
      failedAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000); // Every hour
