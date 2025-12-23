# Guide Rapide - Déploiement VPS Ubuntu

## 📋 Résumé en 5 étapes

### 1️⃣ Préparer le VPS
```bash
# Connexion SSH
ssh root@votre-ip-vps

# Installation des outils nécessaires
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

### 2️⃣ Transférer l'application
```bash
# Sur votre PC Windows (PowerShell)
cd C:\Users\ed3352\Desktop\web
scp -r streaming-app votre-utilisateur@votre-ip-vps:/var/www/

# Ou utilisez WinSCP/FileZilla pour transférer le dossier
```

### 3️⃣ Configurer et démarrer
```bash
# Sur le VPS
cd /var/www/streaming-app

# Créer le fichier .env
nano .env
# Copiez le contenu de .env.example et modifiez:
# - VITE_API_URL avec votre domaine ou IP
# - JWT_SECRET avec une clé générée (voir ci-dessous)

# Générer une clé JWT sécurisée
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Installer et construire
npm install
cd server && npm install && cd ..
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4️⃣ Configurer Nginx
```bash
# Copier la configuration
sudo cp nginx.conf /etc/nginx/sites-available/streaming-app

# Modifier le fichier avec votre domaine/IP
sudo nano /etc/nginx/sites-available/streaming-app
# Remplacez "votre-domaine.com" par votre domaine ou IP

# Activer le site
sudo ln -s /etc/nginx/sites-available/streaming-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5️⃣ Configurer le firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## ✅ Vérification

```bash
# Vérifier PM2
pm2 status

# Vérifier Nginx
sudo systemctl status nginx

# Voir les logs
pm2 logs streaming-app
```

## 🔐 Récupérer les identifiants admin

```bash
cat /var/www/streaming-app/server/data/.admin_credentials
```

## 🌐 Accéder à l'application

Ouvrez dans votre navigateur:
- `http://votre-ip-vps` ou `http://votre-domaine.com`

## 🔒 SSL/HTTPS (Optionnel mais recommandé)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat (nécessite un domaine)
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

## 🔄 Mise à jour de l'application

```bash
cd /var/www/streaming-app
chmod +x deploy.sh
./deploy.sh
```

## 📞 Commandes utiles

```bash
pm2 restart streaming-app    # Redémarrer
pm2 stop streaming-app        # Arrêter
pm2 logs streaming-app        # Voir les logs
pm2 monit                     # Monitorer

sudo systemctl restart nginx  # Redémarrer Nginx
```

## ❓ Problèmes courants

### L'application ne démarre pas
```bash
pm2 logs streaming-app --lines 100
```

### Nginx retourne une erreur 502
```bash
# Vérifier que le backend tourne
pm2 status
# Vérifier les logs
sudo tail -f /var/log/nginx/streaming-app-error.log
```

### Problème de permissions
```bash
sudo chown -R $USER:$USER /var/www/streaming-app
chmod -R 755 /var/www/streaming-app
```

---

Pour plus de détails, consultez `DEPLOIEMENT_VPS.md`
