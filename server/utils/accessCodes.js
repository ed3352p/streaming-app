import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const ACCESS_CODES_FILE = join(DATA_DIR, 'access_codes.json');
const USERS_FILE = join(DATA_DIR, 'users.json');

function readData(file) {
  if (!existsSync(file)) {
    return [];
  }
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeData(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// Générer un code aléatoire
export function generateCode(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  
  return code;
}

// Créer un nouveau code d'accès
export function createAccessCode(duration, quantity = 1, createdBy) {
  const codes = readData(ACCESS_CODES_FILE);
  const generatedCodes = [];
  
  for (let i = 0; i < quantity; i++) {
    let code = generateCode();
    
    // Vérifier que le code n'existe pas déjà
    while (codes.find(c => c.code === code)) {
      code = generateCode();
    }
    
    const newCode = {
      id: Date.now() + i,
      code,
      duration, // en jours
      used: false,
      usedBy: null,
      usedAt: null,
      createdBy,
      createdAt: new Date().toISOString(),
      expiresAt: null // Sera défini lors de l'utilisation
    };
    
    codes.push(newCode);
    generatedCodes.push(newCode);
  }
  
  writeData(ACCESS_CODES_FILE, codes);
  return generatedCodes;
}

// Valider et utiliser un code
export function redeemAccessCode(code, userId) {
  const codes = readData(ACCESS_CODES_FILE);
  const codeIndex = codes.findIndex(c => c.code === code.toUpperCase());
  
  if (codeIndex === -1) {
    return { success: false, error: 'Code invalide' };
  }
  
  const accessCode = codes[codeIndex];
  
  if (accessCode.used) {
    return { success: false, error: 'Code déjà utilisé' };
  }
  
  // Marquer le code comme utilisé
  accessCode.used = true;
  accessCode.usedBy = userId;
  accessCode.usedAt = new Date().toISOString();
  
  // Calculer la date d'expiration
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + accessCode.duration);
  accessCode.expiresAt = expirationDate.toISOString();
  
  writeData(ACCESS_CODES_FILE, codes);
  
  // Activer le premium pour l'utilisateur
  activatePremiumWithCode(userId, accessCode.duration, code);
  
  return { 
    success: true, 
    duration: accessCode.duration,
    expiresAt: accessCode.expiresAt
  };
}

// Activer le premium avec un code
function activatePremiumWithCode(userId, durationDays, code) {
  const users = readData(USERS_FILE);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('Utilisateur non trouvé');
  }
  
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  
  // Si l'utilisateur a déjà un abonnement actif, prolonger
  if (users[userIndex].premium && users[userIndex].subscriptionEnd) {
    const currentEnd = new Date(users[userIndex].subscriptionEnd);
    if (currentEnd > startDate) {
      // Prolonger à partir de la date actuelle d'expiration
      endDate.setTime(currentEnd.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }
  }
  
  users[userIndex].premium = true;
  // Ne pas changer le rôle si l'utilisateur est déjà admin
  if (users[userIndex].role !== 'admin') {
    users[userIndex].role = 'premium';
  }
  users[userIndex].subscriptionPlan = `code_${durationDays}days`;
  users[userIndex].subscriptionStart = startDate.toISOString();
  users[userIndex].subscriptionEnd = endDate.toISOString();
  users[userIndex].lastAccessCode = code;
  
  writeData(USERS_FILE, users);
}

// Obtenir tous les codes
export function getAllAccessCodes() {
  return readData(ACCESS_CODES_FILE);
}

// Obtenir les statistiques des codes
export function getAccessCodesStats() {
  const codes = readData(ACCESS_CODES_FILE);
  
  return {
    total: codes.length,
    used: codes.filter(c => c.used).length,
    unused: codes.filter(c => !c.used).length,
    byDuration: {
      '1day': codes.filter(c => c.duration === 1).length,
      '7days': codes.filter(c => c.duration === 7).length,
      '30days': codes.filter(c => c.duration === 30).length,
      '90days': codes.filter(c => c.duration === 90).length,
      '365days': codes.filter(c => c.duration === 365).length
    }
  };
}

// Supprimer un code
export function deleteAccessCode(codeId) {
  const codes = readData(ACCESS_CODES_FILE);
  const filtered = codes.filter(c => c.id !== codeId);
  
  if (filtered.length === codes.length) {
    return false;
  }
  
  writeData(ACCESS_CODES_FILE, filtered);
  return true;
}

// Supprimer tous les codes utilisés
export function deleteUsedCodes() {
  const codes = readData(ACCESS_CODES_FILE);
  const filtered = codes.filter(c => !c.used);
  const deletedCount = codes.length - filtered.length;
  
  writeData(ACCESS_CODES_FILE, filtered);
  return deletedCount;
}

// Exporter les codes en CSV
export function exportCodesCSV() {
  const codes = readData(ACCESS_CODES_FILE);
  let csv = 'Code,Duration (days),Used,Used By,Used At,Created At\n';
  
  codes.forEach(code => {
    csv += `${code.code},${code.duration},${code.used ? 'Yes' : 'No'},${code.usedBy || ''},${code.usedAt || ''},${code.createdAt}\n`;
  });
  
  return csv;
}
