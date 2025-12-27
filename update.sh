#!/bin/bash

###############################################################################
# Script de mise à jour Lumixar
# Usage: ./update.sh
###############################################################################

set -e

echo "======================================"
echo "🔄 Mise à jour de Lumixar"
echo "======================================"
echo ""

APP_DIR="/var/www/lumixar"
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

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

# Vérifier qu'on est dans le bon répertoire
if [ ! -d "$APP_DIR" ]; then
    echo "Erreur: Répertoire $APP_DIR non trouvé"
    exit 1
fi

cd $APP_DIR

# 1. Backup avant mise à jour
print_info "Création d'un backup de sécurité..."
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/lumixar_pre_update_$DATE.tar.gz $APP_DIR
print_success "Backup créé: lumixar_pre_update_$DATE.tar.gz"

# 2. Arrêter l'application
print_info "Arrêt de l'application..."
pm2 stop lumixar
print_success "Application arrêtée"

# 3. Pull des changements (si Git)
if [ -d ".git" ]; then
    print_info "Récupération des dernières modifications..."
    git pull
    print_success "Code mis à jour"
else
    print_info "Pas de repository Git détecté - mise à jour manuelle requise"
fi

# 4. Installation des dépendances
print_info "Installation des dépendances..."
npm install --production
print_success "Dépendances installées"

# 5. Build de l'application
print_info "Build de l'application..."
npm run build
print_success "Application buildée"

# 6. Redémarrage de l'application
print_info "Redémarrage de l'application..."
pm2 restart lumixar
print_success "Application redémarrée"

# 7. Vérification
sleep 3
pm2 status lumixar

echo ""
echo "======================================"
echo "✅ Mise à jour terminée avec succès!"
echo "======================================"
echo ""
echo "📊 Status: pm2 status lumixar"
echo "📋 Logs: pm2 logs lumixar"
echo ""
