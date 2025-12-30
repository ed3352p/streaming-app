# ✅ Checklist de Sécurité - Déploiement Production

## 🔴 CRITIQUE - À faire AVANT le déploiement

- [ ] **Générer un nouveau JWT_SECRET**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  Ajouter dans `.env` ou variable d'environnement serveur

- [ ] **Configurer NODE_ENV=production**
  ```bash
  export NODE_ENV=production
  ```

- [ ] **Activer HTTPS/TLS**
  - Obtenir un certificat SSL (Let's Encrypt recommandé)
  - Configurer le reverse proxy (nginx/Apache)
  - Forcer la redirection HTTP → HTTPS

- [ ] **Vérifier les origines CORS**
  - Supprimer localhost des origines autorisées
  - Ne garder que les domaines de production

- [ ] **Changer le mot de passe admin par défaut**
  - Se connecter avec les identifiants dans `server/data/.admin_credentials`
  - Changer immédiatement le mot de passe
  - Le fichier sera automatiquement supprimé

## 🟠 IMPORTANT - Configuration serveur

- [ ] **Configurer un reverse proxy (nginx)**
  ```nginx
  server {
    listen 443 ssl http2;
    server_name lumixar.online;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
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
  }
  ```

- [ ] **Configurer fail2ban**
  ```bash
  sudo apt-get install fail2ban
  # Créer /etc/fail2ban/jail.local avec règles pour votre app
  ```

- [ ] **Configurer les logs**
  - Rotation des logs (logrotate)
  - Monitoring des erreurs
  - Alertes pour activités suspectes

- [ ] **Limiter les permissions fichiers**
  ```bash
  chmod 600 server/data/.jwt_secret
  chmod 600 .env
  chmod 700 server/data
  ```

## 🟡 RECOMMANDÉ - Sécurité additionnelle

- [ ] **Implémenter HttpOnly Cookies pour les tokens**
  - Remplacer localStorage par des cookies sécurisés
  - Voir `SECURITY.md` pour l'implémentation

- [ ] **Ajouter DOMPurify côté client**
  ```bash
  npm install dompurify
  ```

- [ ] **Configurer un WAF (Web Application Firewall)**
  - Cloudflare (gratuit)
  - AWS WAF
  - ModSecurity

- [ ] **Mettre en place des backups automatiques**
  - Base de données
  - Fichiers uploadés
  - Configuration

- [ ] **Configurer le monitoring**
  - Uptime monitoring (UptimeRobot, Pingdom)
  - Performance monitoring (New Relic, Datadog)
  - Error tracking (Sentry)

## 🟢 OPTIONNEL - Améliorations futures

- [ ] **Implémenter 2FA (Two-Factor Authentication)**
- [ ] **Ajouter CAPTCHA sur login/register**
- [ ] **Mettre en place un système de sessions Redis**
- [ ] **Implémenter des refresh tokens**
- [ ] **Ajouter un système de notifications de sécurité**
- [ ] **Configurer un CDN pour les assets statiques**
- [ ] **Implémenter rate limiting distribué (Redis)**

## 📋 Tests de Sécurité

### Tests Manuels
```bash
# Test rate limiting login
for i in {1..10}; do 
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifier":"test","password":"test"}'
  echo ""
done

# Test rate limiting register
for i in {1..5}; do 
  curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@test.com","username":"test'$i'","password":"Test123!@#"}'
  echo ""
done

# Vérifier les headers de sécurité
curl -I https://votre-domaine.com

# Test injection SQL/NoSQL
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":{"$ne":null}}'
```

### Tests Automatisés
```bash
# Audit npm
npm audit

# Scan de sécurité avec Snyk
npx snyk test

# Test de pénétration avec OWASP ZAP
# Installer ZAP et scanner votre application
```

## 📊 Monitoring Post-Déploiement

### Première semaine
- [ ] Vérifier les logs quotidiennement
- [ ] Monitorer les tentatives de connexion échouées
- [ ] Vérifier les performances (temps de réponse)
- [ ] Tester tous les endpoints critiques

### Premier mois
- [ ] Analyser les patterns de trafic
- [ ] Identifier les IPs suspectes
- [ ] Vérifier l'utilisation des ressources
- [ ] Audit des comptes utilisateurs

### Maintenance continue
- [ ] Mise à jour des dépendances (hebdomadaire)
- [ ] Rotation des secrets (trimestrielle)
- [ ] Audit de sécurité complet (trimestriel)
- [ ] Test de pénétration (annuel)

## 🆘 Contacts d'Urgence

**En cas d'incident de sécurité:**
1. Isoler le serveur compromis
2. Analyser les logs
3. Bloquer les IPs malveillantes
4. Notifier les utilisateurs si nécessaire
5. Documenter l'incident

**Contacts:**
- DevOps: [À définir]
- Sécurité: [À définir]
- Hébergeur: [À définir]

## 📝 Notes

- Date de déploiement: ___________
- Responsable: ___________
- Version: ___________
- Environnement: Production / Staging / Dev

---

**Dernière révision**: 30 Décembre 2024
**Version**: 1.0.0
