# Système de Détection Anti-AdBlock - Documentation

## Vue d'ensemble

Ce système implémente une détection anti-adblock **côté serveur** robuste qui empêche l'accès au contenu si un bloqueur de publicité est détecté. Contrairement aux solutions JavaScript pures, cette approche est beaucoup plus difficile à contourner.

## Architecture

### 1. Backend (Node.js/Express)

**Fichier**: `server/middleware/adblockDetection.js`

Le middleware génère des tokens de validation cryptographiques qui prouvent qu'une publicité a été chargée côté client.

#### Fonctionnement :
1. Le client demande un token au serveur (`GET /api/adblock/token`)
2. Le serveur génère un token unique avec un challenge cryptographique
3. Le client charge les publicités et calcule une preuve (hash)
4. Le client envoie la preuve au serveur (`POST /api/adblock/verify`)
5. Le serveur valide la preuve et marque le token comme vérifié
6. Les requêtes API suivantes doivent inclure ce token dans le header `X-Ad-Token`

#### Routes API :

```javascript
GET  /api/adblock/token          // Génère un nouveau token
POST /api/adblock/verify         // Vérifie qu'une pub a été chargée
GET  /api/adblock/stats          // Statistiques (Admin seulement)
```

### 2. Frontend (React)

**Fichiers** :
- `src/services/adblockService.js` - Service de gestion des tokens
- `src/components/AdBlockVerifier.jsx` - Composant de vérification UI
- `src/services/api.js` - Intégration automatique des tokens

#### Flux utilisateur :

1. **Au chargement de l'application** :
   - `AdBlockVerifier` s'initialise automatiquement
   - Demande un token au serveur
   - Simule le chargement d'une publicité
   - Vérifie si l'élément publicitaire est bloqué
   - Envoie la preuve au serveur

2. **Si AdBlock détecté** :
   - Affiche un overlay plein écran
   - Message demandant de désactiver l'AdBlock
   - Bouton pour réessayer
   - Bouton pour passer à Premium

3. **Si pas d'AdBlock** :
   - L'utilisateur peut naviguer normalement
   - Toutes les requêtes API incluent automatiquement le token

## Utilisation

### Protéger une route API

```javascript
import { requireAdToken, requireAdTokenOrPremium } from './middleware/adblockDetection.js';

// Bloque l'accès sans token valide
app.get('/api/protected-content', requireAdToken, (req, res) => {
  res.json({ content: 'Contenu protégé' });
});

// Permet l'accès aux utilisateurs Premium sans vérification
app.get('/api/premium-content', requireAdTokenOrPremium, (req, res) => {
  res.json({ content: 'Contenu premium' });
});
```

### Personnaliser le message

Modifiez `src/components/AdBlockVerifier.jsx` :

```jsx
<h2 className="text-3xl font-bold text-red-500 mb-4">
  Votre message personnalisé
</h2>
<p className="text-gray-300 text-lg mb-4 leading-relaxed">
  Votre texte explicatif
</p>
```

### Désactiver temporairement

Dans `src/App.jsx`, commentez le composant :

```jsx
{/* <AdBlockVerifier 
  onVerified={() => setAdBlockVerified(true)}
  onBlocked={() => setAdBlockVerified(false)}
/> */}
```

## Configuration

### Variables d'environnement

Aucune configuration spéciale requise. Le système utilise les mêmes variables que votre API :

```env
VITE_API_URL=http://localhost:3001
```

### Durée de validité des tokens

Par défaut : **5 minutes**

Modifiez dans `server/middleware/adblockDetection.js` :

```javascript
const TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes
```

### Nombre de tentatives

Par défaut : **3 tentatives**

Modifiez dans `src/components/AdBlockVerifier.jsx` :

```javascript
const maxRetries = 3;
```

## Avantages de cette solution

✅ **Détection côté serveur** - Impossible à contourner avec JavaScript
✅ **Tokens cryptographiques** - Sécurisé contre la falsification
✅ **Validation IP** - Empêche le partage de tokens
✅ **Expiration automatique** - Les tokens expirent après 5 minutes
✅ **Support Premium** - Les utilisateurs premium peuvent bypass
✅ **Multi-couches** - Combine détection frontend + validation backend
✅ **Statistiques** - Tracking des détections pour les admins

## Limitations

⚠️ **Stockage en mémoire** - Les tokens sont perdus au redémarrage du serveur
   - Solution : Utiliser Redis en production

⚠️ **Pas de persistance** - L'utilisateur doit revalider à chaque session
   - Solution : Implémenter un système de cookies sécurisés

⚠️ **Contournement possible** - Les utilisateurs très techniques peuvent toujours contourner
   - Solution : Combiner avec d'autres méthodes (CAPTCHA, rate limiting)

## Migration vers Redis (Production)

Pour une solution production, remplacez le `Map()` par Redis :

```javascript
import Redis from 'ioredis';
const redis = new Redis();

// Au lieu de validationTokens.set()
await redis.setex(`adtoken:${token}`, 300, JSON.stringify(tokenData));

// Au lieu de validationTokens.get()
const data = await redis.get(`adtoken:${token}`);
const tokenData = data ? JSON.parse(data) : null;
```

## Monitoring

### Voir les statistiques (Admin)

```bash
curl http://localhost:3001/api/adblock/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Réponse :
```json
{
  "totalTokens": 45,
  "verifiedTokens": 38,
  "unverifiedTokens": 5,
  "expiredTokens": 2
}
```

## Dépannage

### "Token non vérifié"
- L'utilisateur a un AdBlock actif
- Le frontend n'a pas pu charger les éléments publicitaires
- Solution : Demander à l'utilisateur de désactiver son AdBlock

### "Token expiré"
- L'utilisateur est resté inactif > 5 minutes
- Solution : Recharger la page pour obtenir un nouveau token

### "IP mismatch"
- L'utilisateur utilise un VPN/Proxy qui change d'IP
- Solution : Désactiver la validation IP ou augmenter la tolérance

## Support

Pour toute question ou problème :
1. Vérifiez les logs du serveur : `server/logs/`
2. Vérifiez la console du navigateur (F12)
3. Testez avec les outils de développement

## Licence

Ce système est intégré à Lumixar et suit la même licence.
