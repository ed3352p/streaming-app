# 🚀 Guide de Déploiement Lumixar sur Ubuntu

## Installation Automatique (Recommandé)

### Prérequis
- Serveur Ubuntu 20.04+ ou Debian 11+
- Accès root (sudo)
- Nom de domaine pointant vers votre serveur (optionnel)

### Déploiement en Une Commande

```bash
sudo bash deploy-ubuntu.sh
```

Le script va automatiquement:
1. ✅ Mettre à jour le système
2. ✅ Installer Node.js 20, npm, nginx, PM2
3. ✅ Configurer le pare-feu (UFW)
4. ✅ Installer les dépendances
5. ✅ Builder l'application
6. ✅ Configurer PM2 pour le backend
7. ✅ Configurer Nginx comme reverse proxy
8. ✅ Installer SSL avec Let's Encrypt (si domaine fourni)
9. ✅ Créer les scripts de maintenance
10. ✅ Optimiser le système

### Options de Déploiement

#### 1. Avec Nom de Domaine (Production)
```bash
sudo bash deploy-ubuntu.sh
# Entrez votre domaine: lumixar.com
# Entrez votre email: admin@lumixar.com
```
- ✅ SSL automatique (HTTPS)
- ✅ Certificat Let's Encrypt
- ✅ Renouvellement automatique

#### 2. Sans Nom de Domaine (Localhost/Test)
```bash
sudo bash deploy-ubuntu.sh
# Appuyez sur Entrée pour localhost
```
- ✅ Accès via IP du serveur
- ✅ HTTP uniquement
- ✅ Parfait pour tests

## Après Installation

### 1. Vérifier le Statut
```bash
cd /var/www/lumixar
./monitor.sh
```

### 2. Récupérer les Identifiants Admin
```bash
cat /var/www/lumixar/server/data/.admin_credentials
```

### 3. Accéder à l'Application
- **Avec domaine**: https://votre-domaine.com
- **Sans domaine**: http://IP-DU-SERVEUR

## Commandes Utiles

### Gestion de l'Application
```bash
# Voir les logs en temps réel
pm2 logs lumixar-backend

# Redémarrer l'application
pm2 restart lumixar-backend

# Arrêter l'application
pm2 stop lumixar-backend

# Status PM2
pm2 status

# Monitoring interactif
pm2 monit
```

### Mise à Jour
```bash
cd /var/www/lumixar
./update.sh
```

### Backup
```bash
# Backup manuel
/root/backup-lumixar.sh

# Les backups automatiques sont programmés à 3h du matin
# Localisation: /root/backups/
```

### Logs
```bash
# Logs backend
pm2 logs lumixar-backend

# Logs Nginx
tail -f /var/log/nginx/lumixar-access.log
tail -f /var/log/nginx/lumixar-error.log

# Logs système
journalctl -u nginx -f
```

### Nginx
```bash
# Redémarrer Nginx
systemctl restart nginx

# Status Nginx
systemctl status nginx

# Tester la configuration
nginx -t

# Recharger la configuration
systemctl reload nginx
```

## Structure des Fichiers

```
/var/www/lumixar/
├── dist/                    # Frontend buildé
├── server/
│   ├── index.js            # Backend principal
│   ├── data/               # Base de données JSON
│   │   ├── users.json
│   │   ├── movies.json
│   │   ├── series.json
│   │   └── .admin_credentials
│   ├── uploads/            # Fichiers uploadés
│   └── logs/               # Logs backend
├── logs/                   # Logs PM2
├── .env                    # Configuration
├── ecosystem.config.js     # Config PM2
├── monitor.sh              # Script monitoring
└── update.sh               # Script mise à jour
```

## Configuration Avancée

### Modifier le Port Backend
```bash
nano /var/www/lumixar/.env
# Changez PORT=3001 à votre port souhaité
pm2 restart lumixar-backend
```

### Ajouter un Domaine Supplémentaire
```bash
nano /etc/nginx/sites-available/lumixar
# Ajoutez le domaine dans server_name
certbot --nginx -d nouveau-domaine.com
systemctl reload nginx
```

### Augmenter les Ressources PM2
```bash
nano /var/www/lumixar/ecosystem.config.js
# Modifiez max_memory_restart ou instances
pm2 restart lumixar-backend
```

## Sécurité

### Pare-feu (UFW)
```bash
# Voir les règles
ufw status

# Bloquer une IP
ufw deny from IP_ADDRESS

# Autoriser un port
ufw allow PORT_NUMBER
```

### SSL/HTTPS
```bash
# Renouveler manuellement
certbot renew

# Tester le renouvellement
certbot renew --dry-run

# Status du timer de renouvellement
systemctl status certbot.timer
```

### Changer le Mot de Passe Admin
1. Connectez-vous avec les credentials initiaux
2. Allez dans Paramètres > Changer le mot de passe
3. Le fichier `.admin_credentials` sera automatiquement supprimé

## Dépannage

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

# Vérifier les logs Nginx
tail -f /var/log/nginx/lumixar-error.log

# Redémarrer les services
pm2 restart lumixar-backend
systemctl restart nginx
```

### Problème de Permissions
```bash
# Réparer les permissions
chown -R root:root /var/www/lumixar
chmod -R 755 /var/www/lumixar
chmod -R 755 /var/www/lumixar/server/data
```

### Base de Données Corrompue
```bash
# Restaurer depuis backup
cd /root/backups
tar -xzf lumixar_YYYYMMDD_HHMMSS.tar.gz
cp -r var/www/lumixar/server/data/* /var/www/lumixar/server/data/
pm2 restart lumixar-backend
```

## Performance

### Monitoring
```bash
# CPU et RAM
htop

# Espace disque
df -h

# Trafic réseau
iftop

# Monitoring PM2
pm2 monit
```

### Optimisation
```bash
# Nettoyer les logs
pm2 flush

# Nettoyer les anciens backups
ls -t /root/backups/*.tar.gz | tail -n +8 | xargs rm

# Nettoyer npm cache
npm cache clean --force
```

## Support

### Logs Importants
- Backend: `pm2 logs lumixar-backend`
- Nginx: `/var/log/nginx/lumixar-*.log`
- Système: `journalctl -xe`

### Informations Système
```bash
# Version Node.js
node -v

# Version npm
npm -v

# Version PM2
pm2 -v

# Version Nginx
nginx -v

# Info système
uname -a
```

## Désinstallation

```bash
# Arrêter les services
pm2 delete lumixar-backend
pm2 save

# Supprimer Nginx config
rm /etc/nginx/sites-enabled/lumixar
rm /etc/nginx/sites-available/lumixar
systemctl reload nginx

# Supprimer l'application
rm -rf /var/www/lumixar

# Supprimer les backups (optionnel)
rm -rf /root/backups
```

---

**Note**: Pour toute question ou problème, vérifiez d'abord les logs avec `pm2 logs lumixar-backend`
