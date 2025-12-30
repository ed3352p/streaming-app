import crypto from 'crypto';

// Stockage en mémoire des tokens de validation (en production, utiliser Redis)
const validationTokens = new Map();
const TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Nettoie les tokens expirés toutes les minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of validationTokens.entries()) {
    if (now > data.expiresAt) {
      validationTokens.delete(token);
    }
  }
}, 60 * 1000);

/**
 * Génère un token de validation pour vérifier que les pubs sont chargées
 */
export function generateAdToken(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const challenge = crypto.randomBytes(16).toString('hex');
  
  validationTokens.set(token, {
    challenge,
    verified: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY,
    ip: req.ip
  });
  
  res.json({
    token,
    challenge,
    expiresIn: TOKEN_EXPIRY
  });
}

/**
 * Vérifie qu'une publicité a été chargée (appelé par le frontend après chargement)
 */
export function verifyAdLoaded(req, res) {
  const { token, challenge, proof } = req.body;
  
  if (!token || !challenge || !proof) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const tokenData = validationTokens.get(token);
  
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  if (tokenData.ip !== req.ip) {
    return res.status(403).json({ error: 'IP mismatch' });
  }
  
  // Vérifie que le proof est correct (hash du challenge)
  const expectedProof = crypto
    .createHash('sha256')
    .update(challenge + tokenData.challenge)
    .digest('hex');
  
  if (proof !== expectedProof) {
    return res.status(403).json({ error: 'Invalid proof' });
  }
  
  // Marque le token comme vérifié
  tokenData.verified = true;
  tokenData.verifiedAt = Date.now();
  
  res.json({ success: true, verified: true });
}

/**
 * Middleware pour protéger les routes sensibles (streaming, téléchargement)
 * Vérifie que l'utilisateur a un token valide (= a chargé les pubs)
 */
export function requireAdToken(req, res, next) {
  const token = req.headers['x-ad-token'] || req.query.adToken;
  
  if (!token) {
    return res.status(403).json({ 
      error: 'Ad verification required',
      message: 'Veuillez désactiver votre bloqueur de publicité pour accéder au contenu'
    });
  }
  
  const tokenData = validationTokens.get(token);
  
  if (!tokenData) {
    return res.status(401).json({ 
      error: 'Invalid or expired ad token',
      message: 'Votre session a expiré. Veuillez recharger la page.'
    });
  }
  
  if (!tokenData.verified) {
    return res.status(403).json({ 
      error: 'Ad token not verified',
      message: 'Veuillez attendre le chargement complet de la page'
    });
  }
  
  if (tokenData.ip !== req.ip) {
    return res.status(403).json({ 
      error: 'IP mismatch',
      message: 'Erreur de validation. Veuillez recharger la page.'
    });
  }
  
  // Token valide, on continue
  req.adTokenData = tokenData;
  next();
}

/**
 * Version plus souple pour les utilisateurs premium (bypass la vérification)
 */
export function requireAdTokenOrPremium(req, res, next) {
  // Si l'utilisateur est premium, on bypass
  if (req.user && req.user.isPremium) {
    return next();
  }
  
  // Sinon, on vérifie le token
  return requireAdToken(req, res, next);
}

/**
 * Statistiques sur les détections d'adblock
 */
export function getAdblockStats(req, res) {
  const stats = {
    totalTokens: validationTokens.size,
    verifiedTokens: 0,
    unverifiedTokens: 0,
    expiredTokens: 0
  };
  
  const now = Date.now();
  for (const [token, data] of validationTokens.entries()) {
    if (now > data.expiresAt) {
      stats.expiredTokens++;
    } else if (data.verified) {
      stats.verifiedTokens++;
    } else {
      stats.unverifiedTokens++;
    }
  }
  
  res.json(stats);
}

export default {
  generateAdToken,
  verifyAdLoaded,
  requireAdToken,
  requireAdTokenOrPremium,
  getAdblockStats
};
