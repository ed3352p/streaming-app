# 🔒 Guide de Sécurité - Application de Streaming

## ⚠️ Vulnérabilités Corrigées

### 1. Rate Limiting Réactivé
**Problème**: Tous les limiteurs de taux étaient désactivés (max: 999999)
**Solution**: Rate limiting activé avec des limites appropriées:
- Login: 5 tentatives / 15 minutes
- Inscription: 3 comptes / heure
- API: 100 requêtes / 15 minutes
- Upload: 20 uploads / heure
- Paiements: 10 tentatives / 15 minutes

### 2. Content Security Policy Renforcée
**Ajouts**:
- `objectSrc: 'none'` - Bloque les plugins dangereux
- `baseUri: 'self'` - Prévient les attaques par injection de base
- `formAction: 'self'` - Limite les soumissions de formulaires
- HSTS activé avec preload

### 3. CORS Strictement Contrôlé
**Améliorations**:
- Validation dynamique des origines
- Séparation dev/production
- Logging des tentatives CORS bloquées

### 4. Validation d'Environnement
**Nouveau**: Script de validation au démarrage
- Vérifie JWT_SECRET
- Valide NODE_ENV
- Contrôle les configurations de production

## 🛡️ Mesures de Sécurité Actives

### Authentification & Autorisation
- ✅ Tokens JWT avec expiration (24h)
- ✅ Hachage bcrypt avec cost factor 12
- ✅ Validation de force de mot de passe
- ✅ Protection contre les attaques par timing
- ✅ Blacklist IP après 10 tentatives échouées
- ✅ Changement de mot de passe obligatoire pour nouveaux comptes

### Protection des Données
- ✅ Sanitization des entrées utilisateur
- ✅ Protection NoSQL injection (express-mongo-sanitize)
- ✅ Protection HTTP Parameter Pollution (hpp)
- ✅ Validation des emails et usernames
- ✅ Limitation de taille des requêtes (10MB)

### Sécurité des Fichiers
- ✅ Validation par magic numbers (pas seulement extension)
- ✅ Génération de noms de fichiers sécurisés
- ✅ Détection de fichiers suspects
- ✅ Quarantaine automatique
- ✅ Calcul de hash pour intégrité

### Headers de Sécurité
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy
- ✅ HSTS avec preload

### Logging & Monitoring
- ✅ Logging des tentatives de connexion échouées
- ✅ Tracking des requêtes suspectes (401, 403, 429)
- ✅ Détection des requêtes lentes (>5s)
- ✅ Logs de changement de mot de passe

## 🚨 Vulnérabilités Restantes (Client-Side)

### ⚠️ CRITIQUE: Tokens en localStorage
**Problème**: Les tokens JWT sont stockés dans localStorage, vulnérable aux attaques XSS
**Impact**: Un script malveillant peut voler les tokens d'authentification

**Solutions Recommandées**:

#### Option 1: HttpOnly Cookies (Recommandé)
```javascript
// Server-side
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000
});

// Client-side: Le token est automatiquement envoyé
// Pas besoin de localStorage
```

#### Option 2: SessionStorage + Refresh Tokens
```javascript
// Utiliser sessionStorage au lieu de localStorage
// Implémenter un système de refresh tokens
sessionStorage.setItem('token', token);
```

### Autres Recommandations Client

1. **Implémenter CSP Nonces**
   - Générer des nonces uniques pour les scripts inline
   - Remplacer `'unsafe-inline'` par des nonces

2. **Sanitization XSS Côté Client**
   - Utiliser DOMPurify pour le contenu utilisateur
   - Valider toutes les entrées avant affichage

3. **Protection CSRF**
   - Implémenter des tokens CSRF pour les formulaires
   - Valider l'origine des requêtes

## 📋 Checklist de Déploiement Production

