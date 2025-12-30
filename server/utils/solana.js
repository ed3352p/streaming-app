import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Solana
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const RECIPIENT_WALLET = process.env.SOLANA_WALLET_ADDRESS || 'VOTRE_ADRESSE_SOLANA_ICI';

// Plans d'abonnement avec prix en SOL
export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Premium Mensuel',
    price: 50,
    priceSOL: 0.5,
    duration: 30,
    features: [
      'Sans publicité',
      'Qualité HD/4K',
      'Streaming illimité',
      'Accès à tout le catalogue'
    ]
  },
  quarterly: {
    name: 'Premium Trimestriel',
    price: 120,
    priceSOL: 1.2,
    duration: 90,
    discount: 20,
    features: [
      'Sans publicité',
      'Qualité HD/4K',
      'Streaming illimité',
      'Accès à tout le catalogue',
      '20% d\'économie'
    ]
  },
  yearly: {
    name: 'Premium Annuel',
    price: 400,
    priceSOL: 4.0,
    duration: 365,
    discount: 33,
    features: [
      'Sans publicité',
      'Qualité HD/4K',
      'Streaming illimité',
      'Accès à tout le catalogue',
      '33% d\'économie',
      'Support prioritaire'
    ]
  }
};

// Fichiers de données
const PAYMENTS_FILE = join(__dirname, '..', 'data', 'solana_payments.json');
const SUBSCRIPTIONS_FILE = join(__dirname, '..', 'data', 'subscriptions.json');

// Charger les données
function loadData(file) {
  if (!existsSync(file)) {
    return [];
  }
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error(`Error loading ${file}:`, err);
    return [];
  }
}

// Sauvegarder les données
function saveData(file, data) {
  try {
    writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving ${file}:`, err);
  }
}

// Vérifier une transaction Solana
export async function verifySolanaTransaction(signature, expectedAmount, expectedRecipient = RECIPIENT_WALLET) {
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Récupérer les détails de la transaction
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return { valid: false, error: 'Transaction non trouvée' };
    }

    // Vérifier que la transaction est confirmée
    if (!transaction.meta || transaction.meta.err) {
      return { valid: false, error: 'Transaction échouée ou non confirmée' };
    }

    // Vérifier le montant et le destinataire
    const postBalances = transaction.meta.postBalances;
    const preBalances = transaction.meta.preBalances;
    const accountKeys = transaction.transaction.message.accountKeys;

    // Trouver le destinataire dans les clés de compte
    const recipientIndex = accountKeys.findIndex(
      key => key.toBase58() === expectedRecipient
    );

    if (recipientIndex === -1) {
      return { valid: false, error: 'Destinataire incorrect' };
    }

    // Calculer le montant reçu
    const amountReceived = (postBalances[recipientIndex] - preBalances[recipientIndex]) / LAMPORTS_PER_SOL;

    // Vérifier le montant (avec une tolérance de 1%)
    const tolerance = expectedAmount * 0.01;
    if (Math.abs(amountReceived - expectedAmount) > tolerance) {
      return { 
        valid: false, 
        error: `Montant incorrect. Attendu: ${expectedAmount} SOL, Reçu: ${amountReceived} SOL` 
      };
    }

    return {
      valid: true,
      amount: amountReceived,
      timestamp: transaction.blockTime,
      signature
    };
  } catch (err) {
    console.error('Error verifying Solana transaction:', err);
    return { valid: false, error: err.message };
  }
}

// Créer un paiement Solana
export function createSolanaPayment(userId, planId, promoCode = null) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Plan invalide');
  }

  let finalPrice = plan.price;
  let finalPriceSOL = plan.priceSOL;

  // Appliquer le code promo si valide
  if (promoCode) {
    const promo = validatePromoCode(promoCode);
    if (promo.valid) {
      if (promo.promo.type === 'percentage') {
        finalPrice = plan.price * (1 - promo.promo.discount / 100);
        finalPriceSOL = plan.priceSOL * (1 - promo.promo.discount / 100);
      } else {
        finalPrice = Math.max(0, plan.price - promo.promo.discount);
        finalPriceSOL = Math.max(0, plan.priceSOL - (promo.promo.discount / 100));
      }
    }
  }

  const payment = {
    id: `sol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    planId,
    amount: finalPrice,
    amountSOL: finalPriceSOL,
    recipientAddress: RECIPIENT_WALLET,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    promoCode
  };

  const payments = loadData(PAYMENTS_FILE);
  payments.push(payment);
  saveData(PAYMENTS_FILE, payments);

  return payment;
}

