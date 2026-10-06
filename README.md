# Alpha MUN — React + Vite

## Démarrer
Installer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Ouvrir l’adresse indiquée par Vite. Pour produire la version à héberger :

```bash
npm run build
npm run preview
```

## Organisation
- `src/components/` : composants de chaque section.
- `src/hooks/useCountdown.js` : compte à rebours avec nettoyage de l’intervalle.
- `src/services/registration.js` : envoi vers Google Sheets.
- `src/config.js` : date et comités.
- `src/styles.css` : identité crème, bordeaux, dorée et mise en page responsive.
- `public/assets/` : emblème et référence de marque.
- `integration/Code.gs` : Google Apps Script.

## Configurer
Copier `.env.example` en `.env`, ajouter l’URL /exec de Google Apps Script et l’e-mail officiel. Les valeurs VITE sont publiques : aucun secret ne doit y être placé. Redémarrer Vite après changement et reconstruire pour la production.

Créer un Google Sheets, ouvrir Extensions > Apps Script, copier `integration/Code.gs`, puis déployer une application Web exécutée en tant que propriétaire avec l’accès nécessaire aux visiteurs. Tester une soumission depuis le domaine final et vérifier la ligne dans Sheets et la réponse JSON (redirections/CORS à vérifier). Aucun succès n’est annoncé sans réponse positive.

Confirmer l’année, l’heure, les comités, les horaires, le lieu et les liens sociaux avant ouverture. Le contact ouvre la messagerie du visiteur. Ajouter les mentions de confidentialité et la protection antispam avant ouverture publique. La police Breathing attend son fichier autorisé. L’emblème est issu de la planche fournie, à remplacer par le vectoriel original si disponible.

Sans URL configurée, les inscriptions ne sont pas envoyées. Aucun compte utilisateur ni paiement intégré.
