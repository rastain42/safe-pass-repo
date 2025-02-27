# Safe pass, party safe

## Contexte et Présentation du Projet

Safe Pass, Party Safe est une application destinée à faciliter et sécuriser l’accès à des événements festifs, notamment en :
Protégeant les mineurs (vérification d’identité, parrainage).
Gérant une blacklist basée sur des faits réels documentés.
Centralisant l’organisation et la participation à des soirées (billetterie, communication).
Offrant des fonctionnalités de scanning de billets (QR codes) et de suivi en temps réel.
Cette solution vise à simplifier la relation entre :
Les participants (adultes et mineurs avec parrainage),
Les organisateurs (collectifs, associations),
Les administrateurs (modération, supervision).

## présentation technique

ce projet utilise principalement firebase et react native avec des dépendances comme expo

## comment utiliser ?

```
npm i
npx expo start
```

ensuite connectez vous avec un numéro de test renseigné sur firebase,

numéro : +33782185063
code OTP : 222222

### firebase emulator ( optionnel )

Pour démarrer l'émulateur Firebase,
rajoutez ce code dans register et login :

installez ensuite les outils Firebase :

```
npm install -g firebase-tools
firebase login
firebase init emulators
firebase emulators:start
```

En développement, vous pourrez maintenant utiliser ces numéros de test :

+1 650-555-1234 (code: 123456)
+1 650-555-5678 (code: 654321)
Ces numéros fonctionnent automatiquement avec l'émulateur Firebase sans avoir besoin de reCAPTCHA.

### stripe

Pour tester en développement, utilisez les cartes de test Stripe :

4242 4242 4242 4242 (succès)
4000 0000 0000 9995 (échec)
