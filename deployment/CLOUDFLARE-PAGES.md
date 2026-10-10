> Mise a jour : consulter [integration/MISE-A-JOUR.md](../integration/MISE-A-JOUR.md). Le formulaire utilise maintenant une Pages Function ; un upload statique seul ne suffit plus. Les instructions historiques ci-dessous ne remplacent pas cette procedure.

# Alpha MUN — Cloudflare Pages

## État actuel

| Élément | État |
| --- | --- |
| Compilation `npm run build` | Réussie ; sortie `dist` |
| Images, CSS, JavaScript et variables compilées | Vérifiés localement |
| Tests de l'intégration d'inscription | 16 tests simulés réussis |
| Archive `youthglobalclub.com-static.zip` | Prête ; `index.html` à la racine |
| Dépôt Git local | Aucun dépôt exploitable trouvé ; les commandes Git échouent |
| Projet Pages et adresse `pages.dev` | Pas encore créés ni vérifiés |
| DNS publics existants | Relevé partiel enregistré dans `dns-public-before.json` |
| Zone DNS complète et reprise chez Cloudflare | À obtenir et comparer avant changement de serveurs de noms |
| Domaine, HTTPS public, redirection www et tests Sheets en ligne | En attente du déploiement |

Les inscriptions fonctionnelles et le design ne sont pas modifiés. L'URL actuellement présente dans `.env` est conservée ; aucune ancienne URL n'est restaurée.

## 1. Choisir le mode de création du projet

Préférer Git si un dépôt GitHub ou GitLab contenant ce projet est accessible. Il faut connaître son URL, sa branche de production et la racine du projet. Ne pas initialiser ou pousser un nouveau dépôt sans choisir explicitement cette voie. Les fichiers `.env*`, sauf `.env.example`, et les archives ZIP sont ignorés pour un futur dépôt.

