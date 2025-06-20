# 📋 Cahier de Recettes SafePass - Version Simplifiée

## 🎯 Objectif

Document unique regroupant tous les tests essentiels pour valider SafePass avant mise en production.

---

## 🧪 **TESTS CRITIQUES (P0)**

### 🔐 Authentification

| Test                    | Action                              | Résultat attendu          |
| ----------------------- | ----------------------------------- | ------------------------- |
| **Inscription**         | Créer compte avec email/téléphone   | ✅ Compte créé + SMS reçu |
| **Connexion**           | Login avec téléphone + mot de passe | ✅ Accès app              |
| **Mot de passe oublié** | Réinitialiser via SMS               | ✅ Nouveau MDP fonctionne |

### 💳 Paiements

| Test                | Action                | Résultat attendu                  |
| ------------------- | --------------------- | --------------------------------- |
| **Ajouter carte**   | Enregistrer CB Stripe | ✅ Carte sauvée + 3D Secure       |
| **Paiement réussi** | Acheter 2 billets     | ✅ Transaction OK + billets reçus |
| **Paiement échoué** | Carte refusée         | ❌ Erreur claire + pas de charge  |

### 🎫 Billetterie

| Test               | Action                         | Résultat attendu               |
| ------------------ | ------------------------------ | ------------------------------ |
| **Achat billet**   | Sélectionner événement + payer | ✅ Billet dans l'app + QR code |
| **Plus de places** | Événement complet              | ❌ Message "complet"           |
| **QR Code**        | Générer code billet            | ✅ QR lisible en 1s            |

---

## 🧪 **TESTS IMPORTANTS (P1)**

### 🆔 Vérification Identité

- **Upload photo ID** → Photos acceptées + traitement en cours
- **Selfie** → Comparaison faciale OK + statut "vérifié"
- **Rejet document** → Message clair + possibilité de reprendre

### 📱 Interface & Navigation

- **Navigation onglets** → Fluide sans lag
- **Responsive** → Correct sur iPhone SE et iPad
- **Mode sombre** → Bascule fonctionne

### 🌐 Hors-ligne

- **Billets offline** → QR codes accessibles sans réseau
- **Sync reconnexion** → Données mises à jour automatiquement

---

## 🔒 **TESTS SÉCURITÉ**

### Tests Automatiques

```bash
npm run test:security
npm audit --audit-level=high
```

### Tests Manuels

- **Force brute login** → Blocage après 5 tentatives
- **Données chiffrées** → Stockage local sécurisé
- **HTTPS obligatoire** → Toutes les communications

---

## ⚡ **TESTS PERFORMANCE**

### Métriques Cibles

```
Démarrage app      : < 3s
Chargement events  : < 2s
Navigation écrans  : < 500ms
Génération QR      : < 1s
Utilisation RAM    : < 200MB
```

### Tests de Charge

- **100 users simultanés** → App stable
- **1000 requêtes/min** → Temps réponse < 2s

---

## 🐛 **PLAN CORRECTION BUGS**

### Classification

- **🔴 P0 (Critique)** : Fix < 4h (crash, paiement KO)
- **🟠 P1 (Majeur)** : Fix < 24h (fonction cassée)
- **🟡 P2 (Moyen)** : Fix < 1 semaine
- **🟢 P3 (Mineur)** : Fix < 1 mois

### Workflow

1. **Détection** → Ticket avec priorité
2. **Investigation** → Assignment développeur
3. **Correction** → Tests + review
4. **Déploiement** → Validation en prod

---

## 🚀 **ENVIRONNEMENTS**

| Env            | URL                  | Usage         | Tests     |
| -------------- | -------------------- | ------------- | --------- |
| **Local**      | localhost:19006      | Développement | Unitaires |
| **Dev**        | dev-safepass.app     | Intégration   | API + E2E |
| **Staging**    | staging-safepass.app | Pré-prod      | Complets  |
| **Production** | safepass.app         | Live          | Smoke     |

---

## 📊 **MÉTRIQUES QUALITÉ**

### Objectifs

```
Couverture tests   : > 85%
Note App Store     : > 4.5
Uptime            : > 99.9%
MTTR P0           : < 2h
Bugs P0 ouverts   : = 0
```

### Suivi Hebdomadaire

- Tests passés/échoués
- Nouvelles vulnérabilités
- Performance dégradée
- Feedback utilisateurs

---

## ✅ **CHECKLIST RELEASE**

### Avant Déploiement

- [ ] 🧪 Tous tests P0 passent
- [ ] 🔒 Audit sécurité OK
- [ ] ⚡ Performance conforme
- [ ] 📱 Tests multi-devices
- [ ] 💳 Tests paiements réels
- [ ] 🆔 Vérification IA fonctionnelle

### Post Déploiement

- [ ] 📊 Monitoring actif
- [ ] 🚨 Alertes configurées
- [ ] 👥 Équipe support briefée
- [ ] 🔄 Plan rollback prêt

---

## 🛠️ **OUTILS & COMMANDES**

### Tests Rapides

```bash
# Tests critiques uniquement
npm run test:critical

# Tests complets
npm run test:all

# Performance
npm run test:performance

# Sécurité
npm run test:security
```

### Monitoring

- **Uptime** : Firebase Console
- **Erreurs** : Crashlytics
- **Performance** : Lighthouse
- **Usage** : Analytics

---

## 📞 **CONTACTS URGENCE**

- **Tech Lead** : @username (P0/P1)
- **DevOps** : @username (Infrastructure)
- **Product** : @username (Décisions business)
- **Support** : support@safepass.app

---

## 🎯 **RÉSUMÉ EXÉCUTIF**

**Ce qu'il faut retenir :**

1. **Tests P0** = Obligatoires avant chaque release
2. **Sécurité** = Audit continu + zéro tolérance failles critiques
3. **Performance** = Métriques strictes pour UX
4. **Process** = Bug critique = fix en 4h max

**Objectif final :** Application SafePass stable, sécurisée et performante avec 99.9% d'uptime et 0 bug critique en production.
