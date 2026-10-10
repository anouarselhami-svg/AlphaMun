# Formulaire Alpha MUN — cinq étapes (Apps Script version 6)

Le formulaire d’inscription suit désormais les cinq étapes demandées : coordonnées, préférences/expérience, motivation/parcours, logistique/formule, puis quatre confirmations et récapitulatif. Les réponses restent disponibles lors des retours et après une erreur. Les erreurs sont affichées près des champs, avec focus sur la première erreur.

Le site principal, ses prestations et ses liens ne sont pas modifiés. La compilation reste `npm run build:registration`, sortie `registration-site/dist`, et les paramètres Cloudflare de [ALPHAMUN-INSCRIPTION.md](ALPHAMUN-INSCRIPTION.md) restent valables.

## Points à confirmer avant publication

- INTERSS et IAIGC restent exactement les intitulés fournis. Vérifier leur orthographe officielle ; aucun nom complet ou sujet n’a été inventé.
- La capture concernant le traitement des données est tronquée. Une case obligatoire distincte est préparée avec la seule finalité indiquée : l’utilisation des informations par YouthGlobalClub pour traiter l’inscription. La formulation est signalée comme provisoire dans le formulaire. Fournir le texte intégral avant publication, puis remplacer les versions FR et EN de `labels.consentement` et retirer la note provisoire.
- Les catégories « 0 », « 1–3 » et « +5 » ont été remplacées par un **nombre entier de participations supérieur ou égal à zéro** pour inclure explicitement 4 et 5.

## Données et comités

Les intitulés et langues sont dans `src/services/registration-schema.js`, exclusivement pour le formulaire. Ils ne modifient pas la présentation des comités sur le site principal.

Les trois choix sont obligatoires et distincts, avec leur langue visible : anglais, français ou dialecte marocain. La description de l’expérience reste visible et obligatoire même pour zéro participation. Le contact parental est désormais obligatoire pour tous. Les packs affichés sont Pack Normal — 500 MAD et Pack Premium — 1 500 MAD. Changer de pack décoche la confirmation de ses conditions.

La logistique est une réponse longue obligatoire ; elle ne garantit pas une réservation. Les quatre confirmations sont décochées initialement : conditions du pack, traitement des données, code de conduite et exactitude.

## Mettre à jour Apps Script existant

1. Copier l’intégralité de [integration/Code.gs](../integration/Code.gs) dans le projet Apps Script existant. Ne pas changer le classeur ni sa propriété `SPREADSHEET_ID`.
2. Exécuter `preparerColonnes` et autoriser l’accès. Cette opération n’ajoute aucune inscription. Elle ajoute notamment `Nombre de participations MUN` et `Logistique et besoins particuliers`, sans effacer les colonnes ou lignes anciennes. La colonne Motivation et ses anciennes valeurs restent en dernière position.
3. Déployer > Gérer les déploiements > Modifier le déploiement existant > Nouvelle version > Déployer. Conserver la même URL `/exec`, l’exécution en tant que propriétaire et l’accès public requis.
4. Vérifier par GET que le JSON indique `version:6`. Le GET n’écrit rien dans le classeur.
5. Conserver cette URL dans `APPS_SCRIPT_URL` côté serveur du projet Pages **alphamun-inscription**. Ne pas la déplacer dans le bundle React. Redéployer les sources de ce formulaire et son relais `registration-site/functions/api/registration.js`.

La liste des comités de `Code.gs` doit correspondre à celle du formulaire. Le serveur valide tous les champs requis, les nombres, le contact parental pour tous, les tarifs, les trois comités distincts et les quatre confirmations. Les écritures se font par noms d’en-têtes, sous verrou, avec protection contre les formules. Les colonnes historiques inutilisées restent présentes ; leurs anciennes valeurs ne sont pas modifiées. La nouvelle motivation de participation est enregistrée dans `Motivation`, en dernière colonne.

Le relais ne transmet que les champs de cette version et conserve `APPS_SCRIPT_URL` comme configuration serveur. Le navigateur affiche le remerciement seulement après un JSON lisible `ok:true`. Un réseau inaccessible ou une réponse non confirmée conserve les réponses et autorise un nouvel essai ; si l’écriture a déjà eu lieu sans réponse lisible, l’enregistrement reste incertain.

## Vérification

`npm run build:registration`, `npm test` et `npm run test:browser` contrôlent les cinq étapes, les packs, FR / EN, les validations, les réponses conservées, le mobile, l’état d’envoi, une erreur et un succès simulé. Aucun POST n’est envoyé à Google Sheets de production. Les tests serveur vérifient aussi la préservation des anciens tarifs et de Motivation, l’obligation du contact parental pour les adultes, les confirmations séparées et les nombres 0, 4 et 5.

Les messages sont exactement :

- FR : « Merci pour votre inscription ! Votre demande a bien été enregistrée. »
- EN : « Thank you for registering! Your submission has been successfully received. »

Ils n’apparaissent pas avant l’envoi et ne constituent pas une confirmation de paiement ou d’admission. Aucun déploiement distant n’a été exécuté ici.
