# Centralisation des formulaires AlphaMUN — version 7

## État réellement vérifié

- L’URL `/exec` de `VITE_APPS_SCRIPT_URL` dans le `.env` existant a été réutilisée, sans la remplacer. Un GET sans écriture a confirmé `service: alpha-mun-registration`, **version 4**. Le fichier local complet `integration/Code.gs` est désormais en **version 7** ; il n’a pas été installé dans Google.
- Les fichiers privés `.dev.vars` et `registration-site/.dev.vars` sont préparés localement avec cette même URL et un même nouveau `SUBMISSION_TOKEN`. Ils sont ignorés par Git. Leurs valeurs ne sont pas imprimées dans les rapports ni intégrées aux bundles.
- Les variables du compte Cloudflare, `SPREADSHEET_ID`, les lignes du classeur et les paramètres de destination du Google Forms staff ne sont pas accessibles ici. Leur état n’est donc pas certifié.
- Aucun déploiement, aucune soumission au tableur réel, aucune suppression de ligne et aucune modification du Google Forms n’ont été effectués.

## Fonctionnement préparé

Le site principal envoie son contact à `/api/contact`, servi par `functions/api/contact.js`. Le site `alphamun-inscription` envoie ses inscriptions à `/api/registration`, servi par `registration-site/functions/api/registration.js`. Les deux handlers réutilisent `src/server/submission-handler.js` et l’URL Apps Script existante. Le navigateur n’appelle pas directement Google.

Le relais valide les champs, ajoute le jeton serveur et lit le JSON après la redirection Apps Script. Le script valide à nouveau, utilise le classeur existant via sa propriété `SPREADSHEET_ID` (ou le classeur auquel il est lié), puis écrit sous verrou dans `Inscriptions` ou `Contacts`.

Chaque formulaire produit un UUID et le garde pour une nouvelle tentative **inchangée dans la même instance de formulaire**. Une modification des réponses produit un nouveau UUID. L’identifiant et une empreinte SHA-256 des réponses sont enregistrés dans la ligne. Sous verrou, un identifiant déjà enregistré avec la même empreinte renvoie un reçu sans nouvelle ligne ; un même identifiant avec des réponses différentes est refusé. Les anciens enregistrements sans UUID restent intacts et ne sont pas fusionnés arbitrairement. Le maintien des réponses/UUID après fermeture ou rechargement de l’onglet n’est pas implémenté : après une coupure, réessayer depuis le formulaire encore ouvert.

Le succès est affiché uniquement après un reçu `ok: true`, `stored: true` et `submissionId` correspondant. Ce reçu est émis après écriture, `flush` et relecture de l’identifiant, ou après vérification d’une ligne déjà enregistrée. Une erreur réseau, un timeout, une réponse opaque, HTML ou un simple `ok:true` ne valent pas confirmation. Pendant l’envoi, le formulaire est désactivé et un verrou client bloque également un second submit. En cas d’échec, les réponses restent présentes.

Les cellules textuelles commençant par `=`, `+`, `-` ou `@` sont protégées contre l’interprétation comme formules ; les téléphones gardent ainsi leur format texte. Les logs ne contiennent ni réponses personnelles ni jeton.

## Correspondance inscription → colonnes

Tous les champs obligatoires historiques restent obligatoires. Trois réponses structurées facultatives sont ajoutées à l’étape Logistique ; le texte libre obligatoire `logistique` est conservé.

| Champ transmis | Colonne Inscriptions |
|---|---|
| `submission_id` | Identifiant de soumission |
| Générés serveur | Date, Empreinte soumission |
| `prenom`, `nom`, `email`, `telephone` | Prénom, Nom, Email, Téléphone |
| `age`, `contact_parent` | Âge, Contact parent / tuteur |
| `ville`, `etablissement`, `niveau` | Ville, Établissement, Niveau scolaire |
| `comite_choix_1`, `comite_choix_2`, `comite_choix_3` | Comité — choix 1 / 2 / 3 |
| `comite` facultatif, sinon premier choix | Comité |
| `langue_comite` facultatif, sinon langue du premier choix | Langue souhaitée |
| Langues des trois choix calculées côté serveur | Langue des comités |
| `participations_mun` | Nombre de participations MUN |
| `experience` facultatif, sinon Oui/Non d’après le nombre de participations | Expérience MUN |
| `experience_details` | Détails expérience MUN |
| `motivation` | Motivation |
| `motivation_comite` facultatif, sinon `motivation` | Motivation premier comité |
| `attentes` | Attentes |
| `pack` | Pack DH et Tarif MAD (nombres 500 / 1500), Pack choisi (Normal / Premium) |
| `hebergement` facultatif : `oui`, `non`, ou vide | Hébergement |
| `restrictions_alimentaires`, `besoins_particuliers` facultatifs | Restrictions alimentaires, Besoins particuliers |
| `logistique` | Logistique et besoins particuliers |
| `confirmation_pack`, `consentement` | Pack assumé, Consentement |
| `code_conduite`, `exactitude` | Code de conduite accepté, Informations exactes |
| `reglement` facultatif, sinon `code_conduite` | Règlement accepté |

