#!/bin/bash

###############################################################################
# Script de monitoring Lumixar
# Usage: ./monitor.sh
###############################################################################

echo "======================================"
echo "📊 Monitoring Lumixar"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Status PM2
echo -e "${BLUE}━━━ PM2 Status ━━━${NC}"
pm2 status lumixar
echo ""

# 2. Utilisation CPU et Mémoire
echo -e "${BLUE}━━━ Ressources Système ━━━${NC}"
echo "CPU:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "  Utilisation: " 100 - $1"%"}'
echo ""
echo "Mémoire:"
free -h | awk 'NR==2{printf "  Utilisée: %s / %s (%.2f%%)\n", $3, $2, $3*100/$2}'
echo ""
echo "Disque:"
df -h / | awk 'NR==2{printf "  Utilisé: %s / %s (%s)\n", $3, $2, $5}'
echo ""

# 3. Status Nginx
echo -e "${BLUE}━━━ Nginx Status ━━━${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx: Running${NC}"
else
    echo -e "${RED}✗ Nginx: Stopped${NC}"
fi
echo ""

# 4. Connexions actives
echo -e "${BLUE}━━━ Connexions Actives ━━━${NC}"
CONNECTIONS=$(netstat -an | grep :443 | grep ESTABLISHED | wc -l)
echo "  HTTPS: $CONNECTIONS connexions"
echo ""

# 5. Dernières lignes des logs
echo -e "${BLUE}━━━ Derniers Logs (10 lignes) ━━━${NC}"
pm2 logs lumixar --lines 10 --nostream
echo ""

# 6. Uptime
echo -e "${BLUE}━━━ Uptime ━━━${NC}"
uptime -p
echo ""

# 7. Certificat SSL
echo -e "${BLUE}━━━ Certificat SSL ━━━${NC}"
if [ -d "/etc/letsencrypt/live" ]; then
    CERT_DIR=$(ls -t /etc/letsencrypt/live | head -n1)
    if [ -n "$CERT_DIR" ]; then
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$CERT_DIR/cert.pem | cut -d= -f2)
        echo "  Expire le: $EXPIRY"
    fi
fi
echo ""

# 8. Dernières requêtes Nginx
echo -e "${BLUE}━━━ Dernières Requêtes (5) ━━━${NC}"
if [ -f "/var/log/nginx/lumixar-access.log" ]; then
    tail -n 5 /var/log/nginx/lumixar-access.log | awk '{print "  " $1, $7, $9}'
fi
echo ""

echo "======================================"
echo "✅ Monitoring terminé"
echo "======================================"
