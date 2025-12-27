#!/bin/bash

###############################################################################
# Script de déploiement automatique Lumixar sur Ubuntu
# Version: 2.0
# Date: 2025-12-27
# Usage: sudo bash deploy-ubuntu.sh
###############################################################################

set -e

echo "======================================"
echo "🚀 Déploiement Lumixar sur Ubuntu"
echo "======================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonctions d'affichage
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; exit 1; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }
print_step() { echo -e "${BLUE}▶ $1${NC}"; }

# Vérifier root
if [[ $EUID -ne 0 ]]; then
   print_error "Ce script doit être exécuté en tant que root (sudo)"
fi

# Variables
DOMAIN=""
EMAIL=""
APP_DIR="/var/www/lumixar"
NODE_VERSION="20"
USE_SSL="y"

# Demander les informations
print_step "Configuration du déploiement"
read -p "Nom de domaine (ex: lumixar.com) ou appuyez sur Entrée pour localhost: " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
    USE_SSL="n"
    print_info "Mode localhost activé (sans SSL)"
else
    read -p "Email pour SSL (ex: admin@$DOMAIN): " EMAIL
    if [ -z "$EMAIL" ]; then
        print_error "Email requis pour SSL"
    fi
fi

echo ""
print_info "Configuration:"
print_info "  Domaine: $DOMAIN"
[ "$USE_SSL" = "y" ] && print_info "  Email: $EMAIL"
print_info "  Répertoire: $APP_DIR"
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Installation annulée"
fi

# 1. Mise à jour système
print_step "Mise à jour du système"
export DEBIAN_FRONTEND=noninteractive
apt update -qq
apt upgrade -y -qq
print_success "Système mis à jour"

# 2. Installation dépendances
print_step "Installation des dépendances système"
apt install -y -qq curl wget git ufw nginx build-essential
if [ "$USE_SSL" = "y" ]; then
    apt install -y -qq certbot python3-certbot-nginx
fi
print_success "Dépendances installées"

# 3. Installation Node.js
print_step "Installation de Node.js ${NODE_VERSION}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
    apt install -y -qq nodejs
fi
print_success "Node.js $(node -v) installé"
print_success "npm $(npm -v) installé"

# 4. Installation PM2
print_step "Installation de PM2"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 --silent
fi
pm2 update > /dev/null 2>&1 || true
print_success "PM2 installé"

# 5. Configuration pare-feu
print_step "Configuration du pare-feu"
ufw --force enable > /dev/null 2>&1
ufw allow ssh > /dev/null 2>&1
ufw allow http > /dev/null 2>&1
ufw allow https > /dev/null 2>&1
print_success "Pare-feu configuré"

