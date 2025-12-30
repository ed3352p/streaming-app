# 🚀 Guide de Déploiement Lumixar sur lumixar.online

## Prérequis
- Serveur Ubuntu 20.04+ avec accès root
- Domaine `lumixar.online` pointant vers l'IP du serveur (DNS A record)
- Accès SSH au serveur

## Option 1: Déploiement Automatique (Recommandé)

### 1. Connexion au serveur
```bash
ssh root@VOTRE_IP_SERVEUR
```

### 2. Télécharger et exécuter le script
```bash
# Option A: Wget direct
wget https://raw.githubusercontent.com/ed3352p/streaming-app/refs/heads/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo bash deploy-ubuntu.sh

# Option B: Clone puis exécute (recommandé)
git clone https://github.com/ed3352p/streaming-app.git
cd streaming-app
chmod +x deploy-ubuntu.sh
sudo bash deploy-ubuntu.sh
```

### 3. Répondre aux questions
- **Mode d'installation**: `1` (Clone depuis GitHub)
- **Domaine**: `lumixar.online`
- **Email SSL**: `votre-email@exemple.com`

Le script va automatiquement:
- ✅ Installer Node.js, Nginx, PM2, Certbot
- ✅ Cloner le repository depuis GitHub
- ✅ Installer les dépendances (frontend + backend)
- ✅ Builder l'application
- ✅ Configurer SSL (Let's Encrypt)
- ✅ Démarrer l'application avec PM2
- ✅ Créer les scripts de maintenance

**Durée**: ~10-15 minutes

---

## Option 2: Déploiement Manuel

### 1. Préparer le serveur
```bash
# Mise à jour système
apt update && apt upgrade -y

# Installation dépendances
apt install -y curl wget git nginx certbot python3-certbot-nginx build-essential

# Installation Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installation PM2
npm install -g pm2
```

### 2. Cloner le projet
```bash
cd /var/www
git clone https://github.com/ed3352p/streaming-app.git lumixar
cd lumixar
```

### 3. Configuration
```bash
# Créer .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
VITE_API_URL=https://lumixar.online/api
CORS_ORIGIN=https://lumixar.online,https://www.lumixar.online
EOF
```

### 4. Installation et Build
```bash
# Backend
cd server
npm install --production
cd ..

# Frontend
npm install
npm run build
```

### 5. PM2
```bash
pm2 start server/index.js --name lumixar-backend
pm2 save
pm2 startup
```

### 6. Nginx
```bash
# Créer config
nano /etc/nginx/sites-available/lumixar
```

Coller:
```nginx
server {
    listen 80;
    server_name lumixar.online www.lumixar.online;
    root /var/www/lumixar/dist;
    index index.html;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Activer
ln -s /etc/nginx/sites-available/lumixar /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 7. SSL
```bash
certbot --nginx -d lumixar.online -d www.lumixar.online
```

---

## Après le Déploiement

### Vérifications
```bash
# Status PM2
pm2 status

# Logs backend
pm2 logs lumixar-backend

# Status Nginx
systemctl status nginx

# Test API
curl https://lumixar.online/api/health
```

### Identifiants Admin
```bash
cat /var/www/lumixar/server/data/.admin_credentials
```

### Commandes Utiles
```bash
# Redémarrer backend
pm2 restart lumixar-backend

# Mise à jour
cd /var/www/lumixar
git pull
npm install
npm run build
cd server && npm install --production
pm2 restart lumixar-backend

# Backup
tar -czf ~/lumixar-backup-$(date +%Y%m%d).tar.gz /var/www/lumixar/server/data

# Monitoring
pm2 monit
tail -f /var/log/nginx/lumixar-access.log
```

---

## Troubleshooting

### Backend ne démarre pas
```bash
pm2 logs lumixar-backend --lines 50
# Vérifier .env et permissions
```

### Erreur 502 Bad Gateway
```bash
# Vérifier que le backend tourne
pm2 status
netstat -tulpn | grep 3001
```

### SSL ne fonctionne pas
```bash
# Vérifier DNS
dig lumixar.online
# Relancer certbot
certbot renew --dry-run
```

### Build frontend échoue
```bash
# Vérifier Node.js version
node -v  # Doit être >= 18
# Nettoyer et rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## Sécurité

### Pare-feu
```bash
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

### Mises à jour automatiques
```bash
# Backup quotidien (3h du matin)
crontab -e
# Ajouter:
0 3 * * * tar -czf ~/backups/lumixar_$(date +\%Y\%m\%d).tar.gz /var/www/lumixar/server/data
```

### Monitoring
```bash
# Installer monitoring (optionnel)
npm install -g pm2-logrotate
pm2 install pm2-logrotate
```

---

## URLs Importantes

- **Site**: https://lumixar.online
- **API**: https://lumixar.online/api
- **Admin**: https://lumixar.online/admin

---

## Support

En cas de problème:
1. Vérifier les logs: `pm2 logs lumixar-backend`
2. Vérifier Nginx: `tail -f /var/log/nginx/error.log`
3. Vérifier le serveur: `systemctl status nginx`
