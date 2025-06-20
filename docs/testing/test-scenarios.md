# 🎭 Scénarios de Tests Fonctionnels - SafePass

## 🔐 Module Authentification

### AUTH-001 : Inscription utilisateur

**Objectif** : Vérifier le processus complet d'inscription

**Préconditions** :

- Application installée
- Connexion internet active
- Numéro de téléphone valide non utilisé

**Étapes** :

1. Ouvrir l'application
2. Appuyer sur "S'inscrire"
3. Saisir les informations :
   - Prénom : "Jean"
   - Nom : "Dupont"
   - Email : "jean.dupont@email.com"
   - Téléphone : "06 12 34 56 78"
   - Date de naissance : "15/03/1990"
   - Mot de passe : "MotDePasse123!"
4. Accepter les CGU
5. Appuyer sur "Créer le compte"
6. Saisir le code SMS reçu
7. Valider

**Résultat attendu** :

- ✅ Compte créé avec succès
- ✅ SMS de confirmation reçu
- ✅ Redirection vers l'écran d'accueil
- ✅ Données sauvegardées en base

**Cas d'erreur** :

- ❌ Email déjà utilisé → Message d'erreur explicite
- ❌ Téléphone invalide → Validation en temps réel
- ❌ Mot de passe faible → Indicateur de force

---

### AUTH-002 : Connexion utilisateur

**Objectif** : Vérifier la connexion avec téléphone + mot de passe

**Préconditions** :

- Compte utilisateur existant
- Application fermée

**Étapes** :

1. Ouvrir l'application
2. Saisir le numéro de téléphone
3. Saisir le mot de passe
4. Appuyer sur "Se connecter"

**Résultat attendu** :

- ✅ Connexion réussie
- ✅ Session utilisateur créée
- ✅ Accès aux fonctionnalités

**Variantes** :

- **AUTH-002a** : Connexion avec biométrie
- **AUTH-002b** : Connexion après déconnexion automatique
- **AUTH-002c** : Connexion avec "Se souvenir de moi"

---

### AUTH-003 : Réinitialisation mot de passe

**Objectif** : Processus de récupération de mot de passe

**Étapes** :

1. Sur l'écran de connexion, appuyer "Mot de passe oublié"
2. Saisir le numéro de téléphone
3. Recevoir et saisir le code SMS
4. Créer un nouveau mot de passe
5. Confirmer le nouveau mot de passe
6. Se connecter avec le nouveau mot de passe

**Résultat attendu** :

- ✅ Code SMS reçu
- ✅ Mot de passe modifié
- ✅ Connexion possible avec nouveau mot de passe

---

## 🎫 Module Événements

### EVENT-001 : Consultation des événements

**Objectif** : Afficher la liste des événements disponibles

**Étapes** :

1. Se connecter à l'application
2. Accéder à l'onglet "Événements"
3. Consulter la liste
4. Filtrer par catégorie
5. Rechercher un événement spécifique

**Résultat attendu** :

- ✅ Liste des événements affichée
- ✅ Filtres fonctionnels
- ✅ Recherche opérationnelle
- ✅ Détails accessibles

---

### EVENT-002 : Réservation de billet

**Objectif** : Processus complet de réservation

**Préconditions** :

- Utilisateur connecté
- Événement avec places disponibles
- Méthode de paiement configurée

**Étapes** :

1. Sélectionner un événement
2. Choisir le nombre de billets
3. Sélectionner la catégorie de places
4. Confirmer la sélection
5. Procéder au paiement
6. Valider la transaction

**Résultat attendu** :

- ✅ Billets réservés
- ✅ Paiement effectué
- ✅ Confirmation par email/SMS
- ✅ Billets disponibles dans l'app

**Cas d'erreur** :

- ❌ Plus de places disponibles
- ❌ Paiement échoué
- ❌ Session expirée

---

## 🎭 Module Vérification d'Identité

### VERIF-001 : Vérification par selfie

**Objectif** : Processus de vérification d'identité

**Étapes** :

1. Accéder aux paramètres
2. Sélectionner "Vérification d'identité"
3. Prendre une photo de la pièce d'identité
4. Prendre un selfie
5. Attendre la validation automatique

**Résultat attendu** :

- ✅ Photos uploadées
- ✅ Comparaison faciale réussie
- ✅ Statut "Vérifié" affiché
- ✅ Accès aux événements premium

---

## 💳 Module Paiements

### PAY-001 : Ajout méthode de paiement

**Objectif** : Enregistrer une carte bancaire

**Étapes** :

1. Accéder au portefeuille
2. Appuyer "Ajouter une carte"
3. Scanner ou saisir les informations
4. Valider avec 3D Secure
5. Confirmer l'enregistrement

**Résultat attendu** :

- ✅ Carte enregistrée
- ✅ Informations chiffrées
- ✅ Test de validation réussi

---

