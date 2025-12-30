# 🚀 Démarrage Rapide du Backend sur VPS

## Solution Rapide (Si vous avez déjà Node.js et PM2)

```bash
# 1. Aller dans le dossier du projet
cd /var/www/lumixar

# 2. Installer les dépendances (si pas déjà fait)
npm install

# 3. Démarrer avec PM2
pm2 start ecosystem.config.cjs --env production

# 4. Vérifier que ça tourne
pm2 status
pm2 logs lumixar-backend
```

## Si vous n'avez pas PM2

```bash
# Installer PM2
sudo npm install -g pm2

# Puis suivre les étapes ci-dessus
```

## Vérifier que le backend fonctionne

```bash
# Test local sur le VPS
curl http://localhost:3001/api/movies

# Si ça retourne des données JSON, c'est bon!
```

## Problème: Le frontend ne peut pas accéder au backend

### Vous avez 2 options:

### Option 1: Utiliser Nginx comme reverse proxy (RECOMMANDÉ)

1. Installer Nginx:
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

2. Créer la configuration:
```bash
sudo nano /etc/nginx/sites-available/lumixar
```

3. Coller cette configuration:
```nginx
server {
    listen 80;
    server_name lumixar.online www.lumixar.online;

    # Frontend (fichiers statiques)
    location / {
        root /var/www/lumixar/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
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
}
```

4. Activer et redémarrer:
```bash
sudo ln -s /etc/nginx/sites-available/lumixar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. Modifier le frontend pour utiliser l'URL relative:
```bash
# Créer un fichier .env dans le dossier racine
echo "VITE_API_URL=" > .env

# Rebuild le frontend
npm run build

# Copier les fichiers dans le dossier Nginx
sudo cp -r dist/* /var/www/lumixar/dist/
```

### Option 2: Utiliser un sous-domaine pour l'API

1. Créer un sous-domaine `api.lumixar.online` pointant vers votre VPS

2. Configuration Nginx:
```bash
sudo nano /etc/nginx/sites-available/lumixar-api
```

```nginx
server {
    listen 80;
    server_name api.lumixar.online;

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
    }
}
```

3. Activer:
```bash
sudo ln -s /etc/nginx/sites-available/lumixar-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. Modifier le frontend:
```bash
echo "VITE_API_URL=https://api.lumixar.online" > .env
npm run build
```

## Activer HTTPS (SSL) avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d lumixar.online -d www.lumixar.online

# Si vous utilisez un sous-domaine API:
sudo certbot --nginx -d api.lumixar.online

# Certbot va automatiquement configurer HTTPS et rediriger HTTP vers HTTPS
```

## Commandes Utiles

```bash
# Voir les logs du backend
pm2 logs lumixar-backend

# Redémarrer le backend
pm2 restart lumixar-backend

# Arrêter le backend
pm2 stop lumixar-backend

# Voir le statut
pm2 status

# Redémarrer Nginx
sudo systemctl restart nginx

# Voir les logs Nginx
sudo tail -f /var/log/nginx/error.log
```

## Dépannage

### Erreur CORS
- Vérifiez que `lumixar.online` est dans la liste CORS du backend (déjà fait)
- Utilisez Nginx comme reverse proxy (Option 1 recommandée)

### Backend ne démarre pas
```bash
# Vérifier les logs
pm2 logs lumixar-backend

# Vérifier si le port 3001 est libre
sudo lsof -i :3001

# Tuer le processus si nécessaire
sudo kill -9 <PID>
```

### 502 Bad Gateway
- Le backend n'est pas démarré: `pm2 start ecosystem.config.cjs`
- Vérifier que le backend écoute sur le bon port: `pm2 logs`

### Permission denied
```bash
sudo chown -R $USER:$USER /var/www/lumixar
chmod -R 755 /var/www/lumixar
```

## Configuration Firewall

```bash
# Autoriser les ports nécessaires
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# Activer le firewall
sudo ufw enable
```

## ✅ Checklist Rapide

1. [ ] Backend démarré avec PM2: `pm2 start ecosystem.config.cjs`
2. [ ] Backend accessible localement: `curl http://localhost:3001/api/movies`
3. [ ] Nginx installé et configuré
4. [ ] SSL configuré avec Certbot
5. [ ] Frontend rebuild avec la bonne URL API
6. [ ] Test final: Ouvrir `https://lumixar.online` dans le navigateur

## 🎯 Résultat Final

Après configuration, votre site devrait être accessible:
- **Frontend**: https://lumixar.online
- **Backend API**: https://lumixar.online/api (Option 1) ou https://api.lumixar.online (Option 2)
- **Aucune erreur CORS**
- **HTTPS activé**
