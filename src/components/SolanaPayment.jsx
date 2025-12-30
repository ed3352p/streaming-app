import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function SolanaPayment({ plan, onSuccess, onCancel }) {
  const { user } = useAuth();
  const [walletAddress, setWalletAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [txSignature, setTxSignature] = useState(null);

  // Adresse du wallet destinataire (remplacer par votre adresse Solana)
  const RECIPIENT_ADDRESS = 'VOTRE_ADRESSE_SOLANA_ICI';

  // Prix en SOL (à ajuster selon le taux de change)
  const getPriceInSOL = () => {
    const solPrices = {
      monthly: 0.5,    // ~$50 si SOL = $100
      quarterly: 1.2,  // ~$120 si SOL = $100
      yearly: 4.0      // ~$400 si SOL = $100
    };
    return solPrices[plan.id] || 0.5;
  };

  const priceInSOL = getPriceInSOL();

  // Détecter si Phantom wallet est installé
  const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    if ('solflare' in window) {
      return window.solflare;
    }
    window.open('https://phantom.app/', '_blank');
    return null;
  };

  // Connecter le wallet
  const connectWallet = async () => {
    setConnecting(true);
    setError(null);

    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Phantom wallet non détecté. Veuillez l\'installer.');
      }

      const resp = await provider.connect();
      setWalletAddress(resp.publicKey.toString());
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  // Déconnecter le wallet
  const disconnectWallet = async () => {
    try {
      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
        setWalletAddress(null);
      }
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  // Envoyer le paiement
  const sendPayment = async () => {
    setSending(true);
    setError(null);

    try {
      const provider = getProvider();
      if (!provider || !walletAddress) {
        throw new Error('Wallet non connecté');
      }

      // Créer la transaction
      const connection = new window.solanaWeb3.Connection(
        'https://api.mainnet-beta.solana.com',
        'confirmed'
      );

      const transaction = new window.solanaWeb3.Transaction().add(
        window.solanaWeb3.SystemProgram.transfer({
          fromPubkey: new window.solanaWeb3.PublicKey(walletAddress),
          toPubkey: new window.solanaWeb3.PublicKey(RECIPIENT_ADDRESS),
          lamports: priceInSOL * window.solanaWeb3.LAMPORTS_PER_SOL
        })
      );

      transaction.feePayer = new window.solanaWeb3.PublicKey(walletAddress);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Signer et envoyer
      const signed = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Attendre confirmation
      await connection.confirmTransaction(signature);
      
      setTxSignature(signature);

      // Notifier le backend
      await fetch('/api/verify-solana-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId: plan.id,
          signature,
          amount: priceInSOL
        })
      });

      onSuccess(signature);
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement');
    } finally {
      setSending(false);
    }
  };

  // Charger Solana Web3.js
  useEffect(() => {
    if (!window.solanaWeb3) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1e293b, #0f172a)',
      padding: '40px',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.1)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{textAlign: 'center', marginBottom: '30px'}}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #9945FF, #14F195)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '40px'
        }}>
          ◎
        </div>
        <h2 style={{fontSize: '28px', marginBottom: '10px'}}>
          Paiement Solana
        </h2>
        <p style={{color: '#94a3b8', fontSize: '16px'}}>
          Payez avec votre wallet Phantom ou Solflare
        </p>
      </div>

      {/* Plan Info */}
      <div style={{
        background: 'rgba(153, 69, 255, 0.1)',
        border: '1px solid rgba(153, 69, 255, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
          <span style={{color: '#94a3b8'}}>Plan:</span>
          <span style={{fontWeight: '600'}}>{plan.name}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
          <span style={{color: '#94a3b8'}}>Durée:</span>
          <span style={{fontWeight: '600'}}>{plan.duration} jours</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '15px',
          borderTop: '1px solid rgba(153, 69, 255, 0.2)',
          marginTop: '10px'
        }}>
          <span style={{color: '#94a3b8', fontSize: '18px'}}>Total:</span>
          <div style={{textAlign: 'right'}}>
            <div style={{fontSize: '28px', fontWeight: '700', color: '#9945FF'}}>
              {priceInSOL} SOL
            </div>
            <div style={{fontSize: '14px', color: '#94a3b8'}}>
              ≈ ${plan.price}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection */}
      {!walletAddress ? (
        <button
          onClick={connectWallet}
          disabled={connecting}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #9945FF, #14F195)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            cursor: connecting ? 'not-allowed' : 'pointer',
            opacity: connecting ? 0.7 : 1,
            transition: 'all 0.3s'
          }}
        >
          {connecting ? '⏳ Connexion...' : '🔗 Connecter le Wallet'}
        </button>
      ) : (
        <>
          {/* Wallet Connected */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{color: '#22c55e', fontSize: '14px', marginBottom: '5px'}}>
                ✓ Wallet connecté
              </div>
              <div style={{color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace'}}>
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </div>
            </div>
            <button
              onClick={disconnectWallet}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Déconnecter
            </button>
          </div>

          {/* Payment Button */}
          {!txSignature && (
            <button
              onClick={sendPayment}
              disabled={sending}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: sending ? '#475569' : 'linear-gradient(135deg, #9945FF, #14F195)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: sending ? 'not-allowed' : 'pointer',
                marginBottom: '15px',
                transition: 'all 0.3s'
              }}
            >
              {sending ? '⏳ Envoi en cours...' : `💸 Payer ${priceInSOL} SOL`}
            </button>
          )}

          {/* Transaction Success */}
          {txSignature && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid #22c55e',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '48px', marginBottom: '15px'}}>✅</div>
              <h3 style={{color: '#22c55e', marginBottom: '10px'}}>
                Paiement réussi !
              </h3>
              <p style={{color: '#94a3b8', fontSize: '14px', marginBottom: '15px'}}>
                Votre compte Premium sera activé dans quelques instants
              </p>
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#9945FF',
                  fontSize: '12px',
                  textDecoration: 'underline'
                }}
              >
                Voir la transaction sur Solscan
              </a>
            </div>
          )}
        </>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '15px',
          color: '#ef4444'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          color: '#94a3b8',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Annuler
      </button>

      {/* Info */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        fontSize: '13px',
        color: '#94a3b8'
      }}>
        <div style={{marginBottom: '8px'}}>
          💡 <strong>Besoin d'aide ?</strong>
        </div>
        <ul style={{margin: 0, paddingLeft: '20px'}}>
          <li>Installez Phantom wallet depuis phantom.app</li>
          <li>Assurez-vous d'avoir assez de SOL dans votre wallet</li>
          <li>Le paiement est instantané et sécurisé</li>
        </ul>
      </div>
    </div>
  );
}
