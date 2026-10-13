# Correction du 405 d’inscription

La racine Cloudflare réelle est frontend. La route d’inscription existait uniquement sous frontend/registration-site/functions, tandis que frontend/functions ne contenait que le contact et health. POST /api/inscription ne correspondait donc à aucune Function découverte depuis la racine de production. Le 405 vide observé est cohérent avec le service statique ; la logique backend retourne toujours des erreurs JSON. De plus, npm run build produisait uniquement frontend/dist alors que Pages publiait frontend/registration-site/dist, potentiellement ancien.

Corrections : route frontend/functions/api/inscription.js avec onRequest et transmission de context.env ; build par défaut des deux sites ; _routes.json explicite pour /api/* et /health ; commandes Wrangler vérifiées depuis frontend avec les assets registration-site/dist. La validation, le format URL-encoded avec charset, les clés d’idempotence, Reply-To et Resend sont conservés. Aucun secret Cloudflare modifié.

Vérifications du 13 octobre 2026 :

- 28 tests réussis (7 backend, 21 frontend).
- Deux builds Vite et deux bundles Pages Functions compilés.
- Fichiers générés des deux sites : /api/* inclus, aucune exclusion, aucune redirection active, aucun _worker.js statique.
- Wrangler Pages local : POST invalide avec application/x-www-form-urlencoded;charset=UTF-8 retourne 400 et {ok:false,code:"INVALID_SUBMISSION_ID"}.
- Bundle Pages exécuté dans workerd : POST valide retourne 200 et accepted:true avec Resend simulé ; retry avec la même clé ; POST invalide retourne 400 et INVALID_FIELDS en JSON.

Aucun appel de soumission en production, email réel, changement de secret distant ou déploiement public. La correction est préparée localement ; sa mise en production reste à effectuer ultérieurement.
