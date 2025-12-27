# 🎬 Lumixar - Plateforme de Streaming

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19.x-blue.svg)](https://reactjs.org)

Plateforme de streaming moderne pour films, séries et IPTV avec interface élégante et performances optimisées.

## 🚀 Déploiement Rapide sur VPS

### Installation Automatique (Recommandé)

```bash
# 1. Connexion SSH à votre VPS
ssh root@VOTRE_IP_VPS

# 2. Télécharger et lancer le script d'installation
wget https://raw.githubusercontent.com/ed3352p/streaming-app/main/vps-install.sh
chmod +x vps-install.sh
./vps-install.sh
```

Le script configure automatiquement :
- ✅ Node.js 20 + npm
- ✅ PM2 (gestionnaire de processus)
- ✅ Nginx (serveur web)
- ✅ SSL/HTTPS (Let's Encrypt)
- ✅ Pare-feu (UFW)
- ✅ Backups automatiques

**Durée** : ~10-15 minutes

📖 **Guide complet** : [DEPLOIEMENT_VPS.md](DEPLOIEMENT_VPS.md)

---

## 💻 Développement Local

### Prérequis

- Node.js 20.x ou supérieur
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone https://github.com/ed3352p/streaming-app.git
cd streaming-app

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Scripts Disponibles

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build pour la production
npm run preview      # Prévisualiser le build
npm run lint         # Linter le code
npm start            # Démarrer frontend + backend
npm run server       # Démarrer uniquement le backend
```

---

## 📁 Structure du Projet

```
streaming-app/
├── public/              # Fichiers statiques et SEO
│   ├── robots.txt      # Configuration robots
│   ├── sitemap.xml     # Plan du site
│   └── _headers        # Headers HTTP
├── src/
│   ├── components/     # Composants React
│   ├── pages/          # Pages de l'application
│   ├── context/        # Contextes React
│   ├── services/       # Services API
│   └── utils/          # Utilitaires
├── server/             # Backend Node.js
├── vps-install.sh      # Script d'installation VPS
├── nginx.conf          # Configuration Nginx
├── ecosystem.config.js # Configuration PM2
└── .env                # Variables d'environnement
```

---

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine :

```env
# URL de l'API
VITE_API_URL=https://lumixar.com/api

# Port du serveur
PORT=3000

# Environnement
NODE_ENV=production

# JWT Secret (générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=votre_cle_secrete_jwt

# Durée de session (24h)
SESSION_DURATION=86400
```

Voir `.env.example` pour toutes les options disponibles.

---

## 🌐 Déploiement

### VPS (Ubuntu/Debian)

Suivez le guide complet : [DEPLOIEMENT_VPS.md](DEPLOIEMENT_VPS.md)

### Netlify / Vercel

```bash
# Build
npm run build

# Le dossier dist/ contient les fichiers à déployer
```

---

## 🛠️ Maintenance

### Mise à jour

```bash
cd /var/www/lumixar
./update.sh
```

### Backup

```bash
./backup.sh
```

### Monitoring

```bash
./monitor.sh
```

### Commandes PM2

```bash
pm2 status          # Voir le status
pm2 logs lumixar    # Voir les logs
pm2 restart lumixar # Redémarrer
pm2 monit           # Monitoring en temps réel
```

---

## 🔒 Sécurité

- ✅ SSL/TLS automatique (Let's Encrypt)
- ✅ Headers de sécurité (CSP, HSTS, etc.)
- ✅ Rate limiting
- ✅ JWT pour l'authentification
- ✅ Validation des entrées
- ✅ Protection CSRF

---

## 📊 SEO

Le projet est optimisé pour le référencement :

- ✅ Meta tags complets (Open Graph, Twitter Cards)
- ✅ Structured Data (Schema.org)
- ✅ Sitemap XML
- ✅ robots.txt optimisé
- ✅ Performance optimisée (Core Web Vitals)

📖 **Guide SEO complet** : [SEO_GUIDE.md](SEO_GUIDE.md)

---

## 🎯 Fonctionnalités

### Frontend
- ⚡ React 19 + Vite
- 🎨 TailwindCSS 4
- 🔄 React Router
- 🎬 Lecteur vidéo HLS.js
- 📱 Design responsive
- 🌙 Interface moderne

### Backend
- 🚀 Node.js + Express
- 🔐 Authentification JWT
- 📊 Gestion des utilisateurs
- 🎥 Gestion du contenu
- 📺 IPTV Live
- 💳 Système d'abonnement

---

## 📝 License

MIT License - voir [LICENSE](LICENSE)

---

## 🤝 Support

- 📧 Email: support@lumixar.com
- 📖 Documentation: [DEPLOIEMENT_VPS.md](DEPLOIEMENT_VPS.md)
- 🐛 Issues: [GitHub Issues](https://github.com/ed3352p/streaming-app/issues)

---

## 🚀 Prochaines Étapes

Après l'installation :

1. ✅ Configurer votre domaine DNS
2. ✅ Personnaliser `.env`
3. ✅ Ajouter votre contenu
4. ✅ Configurer les paiements (optionnel)
5. ✅ Mettre en place le monitoring

---

**Fait avec ❤️ pour Lumixar**
