<div align="center">

# 🦄 Lumixar

### Plateforme de Streaming Premium - Films, Séries & IPTV

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.18-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[🌐 Demo](https://lumixar.online) • [📖 Documentation](./DEPLOY.md) • [🚀 Installation](./INSTALLATION.md)

</div>

---

## ✨ Fonctionnalités

### 🎬 Contenu Multimédia
- **Films HD/4K** - Catalogue de films en haute qualité
- **Séries TV** - Épisodes complets avec gestion des saisons
- **IPTV Live** - Chaînes TV en direct avec support HLS
- **Lecteur Vidéo** - Player personnalisé avec contrôles avancés

### 🎨 Interface Utilisateur
- **Design Moderne** - Interface élégante et responsive
- **Mode Sombre** - Thème sombre par défaut optimisé
- **Navigation Intuitive** - Expérience utilisateur fluide
- **Recherche Avancée** - Filtres par genre, année, note

### 🔐 Gestion des Utilisateurs
- **Authentification JWT** - Système de connexion sécurisé
- **Profils Utilisateurs** - Gestion des comptes personnalisés
- **Favoris & Historique** - Sauvegarde des préférences
- **Panel Admin** - Interface d'administration complète

### ⚡ Performance
- **Streaming HLS** - Lecture adaptative de qualité
- **Cache Optimisé** - Chargement rapide des contenus
- **SEO Friendly** - Optimisé pour les moteurs de recherche
- **PWA Ready** - Installation possible sur mobile

---

## 🚀 Installation Rapide

### Prérequis
- **Node.js** 20+ et npm
- **Serveur Ubuntu/Debian** (pour production)
- **Nom de domaine** (optionnel)

### Installation Automatique (Production)

```bash
# Cloner le dépôt
git clone https://github.com/ed3352p/streaming-app.git
cd streaming-app

# Déploiement automatique sur Ubuntu/Debian
sudo bash deploy-ubuntu.sh
```

Le script configure automatiquement :
- ✅ Node.js, npm, nginx, PM2
- ✅ SSL/HTTPS avec Let's Encrypt
- ✅ Pare-feu et sécurité
- ✅ Backups automatiques
- ✅ Monitoring système

📖 **Guide complet** : [INSTALLATION.md](./INSTALLATION.md)

### Installation Locale (Développement)

```bash
# Cloner le dépôt
git clone https://github.com/ed3352p/streaming-app.git
cd streaming-app

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer le serveur backend et frontend
npm start
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001

---

## 🛠️ Stack Technique

### Frontend
- **React 19.2** - Framework UI moderne
- **React Router 7** - Navigation SPA
- **TailwindCSS 4** - Styling utility-first
- **Lucide React** - Icônes élégantes
- **HLS.js** - Streaming vidéo adaptatif
- **Vite 7** - Build tool ultra-rapide

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web minimaliste
- **JWT** - Authentification sécurisée
- **JSON Database** - Stockage léger

### DevOps
- **PM2** - Process manager production
- **Nginx** - Reverse proxy & serveur web
- **Let's Encrypt** - Certificats SSL gratuits
- **UFW** - Pare-feu Linux

---

## 📁 Structure du Projet

```
streaming-app/
├── src/                      # Code source frontend
│   ├── components/          # Composants React
│   ├── pages/              # Pages de l'application
│   ├── contexts/           # Contexts React (Auth, etc.)
│   ├── hooks/              # Custom hooks
│   └── main.jsx            # Point d'entrée
├── server/                  # Backend Node.js
│   ├── index.js            # Serveur Express
│   ├── data/               # Base de données JSON
│   ├── uploads/            # Fichiers uploadés
│   └── logs/               # Logs backend
├── public/                  # Fichiers statiques
│   ├── _headers            # Headers HTTP
│   ├── _redirects          # Redirections
│   ├── robots.txt          # SEO
│   └── sitemap.xml         # Sitemap
├── deploy-ubuntu.sh        # Script de déploiement auto
├── .env.example            # Template configuration
├── package.json            # Dépendances npm
└── vite.config.js          # Configuration Vite
```

---

## 🎯 Commandes Disponibles

### Développement
```bash
npm run dev          # Démarrer frontend (Vite)
npm run server       # Démarrer backend (Node.js)
npm start            # Démarrer frontend + backend
```

### Production
```bash
npm run build        # Build pour production
npm run preview      # Prévisualiser le build
npm run lint         # Vérifier le code
```

### Gestion (Production)
```bash
pm2 status                    # Status de l'application
pm2 logs lumixar-backend     # Voir les logs
pm2 restart lumixar-backend  # Redémarrer
./monitor.sh                 # Monitoring système
./update.sh                  # Mise à jour
```

---

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine :

```env
# API Backend
VITE_API_URL=http://localhost:3001/api
PORT=3001

# Environnement
NODE_ENV=development

# Sécurité JWT
JWT_SECRET=votre_cle_secrete_forte_64_caracteres_minimum
SESSION_DURATION=86400

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3001

# Uploads
MAX_FILE_SIZE=100

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

📝 Voir [.env.example](./.env.example) pour toutes les options

---

## 🔐 Sécurité

- **JWT Authentication** - Tokens sécurisés pour l'authentification
- **Rate Limiting** - Protection contre les attaques DDoS
- **CORS** - Configuration stricte des origines
- **Helmet.js** - Headers HTTP sécurisés
- **Input Validation** - Validation des données utilisateur
- **SSL/TLS** - HTTPS en production avec Let's Encrypt

---

## 📊 Monitoring & Logs

### Logs Backend
```bash
pm2 logs lumixar-backend --lines 100
```

### Logs Nginx
```bash
tail -f /var/log/nginx/lumixar-access.log
tail -f /var/log/nginx/lumixar-error.log
```

### Monitoring Système
```bash
./monitor.sh        # Script de monitoring personnalisé
pm2 monit          # Monitoring PM2 interactif
htop               # Ressources système
```

---

## 🚨 Dépannage

### L'application ne démarre pas
```bash
# Vérifier les logs
pm2 logs lumixar-backend --lines 50

# Vérifier le port
netstat -tulpn | grep 3001

# Redémarrer
pm2 restart lumixar-backend
```

### Erreur 502 Bad Gateway
```bash
# Vérifier que le backend tourne
pm2 status

# Redémarrer les services
pm2 restart lumixar-backend
systemctl restart nginx
```

### Problèmes de permissions
```bash
# Réparer les permissions
sudo chown -R $USER:$USER /var/www/lumixar
sudo chmod -R 755 /var/www/lumixar
```

📖 **Guide complet** : [DEPLOY.md](./DEPLOY.md)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le projet
2. **Créer** une branche (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

---

## 📝 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 📞 Support

- **Documentation** : [DEPLOY.md](./DEPLOY.md) • [INSTALLATION.md](./INSTALLATION.md)
- **Issues** : [GitHub Issues](https://github.com/ed3352p/streaming-app/issues)
- **Email** : support@lumixar.online

---

## 🌟 Remerciements

- [React](https://reactjs.org/) - Framework UI
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS
- [HLS.js](https://github.com/video-dev/hls.js/) - Lecteur HLS
- [Lucide](https://lucide.dev/) - Icônes

---

<div align="center">

**Fait avec ❤️ et une touche de magie 🪄**

⭐ **N'oubliez pas de mettre une étoile si ce projet vous plaît !** ⭐

[⬆ Retour en haut](#-lumixar)

</div>
