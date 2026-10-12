# Préparation de la centralisation AlphaMUN

La procédure actuelle complète est [integration/MISE-A-JOUR.md](integration/MISE-A-JOUR.md). Elle décrit la version 7 d’Apps Script, les deux relais Cloudflare, les correspondances de colonnes et les vérifications restantes.

- Site principal : `npm.cmd run build:main` → `dist`, avec `functions/api/contact.js` à déployer ultérieurement depuis la racine.
- Site d’inscription : `npm.cmd run build:registration` → `registration-site/dist`, avec `registration-site/functions/api/registration.js`.
- Tarifs actuels : **500 MAD et 1 500 MAD**. Les tarifs historiques du tableur ne sont pas réécrits.
- L’URL `/exec` existante est réutilisée. Le GET exécuté pendant la préparation répond encore en **version 4** ; le script version 7 est fourni localement mais n’a pas été installé dans Google.
- Les deux projets Pages nécessitent les secrets d’exécution privés `APPS_SCRIPT_URL` et `SUBMISSION_TOKEN`, identique à la propriété Apps Script. La configuration locale est préparée dans les deux `.dev.vars` ignorés par Git. Ne pas exposer ces valeurs dans les bundles.
- Le contact doit être enregistré dans `Contacts` ; les délégués dans `Inscriptions`. Les candidatures staff restent dans Google Forms, à associer manuellement au même tableur privé.
- Ne pas transférer `.env`, `.dev.vars` ou `integration/Code.gs` dans les ressources publiques. Un upload du seul `dist` ne fournit pas les routes serveur.

Aucun déploiement public ni envoi au classeur réel n’a été effectué. Consulter la procédure avant toute actualisation ; les contrôles de lignes dans Sheets et de destination du Forms sont encore à faire avec le compte propriétaire.
