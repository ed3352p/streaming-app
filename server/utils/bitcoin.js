import crypto from 'crypto';
import https from 'https';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const PAYMENTS_FILE = join(DATA_DIR, 'payments.json');
const SUBSCRIPTIONS_FILE = join(DATA_DIR, 'subscriptions.json');
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

// Plans d'abonnement
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Premium Mensuel',
    duration: 30,
    price: 5.00,
    priceBTC: 0.00013,
    features: [
      'Accès illimité à tout le contenu',
      'Qualité HD/4K',
      'Pas de publicités',
      'Téléchargement hors ligne',
      'Multi-devices (5 appareils)',
      'Support prioritaire'
    ]
  },
  quarterly: {
    id: 'quarterly',
    name: 'Premium Trimestriel',
    duration: 90,
    price: 15.00,
    priceBTC: 0.00038,
    discount: 0,
    features: [
      'Tous les avantages Premium',
      'Accès anticipé aux nouveautés',
      'Badge exclusif'
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Premium Annuel',
    duration: 365,
    price: 40.00,
    priceBTC: 0.00100,
    discount: 33,
    features: [
      'Tous les avantages Premium',
      '33% de réduction',
      'Accès VIP aux événements',
      'Contenu exclusif',
      'Profil personnalisé'
    ]
  }
};

// Adresse Bitcoin pour recevoir les paiements
const BTC_PAYMENT_ADDRESS = 'bc1pnlzrveaul6gpw9hxhm58zx20yr9p4elqdnp5smvgjldl65cwkwtqvppdqk';

// Générer une adresse Bitcoin unique pour un paiement
export function generateBTCAddress() {
  // Utiliser l'adresse Bitcoin réelle fournie
  return BTC_PAYMENT_ADDRESS;
}

// Vérifier le taux de change BTC/USD
export async function getBTCRate() {
  return new Promise((resolve, reject) => {
    https.get('https://api.coinbase.com/v2/exchange-rates?currency=BTC', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const usdRate = parseFloat(parsed.data.rates.USD);
          resolve(usdRate);
        } catch (err) {
          resolve(40000); // Fallback rate
        }
      });
    }).on('error', () => {
      resolve(40000); // Fallback rate
    });
  });
}

// Calculer le prix en BTC selon le taux actuel
export async function calculateBTCPrice(usdAmount) {
  const btcRate = await getBTCRate();
  return (usdAmount / btcRate).toFixed(8);
}

// Créer un paiement Bitcoin
export async function createBTCPayment(userId, planId, promoCode = null) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Plan invalide');
  }

  let finalPrice = plan.price;
  let discount = 0;

  // Appliquer le code promo
  if (promoCode) {
    const promoCodes = readData(join(DATA_DIR, 'promo_codes.json'));
    const promo = promoCodes.find(p => 
      p.code === promoCode && 
      p.active && 
      new Date(p.validUntil) > new Date() &&
      p.usedCount < p.maxUses
    );

    if (promo) {
      if (promo.type === 'percentage') {
        discount = (finalPrice * promo.discount) / 100;
        finalPrice -= discount;
      } else if (promo.type === 'fixed') {
        discount = promo.discount;
        finalPrice = Math.max(0, finalPrice - discount);
      }

      // Incrémenter le compteur d'utilisation
      promo.usedCount++;
      writeData(join(DATA_DIR, 'promo_codes.json'), promoCodes);
    }
  }

  const btcAmount = await calculateBTCPrice(finalPrice);
  const btcAddress = generateBTCAddress();

  const payment = {
    id: `pay_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    userId,
    planId,
    plan: plan.name,
    amountUSD: finalPrice,
    amountBTC: btcAmount,
    discount,
    promoCode,
    btcAddress,
    status: 'pending',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    createdAt: new Date().toISOString(),
    confirmedAt: null,
    txHash: null
  };

  const payments = readData(PAYMENTS_FILE);
  payments.push(payment);
  writeData(PAYMENTS_FILE, payments);

  return payment;
}

// Vérifier une transaction Bitcoin
export async function verifyBTCTransaction(paymentId, txHash) {
  // En production, vérifier via blockchain API (blockchain.info, blockchair.com, etc.)
  // Pour le développement, on simule la vérification
  
  const payments = readData(PAYMENTS_FILE);
  const paymentIndex = payments.findIndex(p => p.id === paymentId);
  
  if (paymentIndex === -1) {
    throw new Error('Paiement non trouvé');
  }

  const payment = payments[paymentIndex];

  // Vérifier si le paiement n'a pas expiré
  if (new Date(payment.expiresAt) < new Date()) {
    payment.status = 'expired';
    writeData(PAYMENTS_FILE, payments);
    throw new Error('Paiement expiré');
  }

  // Simuler la vérification de transaction
  // En production, appeler une API blockchain
  const isValid = await checkBlockchainTransaction(payment.btcAddress, payment.amountBTC, txHash);

  if (isValid) {
    payment.status = 'confirmed';
    payment.confirmedAt = new Date().toISOString();
    payment.txHash = txHash;
    writeData(PAYMENTS_FILE, payments);

    // Activer l'abonnement premium
    await activatePremiumSubscription(payment.userId, payment.planId);

    return { success: true, payment };
  } else {
    throw new Error('Transaction invalide ou montant incorrect');
  }
}

// Vérifier la transaction sur la blockchain
async function checkBlockchainTransaction(address, expectedAmount, txHash) {
  // En production, utiliser une vraie API blockchain
  // Exemple avec blockchain.info API:
  /*
  return new Promise((resolve, reject) => {
    https.get(`https://blockchain.info/rawtx/${txHash}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const tx = JSON.parse(data);
          const output = tx.out.find(o => o.addr === address);
          if (output && output.value >= expectedAmount * 100000000) { // Satoshis
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          resolve(false);
        }
      });
    }).on('error', () => resolve(false));
  });
  */

  // Pour le développement, on accepte toute transaction avec un hash valide
  return txHash && txHash.length === 64;
}

