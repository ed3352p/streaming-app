// Simple hash function for password security (client-side)
// Note: For production, use bcrypt on a backend server

// Fallback hash for HTTP (non-secure contexts)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const salt = 'lumixar_2024';
  let hash2 = 0;
  const combined = str + salt;
  for (let i = 0; i < combined.length; i++) {
    hash2 = combined.charCodeAt(i) + ((hash2 << 5) - hash2);
  }
  return Math.abs(hash).toString(16) + Math.abs(hash2).toString(16);
}

export async function hashPassword(password) {
  // Check if crypto.subtle is available (HTTPS only)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'lumixar_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for HTTP
  return simpleHash(password);
}

export async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Generate a secure session token
export function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Session expiry time (24 hours)
export const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Validate session
export function isSessionValid(session) {
  if (!session || !session.token || !session.expiresAt) return false;
  return new Date(session.expiresAt) > new Date();
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('Au moins 8 caractères');
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule');
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre');
  return { isValid: errors.length === 0, errors };
}
