# alphamun-inscription

Racine Cloudflare : frontend. Build : npm run build. Sortie : registration-site/dist.

POST /api/inscription est découvert dans frontend/functions/api/inscription.js et appelle backend/src/index.js avec context.env. Le fichier frontend/public/_routes.json est copié dans les deux sorties et inclut /api/*. Aucun middleware ni _worker.js ne remplace les Functions. Le _redirects ne contient aucune règle active. Voir [la configuration complète](DEUX-SITES.md).