# 6. Préparation répertoire
print_step "Préparation du répertoire d'application"
if [ -d "$APP_DIR" ]; then
    print_info "Sauvegarde de l'ancienne installation..."
    BACKUP_DIR="/root/lumixar-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    [ -d "$APP_DIR/server/data" ] && cp -r "$APP_DIR/server/data" "$BACKUP_DIR/" 2>/dev/null || true
    [ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Backup créé: $BACKUP_DIR"
    rm -rf "$APP_DIR"
fi

mkdir -p "$APP_DIR"
print_success "Répertoire préparé"

# 7. Copie des fichiers
print_step "Installation des fichiers de l'application"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp -r "$SCRIPT_DIR"/* "$APP_DIR/" 2>/dev/null || true
cp -r "$SCRIPT_DIR"/.* "$APP_DIR/" 2>/dev/null || true
cd "$APP_DIR"
print_success "Fichiers copiés"

# 8. Configuration .env
print_step "Configuration de l'environnement"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

if [ "$DOMAIN" = "localhost" ]; then
    API_URL="http://localhost:3001/api"
    CORS_ORIGIN="http://localhost:5173,http://localhost:8080,http://localhost:3001"
else
    API_URL="https://$DOMAIN/api"
    CORS_ORIGIN="https://$DOMAIN,https://www.$DOMAIN,http://$DOMAIN"
fi

cat > "$APP_DIR/.env" << EOF
# Configuration Lumixar - Production
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=$JWT_SECRET
SESSION_DURATION=86400

# API
VITE_API_URL=$API_URL

# CORS
CORS_ORIGIN=$CORS_ORIGIN

# Sécurité
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=100
LOG_LEVEL=info
EOF

print_success "Fichier .env créé"

# 9. Installation dépendances backend
print_step "Installation des dépendances backend"
cd "$APP_DIR/server"
npm install --production --silent
print_success "Dépendances backend installées"

# 10. Installation dépendances frontend
print_step "Installation des dépendances frontend"
cd "$APP_DIR"
npm install --silent
print_success "Dépendances frontend installées"

# 11. Build frontend
print_step "Build de l'application frontend"
npm run build
print_success "Frontend buildé"

# 12. Création des répertoires nécessaires
print_step "Création des répertoires de données"
mkdir -p "$APP_DIR/server/data"
mkdir -p "$APP_DIR/server/uploads"
mkdir -p "$APP_DIR/server/chunks"
mkdir -p "$APP_DIR/server/encoded"
mkdir -p "$APP_DIR/logs"
chmod -R 755 "$APP_DIR/server/data"
chmod -R 755 "$APP_DIR/server/uploads"
print_success "Répertoires créés"

# 13. Configuration PM2
print_step "Configuration de PM2"
cat > "$APP_DIR/ecosystem.config.cjs" << 'EOF'
module.exports = {
  apps: [{
    name: 'lumixar-backend',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/backend-err.log',
    out_file: './logs/backend-out.log',
    log_file: './logs/backend-combined.log',
    time: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
EOF

pm2 delete lumixar-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
print_success "PM2 configuré et démarré"

# 14. Configuration Nginx
print_step "Configuration de Nginx"

if [ "$DOMAIN" = "localhost" ]; then
cat > /etc/nginx/sites-available/lumixar << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/lumixar/dist;
    index index.html;

    access_log /var/log/nginx/lumixar-access.log;
    error_log /var/log/nginx/lumixar-error.log;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Cache statique
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Backend
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

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Sécurité
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
else
cat > /etc/nginx/sites-available/lumixar << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/dist;
    index index.html;

    access_log /var/log/nginx/lumixar-access.log;
    error_log /var/log/nginx/lumixar-error.log;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Cache statique
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
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
}
EOF
fi

ln -sf /etc/nginx/sites-available/lumixar /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
print_success "Nginx configuré"

# 15. SSL avec Let's Encrypt
if [ "$USE_SSL" = "y" ]; then
    print_step "Installation du certificat SSL"
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
    systemctl enable certbot.timer
    systemctl start certbot.timer
    print_success "SSL configuré"
fi

# 16. Optimisations système
print_step "Optimisations système"
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 65535
* hard nofile 65535
EOF

cat >> /etc/sysctl.conf << 'EOF'
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
EOF
sysctl -p > /dev/null 2>&1
print_success "Optimisations appliquées"

# 17. Scripts utilitaires
print_step "Création des scripts utilitaires"

# Script de mise à jour
cat > "$APP_DIR/update.sh" << 'EOF'
#!/bin/bash
echo "🔄 Mise à jour de Lumixar..."
cd /var/www/lumixar
git pull
npm install --production --silent
cd server && npm install --production --silent && cd ..
npm run build
pm2 restart lumixar-backend
echo "✓ Mise à jour terminée!"
EOF
chmod +x "$APP_DIR/update.sh"

# Script de backup
cat > /root/backup-lumixar.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
echo "📦 Backup de Lumixar..."
tar -czf "$BACKUP_DIR/lumixar_$DATE.tar.gz" /var/www/lumixar/server/data /var/www/lumixar/.env 2>/dev/null
echo "✓ Backup: $BACKUP_DIR/lumixar_$DATE.tar.gz"
ls -t "$BACKUP_DIR"/lumixar_*.tar.gz | tail -n +8 | xargs -r rm
EOF
chmod +x /root/backup-lumixar.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup-lumixar.sh") | crontab -

# Script de monitoring
cat > "$APP_DIR/monitor.sh" << 'EOF'
#!/bin/bash
echo "📊 Status Lumixar"
echo "=================="
echo ""
echo "🔹 PM2 Status:"
pm2 status
echo ""
echo "🔹 Nginx Status:"
systemctl status nginx --no-pager | head -n 5
echo ""
echo "🔹 Disk Usage:"
df -h /var/www/lumixar | tail -n 1
echo ""
echo "🔹 Memory Usage:"
free -h | grep Mem
echo ""
echo "🔹 Recent Logs (dernières 10 lignes):"
pm2 logs lumixar-backend --lines 10 --nostream
EOF
chmod +x "$APP_DIR/monitor.sh"

print_success "Scripts utilitaires créés"

# 18. Récupération des credentials admin
print_step "Récupération des identifiants admin"
sleep 2
if [ -f "$APP_DIR/server/data/.admin_credentials" ]; then
    cat "$APP_DIR/server/data/.admin_credentials"
else
    print_info "Les identifiants admin seront générés au premier démarrage"
    print_info "Vérifiez: cat $APP_DIR/server/data/.admin_credentials"
fi

# 19. Affichage final
echo ""
echo "======================================"
echo "✅ INSTALLATION TERMINÉE!"
echo "======================================"
echo ""
print_success "Lumixar est maintenant en ligne!"
echo ""
echo "📋 Informations:"
if [ "$DOMAIN" = "localhost" ]; then
    echo "  🌐 URL: http://localhost"
    echo "  🌐 API: http://localhost/api"
else
    echo "  🌐 URL: https://$DOMAIN"
    echo "  🌐 API: https://$DOMAIN/api"
fi
echo "  📁 Répertoire: $APP_DIR"
echo "  🔑 Credentials: $APP_DIR/server/data/.admin_credentials"
echo ""
echo "🔧 Commandes utiles:"
echo "  • Status: $APP_DIR/monitor.sh"
echo "  • Logs: pm2 logs lumixar-backend"
echo "  • Redémarrer: pm2 restart lumixar-backend"
echo "  • Mise à jour: $APP_DIR/update.sh"
echo "  • Backup: /root/backup-lumixar.sh"
echo ""
echo "📊 Monitoring:"
echo "  • PM2: pm2 monit"
echo "  • Nginx: tail -f /var/log/nginx/lumixar-access.log"
echo ""
print_info "Vérifiez les logs avec: pm2 logs lumixar-backend"
echo ""
