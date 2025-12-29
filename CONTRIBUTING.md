# 🤝 Guide de Contribution - Lumixar

Merci de votre intérêt pour contribuer à **Lumixar** ! Ce guide vous aidera à démarrer.

---

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Structure du Projet](#structure-du-projet)
- [Standards de Code](#standards-de-code)
- [Processus de Pull Request](#processus-de-pull-request)
- [Signaler des Bugs](#signaler-des-bugs)
- [Proposer des Fonctionnalités](#proposer-des-fonctionnalités)

---

## 📜 Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :
- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est le mieux pour la communauté
- Faites preuve d'empathie envers les autres membres

---

## 🚀 Comment Contribuer

### 1. Fork le Projet

```bash
# Cloner votre fork
git clone https://github.com/VOTRE-USERNAME/streaming-app.git
cd streaming-app
```

### 2. Créer une Branche

```bash
# Créer une branche pour votre fonctionnalité
git checkout -b feature/ma-nouvelle-fonctionnalite

# Ou pour un bug fix
git checkout -b fix/correction-bug
```

### 3. Faire vos Modifications

- Écrivez du code propre et commenté
- Suivez les standards de code du projet
- Testez vos modifications localement

### 4. Commit vos Changements

```bash
git add .
git commit -m "feat: ajout de ma nouvelle fonctionnalité"
```

**Format des messages de commit** :
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, point-virgules manquants, etc.
- `refactor:` Refactorisation du code
- `test:` Ajout de tests
- `chore:` Maintenance

### 5. Push vers GitHub

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

### 6. Ouvrir une Pull Request

- Allez sur GitHub et ouvrez une Pull Request
- Décrivez clairement vos modifications
- Référencez les issues liées si applicable

---

## 📁 Structure du Projet

```
streaming-app/
├── src/                    # Frontend React
│   ├── components/        # Composants réutilisables
│   ├── pages/            # Pages de l'application
│   ├── contexts/         # Contexts React
│   └── hooks/            # Custom hooks
├── server/                # Backend Node.js
│   ├── index.js          # Point d'entrée serveur
│   ├── middleware/       # Middlewares Express
│   └── utils/            # Utilitaires backend
└── public/               # Fichiers statiques
```

---

## 💻 Standards de Code

### Frontend (React)

- **Composants** : Utilisez des composants fonctionnels avec hooks
- **Naming** : PascalCase pour les composants, camelCase pour les fonctions
- **Props** : Destructurez les props dans les paramètres
- **Hooks** : Placez les hooks au début des composants

```jsx
// ✅ Bon
const MyComponent = ({ title, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return <div>{title}</div>;
};

// ❌ Mauvais
function mycomponent(props) {
  return <div>{props.title}</div>;
}
```

### Backend (Node.js)

- **Async/Await** : Préférez async/await aux callbacks
- **Error Handling** : Utilisez try/catch pour gérer les erreurs
- **Validation** : Validez toujours les entrées utilisateur
- **Sécurité** : Ne jamais exposer de données sensibles

```javascript
// ✅ Bon
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ❌ Mauvais
const getUser = (req, res) => {
  User.findById(req.params.id, (err, user) => {
    res.json(user);
  });
};
```

### Style

- **TailwindCSS** : Utilisez les classes Tailwind pour le styling
- **Responsive** : Testez sur mobile, tablette et desktop
- **Dark Mode** : Respectez le thème sombre par défaut

---

## 🔍 Processus de Pull Request

### Checklist avant de soumettre

- [ ] Le code compile sans erreurs
- [ ] Les tests passent (si applicable)
- [ ] Le code suit les standards du projet
- [ ] La documentation est à jour
- [ ] Les commits sont bien formatés
- [ ] Pas de console.log() ou code de debug

### Review Process

1. Un mainteneur examinera votre PR
2. Des modifications peuvent être demandées
3. Une fois approuvée, votre PR sera mergée
4. Votre contribution sera créditée

---

## 🐛 Signaler des Bugs

### Avant de signaler

- Vérifiez que le bug n'a pas déjà été signalé
- Testez avec la dernière version
- Collectez les informations nécessaires

### Template de Bug Report

```markdown
**Description du bug**
Description claire et concise du bug.

**Comment reproduire**
1. Aller sur '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement attendu**
Ce qui devrait se passer.

**Screenshots**
Si applicable, ajoutez des captures d'écran.

**Environnement**
- OS: [ex: Windows 11]
- Navigateur: [ex: Chrome 120]
- Version: [ex: 1.0.0]

**Logs**
```
Collez les logs d'erreur ici
```
```

---

## 💡 Proposer des Fonctionnalités

### Template de Feature Request

```markdown
**Problème à résoudre**
Décrivez le problème que cette fonctionnalité résoudrait.

**Solution proposée**
Décrivez la solution que vous aimeriez voir.

**Alternatives considérées**
Décrivez les alternatives que vous avez envisagées.

**Contexte additionnel**
Ajoutez tout autre contexte ou screenshots.
```

---

## 🛠️ Configuration de l'Environnement de Développement

### Installation

```bash
# Cloner le repo
git clone https://github.com/ed3352p/streaming-app.git
cd streaming-app

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Démarrer en mode développement
npm start
```

### Variables d'Environnement

Configurez votre fichier `.env` :

```env
VITE_API_URL=http://localhost:3001/api
PORT=3001
NODE_ENV=development
JWT_SECRET=votre_cle_secrete_de_dev
```

---

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 📝 Documentation

- Commentez le code complexe
- Mettez à jour le README si nécessaire
- Documentez les nouvelles API endpoints
- Ajoutez des JSDoc pour les fonctions importantes

```javascript
/**
 * Récupère un utilisateur par son ID
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {Promise<Object>} L'objet utilisateur
 * @throws {Error} Si l'utilisateur n'existe pas
 */
async function getUserById(userId) {
  // ...
}
```

---

## 🎯 Priorités de Contribution

### Haute Priorité
- Corrections de bugs critiques
- Problèmes de sécurité
- Améliorations de performance

### Moyenne Priorité
- Nouvelles fonctionnalités
- Améliorations UX/UI
- Documentation

### Basse Priorité
- Refactoring
- Optimisations mineures
- Nettoyage de code

---

## 📞 Besoin d'Aide ?

- **Issues** : [GitHub Issues](https://github.com/ed3352p/streaming-app/issues)
- **Discussions** : [GitHub Discussions](https://github.com/ed3352p/streaming-app/discussions)
- **Email** : support@lumixar.online

---

## 🙏 Remerciements

Merci à tous les contributeurs qui aident à améliorer Lumixar !

### Top Contributors

<!-- Sera mis à jour automatiquement -->

---

**Fait avec ❤️ par la communauté Lumixar**
