# 🚀 Guide de Déploiement Backend sur VPS

## Prérequis sur votre VPS

```bash
# Installer Node.js (version 18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Installer Git
sudo apt-get install -y git
```

## 1. Transférer les fichiers sur le VPS

### Option A: Via Git (recommandé)
```bash
# Sur votre VPS
cd /var/www
sudo git clone https://github.com/votre-repo/streaming-app.git lumixar
cd lumixar
```

### Option B: Via SCP/SFTP
```bash
# Depuis votre machine locale
scp -r streaming-app/ user@votre-vps-ip:/var/www/lumixar/
```

## 2. Configuration sur le VPS

```bash
# Aller dans le dossier
cd /var/www/lumixar

# Installer les dépendances
npm install

# Créer le dossier logs
mkdir -p logs

# Créer le dossier data (pour JWT secret et fichiers JSON)
mkdir -p server/data

# Copier le fichier .env.production
cp .env.production .env

# Donner les permissions
sudo chown -R $USER:$USER /var/www/lumixar
chmod -R 755 /var/www/lumixar
```

## 3. Démarrer le backend avec PM2

```bash
# Démarrer l'application
pm2 start ecosystem.config.cjs --env production

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs lumixar-backend

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# Suivre les instructions affichées
```

## 4. Configuration Nginx (Reverse Proxy)

Créer un fichier de configuration Nginx:

```bash
sudo nano /etc/nginx/sites-available/lumixar-api
```

Contenu du fichier:

```nginx
server {
    listen 80;
    server_name api.lumixar.online;  # Ou lumixar.online si même domaine

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (optionnel si déjà géré par Express)
        add_header 'Access-Control-Allow-Origin' 'https://lumixar.online' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
}
```

Activer la configuration:

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/lumixar-api /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

## 5. Configuration SSL avec Certbot (HTTPS)

```bash
# Installer Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d api.lumixar.online

# Ou si même domaine:
sudo certbot --nginx -d lumixar.online
```

## 6. Mettre à jour l'URL du backend dans le frontend

Dans votre fichier `.env` du frontend (avant le build):

```env
VITE_API_URL=https://api.lumixar.online
# Ou si même domaine:
VITE_API_URL=https://lumixar.online/api
```

Puis rebuild le frontend:

```bash
npm run build
```

## 7. Commandes PM2 utiles

```bash
# Voir les logs en temps réel
pm2 logs lumixar-backend

# Redémarrer l'application
pm2 restart lumixar-backend

# Arrêter l'application
pm2 stop lumixar-backend

# Supprimer l'application
pm2 delete lumixar-backend

# Voir les métriques
pm2 monit

# Lister toutes les applications
pm2 list
```

## 8. Vérification

```bash
# Tester si le backend répond
curl http://localhost:3001/api/movies

# Tester depuis l'extérieur
curl https://api.lumixar.online/api/movies
```

## 9. Firewall (UFW)

```bash
# Autoriser les ports nécessaires
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3001  # Backend (si accès direct, sinon non nécessaire avec Nginx)

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

## 10. Maintenance

### Mettre à jour le code
```bash
cd /var/www/lumixar
git pull origin main
npm install
pm2 restart lumixar-backend
```

### Sauvegarder les données
```bash
# Sauvegarder le dossier data
tar -czf backup-$(date +%Y%m%d).tar.gz server/data/
```

### Voir les logs d'erreur
```bash
pm2 logs lumixar-backend --err
```

## 🔧 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier les logs
pm2 logs lumixar-backend

# Vérifier si le port 3001 est utilisé
sudo lsof -i :3001

# Redémarrer PM2
pm2 restart all
```

### Erreur CORS
- Vérifier que `lumixar.online` est dans la liste CORS du backend
- Vérifier la configuration Nginx
- Vérifier les headers dans les DevTools du navigateur

### Erreur 502 Bad Gateway
- Le backend n'est pas démarré: `pm2 start ecosystem.config.cjs`
- Vérifier les logs: `pm2 logs`
- Vérifier la configuration Nginx

## 📊 Monitoring

```bash
# Installer PM2 monitoring (optionnel)
pm2 install pm2-logrotate

# Configurer la rotation des logs
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## ✅ Checklist finale

- [ ] Node.js installé (v18+)
- [ ] PM2 installé globalement
- [ ] Fichiers transférés sur le VPS
- [ ] `npm install` exécuté
- [ ] Dossiers `logs` et `server/data` créés
- [ ] Backend démarré avec PM2
- [ ] Nginx configuré et redémarré
- [ ] SSL configuré avec Certbot
- [ ] Frontend rebuild avec la bonne `VITE_API_URL`
- [ ] Firewall configuré
- [ ] Tests de connexion réussis

## 🎯 URLs finales

- Frontend: `https://lumixar.online`
- Backend API: `https://api.lumixar.online` (ou `https://lumixar.online/api`)
- PM2 Web: `http://votre-vps-ip:9615` (si pm2-web installé)
