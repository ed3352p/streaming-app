# 🚀 Installation Rapide - Lumixar

## Installation en Une Commande

### Sur Ubuntu/Debian

```bash
sudo bash deploy-ubuntu.sh
```

C'est tout! Le script configure **TOUT** automatiquement:
- ✅ Node.js, npm, nginx, PM2
- ✅ Pare-feu et sécurité
- ✅ Base de données et fichiers
- ✅ SSL/HTTPS (si domaine fourni)
- ✅ Backups automatiques
- ✅ Monitoring

## Deux Options

### Option 1: Avec Domaine (Production)
```bash
sudo bash deploy-ubuntu.sh
```
- Entrez votre domaine: `lumixar.com`
- Entrez votre email: `admin@lumixar.com`
- **Résultat**: Site accessible via `https://lumixar.com` avec SSL

### Option 2: Sans Domaine (Test/Local)
```bash
sudo bash deploy-ubuntu.sh
```
- Appuyez sur Entrée (laissez vide)
- **Résultat**: Site accessible via `http://IP-DU-SERVEUR`

## Après Installation

### 1. Récupérer les Identifiants Admin
```bash
cat /var/www/lumixar/server/data/.admin_credentials
```

### 2. Accéder au Site
- **Avec domaine**: https://votre-domaine.com
- **Sans domaine**: http://VOTRE-IP-SERVEUR

### 3. Vérifier le Status
```bash
cd /var/www/lumixar
./monitor.sh
```

## Commandes Essentielles

```bash
# Voir les logs
pm2 logs lumixar-backend

# Redémarrer
pm2 restart lumixar-backend

# Mettre à jour
cd /var/www/lumixar && ./update.sh

# Backup
/root/backup-lumixar.sh
```

## Problèmes?

```bash
# Vérifier les logs
pm2 logs lumixar-backend --lines 50

# Redémarrer tout
pm2 restart lumixar-backend
systemctl restart nginx
```

---

**Documentation complète**: Voir [DEPLOY.md](./DEPLOY.md)
