#!/usr/bin/env bash

###############################################################################
# Script de mise à jour Lumixar depuis GitHub
# Usage: sudo bash update-from-github.sh
###############################################################################

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
APP_DIR="/var/www/lumixar"
BACKUP_DIR="/root/lumixar-backup-$(date +%Y%m%d_%H%M%S)"
TEMP_DIR="/tmp/lumixar-update-$$"

echo "======================================"
echo "🔄 Mise à jour Lumixar depuis GitHub"
echo "======================================"
echo ""

# 1. Backup des données importantes
print_step "Sauvegarde des données"
mkdir -p "$BACKUP_DIR"

if [ -d "$APP_DIR/server/data" ]; then
    cp -r "$APP_DIR/server/data" "$BACKUP_DIR/"
    print_success "Données sauvegardées"
fi

if [ -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env" "$BACKUP_DIR/"
    print_success "Fichier .env sauvegardé"
fi

print_info "Backup créé: $BACKUP_DIR"

# 2. Arrêter l'application
print_step "Arrêt de l'application"
pm2 stop lumixar-backend 2>/dev/null || true
print_success "Application arrêtée"

# 3. Clone du nouveau code
print_step "Téléchargement du nouveau code"
rm -rf "$TEMP_DIR"

if ! git clone --depth 1 --branch "$GIT_BRANCH" "$GIT_REPO" "$TEMP_DIR"; then
    print_error "Échec du clone Git"
fi

if [ ! -f "$TEMP_DIR/package.json" ]; then
    print_error "Repository invalide"
fi

print_success "Code téléchargé"

# 4. Copier les nouveaux fichiers
print_step "Mise à jour des fichiers"

# Supprimer les anciens fichiers sauf data et .env
cd "$APP_DIR"
find . -maxdepth 1 ! -name '.' ! -name '..' ! -name 'server' ! -name '.env' ! -name 'node_modules' -exec rm -rf {} + 2>/dev/null || true
rm -rf src public vite.config.js package.json package-lock.json

# Copier les nouveaux fichiers
shopt -s dotglob
cp -r "$TEMP_DIR"/* "$APP_DIR/" 2>/dev/null || true
shopt -u dotglob

# Restaurer les données
if [ -d "$BACKUP_DIR/data" ]; then
    rm -rf "$APP_DIR/server/data"
    cp -r "$BACKUP_DIR/data" "$APP_DIR/server/"
fi

if [ -f "$BACKUP_DIR/.env" ]; then
    cp "$BACKUP_DIR/.env" "$APP_DIR/"
fi

# Vérifier et générer JWT_SECRET si nécessaire
if [ -f "$APP_DIR/.env" ]; then
    if ! grep -q "JWT_SECRET=" "$APP_DIR/.env"; then
        print_info "Génération de JWT_SECRET..."
        JWT_SECRET=$(openssl rand -hex 64)
        echo "JWT_SECRET=$JWT_SECRET" >> "$APP_DIR/.env"
        print_success "JWT_SECRET généré"
    fi
else
    print_info "Création du fichier .env..."
    JWT_SECRET=$(openssl rand -hex 64)
    echo "NODE_ENV=production" > "$APP_DIR/.env"
    echo "PORT=3001" >> "$APP_DIR/.env"
    echo "JWT_SECRET=$JWT_SECRET" >> "$APP_DIR/.env"
    print_success "Fichier .env créé"
fi

rm -rf "$TEMP_DIR"
print_success "Fichiers mis à jour"

# 5. Installation des dépendances
print_step "Installation des dépendances"

# Backend
cd "$APP_DIR/server"
print_info "Installation dépendances backend..."
npm install --production --silent
print_success "Dépendances backend installées"

# Frontend
cd "$APP_DIR"
print_info "Installation dépendances frontend..."
npm install --silent
print_success "Dépendances frontend installées"

# 6. Build du frontend
print_step "Build du frontend"
print_info "Build en cours..."
npm run build
print_success "Frontend buildé"

# 7. Permissions
print_step "Configuration des permissions"
chown -R www-data:www-data "$APP_DIR/dist"
chmod -R 755 "$APP_DIR/dist"
print_success "Permissions configurées"

# 8. Redémarrer l'application
print_step "Redémarrage de l'application"
cd "$APP_DIR"

# Supprimer tous les processus PM2
print_info "Suppression des anciens processus PM2..."
pm2 delete all 2>/dev/null || true

# Redémarrer avec le fichier de config
print_info "Démarrage avec ecosystem.config.cjs..."
pm2 start ecosystem.config.cjs

# Sauvegarder la configuration PM2
print_info "Sauvegarde de la configuration PM2..."
pm2 save

sleep 3

if pm2 list | grep -q "lumixar-backend.*online"; then
    print_success "Application redémarrée"
else
    print_error "Échec du redémarrage. Vérifiez: pm2 logs lumixar-backend"
fi

# 9. Vérifications
print_step "Vérifications"

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Backend répond"
else
    print_info "Backend en cours de démarrage..."
fi

if [ -f "$APP_DIR/dist/index.html" ]; then
    print_success "Frontend déployé"
else
    print_error "Frontend manquant"
fi

# 10. Résumé
echo ""
echo "======================================"
echo "✅ MISE À JOUR TERMINÉE!"
echo "======================================"
echo ""
print_success "Lumixar a été mis à jour avec succès"
echo ""
echo "📋 Informations:"
echo "  🌐 Site: https://lumixar.online"
echo "  📁 Backup: $BACKUP_DIR"
echo "  📊 Status: pm2 status"
echo "  📝 Logs: pm2 logs lumixar-backend"
echo ""
print_info "Testez le site dans votre navigateur"
echo ""