Les champs de compatibilité `comite`, `langue_comite`, `experience`, `motivation_comite`, `reglement` n’ajoutent pas de saisies redondantes au formulaire ; lorsqu’ils sont fournis à l’API ils sont validés et conservés. Sans réponse structurée, hébergement/restrictions/besoins restent vides : aucune information n’est inventée à partir du pack ou du texte libre.

La liste des comités du formulaire et de la validation Apps Script correspond désormais aux 15 comités du site. MPS garde le dialecte marocain confirmé dans les données historiques du formulaire. Les autres langues sont dérivées de la liste serveur, pas d’un libellé traduit.

## Contact → Contacts

| Champ | Colonne |
|---|---|
| `submission_id` | Identifiant de demande |
| Générés serveur | Date, Empreinte soumission |
| `nom`, `email`, `message` | Nom, Email, Message |
| `langue_site` | Langue du site |

Le lien séparé vers l’adresse e-mail reste disponible. Le bouton du formulaire enregistre maintenant la demande dans Sheets et n’ouvre plus le logiciel de messagerie.

## Actualiser Apps Script, sans créer un autre classeur

À faire manuellement, lorsque vous autorisez la mise à jour :

1. Ouvrir le **projet Apps Script déjà utilisé par l’URL `/exec` existante**. Conserver ses autres fichiers éventuels ; remplacer son fichier `Code.gs` par l’intégralité de `integration/Code.gs`.
2. Paramètres du projet → Propriétés du script : conserver le `SPREADSHEET_ID` existant. Si le script est lié au bon classeur, la solution de repli continue à l’utiliser. Ne pas créer un nouveau tableur.
3. Ajouter `SUBMISSION_TOKEN`, avec la valeur privée de `.dev.vars` local. Ne pas mettre ce jeton dans une variable `VITE_*`, un fichier suivi par Git ou le navigateur.
4. Exécuter `preparerColonnes`, accepter les autorisations nécessaires, puis vérifier les onglets **Inscriptions** et **Contacts**. Cette opération ajoute les titres manquants à droite sans déplacer les colonnes existantes et sans créer d’inscription. En cas de titres doublons, elle refuse l’opération plutôt que d’écrire de manière ambiguë.
5. Déployer → Gérer les déploiements → modifier **le déploiement existant** → Nouvelle version → Déployer. Conserver la même URL `/exec`, l’exécution en tant que propriétaire et l’accès de l’application Web adapté au relais. Le classeur reste privé et n’est jamais publié sur le Web.
6. Un GET de `/exec` doit annoncer **version 7**. Le script refuse les POST sans le jeton serveur ; un GET ne retourne aucune donnée du classeur.

Ne pas publier les nouveaux frontends avant la mise à jour du script et des secrets : la version 4 n’émet pas les reçus de stockage attendus par la version 7.

## Secrets Cloudflare à régler sur les deux projets

Dans **Workers & Pages → projet → Settings → Variables and Secrets**, configurer comme valeurs d’exécution privées :

- `APPS_SCRIPT_URL` : **la même URL existante** terminée par `/exec`, déjà présente localement ;
- `SUBMISSION_TOKEN` : **le même jeton** que la propriété Apps Script.

Faire cela sur le projet principal **et** `alphamun-inscription`. L’ancienne variable `VITE_APPS_SCRIPT_URL` reste acceptée comme binding **d’exécution** du relais pour compatibilité, mais une variable de build seule ne suffit pas. Privilégier `APPS_SCRIPT_URL`. Les exemples sont `.dev.vars.example` et `registration-site/.dev.vars.example` ; les vraies valeurs locales sont dans les fichiers ignorés `.dev.vars` respectifs.

Les nouveaux fichiers `functions/api/contact.js` (racine du site principal) et `registration-site/functions/api/registration.js` doivent être inclus dans les futurs déploiements Pages. Un ZIP ou un glisser-déposer des seuls fichiers `dist` ne déploie pas les Functions. Préserver les deux domaines et leur configuration DNS.

