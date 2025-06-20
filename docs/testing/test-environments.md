# 🌍 Environnements de Test - SafePass

## 🏗️ Architecture des Environnements

### Vue d'ensemble

```
Production ← Staging ← Development ← Local
     ↑         ↑          ↑          ↑
   Users    Testing    Integration  Developers
```

---

## 💻 Environnement Local (DEV)

### Configuration

- **URL** : `http://localhost:19006`
- **Base de données** : Firebase Emulator
- **Services** : Mocks/Emulators
- **Données** : Jeu de données de test

### Utilisation

```bash
# Démarrage environnement local
npm run start:development
npm run firebase:emulator

# Tests locaux
npm run test
npm run test:watch
```

### Données de test

- Utilisateurs fictifs pré-créés
- Événements de démonstration
- Cartes de test Stripe

---

## 🔧 Environnement Développement (DEVELOP)

### Configuration

- **URL** : `https://dev-safepass.firebase.app`
- **Base de données** : Firebase Development
- **Services** : Services de test/sandbox
- **Branche** : `develop`

### Déploiement automatique

```yaml
# .github/workflows/deploy-dev.yml
name: Deploy to Development
on:
  push:
    branches: [develop]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Firebase
        run: |
          npm ci
          npm run build:development
          firebase deploy --project development
```

### Données

- Données synthétiques
- Tests d'intégration continue
- APIs en mode sandbox

---

## 🧪 Environnement Staging (STAGING)

### Configuration

- **URL** : `https://staging-safepass.firebase.app`
- **Base de données** : Firebase Staging
- **Services** : Services pré-production
- **Branche** : `release/*`

### Critères d'entrée

- ✅ Tous les tests unitaires passent
- ✅ Tests d'intégration validés
- ✅ Review de code approuvée
- ✅ Tests de sécurité OK

### Tests effectués

- Tests E2E complets
- Tests de performance
- Tests d'acceptation utilisateur
- Validation par le Product Owner

### Déploiement

```bash
# Déploiement vers staging
git checkout release/v1.x.x
npm run build:staging
npm run test:e2e:staging
firebase deploy --project staging
```

---

## 🚀 Environnement Production (PROD)

### Configuration

- **URL** : `https://safepass.app`
- **Base de données** : Firebase Production
- **Services** : Services live
- **Branche** : `main`

### Critères d'entrée

- ✅ Validation complète en staging
- ✅ Approbation Product Owner
- ✅ Tests de sécurité finaux
- ✅ Plan de rollback préparé

### Monitoring

- **Uptime** : 99.9% SLA
- **Performance** : Métriques temps réel
- **Erreurs** : Alertes automatiques
- **Usage** : Analytics utilisateurs

---

## 📱 Matrices de Test par Appareil

### iOS Testing Matrix

| Appareil      | iOS Version | Environnement | Tests             |
| ------------- | ----------- | ------------- | ----------------- |
| iPhone SE     | iOS 15      | Staging       | Tests manuels     |
| iPhone 13     | iOS 16      | Staging       | Tests automatisés |
| iPhone 15 Pro | iOS 17      | Staging       | Tests performance |
| iPad Air      | iPadOS 17   | Development   | Tests tablette    |

### Android Testing Matrix

| Appareil    | Android Version | Environnement | Tests             |
| ----------- | --------------- | ------------- | ----------------- |
| Samsung S22 | Android 12      | Staging       | Tests manuels     |
| Pixel 7     | Android 13      | Staging       | Tests automatisés |
| OnePlus 11  | Android 14      | Development   | Tests performance |

---

## 🔐 Gestion des Secrets par Environnement

### Variables d'environnement

```bash
# .env.development
FIREBASE_PROJECT_ID=safepass-dev
STRIPE_PUBLISHABLE_KEY=pk_test_...
API_BASE_URL=https://api-dev.safepass.app

# .env.staging
FIREBASE_PROJECT_ID=safepass-staging
STRIPE_PUBLISHABLE_KEY=pk_test_...
API_BASE_URL=https://api-staging.safepass.app

# .env.production
FIREBASE_PROJECT_ID=safepass-prod
STRIPE_PUBLISHABLE_KEY=pk_live_...
API_BASE_URL=https://api.safepass.app
```