### Avant le Déploiement
- [ ] Changer JWT_SECRET (générer avec crypto.randomBytes)
- [ ] Configurer NODE_ENV=production
- [ ] Activer HTTPS/TLS
- [ ] Configurer les origines CORS production uniquement
- [ ] Vérifier que rate limiting est activé
- [ ] Supprimer les logs de debug
- [ ] Configurer les backups automatiques
- [ ] Tester tous les endpoints avec rate limiting

### Configuration Serveur
- [ ] Configurer un reverse proxy (nginx/Apache)
- [ ] Activer les logs d'accès
- [ ] Configurer fail2ban pour bloquer les IPs malveillantes
- [ ] Mettre en place un WAF (Web Application Firewall)
- [ ] Configurer les certificats SSL/TLS
- [ ] Activer HTTP/2
- [ ] Configurer les headers de sécurité au niveau proxy

### Monitoring
- [ ] Configurer des alertes pour tentatives de connexion échouées
- [ ] Monitorer l'utilisation CPU/RAM
- [ ] Tracker les erreurs 5xx
- [ ] Surveiller les pics de trafic inhabituels
- [ ] Logs centralisés (ELK, Splunk, etc.)

## 🔐 Gestion des Secrets

### Génération de Secrets Sécurisés
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret
openssl rand -base64 32
```

### Stockage des Secrets
- ✅ Utiliser des variables d'environnement
- ✅ Ne JAMAIS commiter .env dans Git
- ✅ Utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager)
- ✅ Rotation régulière des secrets (tous les 90 jours)
- ✅ Permissions fichiers restrictives (chmod 600 .env)

## 🔄 Maintenance de Sécurité

### Quotidien
- Vérifier les logs de sécurité
- Monitorer les tentatives de connexion échouées
- Vérifier les IPs blacklistées

### Hebdomadaire
- Analyser les patterns de trafic
- Vérifier les mises à jour de dépendances
- Audit des comptes utilisateurs

### Mensuel
- Audit complet de sécurité
- Mise à jour des dépendances
- Test de pénétration basique
- Révision des logs d'accès

### Trimestriel
- Rotation des secrets
- Audit de code complet
- Test de pénétration professionnel
- Révision des politiques de sécurité

## 📚 Ressources

### Outils de Sécurité
- **npm audit**: Scan des vulnérabilités npm
- **Snyk**: Monitoring continu des dépendances
- **OWASP ZAP**: Test de pénétration
- **Burp Suite**: Analyse de sécurité web

### Standards & Guides
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Commandes Utiles
```bash
# Audit des dépendances
npm audit
npm audit fix

# Vérifier les dépendances obsolètes
npm outdated

# Analyser la sécurité avec Snyk
npx snyk test

# Vérifier les headers de sécurité
curl -I https://votre-domaine.com
```

## 🆘 En Cas d'Incident

### Procédure d'Urgence
1. **Isoler**: Déconnecter le serveur compromis
2. **Analyser**: Examiner les logs pour comprendre l'attaque
3. **Contenir**: Bloquer les IPs malveillantes
4. **Éradiquer**: Corriger la vulnérabilité
5. **Récupérer**: Restaurer depuis un backup sain
6. **Documenter**: Créer un rapport d'incident

### Contacts d'Urgence
- Équipe DevOps: [À définir]
- Responsable Sécurité: [À définir]
- Hébergeur: [À définir]

## ✅ Tests de Sécurité

### Tests Automatisés
```bash
# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:3001/api/auth/login; done

# Test injection SQL/NoSQL
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin", "password": {"$ne": null}}'

# Test XSS
curl -X POST http://localhost:3001/api/movies \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title": "<script>alert(1)</script>"}'
```

### Tests Manuels
- [ ] Tenter un brute force sur login
- [ ] Tester les injections dans tous les champs
- [ ] Vérifier les headers de sécurité
- [ ] Tester l'upload de fichiers malveillants
- [ ] Vérifier les permissions d'accès
- [ ] Tester les attaques CSRF

---

**Dernière mise à jour**: 30 Décembre 2024
**Version**: 1.0.0
**Statut**: ✅ Sécurité renforcée - Monitoring requis
