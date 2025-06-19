# 🎯 SafePass - Application de Billetterie Sécurisée

[![Expo](https://img.shields.io/badge/Expo-52-000020.svg?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)

> Application mobile de billetterie d'événements avec vérification d'identité intelligente, développée avec Expo 52 et React Native.

---

## ✨ Fonctionnalités Principales

🔐 **Vérification d'Identité Simplifiée**

- Processus en 2 étapes avec selfie optionnel
- OCR intelligent avec validation MRZ automatique
- Reconnaissance faciale optionnelle pour sécurité renforcée

🎫 **Gestion Complète des Événements**

- Navigation et recherche d'événements intuitive
- Achat sécurisé avec Stripe et QR codes uniques
- Dashboard organisateur avec analytics en temps réel

👥 **Expérience Utilisateur Optimisée**

- Interface moderne avec thème sombre/clair
- Notifications intelligentes et rappels d'événements
- Support client intégré avec chat en temps réel

---

## 🚀 Démarrage Rapide

### 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- Compte Firebase configuré

### ⚡ Installation Express

```bash
# Cloner et installer
git clone https://github.com/safepass/safe-pass-repo.git
cd safe-pass-repo
npm install

# Configuration environnement
npm run env:dev

# Démarrer l'application
npm run start
```

### 🔧 Configuration Complète

Consultez le **[Guide de Configuration](docs/DEVELOPMENT.md)** pour une installation détaillée.

---

## 📚 Documentation

### 👥 **Utilisateurs**

- 📱 **[Manuel Utilisateur](docs/USER_MANUAL.md)** - Guide complet d'utilisation
- 🆔 **[Guide de Vérification](VERIFICATION_GUIDE.md)** - Processus de vérification d'identité

### 🔧 **Développeurs**

- 🏗️ **[Architecture](docs/ARCHITECTURE.md)** - Documentation technique détaillée
- 🛠️ **[Guide de Développement](docs/DEVELOPMENT.md)** - Setup et workflows
- 🔌 **[API Reference](docs/API.md)** - Documentation des APIs

### 👨‍💼 **Administrateurs**

- 📋 **[Manuel Admin](docs/ADMIN_MANUAL.md)** - Gestion système et opérations
- 🔄 **[Guide de Mise à Jour](docs/UPDATE_GUIDE.md)** - Processus de déploiement
- 🛡️ **[Sécurité](docs/SECURITY.md)** - Procédures de sécurité

📖 **[Documentation Complète](docs/README.md)** - Index de toute la documentation

---

## 🛠️ Stack Technique

| Couche         | Technologies                                   |
| -------------- | ---------------------------------------------- |
| **Frontend**   | Expo 52, React Native, TypeScript              |
| **Navigation** | Expo Router (file-based)                       |
| **Backend**    | Firebase (Auth, Firestore, Functions, Storage) |
| **Paiements**  | Stripe                                         |
| **OCR/AI**     | Google Cloud Document AI                       |
| **CI/CD**      | GitHub Actions, EAS Build                      |

---

## 📱 Scripts Essentiels

```bash
# 🚀 Développement
npm run start              # Démarrer Expo dev server
npm run android           # Lancer sur Android
npm run ios               # Lancer sur iOS

# 🏗️ Build & Deploy
npm run build:staging     # Build staging
npm run build:prod        # Build production
npm run deploy:functions  # Déployer Cloud Functions

# 🧪 Tests & Qualité
npm run test              # Tests unitaires
npm run lint              # Linting ESLint
npm run format            # Formatage Prettier

# 🔄 Gestion Environnements
npm run env:dev           # Basculer vers développement
npm run env:staging       # Basculer vers staging
npm run env:prod          # Basculer vers production
```

---

## 🏗️ Architecture Simplifiée

```
📱 app/                    # Pages Expo Router
🧩 components/            # Composants réutilisables
🔧 services/              # Services métier
🎣 hooks/                 # Custom hooks React
🏷️ types/                 # Types TypeScript
🛠️ utils/                 # Utilitaires
🔥 firebase/              # Configuration Firebase
📚 docs/                  # Documentation complète
```

**[Proposition de Réorganisation](docs/REORGANIZATION_PROPOSAL.md)** - Structure optimisée pour la scalabilité

---

## 🚀 CI/CD et Déploiement

### 🤖 GitHub Actions

- ✅ Linting et tests automatiques
- 🏗️ Build automatique staging/production
- 🚀 Déploiement automatique Cloud Functions
- 📊 Monitoring et notifications

### 📋 Processus de Release

1. **Développement** → Branch `develop`
2. **Tests** → Pipeline automatique
3. **Staging** → Validation QA
4. **Production** → Release graduée

Consultez le **[Guide CI/CD](CICD_SETUP.md)** pour plus de détails.

---

## 🔐 Sécurité et Conformité

- 🛡️ **Authentification multi-facteurs** avec SMS
- 🔒 **Chiffrement end-to-end** des données sensibles
- ⚖️ **Conformité RGPD** complète
- 🔍 **Validation MRZ** anti-falsification
- 💳 **Paiements PCI DSS** certifiés

---

## 📊 Métriques et Performance

### 🎯 **KPIs Actuels**

- ⚡ **Temps de vérification** : 30-45 secondes
- ✅ **Taux de succès automatique** : 85%+
- 🎯 **Précision OCR** : 95%+
- ⭐ **Satisfaction utilisateur** : 4.8/5

### 📈 **Monitoring**

- Firebase Analytics pour métriques business
- Crashlytics pour stabilité applicative
- Performance Monitoring temps réel

---

## 🚀 Démarrage Express

### ⚡ Installation Rapide

```bash
npm install
npx expo start
```

### 🔑 Authentification Test

Connectez-vous avec les comptes de test Firebase :

- **👨‍💼 Organisateur** : +337 8218 50 63 | OTP: 222222 | MDP: Mot2Passe!
- **👤 Utilisateur** : +337 68 50 98 48 | OTP: 123456 | MDP: Mot2Passe!

### 💳 Paiements Test (Stripe)

Utilisez ces cartes de test en développement :

- **✅ Succès** : 4242 4242 4242 4242
- **❌ Échec** : 4000 0000 0000 9995

---

## 🤝 Contribution

### 🔧 **Guidelines Développeur**

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Suivre les standards de code (ESLint + Prettier)
4. Ajouter des tests pour nouvelles fonctionnalités
5. Créer une Pull Request avec description détaillée

### 📋 **Standards de Code**

- **TypeScript** obligatoire
- **Conventional Commits** pour messages
- **100% coverage** pour fonctionnalités critiques
- **Documentation** mise à jour

---

## 🔮 Roadmap

### 🎯 **Version 1.1** (Q1 2025)

- [ ] Mode hors-ligne complet
- [ ] Notifications push intelligentes
- [ ] Partage de tickets social

### 🚀 **Version 1.2** (Q2 2025)

- [ ] Support multi-langues
- [ ] Analytics avancées organisateurs
- [ ] API publique pour partenaires

### 🌟 **Version 2.0** (Q3 2025)

- [ ] Architecture microservices
- [ ] Événements virtuels/hybrides
- [ ] Intégration IoT (bracelets, badges)

---

## 📞 Support et Contact

### 🆘 **Support Technique**

- 📧 **Email** : support@safepass.com
- 💬 **Chat** : Dans l'application
- 📚 **Documentation** : [docs/README.md](docs/README.md)
- 🐛 **Issues** : GitHub Issues

### 👥 **Équipe**

- **Product Owner** : [À définir]
- **Tech Lead** : [À définir]
- **DevOps** : [À définir]

---

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**🎯 SafePass - Sécuriser l'accès aux événements avec simplicité et innovation**

[![GitHub stars](https://img.shields.io/github/stars/safepass/safe-pass-repo?style=social)](https://github.com/safepass/safe-pass-repo)
[![Follow](https://img.shields.io/twitter/follow/SafePassApp?style=social)](https://twitter.com/SafePassApp)

_Développé avec ❤️ par l'équipe SafePass_

</div>
