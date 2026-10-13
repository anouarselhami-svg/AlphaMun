# Vérifications locales — 13 octobre 2026

- npm test : 6 tests backend + 21 tests frontend réussis (27 au total).
- Validation : champs obligatoires, coordonnées, âge, nombre de participations, trois comités distincts, tarifs 500/1500 MAD, confirmations, hébergement et limites de taille.
- Envoi : toutes les réponses des étapes précédentes et facultatives, libellés lisibles UTF-8, langues des comités, confirmations, tarif et Reply-To.
- Erreurs : configuration absente/invalide, refus 401/429/500, conflit d’idempotence 409, réseau, timeout simulé, JSON invalide et réponse sans identifiant d’email. Aucun faux succès.
- Répétitions : même UUID, clé Resend et contenu d’email pour les retries ; nouvel UUID quand les réponses changent ; tentatives concurrentes testées. La déduplication dépend de Resend et de sa fenêtre de 24 h.
- Deux builds Vite réussis : frontend/dist et frontend/registration-site/dist.
- Deux compilations Pages Functions réussies : backend/dist/main et backend/dist/registration. Aucun déploiement.
- Edge : FR/EN, liens des deux packs, visites directes/rechargements, cinq étapes, mobile, contact, chargement, erreurs, réponses conservées, retry avec le même ID et succès simulé.
- Bundle Pages compilé exécuté dans workerd : health, validation, email complet et répétition avec une simulation Resend. Toutes les sorties réseau interceptées ; aucun email réel.
- Projet Pages local : /health 200, preflight /api/inscription 204 pour le proxy du formulaire, soumission invalide 400. Variables du projet d’inscription chargées depuis son fichier .dev.vars.
- git diff --check réussi ; fichier contenant la clé locale confirmé ignoré par Git.

Reproduire depuis la racine :

```sh
npm run build:all
npm test
npm run test:browser
npm run build:backend
npm --prefix backend run test:runtime
```

Sous PowerShell avec scripts désactivés, utiliser npm.cmd. Wrangler et Edge ont été exécutés avec l’autorisation nécessaire au runtime local ; aucune modification de la politique PowerShell.

La livraison réelle reste à vérifier après configuration distante de Resend/Cloudflare et autorisation de publication. Aucun changement DNS, secret Cloudflare distant, déploiement public ou accès au tableur historique. L’expéditeur indiqué par l’utilisateur est alphamun@youthglobalclub.com ; le statut Verified du compte Resend n’a pas été inspecté.
