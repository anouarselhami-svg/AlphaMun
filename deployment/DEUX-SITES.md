# Deux sites Alpha MUN — déploiement Cloudflare Pages

Les deux applications partagent les composants, les styles et les logos de ce dépôt, mais ont des entrées React, des bundles et des déploiements distincts. Le sous-domaine et les projets ne sont pas configurés par ces fichiers.

| Application | Domaine prévu | Entrée React | Commande depuis la racine | Sortie |
| --- | --- | --- | --- | --- |
| Présentation | youthglobalclub.com | src/main.jsx | npm run build:main | dist |
| Inscription | inscription.youthglobalclub.com | registration-site/main.jsx | npm run build:registration | registration-site/dist |

`npm ci` installe les dépendances communes à la racine. `npm run build:all` compile les deux applications. Utiliser Node 22 ou supérieur compatible avec la version de Vite du projet.

## Variables

Site principal, variables de compilation :

- `VITE_REGISTRATION_SITE_URL=https://inscription.youthglobalclub.com/` (valeur par défaut centralisée dans `src/config.js`). Les deux liens ajoutent `?pack=500` et `?pack=1500`, ouvrent un nouvel onglet et utilisent `noopener noreferrer`.
- `VITE_CONTACT_EMAIL=alphamun@youthglobalclub.com`.
- `VITE_STAFF_FORM_URL` : véritable lien Google Forms des staffs, quand il sera fourni.

Site d’inscription :

- `VITE_MAIN_SITE_URL=https://youthglobalclub.com/` : retour vers le site principal, compilation (valeur par défaut centralisée).
- `APPS_SCRIPT_URL` : URL existante du déploiement Apps Script, terminant par `/exec`. Configurer comme secret/variable **d’exécution** du projet Pages d’inscription pour Production et, avec un déploiement de test, pour Preview. Cette URL ne doit plus être compilée dans le navigateur. Le relais accepte aussi l’ancienne variable d’exécution `VITE_APPS_SCRIPT_URL` pour compatibilité ; privilégier `APPS_SCRIPT_URL`.
- Ne pas configurer Apps Script sur le projet de présentation. L’ancienne variable locale `VITE_APPS_SCRIPT_URL` n’est plus utilisée par le navigateur.

## Déployer depuis le terminal

Les noms ci-dessous sont des noms proposés ; remplacer par les vrais projets de votre compte. Aucune commande de publication n’a été exécutée ici.

```powershell
npm ci
npm run build:all
npx wrangler login
npx wrangler pages deploy dist --project-name alpha-mun-main
npx wrangler pages deploy dist --cwd registration-site --project-name alpha-mun-registration
```

Le dernier appel se place dans `registration-site`, où se trouvent `functions/api/registration.js` et `wrangler.toml`. Il déploie le relais en plus des ressources du formulaire. Le dossier `dist` de la racine ne contient aucune Function d’inscription. Le glisser-déposer du seul dossier de ressources ne déploie pas le relais.

Si le projet d’inscription existe déjà avec un autre nom ou des bindings, adapter `registration-site/wrangler.toml` à sa configuration avant de publier. Ne pas remplacer les réglages existants sans les comparer.

## Déploiement Git dans Cloudflare Pages

Connecter le même dépôt à deux projets Pages distincts, preset « None » :

- Présentation : répertoire racine du dépôt, commande `npm run build:main`, sortie `dist`.
- Inscription : répertoire racine `registration-site`, commande `npm ci --prefix .. && npm --prefix .. run build:registration`, sortie `dist`. Les sources partagées restent dans le même checkout ; l’installation a lieu dans le parent. Ce répertoire racine permet aussi à Pages de découvrir son dossier `functions`.

Configurer les variables ci-dessus sur chaque projet. Autoriser les changements de `src/`, `public/`, `integration/` et du lockfile à déclencher la compilation du formulaire ; ne pas limiter ses déclencheurs au seul dossier `registration-site`.

