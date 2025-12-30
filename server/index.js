import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { trackView, trackAdImpression, trackAdClick, trackSession, trackBandwidth, getAnalytics, getPopularContent, getStatsByGenre, getPeakHours, getTrends } from './utils/analytics.js';
import { getGeoLocation, getClientIP } from './utils/geoip.js';
import { uploadHandler } from './utils/uploadHandler.js';
import { videoProcessor } from './utils/videoProcessor.js';
import multer from 'multer';
import { 
  authLimiter, 
  registerLimiter, 
  apiLimiter, 
  uploadLimiter,
  paymentLimiter,
  securityHeaders,
  securityLogger,
  checkBlacklist,
  recordFailedAttempt,
  validateInput,
  validatePasswordStrength
} from './middleware/security.js';
import { 
  validateFileType, 
  generateSecureFilename, 
  isSuspiciousFile,
  validateVideoMetadata 
} from './middleware/fileValidation.js';
import logger from './utils/logger.js';
import { 
  SUBSCRIPTION_PLANS,
  createBTCPayment,
  verifyBTCTransaction,
  getUserPayments,
  getUserSubscription,
  cancelSubscription,
  validatePromoCode,
  getBTCRate
} from './utils/bitcoin.js';
import {
  SUBSCRIPTION_PLANS as SOLANA_PLANS,
  verifySolanaTransaction,
  verifyAndActivateSubscription,
  getUserSubscription as getSolanaSubscription,
  getSOLRate
} from './utils/solana.js';
import {
  createAccessCode,
  redeemAccessCode,
  getAllAccessCodes,
  getAccessCodesStats,
  deleteAccessCode,
  deleteUsedCodes,
  exportCodesCSV
} from './utils/accessCodes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// Secure JWT Secret management - generate and persist if not exists
const SECRET_FILE = join(__dirname, 'data', '.jwt_secret');
function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  
  if (existsSync(SECRET_FILE)) {
    return readFileSync(SECRET_FILE, 'utf-8').trim();
  }
  
  // Generate a secure random secret
  const secret = crypto.randomBytes(64).toString('hex');
  if (!existsSync(join(__dirname, 'data'))) {
    mkdirSync(join(__dirname, 'data'), { recursive: true });
  }
  writeFileSync(SECRET_FILE, secret);
  console.log('🔐 New JWT secret generated and saved');
  return secret;
}

const JWT_SECRET = getJwtSecret();

// Rate limiting storage (in-memory, resets on server restart)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  
  // Reset if window expired
  if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - attempts.firstAttempt)) / 1000);
    return { allowed: false, waitTime, remaining: 0 };
  }
  
  return { allowed: true, remaining: MAX_ATTEMPTS - attempts.count };
}

function clearRateLimit(ip) {
  loginAttempts.delete(ip);
}

// Password validation
function validatePassword(password) {
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
  return errors;
}

// Generate secure random password
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  // Ensure password meets requirements
  password = password.slice(0, 12) + 'Aa1!';
  return password;
}

