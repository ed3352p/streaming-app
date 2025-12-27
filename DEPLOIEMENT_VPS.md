# 🚀 Guide de Déploiement VPS - Lumixar

Guide complet pour déployer Lumixar sur un VPS Ubuntu/Debian.

---

## 📋 Prérequis

### Serveur VPS
- **OS**: Ubuntu 20.04/22.04 LTS ou Debian 11/12
- **RAM**: Minimum 2 GB (4 GB recommandé)
- **CPU**: 2 vCPU minimum
- **Stockage**: 20 GB minimum
- **Accès**: SSH root ou sudo

### Domaine
- Nom de domaine configuré (ex: lumixar.com)
- DNS pointant vers l'IP du VPS (A record)
- Sous-domaine www optionnel

---

## 🎯 Installation Automatique (Recommandé)

### Étape 1: Connexion SSH
```bash
ssh root@VOTRE_IP_VPS
```

### Étape 2: Télécharger le script
```bash
cd /root
wget https://raw.githubusercontent.com/ed3352p/streaming-app/main/vps-install.sh
chmod +x vps-install.sh
```

### Étape 3: Lancer l'installation
```bash
./vps-install.sh
```

Le script vous demandera:
- **Nom de domaine**: lumixar.com
- **Email**: votre@email.com (pour SSL)

**Durée**: ~10-15 minutes

---

## 🔧 Installation Manuelle

### 1. Mise à jour du système
```bash
apt update && apt upgrade -y
```

### 2. Installation de Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Vérifier la version
npm -v
```

### 3. Installation de PM2
```bash
npm install -g pm2
pm2 startup systemd
```

### 4. Installation de Nginx
```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 5. Installation de Certbot (SSL)
```bash
apt install -y certbot python3-certbot-nginx
```