## Associer le sous-domaine

1. Déployer le projet d’inscription et vérifier son adresse réelle `*.pages.dev`.
2. Dans Cloudflare : Workers & Pages > projet d’inscription > Custom domains > Set up a domain.
3. Saisir `inscription.youthglobalclub.com` et suivre la procédure.
4. Si la zone est gérée par Cloudflare, confirmer l’enregistrement proposé. Sinon, chez le fournisseur DNS, créer un CNAME `inscription` vers le vrai nom `PROJET.pages.dev` indiqué par Cloudflare.
5. Attendre l’état actif du domaine et du certificat HTTPS. Ne pas créer seulement le CNAME sans associer le domaine au projet Pages.
6. Vérifier les deux liens du site principal, l’ouverture en nouvel onglet et le rechargement de `https://inscription.youthglobalclub.com/?pack=500` puis `?pack=1500`.

Ne pas modifier l’association actuelle de `youthglobalclub.com` lors de l’ajout du sous-domaine.

Références officielles : [domaines personnalisés](https://developers.cloudflare.com/pages/configuration/custom-domains/), [commandes Pages de Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/pages/), [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/).

## Apps Script complet

Remplacer le code du projet Apps Script existant par l’intégralité de `integration/Code.gs`. Conserver `SPREADSHEET_ID` ou le classeur lié. Exécuter `preparerColonnes` : cette fonction ajoute les colonnes manquantes, déplace « Motivation » et ses anciennes valeurs en dernière colonne, sans créer d’inscription ni remplacer les tarifs historiques.

Déployer > Gérer les déploiements > Modifier le déploiement existant > Nouvelle version > Déployer. Conserver la même URL publique `/exec` et l’exécution en tant que propriétaire. Un GET retourne la version 5 sans écriture. Ne pas exécuter un POST de test sur le classeur de production.

Le script valide les champs requis, l’âge entier positif sans limite d’admission inventée, le contact parental conditionnel, les tarifs 500 / 1500 et les cases exactement cochées. Les choix sont distincts, validés contre les listes officielles et requis jusqu’à trois selon leur nombre. Les valeurs sont associées par en-têtes, protégées contre les formules, et enregistrées sous verrou. Le succès est retourné après l’écriture et `flush`.

Les listes `config.committees` / `config.committeeLanguages` et `CONFIRMED_COMMITTEES` / `COMMITTEE_LANGUAGES` dans Apps Script doivent rester synchronisées. Actuellement elles sont vides : aucune langue ni aucun comité n’est inventé, et le formulaire permet de poursuivre.

## Vérification sans production

```powershell
npm run build:all
npm test
node scripts/verify-dist.mjs dist
node scripts/verify-dist.mjs registration-site/dist
npm run test:browser
```

Le test navigateur utilise Edge headless (chemin Windows par défaut, surcharge possible via `EDGE_PATH`), les deux sorties compilées sur localhost et des réponses d’envoi simulées. Il vérifie les deux URL, les rechargements, le paramètre invalide, les quatre étapes, les erreurs proches des champs, les réponses conservées, le changement de pack, le contact parental, le formulaire mobile, l’état d’envoi, une erreur et un nouvel essai. Il produit `.browser-check/registration-mobile.png`. Aucun envoi n’atteint Google Sheets.

Pour tester réellement Apps Script, créer un déploiement et un classeur de test séparés. Copier `registration-site/.dev.vars.example` vers `.dev.vars` dans ce dossier et remplacer la valeur par l’URL **de test**, puis utiliser `npx wrangler pages dev dist --cwd registration-site`. Vite seul ne fournit pas la Function.

Après publication, `node scripts/verify-deployment.mjs https://DOMAINE_REEL` contrôle HTTPS et les ressources sans soumettre d’inscription. Une vérification réelle de l’enregistrement nécessite le classeur de test.
