# AlphaMUN — Pages Functions et Resend

Un seul dépôt Git à la racine. Les deux sites React/Vite sont conservés. Les inscriptions sont envoyées par la Pages Function POST /api/inscription du projet alphamun-inscription. Les nouvelles réponses restent dans la boîte email destinataire ; aucun stockage Sheets ni Durable Object.

| Dossier / fichier | Rôle |
| --- | --- |
| frontend/src/ | Site, formulaire à cinq étapes, composants et styles |
| frontend/registration-site/ | Entrée Vite et configuration Cloudflare du site d’inscription |
| frontend/registration-site/functions/api/inscription.js | Endpoint Pages de l’inscription |
| frontend/functions/api/contact.js | Endpoint Pages du formulaire de contact existant |
| backend/src/index.js | Réception, validation et réponses JSON communes |
| backend/src/validation.js | Règles exactes des champs, comités, tarifs et confirmations |
| backend/src/email.js | Récapitulatif lisible, Reply-To, timeout et API Resend |
| archive/integration/ | Ancien Apps Script, conservé uniquement comme référence historique |

Node.js 24.14.1 vérifié. Installer : `npm run install:all`. Sous PowerShell si les scripts sont désactivés, employer npm.cmd.

Après `npm run build:all`, démarrer dans des terminaux distincts :

```sh
npm run dev:backend       # Pages inscription : 127.0.0.1:8787
npm run dev:registration  # Vite inscription : 127.0.0.1:5174
npm run dev:backend:main  # Pages principal/contact : 127.0.0.1:8788
npm run dev:frontend      # Vite principal : localhost:5173
```

Les proxies Vite transmettent /api et /health à leur projet Pages local. En production, les appels sont relatifs au même domaine : aucune VITE_API_BASE_URL. Les variables VITE sont publiques et ne doivent contenir aucun secret.

Copier les .dev.vars.example vers .dev.vars dans les dossiers frontend/registration-site/ et frontend/ pour configurer les secrets locaux de chaque projet. Le fichier d’inscription local est déjà configuré avec la clé fournie et alphamun@youthglobalclub.com comme expéditeur/destinataire ; il est ignoré par Git. Aucun secret dans les fichiers d’exemple. Voir [configuration Cloudflare/Resend](deployment/DEUX-SITES.md).

```sh
npm run build:all          # frontend/dist + frontend/registration-site/dist
npm run build:backend      # compilation locale des deux Pages Functions, sans publication
npm test                  # 6 tests backend + 21 tests frontend ; après builds
npm run test:browser       # Edge, soumissions simulées
npm --prefix backend run test:runtime # bundle Pages dans workerd, Resend simulé
```

Le serveur reçoit toutes les réponses en application/x-www-form-urlencoded, contrôle leur taille et reprend les règles du formulaire. Packs : Normal 500 MAD et Premium 1 500 MAD. Il annonce le succès seulement après réception d’un ID d’email accepté par Resend : JSON ok:true, accepted:true, submissionId. Une erreur renvoie ok:false et un code, sans réponses personnelles ni secret. Le succès indique l’acceptation par Resend, pas la livraison finale, le paiement ou l’admission.

Une tentative avec les mêmes réponses conserve son UUID dans le formulaire. La clé Resend et le contenu d’email sont identiques pour les retries ; des réponses modifiées reçoivent un nouvel UUID. Resend déduplique pendant 24 heures, sans garantie de déduplication au-delà. L’identifiant reste dans l’email pour faciliter les vérifications. Les cinq étapes, placeholders, traductions FR/EN, états d’envoi et réponses après échec sont conservés.

Les anciennes inscriptions restent dans leur tableur : aucune opération distante sur ces données n’a été exécutée. Les appels, variables et relais Apps Script sont retirés du parcours actif. Le lien indépendant Google Forms du recrutement staff est conservé. La mention de consentement provisoire déjà présente reste à compléter avant ouverture publique.

Voir [les résultats des tests](deployment/TESTS.md). Aucun déploiement public ni email réel effectué pendant cette préparation.