### 6. Configuration du pare-feu
```bash
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

### 7. Déploiement du code

#### Option A: Git
```bash
mkdir -p /var/www/lumixar
cd /var/www/lumixar
git clone https://github.com/ed3352p/streaming-app.git .
```

#### Option B: SCP (depuis votre PC)
```bash
# Sur votre PC local
scp -r ./streaming-app/* root@VOTRE_IP:/var/www/lumixar/
```

### 8. Installation des dépendances
```bash
cd /var/www/lumixar
npm install --production
```

### 9. Configuration de l'environnement
```bash
cp .env.example .env
nano .env
```

Configurez vos variables:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=votre_database_url
JWT_SECRET=votre_secret_jwt_securise
```

### 10. Build de l'application
```bash
npm run build
```

### 11. Démarrage avec PM2
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 12. Configuration Nginx
```bash
# Copier la configuration
cp nginx.conf /etc/nginx/sites-available/lumixar

# Créer le lien symbolique
ln -s /etc/nginx/sites-available/lumixar /etc/nginx/sites-enabled/

# Supprimer la config par défaut
rm /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Redémarrer Nginx
systemctl restart nginx
```

### 13. Installation SSL (Let's Encrypt)
```bash
certbot --nginx -d lumixar.com -d www.lumixar.com
```

Suivez les instructions et choisissez la redirection HTTPS.

### 14. Vérification
```bash
# Vérifier PM2
pm2 status

# Vérifier Nginx
systemctl status nginx

# Vérifier les logs
pm2 logs lumixar
```

---

## 📊 Commandes Utiles

### PM2
```bash
# Voir le status
pm2 status

# Voir les logs
pm2 logs lumixar

# Redémarrer l'app
pm2 restart lumixar

# Arrêter l'app
pm2 stop lumixar

# Supprimer l'app
pm2 delete lumixar

# Monitoring
pm2 monit

# Interface web (port 9615)
pm2 web
```

### Nginx
```bash
# Tester la configuration
nginx -t

# Redémarrer
systemctl restart nginx

# Recharger (sans downtime)
systemctl reload nginx

# Voir les logs
tail -f /var/log/nginx/lumixar-access.log
tail -f /var/log/nginx/lumixar-error.log
```

### SSL
```bash
# Renouveler manuellement
certbot renew

# Tester le renouvellement
certbot renew --dry-run

# Voir les certificats
certbot certificates
```

### Système
```bash
# Espace disque
df -h

# Mémoire
free -h

# Processus
htop

# Logs système
journalctl -xe
```

---

## 🔄 Mise à Jour de l'Application

### Méthode 1: Script automatique
```bash
cd /var/www/lumixar
./update.sh
```

### Méthode 2: Manuelle
```bash
cd /var/www/lumixar

# Pull les changements
git pull

# Installer les nouvelles dépendances
npm install --production

# Rebuild
npm run build

# Redémarrer
pm2 restart lumixar
```

---

## 💾 Backup et Restauration

### Backup Manuel
```bash
/root/backup-lumixar.sh
```

Les backups sont stockés dans `/root/backups/`

### Backup Automatique
Le script d'installation configure un backup quotidien à 3h du matin.

Vérifier le cron:
```bash
crontab -l
```

### Restauration
```bash
cd /var/www
tar -xzf /root/backups/lumixar_YYYYMMDD_HHMMSS.tar.gz
pm2 restart lumixar
```

---

## 🔒 Sécurité

### 1. Changer le port SSH (optionnel)
```bash
nano /etc/ssh/sshd_config
# Changer Port 22 à Port 2222
systemctl restart sshd

# Mettre à jour le pare-feu
ufw allow 2222/tcp
ufw delete allow ssh
```

### 2. Désactiver l'authentification par mot de passe
```bash
nano /etc/ssh/sshd_config
# PasswordAuthentication no
systemctl restart sshd
```

### 3. Installer Fail2Ban
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 4. Mises à jour automatiques
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 📈 Monitoring et Performance

### 1. Installer Netdata (optionnel)
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```
Accès: http://VOTRE_IP:19999

### 2. Logs en temps réel
```bash
# Logs combinés
pm2 logs

# Logs Nginx
tail -f /var/log/nginx/lumixar-access.log

# Logs système
journalctl -f
```

### 3. Monitoring PM2
```bash
pm2 monit
```

---

## 🐛 Dépannage

### L'application ne démarre pas
```bash
# Vérifier les logs
pm2 logs lumixar --lines 100

# Vérifier le port
netstat -tulpn | grep 3000

# Redémarrer
pm2 restart lumixar
```

### Nginx retourne 502 Bad Gateway
```bash
# Vérifier que l'app tourne
pm2 status

# Vérifier les logs Nginx
tail -f /var/log/nginx/lumixar-error.log

# Vérifier la config Nginx
nginx -t
```

### SSL ne fonctionne pas
```bash
# Vérifier les certificats
certbot certificates

# Renouveler
certbot renew --force-renewal

# Vérifier la config Nginx
nginx -t
```

### Manque de mémoire
```bash
# Vérifier l'utilisation
free -h

# Créer un swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Disque plein
```bash
# Vérifier l'espace
df -h

# Nettoyer les logs
pm2 flush
journalctl --vacuum-time=7d

# Nettoyer apt
apt clean
apt autoremove
```

---

## 🎯 Optimisations

### 1. Cache Nginx
Ajoutez dans la config Nginx:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### 2. Compression Brotli
```bash
apt install -y nginx-module-brotli
```

### 3. HTTP/3 (QUIC)
Nécessite Nginx compilé avec support QUIC.

### 4. CDN
Utilisez Cloudflare pour:
- Cache global
- Protection DDoS
- SSL gratuit
- Optimisation automatique

---

## 📞 Support

### Logs importants
- **PM2**: `pm2 logs lumixar`
- **Nginx**: `/var/log/nginx/lumixar-*.log`
- **Système**: `journalctl -xe`

### Vérifications
```bash
# Status général
pm2 status
systemctl status nginx
ufw status

# Ports ouverts
netstat -tulpn

# Processus
ps aux | grep node
```

---

## ✅ Checklist Post-Installation

- [ ] Application accessible via HTTPS
- [ ] Redirection HTTP → HTTPS fonctionne
- [ ] SSL valide (cadenas vert)
- [ ] PM2 démarre au boot
- [ ] Backup automatique configuré
- [ ] Pare-feu activé
- [ ] Logs accessibles
- [ ] Monitoring en place
- [ ] DNS configuré correctement
- [ ] Email de contact SSL valide

---

## 🚀 Prochaines Étapes

1. **Configurer un CDN** (Cloudflare)
2. **Mettre en place un monitoring** (Uptime Robot)
3. **Configurer les alertes** (email/Slack)
4. **Optimiser les performances** (cache, compression)
5. **Sauvegardes externes** (S3, Backblaze)

---

*Guide créé le 27 décembre 2025 pour Lumixar v1.0*
