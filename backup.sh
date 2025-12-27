#!/bin/bash

###############################################################################
# Script de backup Lumixar
# Usage: ./backup.sh
# Cron: 0 3 * * * /var/www/lumixar/backup.sh
###############################################################################

set -e

APP_DIR="/var/www/lumixar"
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_BACKUPS=7

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

echo "======================================"
echo "📦 Backup de Lumixar"
echo "======================================"
echo ""

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

# Backup de l'application
print_info "Création du backup..."
tar -czf $BACKUP_DIR/lumixar_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='.git' \
    $APP_DIR

BACKUP_SIZE=$(du -h $BACKUP_DIR/lumixar_$DATE.tar.gz | cut -f1)
print_success "Backup créé: lumixar_$DATE.tar.gz ($BACKUP_SIZE)"

# Backup de la base de données (si applicable)
if [ -f "$APP_DIR/.env" ]; then
    print_info "Backup de la configuration..."
    cp $APP_DIR/.env $BACKUP_DIR/env_$DATE.backup
    print_success "Configuration sauvegardée"
fi

# Nettoyer les anciens backups
print_info "Nettoyage des anciens backups (garde les $KEEP_BACKUPS derniers)..."
cd $BACKUP_DIR
ls -t lumixar_*.tar.gz | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm
print_success "Anciens backups supprimés"

# Afficher les backups disponibles
echo ""
echo "📋 Backups disponibles:"
ls -lh $BACKUP_DIR/lumixar_*.tar.gz | tail -n $KEEP_BACKUPS

echo ""
print_success "Backup terminé!"
echo ""
