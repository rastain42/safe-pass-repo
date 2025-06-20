# Configuration CI/CD pour SafePass - Expo 52

Ce guide explique comment configurer le pipeline CI/CD pour l'application SafePass utilisant Expo 52.

## 🏗️ Architecture

### Environnements

- **Development** : Développement local avec Firebase dev
- **Staging** : Tests d'intégration avec Firebase staging
- **Production** : Application live avec Firebase production

### Workflows

- **ci-cd.yml** : Pipeline principal (build, test, deploy)
- **pr-checks.yml** : Vérifications sur Pull Requests

## 🔑 Secrets GitHub requis

### Expo & EAS (Obligatoires)

- `EXPO_TOKEN` : Token d'authentification Expo CLI
  ```bash
  # Obtenir le token
  npx expo login
  npx expo whoami
  # Ou créer sur https://expo.dev/accounts/[username]/settings/access-tokens
  ```

### Firebase (Obligatoires)

- `FIREBASE_TOKEN` : Token Firebase CLI
  ```bash
  # Obtenir le token
  firebase login:ci
  ```

### Services optionnels

- `CODECOV_TOKEN` : Coverage de code
- `SLACK_WEBHOOK_URL` : Notifications Slack
- `SONAR_TOKEN` : Analyse de qualité

## 📱 Commandes disponibles

### Gestion des environnements

```bash
npm run env:development    # Basculer vers dev
npm run env:staging       # Basculer vers staging
npm run env:production    # Basculer vers production
```

### Développement

```bash
npm run start:development # Démarrer en mode dev
npm run start:staging     # Démarrer en mode staging
npm run lint             # Vérification ESLint
npm run test:ci          # Tests avec coverage
```

### Build et déploiement

```bash
npm run build:staging     # Build staging
npm run build:production  # Build production
npm run deploy:staging    # Submit staging
npm run deploy:production # Submit production
```

## � Déclenchement du pipeline

### Automatique

- **Push sur `main`** : Build et deploy production
- **Push sur `develop/staging`** : Build et deploy staging
- **Pull Request** : Tests et vérifications

### Manuel

- Via GitHub Actions UI
- Avec `gh` CLI :
  ```bash
  gh workflow run ci-cd.yml
  ```

## � Prérequis techniques

### Projets Firebase

Créez 3 projets Firebase :

- `safe-pass-5ebef` (production)
- `safe-pass-5ebef-staging` (staging)
- `safe-pass-5ebef-dev` (development)

### Expo/EAS

- Compte Expo avec EAS CLI
- Organisation configurée si nécessaire

## � Configuration initiale

1. **Configurer les secrets GitHub**
2. **Créer les branches** :
   ```bash
   git checkout -b develop
   git checkout -b staging
   ```
3. **Premier push** pour tester le pipeline
4. **Vérifier les logs** dans GitHub Actions

## 📊 Monitoring

- **GitHub Actions** : Logs détaillés des builds
- **Expo Dashboard** : Status des builds EAS
- **Firebase Console** : Déploiements functions
- **Codecov** : Coverage de code (si configuré)
