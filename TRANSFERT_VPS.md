# 📤 Transférer le Projet sur VPS

## Méthode 1: Via Git (Recommandé)

### Sur votre machine locale:
```bash
# 1. Commit et push sur GitHub
cd C:\Users\ed3352\Desktop\dev\web\streaming-app
git add .
git commit -m "Configuration déploiement Ubuntu"
git push origin main
```

### Sur le VPS:
```bash
# 1. Se connecter au VPS
ssh root@VOTRE_IP_VPS

# 2. Cloner le repo
cd /root
git clone https://github.com/ed3352p/streaming-app.git

# 3. Lancer le déploiement
cd streaming-app
sudo bash deploy-ubuntu.sh
```

---

## Méthode 2: Via SCP (Transfert Direct)

### Depuis Windows (PowerShell):
```powershell
# Transférer tout le dossier vers le VPS
scp -r C:\Users\ed3352\Desktop\dev\web\streaming-app root@VOTRE_IP_VPS:/root/streaming-app
```

### Sur le VPS:
```bash
# Se connecter
ssh root@VOTRE_IP_VPS

# Lancer le déploiement
cd /root/streaming-app
sudo bash deploy-ubuntu.sh
```

---

## Méthode 3: Via SFTP (FileZilla)

1. **Télécharger FileZilla**: https://filezilla-project.org/
2. **Connecter au VPS**:
   - Hôte: `sftp://VOTRE_IP_VPS`
   - Utilisateur: `root`
   - Mot de passe: `VOTRE_MOT_DE_PASSE`
   - Port: `22`
3. **Transférer**: Glisser-déposer le dossier `streaming-app` vers `/root/`
4. **Sur le VPS**:
```bash
ssh root@VOTRE_IP_VPS
cd /root/streaming-app
sudo bash deploy-ubuntu.sh
```

---

## Méthode 4: Via rsync (Plus Rapide)

### Depuis Windows (WSL ou Git Bash):
```bash
# Synchroniser le projet
rsync -avz --progress C:/Users/ed3352/Desktop/dev/web/streaming-app/ root@VOTRE_IP_VPS:/root/streaming-app/
```

### Sur le VPS:
```bash
ssh root@VOTRE_IP_VPS
cd /root/streaming-app
sudo bash deploy-ubuntu.sh
```

---

## ⚡ Commandes Rapides

### Tout en Une (Git):
```bash
# Local
cd C:\Users\ed3352\Desktop\dev\web\streaming-app
git add . && git commit -m "Deploy" && git push

# VPS
ssh root@VOTRE_IP_VPS "cd /root && git clone https://github.com/ed3352p/streaming-app.git && cd streaming-app && bash deploy-ubuntu.sh"
```

### Tout en Une (SCP):
```powershell
# Depuis PowerShell Windows
scp -r C:\Users\ed3352\Desktop\dev\web\streaming-app root@VOTRE_IP_VPS:/root/streaming-app && ssh root@VOTRE_IP_VPS "cd /root/streaming-app && bash deploy-ubuntu.sh"
```

---

## 🔑 Configuration SSH (Optionnel mais Recommandé)

### Créer une clé SSH (si pas déjà fait):
```powershell
# Sur Windows
ssh-keygen -t ed25519 -C "votre@email.com"
```

### Copier la clé sur le VPS:
```powershell
# Méthode 1: ssh-copy-id (Git Bash)
ssh-copy-id root@VOTRE_IP_VPS

# Méthode 2: Manuelle
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@VOTRE_IP_VPS "cat >> ~/.ssh/authorized_keys"
```

Après ça, plus besoin de mot de passe!

---

## 📋 Checklist Avant Transfert

- [ ] Vérifier que `.env` contient les bonnes valeurs
- [ ] Commit tous les changements sur Git
- [ ] Vérifier que le VPS est accessible: `ssh root@VOTRE_IP_VPS`
- [ ] Vérifier que le domaine pointe vers le VPS (si applicable)

---

## 🚀 Après le Transfert

Une fois sur le VPS, lancez simplement:
```bash
sudo bash deploy-ubuntu.sh
```

Le script s'occupe de TOUT:
- Installation des dépendances
- Configuration
- Build
- Démarrage
- SSL (si domaine)

**Durée totale**: ~5-10 minutes

---

## ❓ Problèmes Courants

### "Permission denied"
```bash
# Donner les permissions
chmod +x deploy-ubuntu.sh
```

### "Connection refused"
```bash
# Vérifier que SSH est actif sur le VPS
sudo systemctl status ssh
```

### "Host key verification failed"
```bash
# Accepter la clé du serveur
ssh-keyscan VOTRE_IP_VPS >> ~/.ssh/known_hosts
```

---

## 📞 Support

Si vous avez des problèmes, vérifiez:
1. Connexion SSH: `ssh root@VOTRE_IP_VPS`
2. Fichiers transférés: `ls -la /root/streaming-app`
3. Script exécutable: `ls -l /root/streaming-app/deploy-ubuntu.sh`
