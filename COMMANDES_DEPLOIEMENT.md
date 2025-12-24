# 🚀 Toutes les Commandes de Déploiement VPS Ubuntu

## 📦 ÉTAPE 1: Préparer le VPS

```bash
# Connexion SSH
ssh root@votre-ip-vps

# Mettre à jour le système
sudo apt update
sudo apt upgrade -y

# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version
npm --version

# Installer PM2
sudo npm install -g pm2

# Installer Nginx
sudo apt install -y nginx

# Créer le dossier de l'application
cd /var/www
sudo mkdir streaming-app
sudo chown -R $USER:$USER streaming-app
```

---

## 📤 ÉTAPE 2: Transférer l'Application

### Option A: Avec SCP (depuis Windows PowerShell)
```powershell
# Sur votre machine Windows
cd C:\Users\ed3352\Desktop\dev\web

# Compresser (si tar disponible, sinon utilisez WinRAR/7zip)
# Puis transférer avec WinSCP ou FileZilla vers /var/www/streaming-app
```

### Option B: Sur le VPS directement
```bash
cd /var/www/streaming-app
# Uploader vos fichiers via SFTP (WinSCP/FileZilla)
```

---

## ⚙️ ÉTAPE 3: Configurer l'Application

```bash
# Aller dans le dossier
cd /var/www/streaming-app

# Créer le fichier .env
nano .env
```

**Contenu du .env:**
```env
VITE_API_URL=http://votre-domaine.com
JWT_SECRET=votre-cle-secrete-generee
PORT=3001
NODE_ENV=production
```

**Générer JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Installer les dépendances:**
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..

# Build frontend
npm run build
```

---

## 🔄 ÉTAPE 4: Configurer PM2

```bash
# Créer ecosystem.config.js
nano ecosystem.config.js
```

**Contenu de ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'streaming-app',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

**Démarrer l'application:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Copier et exécuter la commande affichée
```

**Vérifier:**
```bash
pm2 status
pm2 logs streaming-app
```

---

## 🌐 ÉTAPE 5: Configurer Nginx

```bash
# Créer la configuration
sudo nano /etc/nginx/sites-available/streaming-app
```

**Contenu de la configuration Nginx:**
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    root /var/www/streaming-app/dist;
    index index.html;

    access_log /var/log/nginx/streaming-app-access.log;
    error_log /var/log/nginx/streaming-app-error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Activer le site:**
```bash
sudo ln -s /etc/nginx/sites-available/streaming-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 ÉTAPE 6: Configurer le Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

---

## 🔐 ÉTAPE 7: SSL/HTTPS (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Tester le renouvellement automatique
sudo certbot renew --dry-run
```

---

## ✅ ÉTAPE 8: Vérification

```bash
# Vérifier PM2
pm2 status
pm2 logs streaming-app --lines 50

# Vérifier Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/streaming-app-error.log

# Récupérer les identifiants admin
cat /var/www/streaming-app/server/data/.admin_credentials
```

---

## 🛠️ COMMANDES UTILES

### Gestion PM2
```bash
pm2 restart streaming-app    # Redémarrer
pm2 stop streaming-app        # Arrêter
pm2 logs streaming-app        # Logs en temps réel
pm2 monit                     # Moniteur
pm2 delete streaming-app      # Supprimer
```

### Gestion Nginx
```bash
sudo systemctl restart nginx  # Redémarrer
sudo systemctl stop nginx     # Arrêter
sudo systemctl start nginx    # Démarrer
sudo systemctl status nginx   # Statut
sudo nginx -t                 # Tester config
```

### Mise à jour de l'application
```bash
cd /var/www/streaming-app
npm install
npm run build
cd server && npm install && cd ..
pm2 restart streaming-app
```

### Logs
```bash
# Logs PM2
pm2 logs streaming-app

# Logs Nginx
sudo tail -f /var/log/nginx/streaming-app-access.log
sudo tail -f /var/log/nginx/streaming-app-error.log

# Logs système
sudo journalctl -xe
```

---

## 🔧 DÉPANNAGE

### Erreur 502 Bad Gateway
```bash
# Vérifier que le backend tourne
pm2 status
pm2 restart streaming-app

# Vérifier les logs
pm2 logs streaming-app
sudo tail -f /var/log/nginx/streaming-app-error.log
```

### Problème de permissions
```bash
sudo chown -R $USER:$USER /var/www/streaming-app
chmod -R 755 /var/www/streaming-app
```

### Redémarrer tout
```bash
pm2 restart streaming-app
sudo systemctl restart nginx
```

---

## 🔐 SÉCURITÉ SUPPLÉMENTAIRE

```bash
# Installer Fail2Ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Changer le port SSH (optionnel)
sudo nano /etc/ssh/sshd_config
# Changer Port 22 à Port 2222
sudo systemctl restart sshd

# Désactiver root login
sudo nano /etc/ssh/sshd_config
# Mettre PermitRootLogin no
sudo systemctl restart sshd
```

---

## 📝 CHECKLIST FINALE

- [ ] Node.js installé
- [ ] PM2 installé
- [ ] Nginx installé
- [ ] Application transférée
- [ ] .env configuré
- [ ] Dépendances installées
- [ ] Frontend build
- [ ] PM2 démarré
- [ ] Nginx configuré
- [ ] Firewall activé
- [ ] SSL configuré (optionnel)
- [ ] Application accessible

---

**Votre application est maintenant en ligne!** 🎉

Accès: `http://votre-domaine.com` ou `https://votre-domaine.com` (avec SSL)