### Sécurité

- **Local/Dev** : Clés de test publiques
- **Staging** : Clés de test avec restrictions
- **Production** : Clés live avec monitoring

---

## 🗄️ Gestion des Données de Test

### Base de données par environnement

#### Development

```json
{
  "users": {
    "testuser1": {
      "email": "test@example.com",
      "phone": "+33123456789",
      "verified": true
    }
  },
  "events": {
    "event1": {
      "name": "Concert Test",
      "date": "2024-06-01",
      "available_tickets": 100
    }
  }
}
```

#### Staging

- Copie partielle des données production (anonymisées)
- Jeux de données spécifiques aux tests
- Remise à zéro hebdomadaire

#### Production

- Données réelles utilisateurs
- Sauvegarde quotidienne
- Monitoring performance

---

## 🚥 Scripts de Déploiement

### Déploiement Development

```bash
#!/bin/bash
# scripts/deploy-dev.sh

echo "🚀 Deploying to Development..."

# Tests préalables
npm run test:unit
npm run lint

# Build
npm run build:development

# Déploiement
firebase use development
firebase deploy --only hosting,functions

echo "✅ Development deployment complete!"
echo "🌐 URL: https://dev-safepass.firebase.app"
```

### Déploiement Staging

```bash
#!/bin/bash
# scripts/deploy-staging.sh

echo "🚀 Deploying to Staging..."

# Tests complets
npm run test:all
npm run test:e2e:headless

# Build optimisé
npm run build:staging

# Déploiement
firebase use staging
firebase deploy

# Tests post-déploiement
npm run test:smoke:staging

echo "✅ Staging deployment complete!"
```

### Déploiement Production

```bash
#!/bin/bash
# scripts/deploy-production.sh

echo "🚀 Deploying to Production..."

# Vérifications finales
npm run test:production-ready
npm run audit:security

# Build production
npm run build:production

# Sauvegarde avant déploiement
npm run backup:production

# Déploiement avec monitoring
firebase use production
firebase deploy --force

# Vérification santé
npm run health-check:production

echo "✅ Production deployment complete!"
echo "📊 Monitor: https://console.firebase.google.com"
```

---

## 📊 Monitoring et Alertes

### Métriques par environnement

#### Development

- Tests automatisés : Résultats CI/CD
- Performance : Temps de build
- Erreurs : Logs de développement

#### Staging

- Tests E2E : Taux de succès
- Performance : Temps de réponse
- Compatibilité : Tests multi-devices

#### Production

- **Disponibilité** : 99.9% uptime
- **Performance** : < 2s temps de chargement
- **Erreurs** : < 0.1% taux d'erreur
- **Usage** : Métriques utilisateurs

### Alertes configurées

```yaml
# Exemple configuration alertes
alerts:
  - name: 'High Error Rate'
    condition: 'error_rate > 1%'
    notification: 'slack, email'

  - name: 'Slow Response Time'
    condition: 'response_time > 5s'
    notification: 'slack'

  - name: 'Low Availability'
    condition: 'uptime < 99%'
    notification: 'slack, sms, email'
```

---

## 🔄 Processus de Promotion

### Development → Staging

1. ✅ PR mergée dans `develop`
2. ✅ Tests automatiques passés
3. ✅ Review de code approuvée
4. 🚀 Déploiement automatique

### Staging → Production

1. ✅ Tests E2E complets
2. ✅ Tests de performance
3. ✅ Validation Product Owner
4. ✅ Plan de rollback préparé
5. 🚀 Déploiement manuel approuvé

---

## 📋 Checklist de Validation par Environnement

### Development

- [ ] Build successful
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] No linting errors
- [ ] Functions deployed

### Staging

- [ ] All development criteria ✅
- [ ] E2E tests passing
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Cross-device testing done
- [ ] Stakeholder approval

### Production

- [ ] All staging criteria ✅
- [ ] Final security review
- [ ] Backup completed
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Team notified
