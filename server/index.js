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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
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

function recordFailedAttempt(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  
  if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    attempts.count++;
    loginAttempts.set(ip, attempts);
  }
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
  origin: ['https://min-stream.click', 'http://min-stream.click', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
  skipSuccessfulRequests: true
});

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

app.post('/api/auth/login', authLimiter, async (req, res) => {
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
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    }
    
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

app.post('/api/auth/register', authLimiter, async (req, res) => {
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
    const passwordErrors = validatePassword(newPassword);
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
