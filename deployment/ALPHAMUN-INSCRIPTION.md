# alphamun-inscription

Racine Cloudflare : frontend/registration-site. Build : npm ci --prefix .. && npm --prefix .. run build:registration. Sortie : dist.

POST /api/inscription est une Pages Function découverte dans functions/api/inscription.js. Elle envoie toutes les réponses par Resend. Voir [la configuration complète](DEUX-SITES.md). Aucun Worker séparé ni binding de stockage.
