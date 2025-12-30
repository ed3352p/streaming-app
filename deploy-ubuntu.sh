#!/bin/bash

###############################################################################
# Script de déploiement automatique Lumixar sur Ubuntu
# Version: 3.0 - Clone Git automatique
# Date: 2025-12-29
# Usage: sudo bash deploy-ubuntu.sh
# GitHub: https://github.com/ed3352p/streaming-app.git
###############################################################################

set -e
set -o pipefail

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
GIT_REPO="https://github.com/ed3352p/streaming-app.git"
GIT_BRANCH="main"
DOMAIN="lumixar.online"
EMAIL=""
APP_DIR="/var/www/lumixar"
TEMP_DIR="/tmp/lumixar-install-$$"
NODE_VERSION="20"
USE_SSL="y"
INSTALL_MODE="git"

# Demander le mode d'installation
print_step "Mode d'installation"
echo "1) Clone depuis GitHub (recommandé)"
echo "2) Utiliser les fichiers locaux"
read -p "Choisissez (1 ou 2) [1]: " INSTALL_CHOICE
INSTALL_CHOICE=${INSTALL_CHOICE:-1}

if [ "$INSTALL_CHOICE" = "1" ]; then
    INSTALL_MODE="git"
    print_info "Mode: Clone depuis GitHub"
else
    INSTALL_MODE="local"
    print_info "Mode: Fichiers locaux"
fi

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
print_info "  Mode: $INSTALL_MODE"
[ "$INSTALL_MODE" = "git" ] && print_info "  Repository: $GIT_REPO"
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

