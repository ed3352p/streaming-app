# 🎬 Lumixar - Plateforme de Streaming Professionnelle

[![Version](https://img.shields.io/badge/version-4.0-blue.svg)](https://github.com/ed3352p/streaming-app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

Plateforme de streaming vidéo complète avec fonctionnalités avancées professionnelles : IPTV, EPG, DVR, sécurité renforcée, contrôle parental et bien plus.

## ✨ Fonctionnalités Principales

### 🎥 Streaming & Contenu
- **Films & Séries** - Gestion complète avec métadonnées, trailers, notes
- **IPTV en Direct** - Chaînes TV en streaming avec EPG intégré
- **Multi-formats** - Support HLS, MP4, M3U8
- **Lecteur Avancé** - Contrôles personnalisés, qualité adaptative, sous-titres

### 📺 IPTV Professionnel
- **EPG (Guide TV)** - Programme TV complet 48h avec recherche
- **Cloud DVR** - Enregistrement et programmation d'émissions
- **Statistiques Chaînes** - Analytics en temps réel par chaîne
- **Favoris** - Gestion des chaînes favorites

### ⚡ Infrastructure Pro
- **Load Balancing** - Distribution automatique multi-serveurs
- **Video Preloading** - Cache intelligent des vidéos populaires
- **Auto-Backup** - Sauvegardes quotidiennes automatiques (30 jours)
- **Failover** - Basculement automatique en cas de panne

### 🔐 Sécurité Avancée
- **Device Fingerprinting** - Identification unique multi-facteurs
- **Session Binding** - Liaison IP + Device par session
- **VPN Detection** - Détection VPN/Proxy avec scoring
- **Screen Recording Detection** - Anti-piratage avec blocage automatique
- **Rate Limiting** - Protection DDoS et brute force

### ⚖️ Legal & Conformité
- **Terms of Service** - CGU avec versioning et tracking
- **Privacy Policy** - Politique de confidentialité GDPR
- **Cookie Policy** - Gestion des cookies et consentements
- **Parental Controls** - Contrôle parental avec PIN et profils enfants
- **Content Moderation** - Système de modération et avertissements

### 💰 Monétisation
- **Système Premium** - Abonnements avec codes d'accès
- **Paiements Crypto** - Bitcoin & Solana intégrés
- **Publicités** - Gestion intelligente des ads avec fréquence
- **Parrainage** - Système de référence avec récompenses

### 🎨 UX/UI Moderne
- **Design Responsive** - Mobile, tablette, desktop optimisés
- **Mode Sombre** - Interface élégante et confortable
- **Multi-langues** - i18n avec détection automatique
- **PWA** - Installation comme application native
- **Notifications Push** - Alertes en temps réel

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+ et npm
- Ubuntu/Debian (pour déploiement serveur)

### Développement Local

```bash
# Cloner le projet
git clone https://github.com/ed3352p/streaming-app.git
cd streaming-app

# Installer les dépendances
npm install
cd server && npm install && cd ..

# Démarrer (frontend + backend)
npm start
```

**Accès :**
- Frontend : http://localhost:5050
- Backend API : http://localhost:3001

**Identifiants admin :** Voir `server/data/.admin_credentials`

### Déploiement Production (Ubuntu)

```bash
# Télécharger et exécuter le script
wget https://raw.githubusercontent.com/ed3352p/streaming-app/main/deploy-ubuntu.sh
sudo bash deploy-ubuntu.sh
```

Le script installe **automatiquement** :
- ✅ Node.js, PM2, Nginx
- ✅ Certificat SSL (Let's Encrypt)
- ✅ Toutes les dépendances
- ✅ Configuration optimisée
- ✅ Backups automatiques
- ✅ Monitoring et scripts utilitaires

## 📋 Configuration

### Variables d'Environnement

Créer `.env` à la racine et `server/.env` :

```env
# Frontend (.env)
VITE_API_URL=http://localhost:3001

# Backend (server/.env)
NODE_ENV=production
PORT=3001
JWT_SECRET=votre_secret_jwt_ici

# Notifications Push (optionnel)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=admin@domain.com

# EPG Source
EPG_SOURCE_URL=https://iptv-org.github.io/epg/guides/

# VPN Detection (optionnel)
VPN_API_KEY=votre_cle_api

# Backup
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_INTERVAL_HOURS=24
```

**Générer les clés VAPID :**
```bash
cd server
npx web-push generate-vapid-keys
```

## 🛠️ Commandes Utiles

### Développement
```bash
npm start              # Démarrer dev (frontend + backend)
npm run dev            # Frontend uniquement
npm run server         # Backend uniquement
npm run build          # Build production
```

### Production (après déploiement)
```bash
/var/www/lumixar/monitor.sh           # Status complet
/var/www/lumixar/test-features.sh     # Tester fonctionnalités
pm2 logs lumixar-backend              # Voir les logs
pm2 restart lumixar-backend           # Redémarrer
/var/www/lumixar/update.sh            # Mise à jour
/root/backup-lumixar.sh               # Backup manuel
```

## 📊 Architecture

```
streaming-app/
├── src/                    # Frontend React
│   ├── components/         # Composants réutilisables
│   ├── pages/             # Pages principales
│   ├── context/           # Context API (Auth, etc.)
│   └── assets/            # Images, styles
├── server/                # Backend Express
│   ├── index.js           # Point d'entrée
│   ├── data/              # Base de données JSON
│   ├── utils/             # Utilitaires (EPG, DVR, Security, etc.)
│   ├── middleware/        # Middlewares custom
│   └── routes/            # Routes API avancées
├── public/                # Fichiers statiques
└── deploy-ubuntu.sh       # Script de déploiement auto
```

## 🔌 API Endpoints

### Authentification
- `POST /api/register` - Inscription
- `POST /api/login` - Connexion
- `POST /api/logout` - Déconnexion

### Contenu
- `GET /api/movies` - Liste des films
- `GET /api/series` - Liste des séries
- `GET /api/iptv` - Chaînes IPTV
- `GET /api/search` - Recherche globale

### IPTV Avancé
- `GET /api/epg/channel/:id` - Guide TV
- `POST /api/dvr/schedule` - Programmer enregistrement
- `GET /api/dvr/recordings/:userId` - Mes enregistrements
- `GET /api/channels/stats/:id` - Stats chaîne
- `GET /api/channels/top` - Top chaînes

### Sécurité
- `POST /api/security/fingerprint` - Enregistrer device
- `POST /api/security/vpn-detect` - Détecter VPN
- `POST /api/security/recording-detection` - Signaler enregistrement

### Legal
- `POST /api/terms/accept` - Accepter CGU
- `POST /api/parental-controls/setup` - Config contrôle parental
- `POST /api/moderation/flag` - Signaler contenu

### Infrastructure
- `GET /api/infrastructure/servers` - Status serveurs
- `GET /api/infrastructure/backups` - Liste backups
- `POST /api/infrastructure/backup` - Créer backup

## 🎯 Fonctionnalités Détaillées

### EPG (Electronic Program Guide)
- Programme TV en temps réel
- Recherche par titre/chaîne
- Affichage 48h glissant
- Intégration avec Cloud DVR

### Cloud DVR
- Programmation d'enregistrements
- Gestion du stockage par utilisateur
- Statuts : programmé, en cours, terminé, échoué
- Limite de stockage configurable

### Device Fingerprinting
- Canvas, WebGL, Audio fingerprinting
- Détection hardware (CPU, GPU, RAM)
- Tracking des devices de confiance
- Détection d'anomalies (IP change, multi-devices)

### VPN Detection
- Vérification IP databases
- Analyse headers HTTP
- Scoring de confiance (0-100)
- Blacklist automatique

### Contrôle Parental
- PIN 4 chiffres
- Profils enfants séparés
- Restrictions par âge (G, PG, PG-13, R, NC-17, 18+)
- Catégories bloquées
- Limites de temps d'écran
- Horaires autorisés

## 🔧 Personnalisation

### Ajouter un Film
```javascript
// Via l'interface admin ou API
POST /api/admin/movies
{
  "title": "Film Title",
  "description": "Description",
  "genre": "Action",
  "year": 2024,
  "rating": "PG-13",
  "videoUrl": "https://...",
  "thumbnailUrl": "https://..."
}
```

### Ajouter une Chaîne IPTV
```javascript
POST /api/admin/iptv
{
  "name": "Channel Name",
  "url": "https://stream.m3u8",
  "logo": "https://logo.png",
  "category": "News",
  "country": "FR"
}
```

## 📈 Performance

- **Build optimisé** : Code splitting, lazy loading
- **Cache intelligent** : Service Worker, CDN ready
- **Compression** : Gzip/Brotli activé
- **Images** : Lazy loading, formats optimisés
- **API** : Rate limiting, pagination

## 🔒 Sécurité

- **HTTPS** obligatoire en production
- **Helmet.js** - Headers sécurisés
- **CORS** strict avec whitelist
- **JWT** avec expiration
- **XSS/CSRF** protection
- **Input sanitization** - Validation complète
- **Rate limiting** - Anti-DDoS

## 🐛 Dépannage

### Le serveur ne démarre pas
```bash
# Vérifier les logs
pm2 logs lumixar-backend

# Vérifier le port
netstat -tulpn | grep 3001

# Redémarrer
pm2 restart lumixar-backend
```

### Erreur CORS
- Vérifier `CORS_ORIGIN` dans `.env`
- Ajouter votre domaine dans `server/index.js` ligne 223

### Build échoue
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Documentation

- **Fonctionnalités Avancées** : Voir le code source pour détails
- **API** : Endpoints documentés ci-dessus
- **Sécurité** : Voir `server/middleware/security.js`

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

MIT License - voir [LICENSE](LICENSE)

## 👨‍💻 Auteur

**ed3352p**
- GitHub: [@ed3352p](https://github.com/ed3352p)

## 🙏 Remerciements

- React & Vite pour le framework
- Express.js pour le backend
- FingerprintJS pour le device fingerprinting
- Tous les contributeurs open source

---

**Version 4.0** - Plateforme de streaming professionnelle complète avec fonctionnalités avancées

🌟 **Star ce projet si vous le trouvez utile !**
