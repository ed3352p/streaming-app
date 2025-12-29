#!/bin/bash

###############################################################################
# Script de diagnostic et réparation rapide
###############################################################################

echo "🔍 Diagnostic Lumixar..."
echo ""

# Vérifier PM2
echo "▶ Status PM2:"
pm2 status
echo ""

# Vérifier Nginx
echo "▶ Status Nginx:"
systemctl status nginx --no-pager | head -n 10
echo ""

# Vérifier les ports
echo "▶ Ports en écoute:"
netstat -tulpn | grep -E ':(80|443|3001)'
echo ""

# Vérifier les logs Nginx
echo "▶ Dernières erreurs Nginx:"
tail -n 20 /var/log/nginx/lumixar-error.log 2>/dev/null || echo "Pas de logs d'erreur"
echo ""

# Vérifier les logs PM2
echo "▶ Derniers logs PM2:"
pm2 logs lumixar-backend --lines 20 --nostream 2>/dev/null || echo "PM2 non démarré"
echo ""

# Vérifier la configuration Nginx
echo "▶ Test configuration Nginx:"
nginx -t
echo ""

# Actions de réparation
echo "🔧 Réparation automatique..."
echo ""

# 1. Redémarrer PM2
echo "▶ Redémarrage PM2..."
cd /var/www/lumixar
pm2 delete lumixar-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs 2>/dev/null || pm2 start server/index.js --name lumixar-backend
pm2 save
echo "✓ PM2 redémarré"
echo ""

# 2. Redémarrer Nginx
echo "▶ Redémarrage Nginx..."
systemctl restart nginx
echo "✓ Nginx redémarré"
echo ""

# 3. Vérifier le pare-feu
echo "▶ Status pare-feu:"
ufw status
echo ""

# 4. Test final
echo "▶ Test connexion locale:"
curl -I http://localhost 2>/dev/null | head -n 5 || echo "❌ Nginx ne répond pas"
echo ""

curl -I http://localhost:3001/api 2>/dev/null | head -n 5 || echo "❌ Backend ne répond pas"
echo ""

echo "✅ Diagnostic terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifiez que PM2 tourne: pm2 status"
echo "  2. Vérifiez les logs: pm2 logs lumixar-backend"
echo "  3. Vérifiez Nginx: systemctl status nginx"
echo "  4. Si problème persiste, vérifiez DNS Cloudflare"
