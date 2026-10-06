# Préparation de youthglobalclub.com

Le site utilise React et Vite. Il se déploie comme un site statique à la racine du domaine : `index.html` et `assets/`. Aucun serveur Node.js ni base de données ne sont nécessaires pour servir cette compilation. Les inscriptions sont envoyées à l'application Web Google Apps Script existante.

## Fichiers préparés

- `dist/` : fichiers de production.
- `youthglobalclub.com-static.zip` : contenu de `dist/`, sans dossier parent, prêt à extraire dans la racine Web du site.
- Ne pas transférer `.env`, `src/`, `node_modules/` ou `integration/Code.gs` dans la racine Web.

## Configuration vérifiée

- `base: '/'` dans Vite ; images, CSS et JavaScript prévus pour la racine du domaine.
- `VITE_APPS_SCRIPT_URL` dans `.env` : URL actuellement configurée et conservée ; `scripts/verify-dist.mjs` vérifie qu'elle est intégrée dans la compilation. Ne pas remplacer cette URL par celle d'un ancien déploiement.
- `VITE_CONTACT_EMAIL=alphamun@youthglobalclub.com`. Le formulaire ouvre un e-mail dans l'application de messagerie du visiteur ; celui-ci doit l'envoyer pour terminer. Le formulaire n'est pas vidé.
- Les variables `VITE_*` sont intégrées au JavaScript public lors de la compilation. Ne jamais y placer de secret. Une modification de ces variables exige une nouvelle compilation.
- Navigation par ancres (`#inscription`, `#packs`, etc.), sans React Router : aucune redirection SPA ni fichier `.htaccess` de réécriture n'est nécessaire.
- Date de l'événement et liste des comités restent à confirmer dans `src/config.js`. Aucune année n'a été inventée.

## Reproduire la compilation

Sous PowerShell, dans le projet :

```powershell
npm.cmd run build -- --configLoader native
node scripts/verify-dist.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/package-static.ps1
```

Le chargement natif de la configuration évite la restriction d'accès rencontrée dans cet environnement Windows.
Le script d'archivage utilise des chemins ZIP avec `/`, compatibles avec un serveur Linux, et vérifie que `index.html` est à la racine de l'archive.

## Hébergement et DNS

La cible actuelle est Cloudflare Pages. Voir `deployment/CLOUDFLARE-PAGES.md` pour le déroulement par étapes. Le domaine et la messagerie restent chez Hostinger. Aucune adresse IP ou valeur DNS n'a été supposée. Aucun DNS n'a été modifié.

Conserver les enregistrements de messagerie existants : MX, SPF, DKIM, DMARC et les autres enregistrements liés à la messagerie. Éviter un changement de serveurs de noms ou une réinitialisation de zone sans vérifier au préalable que ces enregistrements seront conservés. Utiliser uniquement les valeurs d'hébergement indiquées dans le compte Hostinger.

## Vérification après mise en ligne

1. Ouvrir `https://youthglobalclub.com` et vérifier le certificat HTTPS, les images et les styles.
2. Vérifier la console et l'onglet Réseau du navigateur : aucun fichier CSS, JS ou image ne doit répondre 404.
3. Vérifier le menu mobile, les liens vers les sections et la sélection des packs à 550 DH et 1 550 DH.
4. Envoyer une inscription de test identifiable depuis le domaine final. Vérifier la réponse JSON `ok: true` et la ligne correspondante dans l'onglet `Inscriptions` du Google Sheets lié au script. Aucune inscription réelle n'a été envoyée pendant la préparation.
5. Vérifier la réception et l'envoi des e-mails du domaine après toute modification DNS autorisée.

## Contact : mailto et éventuel envoi direct

Le destinataire officiel est `alphamun@youthglobalclub.com`. Le formulaire valide le nom, l'e-mail et le message, puis ouvre un e-mail avec l'objet « Contact — Alpha MUN » et les informations saisies dans le corps. L'objet et le corps sont encodés. Les champs restent renseignés, et un lien vers l'adresse officielle permet d'ouvrir directement la messagerie. L'ouverture de l'application ne confirme aucun envoi. Si aucune application n'est configurée, copier l'adresse et utiliser sa messagerie habituelle. L'existence et la réception de la boîte officielle doivent être vérifiées dans le service de messagerie.

Pour envoyer directement depuis le site, ajouter un endpoint serveur (par exemple PHP ou Node.js, selon l'offre d'hébergement). Il doit valider les données, limiter les soumissions et envoyer via SMTP authentifié ou une API de messagerie. Stocker les identifiants exclusivement dans la configuration privée du serveur, hors racine Web. Utiliser un expéditeur autorisé du domaine et l'e-mail du visiteur comme `Reply-To`. Le navigateur ne doit jamais recevoir de mot de passe Hostinger, d'identifiant SMTP ou de clé privée : ne pas les placer dans React ni dans une variable `VITE_*`. Confirmer l'envoi seulement après l'acceptation du service de messagerie ; cette acceptation ne garantit pas la livraison finale. Conserver les enregistrements MX/SPF/DKIM/DMARC existants et vérifier toute modification nécessaire avec le fournisseur réel.
