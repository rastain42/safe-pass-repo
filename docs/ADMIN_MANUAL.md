# 🔧 Manuel Administrateur SafePass

## 🎯 Vue d'Ensemble

Ce manuel est destiné aux administrateurs système, développeurs et équipes DevOps responsables du déploiement, de la maintenance et du monitoring de l'application SafePass.

---

## 🏗️ Infrastructure et Architecture

### ☁️ Services Firebase

#### **Firebase Authentication**

- **Configuration** : Console Firebase → Authentication
- **Providers** : Phone Number (SMS)
- **Règles** : MFA optionnelle, sessions persistantes
- **Monitoring** : Métriques de connexion dans la console

#### **Firestore Database**

```javascript
// Structure principale des collections
users / // Profils utilisateurs
  { userId } /
  -email,
  phone,
  name,
  verified,
  role - created_at,
  last_login;

events / // Événements
  { eventId } /
  -title,
  description,
  date,
  price - organizer_id,
  capacity,
  age_restriction;

tickets / // Tickets vendus
  { ticketId } /
  -event_id,
  user_id,
  purchase_date - qr_code,
  status,
  payment_id;

verifications / // Vérifications d'identité
  { userId } /
  -status,
  confidence_score,
  documents - created_at,
  reviewed_by;
```

#### **Cloud Storage**

```
gs://safepass-bucket/
├── temp/{userId}/           # Fichiers temporaires (TTL: 24h)
├── verifications/{userId}/  # Documents d'identité chiffrés
├── profile-pictures/{userId}/ # Photos de profil
├── events/{eventId}/       # Images d'événements
└── qr-codes/{ticketId}/    # QR codes générés
```

#### **Cloud Functions**

- **analyzeDocument** : OCR et validation MRZ
- **compareFaces** : Vérification biométrique
- **cleanupTempFiles** : Nettoyage automatique
- **generateQRCode** : Génération de QR codes

### 🔧 Configuration des Secrets

#### **Google Cloud Console**

```bash
# Document AI Processor
firebase functions:secrets:set GOOGLE_CLOUD_PROCESSOR_ID
firebase functions:secrets:set GOOGLE_CLOUD_PROJECT_NUMBER

# Stripe Payment
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Autres services
firebase functions:secrets:set SENDGRID_API_KEY
firebase functions:secrets:set SUPPORT_EMAIL
```

#### **Variables d'Environnement**

```bash
# .env.production
EXPO_PUBLIC_FIREBASE_PROJECT_ID=safepass-prod
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_API_URL=https://api.safepass.com
```

---

## 🚀 Déploiement et CI/CD

### 📋 Prérequis

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- EAS CLI (`npm install -g @expo/eas-cli`)

### 🔄 Pipeline de Déploiement

#### **1. Développement Local**

```bash
# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.development.example .env.development
npm run env:dev

# Démarrage du serveur de développement
npm run start
```

#### **2. Tests et Validation**

```bash
# Linting et formatage
npm run lint
npm run format

# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Build de validation
npm run build:staging
```

#### **3. Déploiement Staging**

```bash
# Configuration staging
npm run env:staging

# Déploiement des Cloud Functions
npm run deploy:functions:staging

# Build EAS
npm run build:staging

# Deploy Firebase Hosting
npm run deploy:hosting:staging
```

#### **4. Déploiement Production**

```bash
# Configuration production
npm run env:prod

# Déploiement des Cloud Functions
npm run deploy:functions:prod

# Build et soumission aux stores
npm run build:prod
npm run submit:ios
npm run submit:android
```

### 🤖 GitHub Actions

#### **Workflow PR Checks** (`.github/workflows/pr-checks.yml`)

- ESLint et Prettier
- Tests unitaires
- Build de validation
- Analyse de sécurité

#### **Workflow CI/CD** (`.github/workflows/ci-cd.yml`)

- Déploiement automatique staging (branch `develop`)
- Déploiement production (tags `v*`)
- Notifications Slack/Discord
- Rollback automatique en cas d'échec

---

## 🔐 Sécurité et Conformité

### 🛡️ Règles de Sécurité Firebase

#### **Firestore Rules** (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users peuvent lire/écrire leurs propres données
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Events publics en lecture, écriture pour organisateurs
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['organizer', 'admin'];
    }

    // Tickets privés par utilisateur
    match /tickets/{ticketId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.user_id;
    }
  }
}
```

#### **Storage Rules** (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Fichiers temporaires (24h TTL)
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId &&
        request.time < resource.timeCreated + duration.value(1, 'd');
    }

    // Documents de vérification (chiffrés)
    match /verifications/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 🔒 Chiffrement et Hachage

#### **Données Sensibles**

```typescript
// Chiffrement AES-256 pour les documents
import CryptoJS from 'crypto-js';