### PAY-002 : Traitement de paiement

**Objectif** : Effectuer un paiement pour des billets

**Étapes** :

1. Sélectionner des billets
2. Confirmer le panier
3. Choisir la méthode de paiement
4. Confirmer le montant
5. Finaliser la transaction

**Résultat attendu** :

- ✅ Transaction approuvée
- ✅ Billets délivrés
- ✅ Reçu généré

---

## 📱 Module Interface Utilisateur

### UI-001 : Navigation générale

**Objectif** : Vérifier la fluidité de navigation

**Étapes** :

1. Tester tous les onglets
2. Vérifier les boutons retour
3. Tester les gestes (swipe, pinch)
4. Vérifier les animations

**Résultat attendu** :

- ✅ Navigation fluide
- ✅ Cohérence visuelle
- ✅ Réactivité des interactions

---

### UI-002 : Adaptabilité écrans

**Objectif** : Responsive design sur différents appareils

**Appareils à tester** :

- 📱 iPhone SE (petit écran)
- 📱 iPhone 15 Pro Max (grand écran)
- 📱 Samsung Galaxy S24 (Android)
- 📱 iPad (tablette)

**Résultat attendu** :

- ✅ Interface adaptée à tous les écrans
- ✅ Texte lisible
- ✅ Boutons accessibles

---

## 🌐 Module Hors-ligne

### OFFLINE-001 : Mode hors connexion

**Objectif** : Fonctionnement sans internet

**Étapes** :

1. Se connecter avec internet
2. Télécharger des billets
3. Activer le mode avion
4. Consulter les billets
5. Tenter de scanner un QR code

**Résultat attendu** :

- ✅ Billets consultables hors-ligne
- ✅ QR codes générés localement
- ✅ Synchronisation à la reconnexion

---

## 🔒 Tests de Sécurité

### SEC-001 : Chiffrement des données

**Objectif** : Vérifier la protection des données sensibles

**Tests** :

- Analyse du stockage local
- Vérification HTTPS
- Test des communications API
- Audit des permissions

**Résultat attendu** :

- ✅ Données chiffrées en local
- ✅ Communications sécurisées
- ✅ Permissions minimales

---

### SEC-002 : Authentification forte

**Objectif** : Sécurité des accès

**Tests** :

- Tentatives de force brute
- Validation des sessions
- Test d'injection SQL
- Cross-site scripting (XSS)

**Résultat attendu** :

- ✅ Protection contre les attaques
- ✅ Sessions sécurisées
- ✅ Validation des entrées

---

## 📊 Tests de Performance

### PERF-001 : Temps de chargement

**Objectif** : Mesurer les performances de l'app

**Métriques** :

- Temps de démarrage : < 3s
- Chargement liste événements : < 2s
- Navigation entre écrans : < 500ms
- Génération QR code : < 1s

**Conditions de test** :

- Réseau 4G, 3G, WiFi
- Différents appareils
- Cache vide/plein

---

### PERF-002 : Consommation ressources

**Objectif** : Optimisation mémoire et batterie

**Métriques** :

- Utilisation RAM : < 200MB
- Consommation CPU : < 20%
- Impact batterie : Faible
- Taille de cache : < 100MB

---

## 🧪 Tests d'Intégration

### INTEG-001 : APIs externes

**Objectif** : Intégration avec services tiers

**Services à tester** :

- Stripe (paiements)
- Firebase (notifications)
- Services de SMS
- APIs de vérification

**Scénarios** :

- Panne temporaire du service
- Réponses malformées
- Timeouts réseau
- Codes d'erreur divers

---

## 📝 Critères de Validation

### Critères d'acceptation fonctionnels

- ✅ Tous les scénarios principaux passent
- ✅ Taux de succès > 95%
- ✅ Aucun bug bloquant
- ✅ Performance conforme aux métriques

### Critères d'acceptation non-fonctionnels

- ✅ Sécurité validée par audit
- ✅ Accessibilité conforme WCAG 2.1
- ✅ Compatibilité iOS 14+ et Android 8+
- ✅ Documentation utilisateur complète

---

## 🔄 Matrice de traçabilité

| Fonctionnalité        | Tests Unitaires | Tests Intégration | Tests E2E | Tests Sécurité |
| --------------------- | --------------- | ----------------- | --------- | -------------- |
| Authentification      | ✅              | ✅                | ✅        | ✅             |
| Gestion événements    | ✅              | ✅                | ✅        | ⚠️             |
| Système billetterie   | ✅              | ✅                | ✅        | ⚠️             |
| Vérification identité | ✅              | ✅                | ✅        | ✅             |
| Paiements             | ✅              | ✅                | ✅        | ✅             |
| Interface utilisateur | ✅              | ⚠️                | ✅        | ⚠️             |

**Légende** : ✅ Complet | ⚠️ Partiel | ❌ Manquant