Sans dépôt disponible, téléverser `youthglobalclub.com-static.zip` ou `dist` dans un projet **Pages Direct Upload**. Le glisser-déposer accepte les archives ZIP. Le mode Direct Upload ne se convertit pas en intégration Git : un nouveau projet serait nécessaire pour cette conversion. [Documentation officielle](https://developers.cloudflare.com/pages/get-started/direct-upload/)

Dans le tableau de bord Cloudflare, ouvrir **Workers & Pages → Create application → Pages** et choisir l'import Git ou le téléversement de fichiers, selon le mode retenu. Créer uniquement le projet Pages à cette étape : ne pas changer les DNS du domaine.

## 2. Réglages si déploiement Git

| Réglage | Valeur |
| --- | --- |
| Framework | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Dossier contenant `package.json` dans le dépôt réel |
| Production branch | Branche réelle du dépôt sélectionné |
| Node.js | `.node-version` fixe `24.14.1`, version utilisée pour la préparation locale |
| `VITE_CONTACT_EMAIL` | `alphamun@youthglobalclub.com` |
| `VITE_APPS_SCRIPT_URL` | Copier exactement la valeur actuelle de `.env` |

Configurer ces deux variables avant le premier build dans les environnements Cloudflare de production et de prévisualisation utilisés. `.env` n'est pas envoyé par Git. Les valeurs Vite sont publiques dans le bundle : aucun mot de passe SMTP, jeton Cloudflare ou secret Hostinger ne doit y figurer. [Réglages Vite](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/), [version Node.js](https://developers.cloudflare.com/pages/configuration/build-image/)

Pour Direct Upload, les deux valeurs sont déjà intégrées dans l'archive compilée. Modifier des variables dans le tableau de bord ne modifie pas un bundle téléversé : il faut recompiler et téléverser de nouveau.

## 3. Vérifier d'abord pages.dev

Après création du projet, relever l'adresse HTTPS réellement affichée par Cloudflare. Aucun nom de projet ou sous-domaine disponible n'est supposé ici.

Fournir cette adresse pour permettre les contrôles réseau en lecture seule. Le script `scripts/verify-deployment.mjs` accepte cette adresse comme argument et vérifie HTTPS, HTML, CSS, JS, images et présence des paramètres d'inscription/contact. Il n'envoie aucune inscription.

Dans le navigateur : vérifier les six largeurs habituelles, menu, ancres, packs, liens e-mail et absence d'erreurs de console. Ensuite, autoriser une seule inscription de test identifiable : confirmation uniquement sur `ok:true`, et vérifier la ligne dans le nouveau Google Sheets. Ne pas renvoyer automatiquement si la confirmation manque. Prévoir la même vérification après activation du domaine final.

## 4. Relever la zone Hostinger complète

Avant tout changement de serveurs de noms, relever dans Hostinger la zone complète : type, nom, contenu, priorité MX et TTL pour chaque entrée. Exporter la zone si cette fonction est disponible ; sinon conserver toutes les lignes du tableau DNS. Les requêtes DNS publiques et le scan Cloudflare ne permettent pas d'énumérer tous les noms : des sélecteurs DKIM et des enregistrements de vérification peuvent manquer. [Limites du scan](https://developers.cloudflare.com/dns/zone-setups/reference/dns-quick-scan/)

Le relevé public local observe actuellement :

| Type | Nom | Valeur observée | Priorité |
| --- | --- | --- | --- |
| MX | `youthglobalclub.com` | `mx1.hostinger.com` | 5 |
| MX | `youthglobalclub.com` | `mx2.hostinger.com` | 10 |
| TXT SPF | `youthglobalclub.com` | `v=spf1 include:_spf.mail.hostinger.com ~all` | — |
| TXT DMARC | `_dmarc.youthglobalclub.com` | `v=DMARC1; p=none` | — |

Ce sont des observations horodatées, pas des valeurs de remplacement génériques. Les enregistrements DKIM restent à relever dans la zone Hostinger : aucun sélecteur n'a été inventé. Le relevé JSON contient aussi les serveurs de noms et les entrées Web existantes pour préparer un retour arrière.

## 5. Préparer Cloudflare DNS sans basculer le domaine

Ajouter `youthglobalclub.com` comme zone dans le même compte Cloudflare que le projet Pages. Importer ou compléter les enregistrements existants, puis comparer chaque ligne à la zone Hostinger avant activation. [Import/export](https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/)

Comparer notamment : les deux MX avec leurs priorités ; l'unique politique SPF existante ; chaque sélecteur DKIM et sa valeur TXT/CNAME exacte ; DMARC ; vérifications de domaine ; `mail`, `smtp`, `imap`, `pop`, autodiscover et autoconfig s'ils existent ; toutes les autres entrées utiles. Garder les TXT/MX et les CNAME/A/AAAA de messagerie **DNS only**, sans proxy. Ne pas activer Cloudflare Email Routing, qui pourrait modifier les MX destinés à Hostinger. [Messagerie](https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-records/), [Email Routing et MX](https://developers.cloudflare.com/dns/troubleshooting/email-issues/)

Ne pas copier comme serveurs autoritaires Cloudflare les anciens NS/SOA de l'apex ; conserver les délégations de sous-domaines existantes si présentes. Vérifier également DNSSEC/DS chez le registraire avant la bascule : un ancien DS incompatible avec les nouveaux serveurs peut empêcher la résolution du domaine. Le nom de domaine et la boîte mail restent chez Hostinger.

## 6. Activer le domaine seulement après comparaison

Pour le domaine racine, Cloudflare Pages exige la zone dans le même compte et les serveurs de noms Cloudflare. Utiliser exclusivement les **deux serveurs de noms attribués à cette zone** dans le tableau de bord, après validation de la reprise DNS. Ne pas utiliser une paire d'exemple. [Domaines personnalisés](https://developers.cloudflare.com/pages/configuration/custom-domains/)

Dans **Pages → projet → Custom domains**, associer `youthglobalclub.com` et `www.youthglobalclub.com`. Laisser Cloudflare fournir les entrées nécessaires ; ne pas créer seulement un CNAME sans associer le domaine dans Pages. Remplacer uniquement les entrées Web conflictuelles de l'apex et de `www` avec les valeurs réelles proposées. Ne pas toucher aux entrées de messagerie. Attendre les statuts d'activation et la délivrance HTTPS.

## 7. Rediriger www vers le domaine principal

Après activation des deux domaines, utiliser une règle de redirection Cloudflare limitée à l'hôte `www.youthglobalclub.com`. Le domaine principal retenu est `https://youthglobalclub.com`.

Configuration prévue : condition `http.host eq "www.youthglobalclub.com"` ; cible dynamique `concat("https://youthglobalclub.com", http.request.uri.path)` ; statut 301 ; **conserver la chaîne de requête**. Garder le trafic Web de `www` proxifié pour que la règle s'exécute ; la messagerie reste sans proxy. Tester la conservation du chemin, des paramètres et l'absence de boucle. Ne pas rediriger `pages.dev` pendant les vérifications initiales. [Redirection www](https://developers.cloudflare.com/pages/how-to/www-redirect/), [réglages Single Redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/)

## 8. Vérifications finales et retour arrière

- `https://youthglobalclub.com` : certificat valide, HTML/CSS/JS/images chargés ; tests mobile et ordinateur.
- `https://www.youthglobalclub.com` : une redirection vers le domaine principal ; HTTPS valide également sur www.
- Inscription : un POST valide, un JSON `ok:true`, une seule ligne dans Sheets. Aucun changement du script Google n'est requis pour déplacer le frontend.
- Contact : lien vers `alphamun@youthglobalclub.com`, champs conservés et indication d'envoi depuis la messagerie.
- Messagerie Hostinger : envoi et réception d'un e-mail avec une adresse externe, puis vérification SPF/DKIM/DMARC dans les en-têtes reçus.
- Si un problème apparaît après la bascule : arrêter les nouvelles tentatives d'inscription, comparer la zone DNS à la sauvegarde complète et restaurer seulement les valeurs validées. Garder l'ancienne configuration Web disponible jusqu'à validation.

Toutes les actions dans les comptes, les statuts Pages, la comparaison DNS complète et les tests de livraison restent à effectuer. Le relevé partiel ne suffit pas à autoriser une bascule des serveurs de noms.
