#!/bin/bash

# Script de déploiement automatisé pour VPS Ubuntu
# Usage: ./deploy.sh

echo "🚀 Démarrage du déploiement..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé. Exécutez ce script depuis la racine du projet.${NC}"
    exit 1
fi

# Mettre à jour le code (si Git est utilisé)
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Mise à jour du code depuis Git...${NC}"
    git pull
fi

# Installer les dépendances du frontend
echo -e "${YELLOW}📦 Installation des dépendances frontend...${NC}"
npm install

# Installer les dépendances du backend
echo -e "${YELLOW}📦 Installation des dépendances backend...${NC}"
cd server
npm install
cd ..

# Construire le frontend
echo -e "${YELLOW}🔨 Construction du frontend...${NC}"
npm run build

# Créer le dossier logs s'il n'existe pas
mkdir -p logs

# Vérifier si PM2 est installé
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 n'est pas installé. Installation...${NC}"
    sudo npm install -g pm2
fi

# Redémarrer l'application avec PM2
echo -e "${YELLOW}🔄 Redémarrage de l'application...${NC}"
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Afficher le statut
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
pm2 status
echo ""
echo -e "${GREEN}📊 Pour voir les logs: pm2 logs streaming-app${NC}"
echo -e "${GREEN}📈 Pour monitorer: pm2 monit${NC}"
