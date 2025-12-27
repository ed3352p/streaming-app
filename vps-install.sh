#!/bin/bash

###############################################################################
# Script d'installation automatique Lumixar sur VPS Ubuntu/Debian
# Version: 1.0
# Date: 2025-12-27
###############################################################################

set -e

echo "======================================"
echo "🚀 Installation Lumixar sur VPS"
echo "======================================"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
DOMAIN=""
EMAIL=""
APP_DIR="/var/www/lumixar"
NODE_VERSION="20"

# Fonction pour afficher les messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Vérifier si le script est exécuté en tant que root
if [[ $EUID -ne 0 ]]; then
   print_error "Ce script doit être exécuté en tant que root (sudo)"
   exit 1
fi

# Demander les informations
read -p "Entrez votre nom de domaine (ex: lumixar.com): " DOMAIN
read -p "Entrez votre email pour SSL (ex: admin@lumixar.com): " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    print_error "Le domaine et l'email sont requis!"
    exit 1
fi

print_info "Installation pour le domaine: $DOMAIN"
echo ""

# 1. Mise à jour du système
print_info "Mise à jour du système..."
apt update && apt upgrade -y
print_success "Système mis à jour"

# 2. Installation des dépendances
print_info "Installation des dépendances..."
apt install -y curl wget git ufw nginx certbot python3-certbot-nginx
print_success "Dépendances installées"

# 3. Installation de Node.js
print_info "Installation de Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
print_success "Node.js $(node -v) installé"
print_success "npm $(npm -v) installé"

# 4. Installation de PM2
print_info "Installation de PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
print_success "PM2 installé"

# 5. Configuration du pare-feu
print_info "Configuration du pare-feu UFW..."
ufw --force enable
ufw allow ssh
ufw allow http
ufw allow https
ufw status
print_success "Pare-feu configuré"

# 6. Création du répertoire de l'application
print_info "Création du répertoire de l'application..."
mkdir -p $APP_DIR
cd $APP_DIR
print_success "Répertoire créé: $APP_DIR"

# 7. Message pour le déploiement du code
print_info "Clonez maintenant votre code dans $APP_DIR"
echo ""
echo "Exemple avec Git:"
echo "  cd $APP_DIR"
echo "  git clone https://github.com/votre-repo/lumixar.git ."
echo ""
echo "Ou uploadez vos fichiers via SCP/FTP"
echo ""
read -p "Appuyez sur Entrée une fois le code déployé..."

# 8. Installation des dépendances Node.js
if [ -f "$APP_DIR/package.json" ]; then
    print_info "Installation des dépendances npm..."
    npm install --production
    print_success "Dépendances installées"
else
    print_error "package.json non trouvé dans $APP_DIR"
    exit 1
fi

# 9. Build de l'application
print_info "Build de l'application..."
npm run build
print_success "Application buildée"

# 10. Configuration de PM2
print_info "Configuration de PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'lumixar',
    script: './server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
print_success "PM2 configuré et démarré"

# 11. Configuration de Nginx
print_info "Configuration de Nginx..."
cat > /etc/nginx/sites-available/lumixar << EOF
# Configuration Nginx pour Lumixar
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirection vers HTTPS (sera activée après SSL)
    # return 301 https://\$server_name\$request_uri;

    root $APP_DIR/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/lumixar-access.log;
    error_log /var/log/nginx/lumixar-error.log;

    # Compression Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache des fichiers statiques
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Sécurité
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

# Activer le site
ln -sf /etc/nginx/sites-available/lumixar /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t
systemctl restart nginx
print_success "Nginx configuré et redémarré"

# 12. Installation du certificat SSL
print_info "Installation du certificat SSL avec Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect
print_success "Certificat SSL installé"

# 13. Configuration du renouvellement automatique SSL
print_info "Configuration du renouvellement automatique SSL..."
systemctl enable certbot.timer
systemctl start certbot.timer
print_success "Renouvellement automatique SSL configuré"

# 14. Optimisations système
print_info "Optimisations système..."

# Augmenter les limites de fichiers
cat >> /etc/security/limits.conf << EOF
* soft nofile 65535
* hard nofile 65535
EOF

# Optimisations réseau
cat >> /etc/sysctl.conf << EOF
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
EOF
sysctl -p

print_success "Optimisations appliquées"

# 15. Création du script de mise à jour
cat > $APP_DIR/update.sh << 'EOF'
#!/bin/bash
echo "🔄 Mise à jour de Lumixar..."
cd /var/www/lumixar
git pull
npm install --production
npm run build
pm2 restart lumixar
echo "✓ Mise à jour terminée!"
EOF
chmod +x $APP_DIR/update.sh
print_success "Script de mise à jour créé"

# 16. Création du script de backup
cat > /root/backup-lumixar.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo "📦 Backup de Lumixar..."
tar -czf $BACKUP_DIR/lumixar_$DATE.tar.gz /var/www/lumixar
echo "✓ Backup créé: $BACKUP_DIR/lumixar_$DATE.tar.gz"

# Garder seulement les 7 derniers backups
ls -t $BACKUP_DIR/lumixar_*.tar.gz | tail -n +8 | xargs -r rm
EOF
chmod +x /root/backup-lumixar.sh

# Ajouter au cron (backup quotidien à 3h du matin)
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup-lumixar.sh") | crontab -
print_success "Script de backup créé et planifié"

# 17. Affichage des informations finales
echo ""
echo "======================================"
echo "✅ Installation terminée avec succès!"
echo "======================================"
echo ""
echo "📋 Informations importantes:"
echo "  • Domaine: https://$DOMAIN"
echo "  • Répertoire: $APP_DIR"
echo "  • Logs PM2: pm2 logs lumixar"
echo "  • Logs Nginx: /var/log/nginx/"
echo ""
echo "🔧 Commandes utiles:"
echo "  • Redémarrer l'app: pm2 restart lumixar"
echo "  • Voir les logs: pm2 logs lumixar"
echo "  • Status PM2: pm2 status"
echo "  • Mettre à jour: cd $APP_DIR && ./update.sh"
echo "  • Backup manuel: /root/backup-lumixar.sh"
echo ""
echo "🔐 Sécurité:"
echo "  • SSL: Activé (Let's Encrypt)"
echo "  • Pare-feu: Activé (UFW)"
echo "  • Renouvellement SSL: Automatique"
echo ""
echo "📊 Monitoring:"
echo "  • PM2 Web: pm2 web (port 9615)"
echo "  • Status: systemctl status nginx"
echo ""
print_success "Votre site Lumixar est maintenant en ligne!"
echo ""