// Activer l'abonnement premium
async function activatePremiumSubscription(userId, planId) {
  const plan = SUBSCRIPTION_PLANS[planId];
  const users = readData(USERS_FILE);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    throw new Error('Utilisateur non trouvé');
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

  // Mettre à jour l'utilisateur
  users[userIndex].premium = true;
  users[userIndex].role = 'premium';
  users[userIndex].subscriptionPlan = planId;
  users[userIndex].subscriptionStart = startDate.toISOString();
  users[userIndex].subscriptionEnd = endDate.toISOString();
  writeData(USERS_FILE, users);

  // Créer l'entrée d'abonnement
  const subscriptions = readData(SUBSCRIPTIONS_FILE);
  const subscription = {
    id: `sub_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    userId,
    planId,
    plan: plan.name,
    status: 'active',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    autoRenew: false,
    createdAt: new Date().toISOString()
  };

  subscriptions.push(subscription);
  writeData(SUBSCRIPTIONS_FILE, subscriptions);

  return subscription;
}

// Vérifier les abonnements expirés
export function checkExpiredSubscriptions() {
  const users = readData(USERS_FILE);
  const now = new Date();
  let updated = false;

  users.forEach(user => {
    if (user.premium && user.subscriptionEnd) {
      const endDate = new Date(user.subscriptionEnd);
      if (endDate < now) {
        user.premium = false;
        user.role = 'user';
        user.subscriptionPlan = null;
        updated = true;
      }
    }
  });

  if (updated) {
    writeData(USERS_FILE, users);
  }

  // Mettre à jour les abonnements
  const subscriptions = readData(SUBSCRIPTIONS_FILE);
  subscriptions.forEach(sub => {
    if (sub.status === 'active' && new Date(sub.endDate) < now) {
      sub.status = 'expired';
      updated = true;
    }
  });

  if (updated) {
    writeData(SUBSCRIPTIONS_FILE, subscriptions);
  }
}

// Vérifier périodiquement les abonnements expirés (toutes les heures)
setInterval(checkExpiredSubscriptions, 60 * 60 * 1000);

// Obtenir l'historique des paiements d'un utilisateur
export function getUserPayments(userId) {
  const payments = readData(PAYMENTS_FILE);
  return payments.filter(p => p.userId === userId).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

// Obtenir l'abonnement actif d'un utilisateur
export function getUserSubscription(userId) {
  const subscriptions = readData(SUBSCRIPTIONS_FILE);
  return subscriptions.find(s => 
    s.userId === userId && 
    s.status === 'active' &&
    new Date(s.endDate) > new Date()
  );
}

// Annuler un abonnement
export function cancelSubscription(userId) {
  const subscriptions = readData(SUBSCRIPTIONS_FILE);
  const subscription = subscriptions.find(s => 
    s.userId === userId && s.status === 'active'
  );

  if (subscription) {
    subscription.autoRenew = false;
    subscription.canceledAt = new Date().toISOString();
    writeData(SUBSCRIPTIONS_FILE, subscriptions);
    return true;
  }

  return false;
}

// Valider un code promo
export function validatePromoCode(code) {
  const promoCodes = readData(join(DATA_DIR, 'promo_codes.json'));
  const promo = promoCodes.find(p => p.code === code);

  if (!promo) {
    return { valid: false, error: 'Code promo invalide' };
  }

  if (!promo.active) {
    return { valid: false, error: 'Code promo désactivé' };
  }

  if (new Date(promo.validUntil) < new Date()) {
    return { valid: false, error: 'Code promo expiré' };
  }

  if (promo.usedCount >= promo.maxUses) {
    return { valid: false, error: 'Code promo épuisé' };
  }

  return { 
    valid: true, 
    promo: {
      code: promo.code,
      discount: promo.discount,
      type: promo.type
    }
  };
}
