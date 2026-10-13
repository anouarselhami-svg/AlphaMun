# Configuration Cloudflare Pages et Resend

Les deux projets existants sont conservés. Il n’y a plus de Worker séparé ni de Durable Object à déployer.

| Projet Pages | Racine du projet | Commande de build | Sortie |
| --- | --- | --- | --- |
| alpha-mun-main | frontend | npm ci && npm run build:main | dist |
| alphamun-inscription | frontend | npm run build | registration-site/dist |

La racine du site d’inscription est frontend : Cloudflare découvre frontend/functions/api/inscription.js et frontend/wrangler.toml. Le build par défaut produit les deux sites, dont registration-site/dist attendu par la configuration actuelle. Les imports backend/src restent dans le même dépôt. Ne pas publier uniquement les fichiers statiques par glisser-déposer. Le site principal conserve sa commande build:main et sa sortie frontend/dist ; pour son projet Pages, conserver la sortie dist (une publication Wrangler doit préciser dist explicitement), et non registration-site/dist. Le wrangler.toml courant décrit la sortie du projet d’inscription ; son nom historique ne doit pas servir à sélectionner le projet principal par erreur. Les secrets actuels restent dans chaque environnement Pages, accessibles via context.env.

## Resend et variables serveur

1. Le domaine youthglobalclub.com est vérifié dans Resend, selon la confirmation de l’utilisateur. Conserver les enregistrements DNS et MX existants.
2. L’expéditeur choisi est alphamun@youthglobalclub.com. Le destinataire est également alphamun@youthglobalclub.com. Le participant apparaît en Reply-To. La vérification réelle du compte Resend n’a pas été consultée pendant cette préparation.
3. Dans Cloudflare → Workers & Pages → alphamun-inscription → Settings → Variables and Secrets, définir RESEND_API_KEY en tant que SECRET chiffré. Utiliser la clé serveur fournie, sans la copier dans Git, les variables VITE ou le navigateur.
4. REGISTRATION_EMAIL_FROM et REGISTRATION_EMAIL_TO sont déjà configurés à alphamun@youthglobalclub.com dans les deux wrangler.toml. Configurer le secret RESEND_API_KEY pour production et preview selon les environnements réellement utilisés ; une preview avec une clé réelle enverra des emails réels.
5. Pour conserver le formulaire de contact du site principal, configurer les mêmes trois paramètres dans alpha-mun-main. Chaque projet Pages a son environnement indépendant. En local, utiliser son propre fichier .dev.vars, ignoré par Git.
6. Retirer les anciens secrets et variables Apps Script/Sheets du tableau de bord lors de la future mise en service. Ne pas supprimer le tableur ni les anciennes inscriptions. VITE_API_BASE_URL n’est plus utilisé ; retirer sa configuration de build historique.

Les Functions autorisent l’origine de leur propre projet. Les origines locales des proxies sont explicites dans ALLOWED_ORIGINS. Aucun domaine Worker ou CORS entre les deux sites n’est nécessaire : chaque site appelle son endpoint relatif.

Les tests de livraison réelle restent à faire après autorisation : vérifier le statut Resend et le récapitulatif reçu, puis la répétition du même ID et des mêmes réponses. Aucun email réel, changement DNS, secret Cloudflare distant ou déploiement public n’a été effectué ici.

Les clés d’idempotence Resend sont conservées 24 heures : [documentation Resend](https://resend.com/docs/dashboard/emails/idempotency-keys). Le routage des endpoints suit [Pages Functions](https://developers.cloudflare.com/pages/functions/routing/). Les [secrets et variables Pages](https://developers.cloudflare.com/pages/functions/bindings/#environment-variables) restent côté serveur.
