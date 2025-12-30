# 🔄 Guide Configuration Reverse Proxy Nginx

## 📋 Qu'est-ce qu'un Reverse Proxy ?

Un **reverse proxy** est un serveur qui se place devant votre backend et redirige les requêtes des clients. Dans votre cas :

```
Client (navigateur) 
    ↓
    → https://lumixar.online/api/movies
    ↓
Nginx (port 80/443) 
    ↓
    → Reverse Proxy vers http://localhost:3001/api/movies
    ↓
Backend Node.js (port 3001)
```

### ✅ Avantages

- **Sécurité** : Le backend n'est pas exposé directement
- **SSL/HTTPS** : Nginx gère les certificats SSL
- **Performance** : Cache, compression, load balancing
- **Simplicité** : Un seul domaine pour frontend + backend

---

## 🚀 Installation sur VPS Ubuntu

### 1️⃣ Installer Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### 2️⃣ Copier la configuration

Copiez le fichier `nginx-lumixar.conf` sur votre VPS :

```bash
# Sur votre VPS
sudo nano /etc/nginx/sites-available/lumixar
```

Collez le contenu du fichier `nginx-lumixar.conf` et modifiez :
- `server_name` : Remplacez par votre domaine
- `root` : Vérifiez le chemin vers votre dossier `dist`

### 3️⃣ Activer la configuration

```bash
# Créer un lien symbolique
sudo ln -s /etc/nginx/sites-available/lumixar /etc/nginx/sites-enabled/

# Désactiver la config par défaut
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 4️⃣ Vérifier que ça fonctionne

```bash
# Vérifier que Nginx écoute sur le port 80
sudo netstat -tlnp | grep :80

# Tester l'API
curl http://localhost/api/movies
```

---

## 🔒 Configuration SSL avec Let's Encrypt

### Installation Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtenir un certificat SSL

```bash
sudo certbot --nginx -d lumixar.online -d www.lumixar.online
```

Certbot va :
1. Vérifier que vous possédez le domaine
2. Générer les certificats SSL
3. Modifier automatiquement votre config Nginx
4. Configurer le renouvellement automatique

### Renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Le renouvellement automatique est configuré via systemd
sudo systemctl status certbot.timer
```

---

## 📝 Configuration Backend

### Mettre à jour le fichier `.env`

```bash
# Sur votre VPS : /var/www/lumixar/.env
VITE_API_URL=https://lumixar.online/api
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://lumixar.online,https://www.lumixar.online
```

### Mettre à jour CORS dans `server/index.js`

Le backend doit autoriser les requêtes depuis votre domaine :

```javascript
app.use(cors({
  origin: [
    'https://lumixar.online',
    'https://www.lumixar.online',
    'http://localhost:5173' // Pour le développement local
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Redémarrer le backend

```bash
pm2 restart lumixar-backend
```

---

## 🧪 Tests

### 1. Tester le frontend

```bash
curl https://lumixar.online
# Doit retourner le HTML de votre app
```

### 2. Tester l'API (reverse proxy)

```bash
curl https://lumixar.online/api/movies
# Doit retourner la liste des films en JSON
```

### 3. Tester depuis le navigateur

Ouvrez `https://lumixar.online` et vérifiez :
- ✅ Pas d'erreur CORS dans la console
- ✅ Les films se chargent
- ✅ Le cadenas SSL est vert

---

## 🔧 Dépannage

### Erreur CORS

**Symptôme** : `Cross-Origin Request Blocked`

**Solution** :
1. Vérifiez que `CORS_ORIGIN` dans `.env` contient votre domaine
2. Redémarrez le backend : `pm2 restart lumixar-backend`
3. Vérifiez les logs : `pm2 logs lumixar-backend`

### Backend ne répond pas

**Symptôme** : `502 Bad Gateway`

**Solution** :
```bash
# Vérifier que le backend tourne
pm2 status

# Vérifier que le port 3001 écoute
sudo netstat -tlnp | grep :3001

# Redémarrer le backend
pm2 restart lumixar-backend
```

### Nginx ne démarre pas

**Symptôme** : `nginx: [emerg] bind() to 0.0.0.0:80 failed`

**Solution** :
```bash
# Vérifier qu'aucun autre service n'utilise le port 80
sudo netstat -tlnp | grep :80

# Arrêter Apache si installé
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Certificat SSL expiré

**Solution** :
```bash
# Renouveler manuellement
sudo certbot renew

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 📊 Monitoring

### Logs Nginx

```bash
# Logs d'accès
sudo tail -f /var/log/nginx/lumixar-access.log

# Logs d'erreur
sudo tail -f /var/log/nginx/lumixar-error.log
```

### Logs Backend

```bash
# Logs PM2
pm2 logs lumixar-backend

# Logs en temps réel
pm2 logs lumixar-backend --lines 100
```

### Status des services

```bash
# Status Nginx
sudo systemctl status nginx

# Status Backend
pm2 status

# Monitoring en temps réel
pm2 monit
```

---

## 🎯 Architecture Finale

```
Internet
    ↓
Nginx (Port 80/443)
    ├── / → Frontend (React/Vite) - /var/www/lumixar/dist
    └── /api → Reverse Proxy → Backend Node.js (localhost:3001)
```

### Flux de requête

1. **Frontend** : `https://lumixar.online` → Nginx sert les fichiers statiques
2. **API** : `https://lumixar.online/api/movies` → Nginx proxy vers `http://localhost:3001/api/movies`
3. **Backend** : Traite la requête et renvoie les données
4. **Nginx** : Retourne la réponse au client avec SSL

---

## 📌 Commandes Utiles

```bash
# Redémarrer Nginx
sudo systemctl restart nginx

# Recharger la config Nginx (sans downtime)
sudo nginx -s reload

# Tester la config Nginx
sudo nginx -t

# Redémarrer le backend
pm2 restart lumixar-backend

# Voir les logs en temps réel
pm2 logs lumixar-backend --lines 50

# Status complet
sudo systemctl status nginx
pm2 status
```

---

## 🔐 Sécurité

### Headers de sécurité (déjà configurés)

- `X-Frame-Options: DENY` - Empêche le clickjacking
- `X-Content-Type-Options: nosniff` - Empêche le MIME sniffing
- `X-XSS-Protection` - Protection XSS
- `Referrer-Policy` - Contrôle des referrers

### Firewall

```bash
# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquer l'accès direct au port 3001 depuis l'extérieur
sudo ufw deny 3001/tcp

# Activer le firewall
sudo ufw enable
```

### Rate Limiting (optionnel)

Ajoutez dans la config Nginx pour limiter les requêtes :

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... reste de la config
}
```

---

## ✅ Checklist Déploiement

- [ ] Nginx installé et configuré
- [ ] Configuration Nginx testée (`nginx -t`)
- [ ] SSL configuré avec Certbot
- [ ] Backend démarre avec PM2
- [ ] CORS configuré dans le backend
- [ ] `.env` mis à jour avec le bon domaine
- [ ] Firewall configuré (UFW)
- [ ] Tests frontend et API fonctionnent
- [ ] Logs accessibles et propres
- [ ] Renouvellement SSL automatique activé

---

**🎉 Votre reverse proxy est maintenant configuré !**