# 6. Préparation et sauvegarde
print_step "Préparation du répertoire d'application"
if [ -d "$APP_DIR" ]; then
    print_info "Sauvegarde de l'ancienne installation..."
    BACKUP_DIR="/root/lumixar-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    [ -d "$APP_DIR/server/data" ] && cp -r "$APP_DIR/server/data" "$BACKUP_DIR/" 2>/dev/null || true
    [ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" "$BACKUP_DIR/" 2>/dev/null || true
    [ -f "$APP_DIR/server/data/.admin_credentials" ] && cp "$APP_DIR/server/data/.admin_credentials" "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Backup créé: $BACKUP_DIR"
    rm -rf "$APP_DIR"
fi

mkdir -p "$APP_DIR"
mkdir -p "$TEMP_DIR"
print_success "Répertoires préparés"

# 7. Clone ou copie des fichiers
if [ "$INSTALL_MODE" = "git" ]; then
    print_step "Clone du repository GitHub"
    
    # Vérifier que git est installé
    if ! command -v git &> /dev/null; then
        print_error "Git n'est pas installé. Installez-le avec: apt install git"
    fi
    
    # Clone dans un répertoire temporaire
    print_info "Clone depuis $GIT_REPO (branche: $GIT_BRANCH)..."
    
    # Vérifier la connectivité internet
    if ! ping -c 1 github.com &> /dev/null; then
        print_error "Impossible de contacter GitHub. Vérifiez votre connexion internet."
    fi
    
    # Supprimer le répertoire temporaire s'il existe déjà
    rm -rf "$TEMP_DIR"
    
    # Cloner le repository avec affichage des erreurs
    print_info "Téléchargement en cours..."
    if git clone --depth 1 --branch "$GIT_BRANCH" "$GIT_REPO" "$TEMP_DIR" 2>&1; then
        print_success "Clone Git réussi"
    else
        echo ""
        print_error "Échec du clone Git. Causes possibles:
  - Le repository n'existe pas ou est privé
  - La branche '$GIT_BRANCH' n'existe pas
  - Problème de connexion internet
  - URL incorrecte: $GIT_REPO
  
Vérifiez que le repository est public et accessible."
    fi
    
    # Vérifier que le clone a réussi et contient les fichiers nécessaires
    if [ ! -d "$TEMP_DIR" ]; then
        print_error "Le répertoire temporaire n'a pas été créé"
    fi
    
    if [ ! -f "$TEMP_DIR/package.json" ]; then
        print_error "Le repository est invalide (package.json manquant). Vérifiez que le repository GitHub est correct."
    fi
    
    # Copier les fichiers vers le répertoire final
    print_info "Copie des fichiers vers $APP_DIR..."
    
    # Copier tous les fichiers (y compris les fichiers cachés)
    shopt -s dotglob
    cp -r "$TEMP_DIR"/* "$APP_DIR/" 2>/dev/null || true
    shopt -u dotglob
    
    # Nettoyer le répertoire temporaire
    rm -rf "$TEMP_DIR"
    
    print_success "Repository cloné et fichiers copiés"
else
    print_step "Copie des fichiers locaux"
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    # Vérifier que les fichiers locaux existent
    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        print_error "Fichiers locaux introuvables. Utilisez le mode Git (option 1)."
    fi
    
    cp -r "$SCRIPT_DIR"/* "$APP_DIR/" 2>/dev/null || true
    cp -r "$SCRIPT_DIR"/.* "$APP_DIR/" 2>/dev/null || true
    print_success "Fichiers locaux copiés"
fi

# Vérifier que les fichiers essentiels sont présents
cd "$APP_DIR"
if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "src" ]; then
    print_error "Fichiers essentiels manquants. Installation échouée."
fi
print_success "Vérification des fichiers: OK"

# 8. Configuration .env
print_step "Configuration de l'environnement"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

if [ "$DOMAIN" = "localhost" ]; then
    API_URL="http://localhost:3001"
    CORS_ORIGIN="http://localhost:5173,http://localhost:8080,http://localhost:3001"
else
    API_URL=""
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

# Vérifier que package.json existe
if [ ! -f "package.json" ]; then
    print_error "server/package.json introuvable"
fi

print_info "Installation en cours (cela peut prendre quelques minutes)..."
if ! npm install --production 2>&1 | grep -E "(added|up to date|audited)"; then
    print_error "Échec de l'installation des dépendances backend"
fi

# Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    print_error "node_modules backend non créé"
fi

print_success "Dépendances backend installées ($(ls node_modules | wc -l) packages)"

# 10. Installation dépendances frontend
print_step "Installation des dépendances frontend"
cd "$APP_DIR"

print_info "Installation en cours (cela peut prendre quelques minutes)..."
if ! npm install 2>&1 | grep -E "(added|up to date|audited)"; then
    print_error "Échec de l'installation des dépendances frontend"
fi

# Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    print_error "node_modules frontend non créé"
fi

print_success "Dépendances frontend installées ($(ls node_modules | wc -l) packages)"

# 11. Build frontend
print_step "Build de l'application frontend"
print_info "Build en cours (cela peut prendre quelques minutes)..."

if ! npm run build 2>&1 | tail -20; then
    print_error "Échec du build frontend"
fi

# Vérifier que le dossier dist existe et contient des fichiers
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    print_error "Build frontend échoué: dist/index.html introuvable"
fi

DIST_SIZE=$(du -sh dist | cut -f1)
print_success "Frontend buildé avec succès (Taille: $DIST_SIZE)"

# 12. Création des répertoires nécessaires
print_step "Création des répertoires de données"
mkdir -p "$APP_DIR/server/data"
mkdir -p "$APP_DIR/server/uploads"
mkdir -p "$APP_DIR/server/chunks"
mkdir -p "$APP_DIR/server/encoded"
mkdir -p "$APP_DIR/server/thumbnails"
mkdir -p "$APP_DIR/logs"

# Restaurer les données de backup si elles existent
if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
    print_info "Restauration des données depuis le backup..."
    [ -d "$BACKUP_DIR/data" ] && cp -r "$BACKUP_DIR/data"/* "$APP_DIR/server/data/" 2>/dev/null || true
    [ -f "$BACKUP_DIR/.env" ] && cp "$BACKUP_DIR/.env" "$APP_DIR/" 2>/dev/null || true
    [ -f "$BACKUP_DIR/.admin_credentials" ] && cp "$BACKUP_DIR/.admin_credentials" "$APP_DIR/server/data/" 2>/dev/null || true
    print_success "Données restaurées"
fi

chmod -R 755 "$APP_DIR/server/data"
chmod -R 755 "$APP_DIR/server/uploads"
chmod -R 755 "$APP_DIR/server/chunks"
chmod -R 755 "$APP_DIR/server/encoded"
print_success "Répertoires créés et configurés"

# 13. Configuration PM2
print_step "Configuration de PM2"
cat > "$APP_DIR/ecosystem.config.cjs" << 'EOF'
module.exports = {
  apps: [{
    name: 'lumixar-backend',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# Arrêter l'ancienne instance si elle existe
pm2 delete lumixar-backend 2>/dev/null || true
sleep 2

# Démarrer la nouvelle instance
if ! pm2 start ecosystem.config.cjs 2>&1 | tail -10; then
    print_error "Échec du démarrage PM2"
fi

sleep 3

# Vérifier que l'application est bien démarrée
if ! pm2 list | grep -q "lumixar-backend.*online"; then
    print_error "L'application n'est pas en ligne. Vérifiez les logs: pm2 logs lumixar-backend"
fi

pm2 save
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
print_success "PM2 configuré et application démarrée"

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

# Tester la configuration Nginx
print_info "Test de la configuration Nginx..."
if ! nginx -t 2>&1 | tail -5; then
    print_error "Configuration Nginx invalide"
fi

# Redémarrer Nginx
if ! systemctl restart nginx; then
    print_error "Échec du redémarrage Nginx"
fi

# Vérifier que Nginx est actif
if ! systemctl is-active --quiet nginx; then
    print_error "Nginx n'est pas actif"
fi

print_success "Nginx configuré et actif"

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
cat > "$APP_DIR/update.sh" << EOF
#!/bin/bash
set -e
echo "🔄 Mise à jour de Lumixar..."
cd /var/www/lumixar

if [ -d ".git" ]; then
    echo "📥 Pull depuis Git..."
    git pull
else
    echo "⚠️  Pas de repository Git. Clone depuis GitHub..."
    cd /tmp
    rm -rf lumixar-update
    git clone --depth 1 $GIT_REPO lumixar-update
    cd lumixar-update
    
    # Backup des données
    [ -d /var/www/lumixar/server/data ] && cp -r /var/www/lumixar/server/data /tmp/lumixar-data-backup
    [ -f /var/www/lumixar/.env ] && cp /var/www/lumixar/.env /tmp/lumixar-env-backup
    
    # Copier les nouveaux fichiers
    cp -r * /var/www/lumixar/
    
    # Restaurer les données
    [ -d /tmp/lumixar-data-backup ] && cp -r /tmp/lumixar-data-backup/* /var/www/lumixar/server/data/
    [ -f /tmp/lumixar-env-backup ] && cp /tmp/lumixar-env-backup /var/www/lumixar/.env
    
    cd /var/www/lumixar
    rm -rf /tmp/lumixar-update
fi

echo "📦 Installation des dépendances..."
npm install --production
cd server && npm install --production && cd ..

echo "🔨 Build du frontend..."
npm run build

echo "🔄 Redémarrage de l'application..."
pm2 restart lumixar-backend

echo "✅ Mise à jour terminée!"
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

# 18. Vérifications finales
print_step "Vérifications finales"

# Vérifier que le backend répond
print_info "Test de l'API backend..."
sleep 5
if curl -s http://localhost:3001/api/health > /dev/null 2>&1 || curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Backend répond correctement"
else
    print_info "Backend en cours de démarrage... (vérifiez les logs si problème)"
fi

# Vérifier Nginx
if [ "$DOMAIN" = "localhost" ]; then
    if curl -s http://localhost > /dev/null 2>&1; then
        print_success "Nginx répond correctement"
    else
        print_error "Nginx ne répond pas"
    fi
fi

# 19. Récupération des credentials admin
print_step "Récupération des identifiants admin"
sleep 3
if [ -f "$APP_DIR/server/data/.admin_credentials" ]; then
    cat "$APP_DIR/server/data/.admin_credentials"
else
    print_info "Les identifiants admin seront générés au premier démarrage"
    print_info "Attendez 10 secondes puis vérifiez: cat $APP_DIR/server/data/.admin_credentials"
fi

# 20. Affichage final
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