// Data files
const DATA_DIR = join(__dirname, 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const MOVIES_FILE = join(DATA_DIR, 'movies.json');
const SERIES_FILE = join(DATA_DIR, 'series.json');
const IPTV_FILE = join(DATA_DIR, 'iptv.json');
const ADS_FILE = join(DATA_DIR, 'ads.json');
const WATCHLIST_FILE = join(DATA_DIR, 'watchlist.json');
const FAVORITES_FILE = join(DATA_DIR, 'favorites.json');
const HISTORY_FILE = join(DATA_DIR, 'history.json');
const BOOKMARKS_FILE = join(DATA_DIR, 'bookmarks.json');
const PAYMENTS_FILE = join(DATA_DIR, 'payments.json');
const SUBSCRIPTIONS_FILE = join(DATA_DIR, 'subscriptions.json');
const PROMO_CODES_FILE = join(DATA_DIR, 'promo_codes.json');
const ACCESS_CODES_FILE = join(DATA_DIR, 'access_codes.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Security Middleware
// Helmet - Secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "http://localhost:*", "https://min-stream.click"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS with strict origin control
app.use(cors({
  origin: ['https://min-stream.click', 'http://min-stream.click', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// Security middleware
app.use(securityHeaders);
app.use(securityLogger);
app.use(checkBlacklist);

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Apply API rate limiting to all API routes (sauf paiements) - DISABLED
// app.use('/api', (req, res, next) => {
//   // Exclure les routes de paiement du rate limiter global
//   if (req.path.startsWith('/payment/') || req.path.startsWith('/subscription/')) {
//     return next();
//   }
//   return apiLimiter(req, res, next);
// });

// Global rate limiter - DISABLED
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000, // Limit each IP to 1000 requests per windowMs
//   message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
//   standardHeaders: true,
//   legacyHeaders: false
// });
// app.use(globalLimiter);

// Strict rate limiter for auth endpoints - DISABLED
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 20, // Limit each IP to 20 requests per windowMs
// });

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '..', 'dist')));
}

// Helper functions for JSON file database
function readData(file) {
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeData(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// Input validation and sanitization
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Initialize default admin user with secure random password
async function initDefaultUsers() {
  const users = readData(USERS_FILE);
  if (users.length === 0) {
    // Generate secure random password for admin
    const adminPassword = generateSecurePassword();
    const adminHash = await bcrypt.hash(adminPassword, 12); // Higher cost factor
    
    const defaultUsers = [
      {
        id: 1,
        email: 'admin@streambox.com',
        username: 'admin',
        passwordHash: adminHash,
        role: 'admin',
        premium: true,
        name: 'Administrateur',
        mustChangePassword: true, // Force password change on first login
        createdAt: new Date().toISOString()
      }
    ];
    writeData(USERS_FILE, defaultUsers);
    
    // Save admin credentials to a secure file (delete after first login)
    const credentialsFile = join(DATA_DIR, '.admin_credentials');
    writeFileSync(credentialsFile, `
========================================
  STREAMBOX - IDENTIFIANTS ADMIN
========================================
Email: admin@streambox.com
Username: admin
Password: ${adminPassword}

⚠️  IMPORTANT: Changez ce mot de passe
    immédiatement après la première
    connexion!
    
    Ce fichier sera supprimé après
    le changement de mot de passe.
========================================
`);
    
    console.log('✅ Admin user created');
    console.log('🔑 Admin credentials saved to: server/data/.admin_credentials');
    console.log('⚠️  Please change the admin password immediately after first login!');
  }
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès admin requis' });
  }
  next();
}

// ============ AUTH ROUTES ============

app.post('/api/auth/login', async (req, res) => {
  try {
    let { identifier, password } = req.body;
    
    // Sanitize identifier input
    identifier = sanitizeString(identifier).toLowerCase();
    
    // Validate inputs
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
    }
    
    const users = readData(USERS_FILE);
    
    const user = users.find(u => u.email === identifier || u.username.toLowerCase() === identifier);
    
    if (!user) {
      logger.logFailedLogin(req.ip, identifier);
      recordFailedAttempt(req.ip);
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      logger.logFailedLogin(req.ip, identifier);
      recordFailedAttempt(req.ip);
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    }
    
    logger.logSuccessfulLogin(req.ip, user.id, user.username);
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        premium: user.premium || user.role === 'admin',
        name: user.name || user.username,
        mustChangePassword: user.mustChangePassword || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    let { email, username, password, name } = req.body;
    
    // Sanitize inputs
    email = sanitizeString(email).toLowerCase();
    username = sanitizeString(username);
    name = sanitizeString(name);
    
    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }
    
    // Validate username
    if (!validateUsername(username)) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir 3-20 caractères alphanumériques' });
    }
    
    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: passwordErrors.join('. ') });
    }
    
    const users = readData(USERS_FILE);
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const newUser = {
      id: Date.now(),
      email: email.toLowerCase(),
      username,
      passwordHash,
      role: 'user',
      premium: false,
      name: name || username,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeData(USERS_FILE, users);
    
    logger.info('New user registered', { userId: newUser.id, email: newUser.email, ip: req.ip });
    
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        premium: newUser.premium,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const users = readData(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    premium: user.premium || user.role === 'admin',
    name: user.name || user.username,
    mustChangePassword: user.mustChangePassword || false
  });
});

// Endpoint sécurisé pour vérifier le statut premium (anti-bypass)
app.get('/api/auth/verify-premium', authenticateToken, (req, res) => {
  const users = readData(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé', isPremium: false, maxQuality: 360 });
  }
  
  const isPremium = user.premium === true || user.role === 'admin';
  
  res.json({
    isPremium,
    role: user.role,
    maxQuality: isPremium ? 9999 : 360, // 9999 = illimité, 360 = max pour gratuit
    skipAds: isPremium
  });
});

