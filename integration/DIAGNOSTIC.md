# Diagnostic des inscriptions

## Constat du déploiement actuel

L'URL effective de développement et de production correspond à la dernière URL fournie et finit par `/exec`. Le bundle de production contient également cette URL.

Un seul POST de diagnostic, avec tous les champs obligatoires vides, a renvoyé HTTP 302 vers `script.googleusercontent.com`, puis HTTP 200, `application/json` et `{"ok":false}`. Les deux réponses comportaient `Access-Control-Allow-Origin: *`. Le POST n'a pas été rejoué et aucune inscription valide n'a été envoyée. Ce résultat confirme le refus attendu de cette requête invalide ; il ne permet pas d'identifier pourquoi une inscription valide échoue ni d'exclure une erreur CORS sur une autre réponse.

Le GET actuel retourne une page HTML « Fonction de script introuvable : doGet ». Ce n'est pas une erreur du POST. La version locale mise à jour ajoute un GET de vérification sans écriture dans Sheets.

## Corrections locales

- Le navigateur distingue configuration invalide, erreur HTTP, JSON invalide, `ok:false`, JSON sans `ok:true`, réponse inaccessible et délai dépassé.
- Une erreur réseau/CORS ne prouve ni refus ni absence d'écriture. Il faut vérifier Sheets avant toute nouvelle tentative.
- Aucun `no-cors`, aucune relance automatique et aucune confirmation sans le booléen `ok === true`.
- Le script renvoie un code et une référence `requestId`, et journalise la phase de l'échec.
- Le classeur peut être ciblé explicitement par une propriété `SPREADSHEET_ID`. Le comportement lié au classeur actif reste disponible ; si aucun classeur n'est disponible, le script renvoie `SPREADSHEET_NOT_CONFIGURED` plutôt qu'une erreur masquée.

## Appliquer côté Apps Script

1. Ouvrir le projet du déploiement utilisé et remplacer son code par `integration/Code.gs`.
2. Dans **Paramètres du projet → Propriétés du script**, renseigner `SPREADSHEET_ID` avec l'identifiant du nouveau Sheets : partie entre `/d/` et `/edit` dans son URL. Ne pas mettre l'URL entière ou le `gid`. Aucun identifiant n'a été inventé dans le projet.
3. Le compte qui exécute le script doit pouvoir modifier ce Sheets. Vérifier les autorisations Google demandées au propriétaire.
4. Dans **Déployer → Gérer les déploiements → Modifier**, sélectionner une **nouvelle version** et déployer. Vérifier une exécution en tant que propriétaire et un accès aux visiteurs anonymes (« Tout le monde »), si l'organisation l'autorise.
5. Si l'URL `/exec` change, modifier `.env`, recompiler et réimporter les fichiers du site. Sinon conserver l'URL actuelle.
6. Ouvrir l'URL `/exec` sans connexion Google : le GET de la nouvelle version doit afficher `{"ok":true,"service":"alpha-mun-registration","version":"2"}`. Ce GET confirme seulement la version du déploiement, pas l'écriture dans Sheets.

## Journaux précis à consulter

Dans Apps Script, ouvrir **Exécutions**, retrouver la fonction **doPost**, de type **Application Web**, à l'heure de l'échec, puis ouvrir ses détails et journaux. Consulter `requestId`, `code`, `phase`, `message` et `stack`. Les erreurs attrapées peuvent apparaître comme une exécution terminée : consulter les logs même si le statut n'est pas « Échec ».

- `INVALID_FIELDS`, phase `validation` : noms des champs manquants ; vérifier aussi `pack` (`550` ou `1550`) et `type=registration` dans le POST.
- `SPREADSHEET_NOT_CONFIGURED`, phase `spreadsheet` : configurer l'identifiant explicite du classeur.
- `SCRIPT_ERROR`, phase `spreadsheet` : mauvais identifiant ou autorisations de lecture/écriture.
- Phase `lock` : acquisition du verrou en échec.
- Phase `sheet` : recherche/création de l'onglet `Inscriptions`.
- Phase `append` ou `flush` : échec d'écriture ; vérifier d'abord si une ligne existe déjà avant de réessayer.
- `REGISTRATION_SAVED`, phase `complete`, avec erreur côté navigateur : l'écriture a réussi, mais la confirmation n'a pas été reçue ; ne pas renvoyer.

L'ancienne version attrapait toutes les erreurs sans les journaliser. Il peut donc manquer des détails pour les anciennes tentatives ; le nouveau code doit être effectivement redéployé pour obtenir ces journaux.

## Diagnostic dans le navigateur

Ouvrir **Outils de développement → Réseau**, activer **Conserver le journal**, puis observer une seule soumission autorisée. Vérifier l'URL `/exec`, le POST, les huit paramètres (`nom`, `prenom`, `email`, `etablissement`, `experience`, `comite`, `pack`, `type`), la redirection et la réponse finale. Dans **Console**, consulter `Alpha MUN — inscription` et les messages CORS Google. Une erreur `Failed to fetch` seule ne permet pas de conclure à CORS : elle peut aussi provenir du réseau ou d'un accès refusé. Le navigateur peut masquer le statut et le corps dans ce cas.

Les métadonnées consignées par le site ne contiennent ni valeurs des champs ni URL Google de redirection avec jeton. Ne pas partager un fichier HAR non expurgé : il peut contenir les données personnelles de l'inscription.

Documentation : [applications Web](https://developers.google.com/apps-script/guides/web), [redirections ContentService](https://developers.google.com/apps-script/guides/content), [journaux](https://developers.google.com/apps-script/guides/logging).