const encryptDocument = (data: string, key: string) => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

// Hachage des identifiants
import bcrypt from 'bcrypt';

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};
```

### 📊 Audit et Monitoring

#### **Firebase Analytics**

- Événements personnalisés (purchases, verifications)
- Métriques de performance (temps de vérification)
- Funnels de conversion (inscription → achat)

#### **Crashlytics**

```typescript
// Logging d'erreurs personnalisées
import crashlytics from '@react-native-firebase/crashlytics';

crashlytics().recordError(new Error('Custom error'));
crashlytics().setUserId(userId);
crashlytics().setAttribute('screen', 'verification');
```

---

## 📊 Monitoring et Alertes

### 🎯 Métriques Clés à Surveiller

#### **Performance**

- Temps de réponse des Cloud Functions (< 5s)
- Taux de succès des vérifications d'identité (> 85%)
- Temps de chargement de l'app (< 3s)
- Utilisation mémoire (< 100MB)

#### **Business**

- Taux de conversion inscription → premier achat
- Nombre de tickets vendus par jour
- Taux d'abandon du processus de vérification
- Revenus quotidiens/mensuels

#### **Technique**

- Taux d'erreur des API (< 1%)
- Utilisation des quotas Firebase
- Performance des requêtes Firestore
- Espace de stockage utilisé

### 🚨 Configuration des Alertes

#### **Firebase Console**

```javascript
// Alertes automatiques
- Budget alerts (> 80% du quota)
- Performance alerts (temps de réponse > 5s)
- Error rate alerts (> 1% d'erreurs)
- Usage alerts (quota Firestore > 90%)
```

#### **Cloud Monitoring**

```yaml
# monitoring.yml
alertPolicy:
  displayName: 'SafePass Critical Errors'
  conditions:
    - displayName: 'Error Rate High'
      conditionThreshold:
        filter: 'resource.type="cloud_function"'
        comparison: COMPARISON_GREATER_THAN
        thresholdValue: 0.01
  notificationChannels:
    - email: admin@safepass.com
    - slack: webhook_url
```

### 📈 Dashboards

#### **Firebase Performance Dashboard**

- Métriques temps réel de l'application
- Traces des requêtes les plus lentes
- Statistiques d'utilisation par écran

#### **Custom Analytics Dashboard**

```typescript
// Événements business personnalisés
import analytics from '@react-native-firebase/analytics';

// Tracking des conversions
analytics().logEvent('ticket_purchased', {
  event_id: eventId,
  price: ticketPrice,
  payment_method: 'stripe',
});

// Tracking de la vérification
analytics().logEvent('identity_verified', {
  user_id: userId,
  verification_method: 'automatic',
  confidence_score: 0.95,
});
```

---

## 🛠️ Maintenance et Opérations

### 🔄 Tâches de Maintenance Régulières

#### **Quotidien**

- [ ] Vérification des erreurs Crashlytics
- [ ] Monitoring des métriques de performance
- [ ] Validation des backups automatiques
- [ ] Review des logs d'erreur

#### **Hebdomadaire**

- [ ] Analyse des tendances d'utilisation
- [ ] Nettoyage des fichiers temporaires orphelins
- [ ] Mise à jour des dépendances de sécurité
- [ ] Test des processus de backup/restore

#### **Mensuel**

- [ ] Audit de sécurité complet
- [ ] Optimisation des requêtes Firestore
- [ ] Review des coûts Firebase
- [ ] Mise à jour de la documentation

### 🗃️ Gestion des Données

#### **Backups**

```bash
# Backup automatique Firestore
gcloud firestore export gs://safepass-backups/$(date +%Y%m%d)

# Script de backup quotidien
#!/bin/bash
DATE=$(date +%Y%m%d)
gcloud firestore export gs://safepass-backups/$DATE
gsutil lifecycle set backup-lifecycle.json gs://safepass-backups
```

#### **Nettoyage des Données**

```typescript
// Cloud Function de nettoyage automatique
export const cleanupExpiredData = functions.pubsub
  .schedule('0 2 * * *') // Tous les jours à 2h
  .onRun(async context => {
    // Supprimer les fichiers temp > 24h
    // Supprimer les vérifications rejetées > 30 jours
    // Archive des données > 1 an
  });
```

### 🔧 Procédures d'Urgence

#### **Incident de Sécurité**

1. **Isolement** : Suspendre les services affectés
2. **Investigation** : Analyser les logs et traces
3. **Communication** : Informer les parties prenantes
4. **Correction** : Appliquer les correctifs
5. **Post-mortem** : Documenter et améliorer

#### **Panne Système**

1. **Diagnostic** : Identifier la cause racine
2. **Rollback** : Revenir à la version stable précédente
3. **Communication** : Status page et notifications
4. **Correction** : Déployer le fix en urgence
5. **Surveillance** : Monitor la récupération

---

## 🎛️ Configuration Avancée

### ⚙️ Optimisation Firebase

#### **Firestore Performance**

```typescript
// Index composites optimaux
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "event_date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### **Storage Lifecycle**

```json
// storage-lifecycle.json
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": {
        "age": 30,
        "matchesPrefix": ["temp/"]
      }
    },
    {
      "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
      "condition": {
        "age": 90,
        "matchesPrefix": ["verifications/"]
      }
    }
  ]
}
```

### 🔌 Intégrations Tierces

#### **Stripe Webhooks**

```typescript
// functions/src/stripe-webhooks.ts
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.get('stripe-signature');
  const payload = req.rawBody;

  try {
    const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

#### **SendGrid Email**

```typescript
// Notifications email automatiques
import sgMail from '@sendgrid/mail';

const sendVerificationApproved = async (userEmail: string) => {
  const msg = {
    to: userEmail,
    from: 'noreply@safepass.com',
    subject: '✅ Votre identité a été vérifiée',
    html: emailTemplate,
  };

  await sgMail.send(msg);
};
```

---

## 📋 Procédures Opérationnelles

### 🚀 Déploiement de Nouvelles Fonctionnalités

#### **Checklist Pre-Déploiement**

- [ ] Tests unitaires passent (100%)
- [ ] Tests d'intégration passent
- [ ] Review de code complétée
- [ ] Documentation mise à jour
- [ ] Plan de rollback préparé

#### **Procédure de Déploiement**

1. **Feature Flag** : Activer progressivement
2. **Canary Deployment** : 5% des utilisateurs
3. **Monitoring** : Surveiller les métriques
4. **Full Rollout** : Si succès après 24h
5. **Documentation** : Mettre à jour le changelog

### 🔍 Debugging et Troubleshooting

#### **Logs Centralisés**

```bash
# Logs Cloud Functions
gcloud functions logs read analyzeDocument --limit 50

# Logs Firestore
gcloud logging read 'resource.type="gce_instance"' --limit 50

# Logs application mobile
npx react-native log-android
npx react-native log-ios
```

#### **Outils de Debug**

- **Firebase Console** : Logs et métriques temps réel
- **Flipper** : Debugging React Native
- **Firebase Emulator** : Tests en local
- **Postman** : Tests API

### 📊 Rapports et Analytics

#### **Rapport Mensuel Automatique**

```typescript
export const generateMonthlyReport = functions.pubsub
  .schedule('0 9 1 * *') // 1er de chaque mois à 9h
  .onRun(async context => {
    const report = {
      totalUsers: await getUserCount(),
      totalTicketsSold: await getTicketsSold(),
      revenue: await getRevenue(),
      verificationRate: await getVerificationRate(),
    };

    await sendReportToAdmins(report);
  });
```

---

## 📞 Support et Escalation

### 🆘 Contacts d'Urgence

#### **Équipe Technique**

- **Lead Developer** : lead-dev@safepass.com
- **DevOps Engineer** : devops@safepass.com
- **Security Officer** : security@safepass.com

#### **Escalation Hierarchy**

1. **Level 1** : Support technique (0-4h)
2. **Level 2** : Développeur senior (4-24h)
3. **Level 3** : Architecture/CTO (24h+)

### 📱 Canaux de Communication

#### **Alertes Automatiques**

- **PagerDuty** : Incidents critiques
- **Slack** : #alerts-prod, #dev-team
- **Email** : admin@safepass.com

#### **Status Page**

- **URL** : status.safepass.com
- **Mise à jour** : Automatique via monitoring
- **Communication** : Incidents et maintenances

---

## 📚 Ressources et Documentation

### 📖 Documentation Technique

- **Architecture** : `docs/ARCHITECTURE.md`
- **API Reference** : `docs/API.md`
- **Database Schema** : `docs/DATABASE.md`
- **Security Guide** : `docs/SECURITY.md`

### 🔗 Liens Utiles

- **Firebase Console** : https://console.firebase.google.com
- **Expo Dashboard** : https://expo.dev/accounts/safepass
- **Stripe Dashboard** : https://dashboard.stripe.com
- **GitHub Repository** : https://github.com/safepass/safe-pass-repo

### 📋 Checklists

- **Déploiement** : `docs/checklists/DEPLOYMENT.md`
- **Incident Response** : `docs/checklists/INCIDENT.md`
- **Maintenance** : `docs/checklists/MAINTENANCE.md`

---

_🔧 Ce manuel est un document vivant, mis à jour régulièrement avec les évolutions de l'infrastructure._

_📅 Dernière mise à jour : Décembre 2024_
_👥 Maintenu par : Équipe DevOps SafePass_