// Change password route
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const user = users[userIndex];
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }
    
    // Validate new password strength
    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: passwordErrors.join('. ') });
    }
    
    // Check that new password is different
    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'ancien' });
    }
    
    // Update password
    users[userIndex].passwordHash = await bcrypt.hash(newPassword, 12);
    users[userIndex].mustChangePassword = false;
    users[userIndex].passwordChangedAt = new Date().toISOString();
    writeData(USERS_FILE, users);
    
    logger.logPasswordChange(req.user.id, req.ip);
    
    // Delete admin credentials file if it exists (after first password change)
    const credentialsFile = join(DATA_DIR, '.admin_credentials');
    if (existsSync(credentialsFile) && user.role === 'admin') {
      const { unlinkSync } = await import('fs');
      unlinkSync(credentialsFile);
      console.log('🗑️  Admin credentials file deleted for security');
    }
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Create new user
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, username, password, name, role, premium } = req.body;
    
    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: passwordErrors.join('. ') });
    }
    
    const users = readData(USERS_FILE);
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const newUser = {
      id: Date.now(),
      email: email.toLowerCase(),
      username,
      passwordHash,
      role: role || 'user',
      premium: premium || false,
      name: name || username,
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeData(USERS_FILE, users);
    
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Reset user password
app.post('/api/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Generate new random password
    const newPassword = generateSecurePassword();
    users[userIndex].passwordHash = await bcrypt.hash(newPassword, 12);
    users[userIndex].mustChangePassword = true;
    writeData(USERS_FILE, users);
    
    res.json({ 
      message: 'Mot de passe réinitialisé',
      temporaryPassword: newPassword
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ MOVIES ROUTES ============

app.get('/api/movies', (req, res) => {
  const movies = readData(MOVIES_FILE);
  res.json(movies);
});

app.get('/api/movies/:id', (req, res) => {
  const movies = readData(MOVIES_FILE);
  const id = req.params.id;
  const movie = movies.find(m => m.id == id || m.id === parseInt(id));
  
  if (!movie) {
    return res.status(404).json({ error: 'Film non trouvé' });
  }
  
  res.json(movie);
});

app.post('/api/movies', authenticateToken, requireAdmin, (req, res) => {
  const movies = readData(MOVIES_FILE);
  
  // Sanitize and validate movie data
  const { title, description, genre, year, imageUrl, videoUrl, rating } = req.body;
  
  if (!title || !description || !genre) {
    return res.status(400).json({ error: 'Titre, description et genre requis' });
  }
  
  // Validate URLs if provided
  if (imageUrl && !validateUrl(imageUrl)) {
    return res.status(400).json({ error: 'URL d\'image invalide' });
  }
  
  if (videoUrl && !validateUrl(videoUrl)) {
    return res.status(400).json({ error: 'URL de vidéo invalide' });
  }
  
  const newMovie = {
    id: Date.now(),
    title: sanitizeString(title),
    description: sanitizeString(description),
    genre: sanitizeString(genre),
    year: parseInt(year) || new Date().getFullYear(),
    imageUrl: imageUrl || '',
    videoUrl: videoUrl || '',
    rating: parseFloat(rating) || 0,
    createdAt: new Date().toISOString()
  };
  
  movies.push(newMovie);
  writeData(MOVIES_FILE, movies);
  
  res.status(201).json(newMovie);
});

app.put('/api/movies/:id', authenticateToken, requireAdmin, (req, res) => {
  const movies = readData(MOVIES_FILE);
  const index = movies.findIndex(m => m.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Film non trouvé' });
  }
  
  movies[index] = { ...movies[index], ...req.body, updatedAt: new Date().toISOString() };
  writeData(MOVIES_FILE, movies);
  
  res.json(movies[index]);
});

app.delete('/api/movies/:id', authenticateToken, requireAdmin, (req, res) => {
  const movies = readData(MOVIES_FILE);
  const index = movies.findIndex(m => m.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Film non trouvé' });
  }
  
  movies.splice(index, 1);
  writeData(MOVIES_FILE, movies);
  
  res.json({ message: 'Film supprimé' });
});

// ============ SERIES ROUTES ============

app.get('/api/series', (req, res) => {
  const series = readData(SERIES_FILE);
  res.json(series);
});

app.get('/api/series/:id', (req, res) => {
  const series = readData(SERIES_FILE);
  const show = series.find(s => s.id === parseInt(req.params.id));
  
  if (!show) {
    return res.status(404).json({ error: 'Série non trouvée' });
  }
  
  res.json(show);
});

app.post('/api/series', authenticateToken, requireAdmin, (req, res) => {
  const series = readData(SERIES_FILE);
  
  const newSeries = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  series.push(newSeries);
  writeData(SERIES_FILE, series);
  
  res.status(201).json(newSeries);
});

app.put('/api/series/:id', authenticateToken, requireAdmin, (req, res) => {
  const series = readData(SERIES_FILE);
  const index = series.findIndex(s => s.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Série non trouvée' });
  }
  
  series[index] = { ...series[index], ...req.body, updatedAt: new Date().toISOString() };
  writeData(SERIES_FILE, series);
  
  res.json(series[index]);
});

app.delete('/api/series/:id', authenticateToken, requireAdmin, (req, res) => {
  const series = readData(SERIES_FILE);
  const index = series.findIndex(s => s.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Série non trouvée' });
  }
  
  series.splice(index, 1);
  writeData(SERIES_FILE, series);
  
  res.json({ message: 'Série supprimée' });
});

// ============ IPTV ROUTES ============

app.get('/api/iptv', (req, res) => {
  const iptv = readData(IPTV_FILE);
  res.json(iptv);
});

app.post('/api/iptv', authenticateToken, requireAdmin, (req, res) => {
  const iptv = readData(IPTV_FILE);
  
  const newChannel = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  iptv.push(newChannel);
  writeData(IPTV_FILE, iptv);
  
  res.status(201).json(newChannel);
});

app.put('/api/iptv/:id', authenticateToken, requireAdmin, (req, res) => {
  const iptv = readData(IPTV_FILE);
  const index = iptv.findIndex(c => c.id === req.params.id || c.id === parseInt(req.params.id));
  
  if (index === -1) {
    // Si la chaîne n'existe pas, on la crée (pour les chaînes du playlist.m3u8)
    const newChannel = {
      id: req.params.id,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    iptv.push(newChannel);
    writeData(IPTV_FILE, iptv);
    return res.status(201).json(newChannel);
  }
  
  iptv[index] = { ...iptv[index], ...req.body, updatedAt: new Date().toISOString() };
  writeData(IPTV_FILE, iptv);
  
  res.json(iptv[index]);
});

app.delete('/api/iptv/:id', authenticateToken, requireAdmin, (req, res) => {
  const iptv = readData(IPTV_FILE);
  const index = iptv.findIndex(c => c.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Chaîne non trouvée' });
  }
  
  iptv.splice(index, 1);
  writeData(IPTV_FILE, iptv);
  
  res.json({ message: 'Chaîne supprimée' });
});

// ============ ADS ROUTES ============

app.get('/api/ads', (req, res) => {
  const ads = readData(ADS_FILE);
  res.json(ads);
});

app.post('/api/ads', authenticateToken, requireAdmin, (req, res) => {
  const ads = readData(ADS_FILE);
  
  const newAd = {
    id: Date.now(),
    ...req.body,
    impressions: 0,
    clicks: 0,
    revenue: 0,
    cpm: req.body.cpm || 2.5,
    cpc: req.body.cpc || 0.5,
    active: req.body.active !== false,
    createdAt: new Date().toISOString()
  };
  
  ads.push(newAd);
  writeData(ADS_FILE, ads);
  
  res.status(201).json(newAd);
});

app.put('/api/ads/:id', authenticateToken, requireAdmin, (req, res) => {
  const ads = readData(ADS_FILE);
  const index = ads.findIndex(a => a.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Publicité non trouvée' });
  }
  
  ads[index] = { ...ads[index], ...req.body, updatedAt: new Date().toISOString() };
  writeData(ADS_FILE, ads);
  
  res.json(ads[index]);
});

app.delete('/api/ads/:id', authenticateToken, requireAdmin, (req, res) => {
  const ads = readData(ADS_FILE);
  const index = ads.findIndex(a => a.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Publicité non trouvée' });
  }
  
  ads.splice(index, 1);
  writeData(ADS_FILE, ads);
  
  res.json({ message: 'Publicité supprimée' });
});

// Track ad impression
app.post('/api/ads/:id/impression', async (req, res) => {
  try {
    const ads = readData(ADS_FILE);
    const adIndex = ads.findIndex(a => a.id === parseInt(req.params.id));
    
    if (adIndex !== -1) {
      ads[adIndex].impressions = (ads[adIndex].impressions || 0) + 1;
      ads[adIndex].revenue = (ads[adIndex].revenue || 0) + ((ads[adIndex].cpm || 2.5) / 1000);
      writeData(ADS_FILE, ads);
    }
    
    const ip = getClientIP(req);
    const geo = await getGeoLocation(ip);
    
    trackAdImpression({
      adId: parseInt(req.params.id),
      userId: req.body.userId,
      ip,
      ...geo
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track impression error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Track ad click
app.post('/api/ads/:id/click', async (req, res) => {
  try {
    const ads = readData(ADS_FILE);
    const adIndex = ads.findIndex(a => a.id === parseInt(req.params.id));
    
    if (adIndex !== -1) {
      ads[adIndex].clicks = (ads[adIndex].clicks || 0) + 1;
      ads[adIndex].revenue = (ads[adIndex].revenue || 0) + (ads[adIndex].cpc || 0.5);
      writeData(ADS_FILE, ads);
    }
    
    const ip = getClientIP(req);
    const geo = await getGeoLocation(ip);
    
    trackAdClick({
      adId: parseInt(req.params.id),
      userId: req.body.userId,
      ip,
      ...geo
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ ANALYTICS ROUTES ============

// Track view
app.post('/api/analytics/view', async (req, res) => {
  try {
    const ip = getClientIP(req);
    const geo = await getGeoLocation(ip);
    
    trackView({
      ...req.body,
      ip,
      ...geo
    });
    
    // Update movie/series view count
    if (req.body.contentType === 'movie') {
      const movies = readData(MOVIES_FILE);
      const movieIndex = movies.findIndex(m => m.id === parseInt(req.body.contentId));
      if (movieIndex !== -1) {
        movies[movieIndex].views = (movies[movieIndex].views || 0) + 1;
        writeData(MOVIES_FILE, movies);
      }
    } else if (req.body.contentType === 'series') {
      const series = readData(SERIES_FILE);
      const seriesIndex = series.findIndex(s => s.id === parseInt(req.body.contentId));
      if (seriesIndex !== -1) {
        series[seriesIndex].views = (series[seriesIndex].views || 0) + 1;
        writeData(SERIES_FILE, series);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Track session
app.post('/api/analytics/session', async (req, res) => {
  try {
    const ip = getClientIP(req);
    const geo = await getGeoLocation(ip);
    
    trackSession({
      ...req.body,
      ip,
      ...geo
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track session error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Track bandwidth
app.post('/api/analytics/bandwidth', (req, res) => {
  try {
    trackBandwidth(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Track bandwidth error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get analytics data
app.get('/api/analytics', authenticateToken, requireAdmin, (req, res) => {
  try {
    const timeRange = req.query.range || '24h';
    const analytics = getAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get popular content
app.get('/api/analytics/popular', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const popular = getPopularContent(limit);
    res.json(popular);
  } catch (error) {
    console.error('Get popular error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get stats by genre
app.get('/api/analytics/genres', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stats = getStatsByGenre();
    res.json(stats);
  } catch (error) {
    console.error('Get genre stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get peak hours
app.get('/api/analytics/peak-hours', authenticateToken, requireAdmin, (req, res) => {
  try {
    const peakHours = getPeakHours();
    res.json(peakHours);
  } catch (error) {
    console.error('Get peak hours error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get trends
app.get('/api/analytics/trends', authenticateToken, requireAdmin, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const trends = getTrends(days);
    res.json(trends);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get real-time stats
app.get('/api/analytics/realtime', authenticateToken, requireAdmin, (req, res) => {
  try {
    const analytics = getAnalytics('1h');
    const activeSessions = analytics.sessions.length;
    const recentViews = analytics.views.length;
    const recentBandwidth = analytics.bandwidth.reduce((sum, b) => sum + (b.bytes || 0), 0);
    
    res.json({
      activeSessions,
      recentViews,
      bandwidthMB: (recentBandwidth / 1024 / 1024).toFixed(2),
      sessions: analytics.sessions
    });
  } catch (error) {
    console.error('Get realtime error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ USERS ROUTES (Admin) ============

app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const users = readData(USERS_FILE);
  // Remove password hashes from response
  const safeUsers = users.map(({ passwordHash, ...user }) => user);
  res.json(safeUsers);
});

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const users = readData(USERS_FILE);
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  
  const updates = { ...req.body };
  if (updates.password) {
    updates.passwordHash = await bcrypt.hash(updates.password, 10);
    delete updates.password;
  }
  
  users[index] = { ...users[index], ...updates };
  writeData(USERS_FILE, users);
  
  const { passwordHash, ...safeUser } = users[index];
  res.json(safeUser);
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const users = readData(USERS_FILE);
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  
  // Don't allow deleting yourself
  if (users[index].id === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
  }
  
  users.splice(index, 1);
  writeData(USERS_FILE, users);
  
  res.json({ message: 'Utilisateur supprimé' });
});

// ============ WATCHLIST ROUTES ============

app.get('/api/watchlist', authenticateToken, (req, res) => {
  const watchlist = readData(WATCHLIST_FILE);
  const userWatchlist = watchlist.filter(w => w.userId === req.user.id);
  res.json(userWatchlist);
});

app.post('/api/watchlist', authenticateToken, (req, res) => {
  const watchlist = readData(WATCHLIST_FILE);
  const { contentId, contentType, title, imageUrl } = req.body;
  
  const exists = watchlist.find(w => 
    w.userId === req.user.id && w.contentId === contentId && w.contentType === contentType
  );
  
  if (exists) {
    return res.status(400).json({ error: 'Déjà dans la watchlist' });
  }
  
  const newItem = {
    id: Date.now(),
    userId: req.user.id,
    contentId,
    contentType,
    title,
    imageUrl,
    addedAt: new Date().toISOString()
  };
  
  watchlist.push(newItem);
  writeData(WATCHLIST_FILE, watchlist);
  res.status(201).json(newItem);
});

app.delete('/api/watchlist/:id', authenticateToken, (req, res) => {
  const watchlist = readData(WATCHLIST_FILE);
  const filtered = watchlist.filter(w => 
    !(w.id === parseInt(req.params.id) && w.userId === req.user.id)
  );
  
  if (filtered.length === watchlist.length) {
    return res.status(404).json({ error: 'Item non trouvé' });
  }
  
  writeData(WATCHLIST_FILE, filtered);
  res.json({ message: 'Retiré de la watchlist' });
});

// ============ FAVORITES ROUTES ============

app.get('/api/favorites', authenticateToken, (req, res) => {
  const favorites = readData(FAVORITES_FILE);
  const userFavorites = favorites.filter(f => f.userId === req.user.id);
  res.json(userFavorites);
});

app.post('/api/favorites', authenticateToken, (req, res) => {
  const favorites = readData(FAVORITES_FILE);
  const { contentId, contentType, title, imageUrl } = req.body;
  
  const exists = favorites.find(f => 
    f.userId === req.user.id && f.contentId === contentId && f.contentType === contentType
  );
  
  if (exists) {
    return res.status(400).json({ error: 'Déjà dans les favoris' });
  }
  
  const newItem = {
    id: Date.now(),
    userId: req.user.id,
    contentId,
    contentType,
    title,
    imageUrl,
    addedAt: new Date().toISOString()
  };
  
  favorites.push(newItem);
  writeData(FAVORITES_FILE, favorites);
  res.status(201).json(newItem);
});

app.delete('/api/favorites/:id', authenticateToken, (req, res) => {
  const favorites = readData(FAVORITES_FILE);
  const filtered = favorites.filter(f => 
    !(f.id === parseInt(req.params.id) && f.userId === req.user.id)
  );
  
  if (filtered.length === favorites.length) {
    return res.status(404).json({ error: 'Item non trouvé' });
  }
  
  writeData(FAVORITES_FILE, filtered);
  res.json({ message: 'Retiré des favoris' });
});

// ============ HISTORY ROUTES ============

app.get('/api/history', authenticateToken, (req, res) => {
  const history = readData(HISTORY_FILE);
  const userHistory = history
    .filter(h => h.userId === req.user.id)
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
    .slice(0, 50);
  res.json(userHistory);
});

app.post('/api/history', authenticateToken, (req, res) => {
  const history = readData(HISTORY_FILE);
  const { contentId, contentType, title, imageUrl, progress, duration } = req.body;
  
  const existingIndex = history.findIndex(h => 
    h.userId === req.user.id && h.contentId === contentId && h.contentType === contentType
  );
  
  if (existingIndex >= 0) {
    history[existingIndex] = {
      ...history[existingIndex],
      progress,
      duration,
      watchedAt: new Date().toISOString()
    };
  } else {
    history.push({
      id: Date.now(),
      userId: req.user.id,
      contentId,
      contentType,
      title,
      imageUrl,
      progress,
      duration,
      watchedAt: new Date().toISOString()
    });
  }
  
  writeData(HISTORY_FILE, history);
  res.json({ message: 'Historique mis à jour' });
});

app.delete('/api/history/:id', authenticateToken, (req, res) => {
  const history = readData(HISTORY_FILE);
  const filtered = history.filter(h => 
    !(h.id === parseInt(req.params.id) && h.userId === req.user.id)
  );
  
  writeData(HISTORY_FILE, filtered);
  res.json({ message: 'Retiré de l\'historique' });
});

// ============ BOOKMARKS ROUTES ============

app.get('/api/bookmarks/:contentId', authenticateToken, (req, res) => {
  const bookmarks = readData(BOOKMARKS_FILE);
  const bookmark = bookmarks.find(b => 
    b.userId === req.user.id && b.contentId === parseInt(req.params.contentId)
  );
  res.json(bookmark || null);
});

app.post('/api/bookmarks', authenticateToken, (req, res) => {
  const bookmarks = readData(BOOKMARKS_FILE);
  const { contentId, contentType, timestamp, duration } = req.body;
  
  const existingIndex = bookmarks.findIndex(b => 
    b.userId === req.user.id && b.contentId === contentId
  );
  
  if (existingIndex >= 0) {
    bookmarks[existingIndex] = {
      ...bookmarks[existingIndex],
      timestamp,
      duration,
      updatedAt: new Date().toISOString()
    };
  } else {
    bookmarks.push({
      id: Date.now(),
      userId: req.user.id,
      contentId,
      contentType,
      timestamp,
      duration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  writeData(BOOKMARKS_FILE, bookmarks);
  res.json({ message: 'Bookmark sauvegardé' });
});

// ============ SEARCH ROUTES ============

app.get('/api/search', (req, res) => {
  const { q, genre, year, minRating, maxDuration, quality, sort } = req.query;
  
  const movies = readData(MOVIES_FILE);
  const series = readData(SERIES_FILE);
  let results = [...movies.map(m => ({...m, type: 'movie'})), ...series.map(s => ({...s, type: 'series'}))];
  
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.genre?.toLowerCase().includes(query)
    );
  }
  
  if (genre) {
    results = results.filter(item => item.genre === genre);
  }
  
  if (year) {
    results = results.filter(item => item.year === parseInt(year));
  }
  
  if (minRating) {
    results = results.filter(item => (item.rating || 0) >= parseFloat(minRating));
  }
  
  if (maxDuration) {
    results = results.filter(item => !item.duration || item.duration <= parseInt(maxDuration));
  }
  
  if (quality) {
    results = results.filter(item => item.quality === quality);
  }
  
  if (sort === 'popularity') {
    results.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (sort === 'rating') {
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'year') {
    results.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (sort === 'title') {
    results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }
  
  res.json(results);
});

app.get('/api/search/suggestions', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
  }
  
  const movies = readData(MOVIES_FILE);
  const series = readData(SERIES_FILE);
  const all = [...movies, ...series];
  
  const query = q.toLowerCase();
  const suggestions = all
    .filter(item => item.title?.toLowerCase().includes(query))
    .slice(0, 10)
    .map(item => ({
      id: item.id,
      title: item.title,
      type: movies.includes(item) ? 'movie' : 'series'
    }));
  
  res.json(suggestions);
});

// ============ VIDEO UPLOAD ROUTES ============

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

app.post('/api/upload/init', authenticateToken, requireAdmin, (req, res) => {
  const { filename, totalChunks, fileSize } = req.body;
  const uploadId = uploadHandler.initializeUpload(filename, totalChunks, fileSize);
  res.json({ uploadId });
});

app.post('/api/upload/chunk', authenticateToken, requireAdmin, upload.single('chunk'), async (req, res) => {
  try {
    const { uploadId, chunkIndex } = req.body;
    const chunkData = req.file.buffer;
    
    // Validate chunk size
    if (chunkData.length > 100 * 1024 * 1024) {
      logger.security('Suspicious large chunk upload attempt', { 
        userId: req.user.id, 
        ip: req.ip, 
        size: chunkData.length 
      });
      return res.status(400).json({ error: 'Chunk trop volumineux' });
    }
    
    const result = await uploadHandler.saveChunk(uploadId, parseInt(chunkIndex), chunkData);
    res.json(result);
  } catch (err) {
    logger.error('Upload chunk error', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload/finalize', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { uploadId } = req.body;
    const result = await uploadHandler.finalizeUpload(uploadId);
    
    // Validate the uploaded file
    const isValid = validateFileType(result.path, 'video/mp4');
    if (!isValid) {
      logger.security('Invalid video file uploaded', { 
        userId: req.user.id, 
        filename: result.filename,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Type de fichier invalide' });
    }
    
    logger.logFileUpload(req.user.id, result.filename, result.size, req.ip);
    res.json(result);
  } catch (err) {
    logger.error('Finalize upload error', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/upload/status/:uploadId', authenticateToken, requireAdmin, (req, res) => {
  const status = uploadHandler.getUploadStatus(req.params.uploadId);
  if (!status) {
    return res.status(404).json({ error: 'Upload not found' });
  }
  res.json(status);
});

app.post('/api/video/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { videoPath, baseName } = req.body;
    const result = await videoProcessor.processUploadedVideo(videoPath, baseName);
    res.json(result);
  } catch (err) {
    console.error('Video processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/encoded', express.static(join(__dirname, 'encoded')));
app.use('/thumbnails', express.static(join(__dirname, 'thumbnails')));

// ============ PAYMENT & SUBSCRIPTION ROUTES ============

// Get subscription plans
app.get('/api/subscription/plans', (req, res) => {
  res.json(SUBSCRIPTION_PLANS);
});

// Get BTC rate
app.get('/api/payment/btc-rate', async (req, res) => {
  try {
    const rate = await getBTCRate();
    res.json({ rate });
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération taux BTC' });
  }
});

// Get SOL rate
app.get('/api/payment/sol-rate', async (req, res) => {
  try {
    const rate = await getSOLRate();
    res.json(rate);
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération taux SOL' });
  }
});

// Verify Solana payment
app.post('/api/verify-solana-payment', authenticateToken, async (req, res) => {
  try {
    const { userId, planId, signature, amount } = req.body;
    
    if (!userId || !planId || !signature || !amount) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Vérifier que l'utilisateur correspond
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Activer l'abonnement
    const subscription = await verifyAndActivateSubscription(userId, planId, signature, amount);
    
    // Mettre à jour le statut premium de l'utilisateur
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].premium = true;
      users[userIndex].premiumUntil = subscription.endDate;
      writeData(USERS_FILE, users);
    }

    logger.info('Solana payment verified and subscription activated', { 
      userId, 
      planId, 
      signature,
      ip: req.ip 
    });
    
    res.json({ 
      success: true, 
      subscription,
      message: 'Abonnement Premium activé avec succès!' 
    });
  } catch (err) {
    logger.error('Solana payment verification error', { 
      error: err.message, 
      userId: req.user.id 
    });
    res.status(400).json({ error: err.message });
  }
});

// Create BTC payment
app.post('/api/payment/create', authenticateToken, async (req, res) => {
  try {
    const { planId, promoCode } = req.body;
    
    if (!SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({ error: 'Plan invalide' });
    }

    const payment = await createBTCPayment(req.user.id, planId, promoCode);
    logger.info('BTC payment created', { userId: req.user.id, planId, paymentId: payment.id });
    
    res.json(payment);
  } catch (err) {
    logger.error('Payment creation error', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: err.message });
  }
});

// Verify BTC transaction
app.post('/api/payment/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentId, txHash } = req.body;
    
    if (!paymentId || !txHash) {
      return res.status(400).json({ error: 'paymentId et txHash requis' });
    }

    const result = await verifyBTCTransaction(paymentId, txHash);
    logger.security('BTC payment verified', { 
      userId: req.user.id, 
      paymentId, 
      txHash,
      ip: req.ip 
    });
    
    res.json(result);
  } catch (err) {
    logger.error('Payment verification error', { error: err.message, userId: req.user.id });
    res.status(400).json({ error: err.message });
  }
});

// Get payment status
app.get('/api/payment/:paymentId', authenticateToken, (req, res) => {
  try {
    const payments = readData(PAYMENTS_FILE);
    const payment = payments.find(p => 
      p.id === req.params.paymentId && p.userId === req.user.id
    );
    
    if (!payment) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }
    
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get user payments history
app.get('/api/payments', authenticateToken, (req, res) => {
  try {
    const payments = getUserPayments(req.user.id);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get user subscription
app.get('/api/subscription', authenticateToken, (req, res) => {
  try {
    // Essayer d'abord Solana, puis Bitcoin
    let subscription = getSolanaSubscription(req.user.id);
    if (!subscription) {
      subscription = getUserSubscription(req.user.id);
    }
    res.json(subscription || null);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Cancel subscription
app.post('/api/subscription/cancel', authenticateToken, (req, res) => {
  try {
    const success = cancelSubscription(req.user.id);
    if (success) {
      logger.info('Subscription canceled', { userId: req.user.id });
      res.json({ message: 'Abonnement annulé' });
    } else {
      res.status(404).json({ error: 'Aucun abonnement actif' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Validate promo code
app.post('/api/promo/validate', (req, res) => {
  try {
    const { code } = req.body;
    const result = validatePromoCode(code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Get all payments
app.get('/api/admin/payments', authenticateToken, requireAdmin, (req, res) => {
  try {
    const payments = readData(PAYMENTS_FILE);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Get all subscriptions
app.get('/api/admin/subscriptions', authenticateToken, requireAdmin, (req, res) => {
  try {
    const subscriptions = readData(SUBSCRIPTIONS_FILE);
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Manage promo codes
app.get('/api/admin/promo-codes', authenticateToken, requireAdmin, (req, res) => {
  try {
    const promoCodes = readData(PROMO_CODES_FILE);
    res.json(promoCodes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/admin/promo-codes', authenticateToken, requireAdmin, (req, res) => {
  try {
    const promoCodes = readData(PROMO_CODES_FILE);
    const newPromo = {
      id: Date.now(),
      ...req.body,
      usedCount: 0,
      active: true,
      createdAt: new Date().toISOString()
    };
    promoCodes.push(newPromo);
    writeData(PROMO_CODES_FILE, promoCodes);
    res.status(201).json(newPromo);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/admin/promo-codes/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const promoCodes = readData(PROMO_CODES_FILE);
    const index = promoCodes.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Code promo non trouvé' });
    }
    promoCodes[index] = { ...promoCodes[index], ...req.body };
    writeData(PROMO_CODES_FILE, promoCodes);
    res.json(promoCodes[index]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/admin/promo-codes/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const promoCodes = readData(PROMO_CODES_FILE);
    const filtered = promoCodes.filter(p => p.id !== parseInt(req.params.id));
    writeData(PROMO_CODES_FILE, filtered);
    res.json({ message: 'Code promo supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ ACCESS CODES ROUTES ============

// Generate access codes (Admin)
app.post('/api/admin/access-codes/generate', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { duration, quantity } = req.body;
    
    if (!duration || duration <= 0) {
      return res.status(400).json({ error: 'Durée invalide' });
    }
    
    if (!quantity || quantity <= 0 || quantity > 100) {
      return res.status(400).json({ error: 'Quantité invalide (max 100)' });
    }
    
    const codes = createAccessCode(duration, quantity, req.user.id);
    logger.info('Access codes generated', { 
      adminId: req.user.id, 
      duration, 
      quantity,
      ip: req.ip 
    });
    
    res.json({ codes, count: codes.length });
  } catch (err) {
    logger.error('Access code generation error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all access codes (Admin)
app.get('/api/admin/access-codes', authenticateToken, requireAdmin, (req, res) => {
  try {
    const codes = getAllAccessCodes();
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get access codes stats (Admin)
app.get('/api/admin/access-codes/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stats = getAccessCodesStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete access code (Admin)
app.delete('/api/admin/access-codes/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const success = deleteAccessCode(parseInt(req.params.id));
    if (success) {
      res.json({ message: 'Code supprimé' });
    } else {
      res.status(404).json({ error: 'Code non trouvé' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete all used codes (Admin)
app.delete('/api/admin/access-codes/used', authenticateToken, requireAdmin, (req, res) => {
  try {
    const count = deleteUsedCodes();
    res.json({ message: `${count} codes utilisés supprimés` });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Export codes as CSV (Admin)
app.get('/api/admin/access-codes/export', authenticateToken, requireAdmin, (req, res) => {
  try {
    const csv = exportCodesCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=access_codes.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Redeem access code (User)
app.post('/api/access-code/redeem', authenticateToken, (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code requis' });
    }
    
    const result = redeemAccessCode(code, req.user.id);
    
    if (result.success) {
      logger.info('Access code redeemed', { 
        userId: req.user.id, 
        code, 
        duration: result.duration,
        ip: req.ip 
      });
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    logger.error('Access code redemption error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============ SCRAPER ROUTE ============
app.post('/api/scrape', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

    // Retry logic with exponential backoff
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Fetch the HTML content with realistic headers
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
          },
          redirect: 'follow'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        if (html.length < 100) {
          throw new Error('Réponse HTML trop courte, probablement bloquée');
        }
        
        return res.json({ html });
        
      } catch (error) {
        lastError = error;
        logger.warn(`Scraping attempt ${attempt}/${maxRetries} failed`, { 
          error: error.message, 
          url 
        });
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw lastError;
    
  } catch (error) {
    logger.error('Scraping error after retries', { error: error.message, url: req.body.url });
    res.status(500).json({ error: 'Erreur lors de la récupération des données: ' + error.message });
  }
});

// Catch-all for SPA in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

// Start server
async function start() {
  await initDefaultUsers();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();
