# Guide de Déploiement sur VPS Ubuntu

Ce guide vous explique comment déployer votre application de streaming sur un VPS Ubuntu.

## Prérequis

- Un VPS Ubuntu (20.04 ou plus récent)
- Accès SSH au VPS
- Un nom de domaine (optionnel mais recommandé)
- Node.js 18+ installé sur le VPS

## Étape 1: Préparer votre VPS

### 1.1 Connexion SSH
```bash
ssh root@votre-ip-vps
# ou
ssh votre-utilisateur@votre-ip-vps
```

### 1.2 Mettre à jour le système
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Installer Node.js et npm
```bash
# Installer Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### 1.4 Installer PM2 (gestionnaire de processus)
```bash
sudo npm install -g pm2
```

### 1.5 Installer Nginx (serveur web)
```bash
sudo apt install -y nginx
```

## Étape 2: Transférer votre application sur le VPS

### Option A: Avec Git (recommandé)
```bash
# Sur votre VPS
cd /var/www
sudo mkdir streaming-app
sudo chown -R $USER:$USER streaming-app
cd streaming-app

# Cloner votre dépôt (si vous utilisez Git)
git clone https://github.com/votre-username/votre-repo.git .
```

### Option B: Avec SCP (transfert direct)
```bash
# Sur votre machine locale (Windows PowerShell)
# Compresser le projet
cd C:\Users\ed3352\Desktop\web
tar -czf streaming-app.tar.gz streaming-app/

# Transférer vers le VPS
scp streaming-app.tar.gz votre-utilisateur@votre-ip-vps:/var/www/

# Sur le VPS, décompresser
ssh votre-utilisateur@votre-ip-vps
cd /var/www
tar -xzf streaming-app.tar.gz
cd streaming-app
```

### Option C: Avec SFTP (FileZilla, WinSCP)
1. Ouvrir WinSCP ou FileZilla
2. Connecter au VPS (IP, port 22, utilisateur, mot de passe)
3. Transférer le dossier `streaming-app` vers `/var/www/`

## Étape 3: Configurer l'application

### 3.1 Créer le fichier .env
```bash
cd /var/www/streaming-app
nano .env
```

Ajouter le contenu suivant:
```env
# URL de base (remplacer par votre domaine ou IP)
VITE_API_URL=http://votre-domaine.com
# ou
VITE_API_URL=http://votre-ip-vps

# Clé secrète JWT (générer une clé forte)
JWT_SECRET=votre-cle-secrete-tres-longue-et-aleatoire-ici

# Port du serveur backend
PORT=3001

# Mode production
NODE_ENV=production
```

**Important**: Générez une clé JWT sécurisée:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.2 Installer les dépendances

```bash
# Dépendances du frontend
npm install

# Dépendances du backend
cd server
npm install
cd ..
```

### 3.3 Construire le frontend
```bash
npm run build
```

Cela créera un dossier `dist` avec les fichiers statiques optimisés.

## Étape 4: Configurer PM2

### 4.1 Créer le fichier de configuration PM2
```bash
nano ecosystem.config.js
```

Ajouter:
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

### 4.2 Démarrer l'application avec PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Suivez les instructions affichées pour configurer le démarrage automatique.

### 4.3 Vérifier le statut
```bash
pm2 status
pm2 logs streaming-app
```

## Étape 5: Configurer Nginx

### 5.1 Créer la configuration Nginx
```bash
sudo nano /etc/nginx/sites-available/streaming-app
```

Ajouter:
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    # ou pour IP uniquement:
    # server_name votre-ip-vps;

    root /var/www/streaming-app/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/streaming-app-access.log;
    error_log /var/log/nginx/streaming-app-error.log;

    # Servir les fichiers statiques
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy pour l'API backend
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

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.2 Activer le site
```bash
sudo ln -s /etc/nginx/sites-available/streaming-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Étape 6: Configurer le Firewall

```bash
# Autoriser HTTP et HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

## Étape 7: SSL/HTTPS avec Let's Encrypt (Recommandé)

### 7.1 Installer Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtenir un certificat SSL
```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Suivez les instructions. Certbot configurera automatiquement Nginx pour HTTPS.

### 7.3 Renouvellement automatique
```bash
sudo certbot renew --dry-run
```

Le renouvellement automatique est configuré par défaut.

## Étape 8: Vérification et Tests

### 8.1 Vérifier que tout fonctionne
```bash
# Vérifier PM2
pm2 status

# Vérifier Nginx
sudo systemctl status nginx

# Vérifier les logs
pm2 logs streaming-app --lines 50
sudo tail -f /var/log/nginx/streaming-app-error.log
```

### 8.2 Tester l'application
Ouvrir dans un navigateur:
- `http://votre-domaine.com` ou `http://votre-ip-vps`
- Vérifier la connexion admin

### 8.3 Récupérer les identifiants admin
```bash
cat /var/www/streaming-app/server/data/.admin_credentials
```

## Commandes Utiles

### Gestion PM2
```bash
pm2 restart streaming-app    # Redémarrer l'app
pm2 stop streaming-app        # Arrêter l'app
pm2 logs streaming-app        # Voir les logs
pm2 monit                     # Monitorer en temps réel
```

### Gestion Nginx
```bash
sudo systemctl restart nginx  # Redémarrer Nginx
sudo systemctl status nginx   # Statut de Nginx
sudo nginx -t                 # Tester la config
```

### Mise à jour de l'application
```bash
cd /var/www/streaming-app
git pull                      # Si vous utilisez Git
npm install                   # Mettre à jour les dépendances
npm run build                 # Reconstruire le frontend
cd server && npm install      # Mettre à jour le backend
pm2 restart streaming-app     # Redémarrer l'app
```

## Sécurité Supplémentaire

### 1. Changer le port SSH (optionnel)
```bash
sudo nano /etc/ssh/sshd_config
# Changer Port 22 à Port 2222
sudo systemctl restart sshd
```

### 2. Désactiver la connexion root
```bash
sudo nano /etc/ssh/sshd_config
# Mettre PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Installer Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Dépannage

### L'application ne démarre pas
```bash
pm2 logs streaming-app --lines 100
# Vérifier les erreurs
```

### Nginx retourne 502 Bad Gateway
```bash
# Vérifier que le backend tourne
pm2 status
# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/streaming-app-error.log
```

### Problème de permissions
```bash
sudo chown -R $USER:$USER /var/www/streaming-app
chmod -R 755 /var/www/streaming-app
```

## Support

Pour toute question, vérifiez:
1. Les logs PM2: `pm2 logs streaming-app`
2. Les logs Nginx: `sudo tail -f /var/log/nginx/streaming-app-error.log`
3. Les logs système: `sudo journalctl -xe`

---

**Votre application devrait maintenant être accessible sur votre domaine ou IP VPS!** 🚀