// Vérifier et activer l'abonnement
export async function verifyAndActivateSubscription(userId, planId, signature, amount) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Plan invalide');
  }

  // Vérifier la transaction
  const verification = await verifySolanaTransaction(signature, amount);
  
  if (!verification.valid) {
    throw new Error(verification.error);
  }

  // Mettre à jour le paiement
  const payments = loadData(PAYMENTS_FILE);
  const paymentIndex = payments.findIndex(p => p.userId === userId && p.status === 'pending');
  
  if (paymentIndex !== -1) {
    payments[paymentIndex].status = 'completed';
    payments[paymentIndex].signature = signature;
    payments[paymentIndex].completedAt = new Date().toISOString();
    saveData(PAYMENTS_FILE, payments);
  }

  // Créer ou mettre à jour l'abonnement
  const subscriptions = loadData(SUBSCRIPTIONS_FILE);
  const existingIndex = subscriptions.findIndex(s => s.userId === userId);

  const subscription = {
    userId,
    planId,
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000).toISOString(),
    signature,
    amount: verification.amount,
    autoRenew: false
  };

  if (existingIndex !== -1) {
    subscriptions[existingIndex] = subscription;
  } else {
    subscriptions.push(subscription);
  }

  saveData(SUBSCRIPTIONS_FILE, subscriptions);

  return subscription;
}

// Obtenir l'abonnement d'un utilisateur
export function getUserSubscription(userId) {
  const subscriptions = loadData(SUBSCRIPTIONS_FILE);
  const subscription = subscriptions.find(s => s.userId === userId);

  if (!subscription) {
    return null;
  }

  // Vérifier si l'abonnement est toujours actif
  const now = new Date();
  const endDate = new Date(subscription.endDate);

  if (now > endDate) {
    subscription.status = 'expired';
    const subscriptions = loadData(SUBSCRIPTIONS_FILE);
    const index = subscriptions.findIndex(s => s.userId === userId);
    if (index !== -1) {
      subscriptions[index].status = 'expired';
      saveData(SUBSCRIPTIONS_FILE, subscriptions);
    }
  }

  return subscription;
}

// Obtenir tous les paiements d'un utilisateur
export function getUserPayments(userId) {
  const payments = loadData(PAYMENTS_FILE);
  return payments.filter(p => p.userId === userId);
}

// Annuler un abonnement
export function cancelSubscription(userId) {
  const subscriptions = loadData(SUBSCRIPTIONS_FILE);
  const index = subscriptions.findIndex(s => s.userId === userId);

  if (index === -1) {
    throw new Error('Abonnement non trouvé');
  }

  subscriptions[index].status = 'cancelled';
  subscriptions[index].cancelledAt = new Date().toISOString();
  saveData(SUBSCRIPTIONS_FILE, subscriptions);

  return subscriptions[index];
}

// Obtenir le taux SOL/USD
export async function getSOLRate() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    return { rate: data.solana.usd };
  } catch (err) {
    console.error('Error fetching SOL rate:', err);
    return { rate: 100 }; // Fallback
  }
}

// Valider un code promo (réutilise la logique existante)
export function validatePromoCode(code) {
  const PROMO_CODES = {
    'WELCOME2024': { discount: 20, type: 'percentage', active: true },
    'PREMIUM50': { discount: 50, type: 'percentage', active: true },
    'SAVE10': { discount: 10, type: 'fixed', active: true }
  };

  const promo = PROMO_CODES[code];
  if (!promo || !promo.active) {
    return { valid: false, error: 'Code promo invalide ou expiré' };
  }

  return { valid: true, promo };
}
