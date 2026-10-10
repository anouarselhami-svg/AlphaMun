# Réglages exacts — alphamun-inscription

Le projet actuel utilise `npm run build` à la racine du dépôt et publie `dist`. Ces réglages compilent le site principal (`src/main.jsx`).

Pour le projet Pages **alphamun-inscription**, dépôt `anouarselhami-svg/AlphaMun`, branche `master`, saisir :

| Champ Cloudflare | Valeur |
| --- | --- |
| Build command | `npm ci --prefix .. && npm --prefix .. run build:registration` |
| Build output directory | `dist` |
| Root directory | `registration-site` |

La commande installe les dépendances au niveau du dépôt parent puis appelle le script `build:registration` de son `package.json`. La configuration `registration-site/vite.config.js` fixe la racine Vite à `registration-site` et produit `registration-site/dist`. Dans Cloudflare, le dossier de sortie `dist` est relatif au Root directory choisi.

L’entrée `registration-site/main.jsx` monte `registration-site/App.jsx`, qui affiche directement le composant `Registration` à `/`, en lisant `?pack=500` ou `?pack=1500`. Aucun chemin `/inscription` n’est nécessaire sur ce site. Le Root directory choisi contient également `functions/api/registration.js`, nécessaire à l’envoi vers Google Sheets.

## Variables du projet d’inscription

| Variable | Valeur / usage |
| --- | --- |
| `APPS_SCRIPT_URL` | **Obligatoire pour l’envoi** : copier l’URL réelle du déploiement Apps Script existant, terminant par `/exec`. Configurer comme secret ou variable d’exécution dans Pages, Production. Ne pas inventer de nouvelle URL. Pour Preview, utiliser un déploiement et un classeur de test séparés. |
| `VITE_MAIN_SITE_URL` | `https://youthglobalclub.com/`. Facultative : cette valeur est déjà le défaut dans `src/config.js`. |

Aucune autre variable applicative n’est nécessaire au formulaire. L’ancienne variable `VITE_APPS_SCRIPT_URL` n’est pas requise à la compilation ; le relais accepte son ancienne valeur d’exécution pour compatibilité, mais la variable recommandée est `APPS_SCRIPT_URL`. Utiliser un environnement Node compatible Vite 7 : Node 22.12 ou supérieur (par exemple Node 22 récent).

`registration-site/wrangler.toml` utilise maintenant le nom réel `alphamun-inscription` et `pages_build_output_dir = "dist"`.

## Vérifications effectuées

- Depuis `registration-site` : `npm --prefix .. run build:registration` réussit et produit son propre HTML et bundle dans `registration-site/dist`.
- Le site principal compile toujours séparément : `npm run build:main` → `dist` à la racine. Le script existant `npm run build` n’a pas été remplacé.
- Les 35 tests passent, dont l’affichage du formulaire à la racine avec les deux packs, les paramètres absents ou invalides et la séparation des deux sorties.
- `node scripts/verify-dist.mjs registration-site/dist` passe.

## Appliquer

Vérifier que les fichiers de `registration-site`, les scripts et les composants partagés sont bien présents dans la branche distante `master` utilisée par Pages. Enregistrer ces réglages sur **alphamun-inscription**, puis lancer un nouveau déploiement de cette branche. Ne pas simplement réessayer un ancien déploiement qui reprendrait une ancienne révision/configuration.

Après succès, ouvrir `https://alphamun-inscription.pages.dev/?pack=500` et `?pack=1500` (ou l’adresse pages.dev réellement indiquée par Cloudflare), puis recharger. Le formulaire doit rester affiché avec le bon tarif. La configuration distante n’a pas été modifiée et aucun déploiement n’a été lancé ici.
