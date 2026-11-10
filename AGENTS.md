# Instructions pour les assistants

Présentation du projet et démarrage du Dev Container : [README.md](README.md).

## Lancer

- Dans le Dev Container, `npm run dev` lance l'API sur le port 3000 et le front sur le port 5173.
- `curl -s http://localhost:3000/api/health` vérifie la connexion entre l'API et PostgreSQL.
- Vérifie les changements avec les commandes adaptées : `npm run lint`, `npm run format:check`, `npm run build` et, pour l'API, `npm test`.
- `npm test` nécessite une base PostgreSQL accessible via `DATABASE_URL` et le droit de créer un schéma ; il utilise une IA simulée, pas Ollama. Voir [README.md](README.md).
- [La CI](.github/workflows/ci.yml) exécute la compilation, les tests et la validation de Compose à chaque push et pull request.

## Règles

- Les routes de l'API sont dans [api/src/index.ts](api/src/index.ts) ; le front utilise `/api`, transmis à l'API par le proxy [web/vite.config.ts](web/vite.config.ts).
- Les scripts [db/init/](db/init/) ne s'exécutent qu'à la première initialisation de PostgreSQL : les modifier ne met pas à jour une base existante.
- Ollama est hébergé par l'équipe data. N'ajoute pas de service de modèle local ; l'intégration utilise leur API via ngrok une fois son contrat validé. Le modèle réel n'est pas testé par `npm test`.
- Pour une tâche suivie dans GitHub, consulte son ticket et ses critères avant de modifier le code ; les modèles sont dans [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/).
- Les changements destinés à `develop` passent par une pull request ; ne pousse pas directement sur cette branche.

## Front (React)

- Structure de [web/src/](web/src/) : `pages/` (une page par route, déclarées dans `App.tsx` avec React Router), `components/` (blocs de l'interface), `components/ui/` (champs et boutons réutilisables), `hooks/` et `lib/` (logique et validation sans JSX).
- Réutilise `Button`, `TextField`, `PasswordField`, `SelectField` et `CheckboxField` de `components/ui/` plutôt que de recréer des champs ; un nouveau champ passe par `FieldShell` (libellé, erreur, accessibilité).
- Les couleurs et le rayon viennent des variables CSS de `styles/global.css` ; chaque composant a son CSS à côté, avec des classes préfixées (`ui-`, `auth__`).
- Routes actuelles : `/` (démo), `/inscription`, `/connexion`. Les formulaires ne sont pas encore reliés à l'API.
- Le front n'appelle jamais l'API des data : il passe par notre API.

## Décisions

- Lis [docs/adr/](docs/adr/README.md) avant de changer un composant ou d'ajouter une dépendance.
- Respecte les ADR au statut « En place » ; si un changement les contredit, propose un nouvel ADR et attends validation avant de modifier le code.
- Ne présente pas les ADR « En cours » ou « Proposé » comme des décisions validées. Pour remplacer une décision, suis la procédure décrite dans [docs/adr/README.md](docs/adr/README.md).

## À ne pas faire

- Ne contourne pas les contrôles avec `git commit --no-verify` ou des exclusions ESLint pour masquer une erreur.
- Ne lance pas `npm install` sur l'hôte pour ce projet : utilise le Dev Container afin de préserver l'environnement de l'équipe.
- Ne commite pas de secrets : [api/.env.example](api/.env.example) est un modèle, tandis que `api/.env` est local et ignoré par Git.
- Ne supprime pas `db/data/` pour résoudre un problème de démarrage : ce dossier contient les données PostgreSQL locales.