Pour les essais, utiliser un **classeur et déploiement de test distincts** en Preview/local. Copier les mêmes en-têtes et le même code, puis configurer une URL et un jeton de test. Les fichiers locaux réutilisent actuellement l’URL réelle ; les remplacer par la configuration de test avant un POST de vérification. Vite/preview seuls ne fournissent pas les Functions ; utiliser Pages local :

```powershell
# Site principal, depuis la racine
npx wrangler pages dev dist
# Formulaire, depuis registration-site
npx wrangler pages dev dist
```

Ces commandes servent localement ; elles ne publient rien. Aucun test automatique de ce dépôt ne soumet des réponses au Google Sheets réel.

## Raccordement du Google Forms staff

Le lien du bouton est conservé et sa valeur locale a été vérifiée :
https://docs.google.com/forms/d/e/1FAIpQLScH2jcymagfW1dYNYi83K5RaKmUtsBTVpvejbeVgcehAsQkMQ/viewform?usp=header

L’accès éditeur au Forms n’est pas disponible ici. **Sa destination n’a pas été modifiée ni vérifiée.** L’action précise à faire par son propriétaire :

1. Ouvrir ce Google Forms en **mode édition** (le lien public de réponse ne donne pas accès au réglage).
2. Onglet **Réponses** → menu ⋮ → **Sélectionner la destination des réponses**.
3. Choisir **Sélectionner une feuille de calcul existante**, puis le **même classeur privé** que `SPREADSHEET_ID` / les inscriptions existantes.
4. Laisser Forms créer son onglet de réponses distinct ; le renommer éventuellement **Candidatures staff**. Ne pas le confondre avec `Inscriptions` ou `Contacts` et ne pas supprimer l’ancien onglet/ancien classeur contenant des réponses.
5. Si une destination est déjà liée, relever et comparer son ID. Si elle est différente, noter et conserver l’ancienne destination avant de la dissocier et sélectionner le bon classeur ; ne supprimer aucune réponse.
6. Envoyer une réponse fictive identifiable depuis le Forms et vérifier son horodatage et ses champs dans cet onglet. Le traitement staff reste celui de Google Forms ; il ne passe pas par l’API des délégués.

Procédure officielle : https://support.google.com/docs/answer/2917686?hl=fr

## Vérifications exécutées et contrôle réel restant

Les tests Node utilisent des doubles de SpreadsheetApp sur deux onglets du même classeur : aucun appel Sheets réel. Ils couvrent colonnes, tarifs, champs facultatifs, validation, protection des cellules, historique conservé, verrou, UUID, reçu perdu après écriture puis nouvelle tentative sans doublon, conflits d’identifiant, contact et authenticité des reçus.

Les tests Edge interceptent `fetch` : parcours complet, champs facultatifs renseignés, refus d’envoi, réponses conservées, nouvelle tentative avec le même UUID, succès confirmé, contact, tarifs, mobile/ordinateur. **Ils ne prouvent pas la présence d’une ligne dans le vrai classeur.**

Pour le contrôle réel après configuration, commencer sur le classeur de test :

1. Inscription : `prenom=TEST_ALPHA`, `nom=FICTIF_<date>`, e-mail `alpha-test@example.com`, trois comités distincts, texte `TEST` dans motivation/expérience/attentes/logistique. Renseigner les trois champs facultatifs, cocher les validations et envoyer une fois.
2. Vérifier une seule ligne dans `Inscriptions`, UUID non vide, Date, tous les champs et un tarif numérique de 500. Refaire avec le pack 1500 et vérifier une nouvelle ligne distincte à 1500 ; les anciens tarifs restent inchangés.
3. Simuler une réponse perdue sur l’environnement de test, garder le formulaire ouvert et réessayer avec les mêmes réponses : rechercher le même UUID et compter **une seule ligne**. Un rejet côté serveur avant écriture ne doit créer aucune ligne.
4. Contact : nom `TEST_CONTACT`, e-mail `contact-test@example.com`, message identifiable `TEST_FICTIF`. Vérifier l’unique ligne dans `Contacts`, sa Date et son UUID, puis tester échec/nouvelle tentative.
5. Vérifier séparément la réponse fictive staff dans son onglet Google Forms.
6. Conserver les lignes de test identifiables pour audit ; aucune suppression n’est automatique.

Commandes de validation locale :

```powershell
npm.cmd run build:all
npm.cmd test
node scripts/verify-dist.mjs dist
node scripts/verify-dist.mjs registration-site/dist
node scripts/verify-browser.mjs
```

Références techniques : [routes Pages Functions](https://developers.cloudflare.com/pages/functions/routing/), [bindings et secrets](https://developers.cloudflare.com/pages/functions/bindings/), [verrou Apps Script](https://developers.google.com/apps-script/reference/lock/).
