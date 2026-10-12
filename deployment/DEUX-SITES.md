> Procédure actuelle : [centralisation des formulaires — version 7](../integration/MISE-A-JOUR.md). Les tarifs sont 500 / 1500 MAD. Les deux projets utilisent des secrets d’exécution privés et leur propre Pages Function.

# Deux sites AlphaMUN

| Site | Entrée | Build | Sortie | Route |
|---|---|---|---|---|
| Principal | `src/main.jsx` | `npm.cmd run build:main` | `dist` | `functions/api/contact.js` |
| Inscription | `registration-site/main.jsx` | `npm.cmd run build:registration` | `registration-site/dist` | `registration-site/functions/api/registration.js` |

Les deux Functions réutilisent `src/server/submission-handler.js`, l’URL `/exec` existante et le même tableur. Configurer `APPS_SCRIPT_URL` et `SUBMISSION_TOKEN` sur **les deux projets** Pages, côté serveur. Le binding d’exécution historique `VITE_APPS_SCRIPT_URL` reste accepté, mais n’est pas lu par le navigateur.

Préserver les domaines `youthglobalclub.com` et `inscription.youthglobalclub.com`. Le site principal se déploie à partir de la racine et le site d’inscription à partir de `registration-site` pour découvrir leurs dossiers `functions`. Ne pas uploader seulement les fichiers statiques. Aucune commande de publication n’est exécutée pendant cette préparation.

Installation commune : `npm ci` à la racine. Contrôles : `npm.cmd run build:all`, `npm.cmd test`, puis `node scripts/verify-browser.mjs` (réponses simulées).

Consulter [MISE-A-JOUR.md](../integration/MISE-A-JOUR.md) pour :
- conserver le tableur et actualiser **le même déploiement Apps Script** ;
- préparer les colonnes sans supprimer/reclasser les anciennes lignes ;
- configurer les secrets des deux projets et utiliser un environnement de test ;
- choisir manuellement la destination du Google Forms staff ;
- vérifier les lignes réellement créées, les tarifs et la nouvelle tentative sans doublon.

Références : [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/), [secrets](https://developers.cloudflare.com/pages/functions/bindings/), [domaines personnalisés](https://developers.cloudflare.com/pages/configuration/custom-domains/).
