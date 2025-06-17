# Safe pass, party safe

## Contexte et Présentation du Projet

Safe Pass, Party Safe est une application destinée à faciliter et sécuriser l'accès à des événements festifs, notamment en :

- Protégeant les mineurs (vérification d'identité, parrainage)
- Gérant une blacklist basée sur des faits réels documentés
- Centralisant l'organisation et la participation à des soirées (billetterie, communication)
- Offrant des fonctionnalités de scanning de billets (QR codes) et de suivi en temps réel

Cette solution vise à simplifier la relation entre :

- Les participants (adultes et mineurs avec parrainage)
- Les organisateurs (collectifs, associations)
- Les administrateurs (modération, supervision)

## TODO

polar sh?

Google Cloud Document AI Identity Document Proofing

MRZ VERIFICATION

## Présentation technique

Ce projet utilise principalement Firebase (Authentication, Firestore, Functions) et React Native avec Expo comme framework.

## Comment utiliser ?

```
npm i
npx expo start
```

### Authentification

Connectez-vous avec un numéro de test renseigné sur Firebase :

- **Numéro organisateur**: +33782185063 || **code OTP**: 222222
- **Numéro utilisateur**: +33768509848 || **code OTP**: 123456

### Stripe - Paiement en ligne

L'application intègre Stripe pour la gestion des paiements en ligne. Pour tester en développement :

1. **Cartes de test** :

   - 4242 4242 4242 4242 (paiement réussi)
   - 4000 0000 0000 9995 (paiement échoué)

2. **Configuration Firebase Functions** :

stripe.webhook="whsec_webhook"

3. **Points d'accès des fonctions** :
   - createPaymentIntent : Pour créer des intentions de paiement
   - createTestPaymentIntent : Version de test pour le développement
   - stripeWebhook : Endpoint pour les webhooks Stripe

# SafePass - Liste des tâches

## 🔴 Tâches prioritaires (UI/UX)

- Page détail ticket: Ajouter date de l'événement et heure de début
- Page achat: Corriger CSS du bouton "Valider" et problème de défilement
- QR code preview: Centrer le bouton "Valider"
- Achat ticket: Implémenter la fonctionnalité de ticket nominatif
- Organisateur: Implémenter la logique de gestion et le profil

- attention aux tickets disponibles

- wallet apple et google cards pour les billets

- généralisation du theme

- utiliser google lens ou l'ia pour la pièces d'identité

- modification de l'évènement par l'auteur ( soft delete, edit)

## 🟠 Fonctionnalités importantes

- Support: Implémenter le système de support (formulaire, envoi email)
- Modales: Vérifier l'implémentation sur toutes les pages

## 🟢 Architecture technique (en cours)

### Services à compléter

- `auth.service.ts` - Authentification
- `user.service.ts` - Gestion utilisateur
- `event.service.ts` - Événements
- `ticket.service.ts` - Billets
- `payment.service.ts` - Paiements
- `identity.service.ts` - Vérification d'identité

### Hooks à compléter

- `useAuth.ts` - Gestion de l'authentification
- `useForm.ts` - Formulaires
- `useVerifyIdentity.ts` - Vérification d'identité
- `useTickets.ts` - Gestion des billets
- `useEvents.ts` - Gestion des événements

### Utilitaires (complets)

- `validation.ts` - Validation formulaires
- `formatting.ts` - Formatage (dates, téléphone, etc.)
- `crypto.ts` - Encryption/hachage
- `helpers.ts` - Autres utilitaires

## 🔵 Plan de refactorisation

### Phase 1: Fondations

- Structurer les dossiers
- Finaliser les services manquants
- Finaliser les hooks manquants

### Phase 2: Auth

- Refactoriser `login.tsx`
- Optimiser `register.tsx`

### Phase 3: Composants principaux

- Refactoriser `profile.tsx`
- Refactoriser `index.tsx` (liste événements)
- Refactoriser `TicketList.tsx`

### Phase 4: Écrans complexes

- Refactoriser `EventDetails.tsx`
- Vérifier `VerifyIdentityScreen.tsx`
- Refactoriser `EventForm.tsx`

### Phase 5: Composants réutilisables

- Refactoriser `TicketCard` et `TicketDetail`
- Optimiser `PaymentScreen`

### Phase 6: Finalisations

- Auditer les imports et dépendances
- Ajouter la documentation
- Tests unitaires

## ⚙️ Méthode de travail

1. **Par fichier**:

   - Créer une branche de travail
   - Identifier les appels Firebase directs
   - Remplacer par des appels aux services
   - Intégrer les hooks appropriés
   - Simplifier le JSX

2. **Validation**: Tester les fonctionnalités après chaque refactorisation

peut tu optimiser ce fichier en utilisant #folder:services #folder:hooks #folder:utils
