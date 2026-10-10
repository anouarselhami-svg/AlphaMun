# Mise à jour de l’inscription Alpha MUN 8

Le site utilise `/inscription?pack=500` ou `/inscription?pack=1500`. Les prestations existantes restent inchangées. Le formulaire FR / EN garde les réponses entre les quatre étapes et après une erreur. Le récapitulatif confirme uniquement l’enregistrement, sans paiement ni admission.

## Apps Script existant

1. Ouvrir le projet Apps Script actuellement relié au fichier d’inscriptions. Remplacer son code par l’intégralité de `integration/Code.gs`.
2. Conserver la propriété de script `SPREADSHEET_ID` existante (ou le classeur lié). Le script utilise l’onglet `Inscriptions`.
3. Exécuter `preparerColonnes` une fois et autoriser l’accès au classeur. Cette fonction ne crée aucune inscription. Elle ajoute les en-têtes manquants, déplace la colonne Motivation avec ses anciennes valeurs à la fin et conserve les autres lignes, y compris les tarifs historiques 550 / 1550. Les en-têtes dupliqués sont refusés pour éviter une correspondance ambiguë.
4. Déployer > Gérer les déploiements > sélectionner le déploiement existant > Modifier > Nouvelle version > Déployer. Conserver la même URL `/exec`, l’exécution en tant que propriétaire et l’accès public nécessaire au formulaire.
5. Le GET de cette URL doit retourner `ok:true`, `service:alpha-mun-registration`, `version:5` sans écriture. Ne pas envoyer de test dans le classeur de production.

## Cloudflare Pages

Conserver `VITE_APPS_SCRIPT_URL` pour la compilation. Ajouter la même URL comme variable d’exécution `APPS_SCRIPT_URL` dans le projet Pages, pour les environnements concernés. Le relais `functions/api/registration.js` lit le JSON d’Apps Script et ne renvoie une réussite que si le serveur confirme `ok:true`.

Déployer depuis la racine du dépôt avec l’intégration Git (build `npm run build`, dossier `dist`) ou avec Wrangler (`npx wrangler pages deploy dist --project-name NOM_DU_PROJET_EXISTANT`). Le dossier `functions` doit être présent à la racine lors du déploiement. Un téléversement du seul dossier dist par glisser-déposer ne déploie pas les Functions : https://developers.cloudflare.com/pages/functions/get-started/

`public/_redirects` assure l’ouverture directe et le rechargement de `/inscription`. Les archives statiques existantes ne suffisent plus à déployer le relais.

Pour tester localement l’envoi, compiler puis utiliser Pages local (`npx wrangler pages dev dist`) avec une variable APPS_SCRIPT_URL visant un déploiement de test et un classeur séparé. Le serveur Vite seul ne fournit pas `/api/registration`.

## Informations attendues

Aucun comité ni langue de comité n’est actuellement confirmé dans ce dépôt. Les préférences correspondantes restent facultatives tant que les listes sont vides. Après annonce, renseigner `config.committees` et `config.committeeLanguages`, puis les mêmes listes dans `CONFIRMED_COMMITTEES` et `COMMITTEE_LANGUAGES` du script, et redéployer les deux. Jusqu’à trois choix distincts deviennent obligatoires suivant le nombre disponible.

Renseigner `VITE_STAFF_FORM_URL` avec le vrai Google Forms des staffs. Les sections programme, lieu, horaires et bureau de 13 membres attendent les informations officielles ; aucun nom ni horaire n’a été inventé.

## Vérification

- `node --test tests/registration.test.mjs` : réponses serveur lisibles, refus, validation côté script, migration de colonnes, tarifs historiques, protection des formules et relais (mocks locaux uniquement).
- `npm run build` ; si le sandbox Windows bloque le chargement esbuild de la configuration, `npm run build -- --configLoader runner`.
- `node scripts/verify-dist.mjs` : ressources et URL configurée.
- Vérifier dans un navigateur ordinateur et mobile : préselection des deux packs, modification du pack, FR / EN, quatre étapes, réponses conservées, parent obligatoire sous 18 ans, erreurs près des champs, retour pour correction et absence de doubles clics. Pour la confirmation complète, utiliser uniquement un classeur de test.

Aucune publication ni écriture dans Google Sheets de production n’est effectuée par les tests fournis.
