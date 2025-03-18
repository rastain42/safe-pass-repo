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
