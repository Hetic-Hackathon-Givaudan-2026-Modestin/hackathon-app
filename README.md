# Hackathon

## Stack

- **API :** Node.js 24 et Express, sur le port 3000.
- **Front :** React (Vite, TypeScript et React Router), sur le port 5173.
- **Base de données :** PostgreSQL 17 ; **IA :** Ollama hébergé par l'équipe data.

## Démarrer en trois étapes

1. Clonez le dépôt et ouvrez le dossier dans VS Code.
2. Lancez **Dev Containers: Reopen in Container** depuis la palette de commandes. À la création du conteneur, les dépendances sont installées et `api/.env` est copié depuis `api/.env.example`. Si ce fichier existait déjà, retirez ses anciennes variables `AI_*` qui visaient le conteneur Ollama local.
3. Dans le terminal du conteneur, lancez `npm run build`, puis `npm run migrate -w api` (les migrations sont relançables et conservent les données existantes). Lancez ensuite `npm run dev` et ouvrez [http://localhost:5173](http://localhost:5173).

Le parcours projet, sans compte, est sur `/` : une première étape collecte les
informations générales (dont « avez-vous déjà travaillé avec Givaudan ? »), une
seconde la description du projet. Pour l'instant, le front n'envoie rien : GivBot
affiche « en cours d'évaluation » pour tous les projets (branchement à l'API dans
un prochain ticket).

Côté API, `POST /api/projects` enregistre le projet et le décide : un client déjà
passé chez Givaudan est accepté directement ; sinon le projet, sans nom, email ni
entreprise, est envoyé à l'équipe data (`SCORING_BASE_URL`, `SCORING_API_KEY`, voir
`api/.env.example`), qui retourne un score de 0 à 100. À partir de 65, il est
accepté, sinon refusé ; si l'évaluation échoue, il reste `pending`. La réponse
contient un jeton d'accès secret, affiché une seule fois (seul son hash est stocké),
à envoyer en `Authorization: Bearer` sur `GET /api/projects/{id}` pour lire le
statut. Le contrat de scoring (`POST /score`, réponse `{ "score": n }`) est
provisoire jusqu'à validation par l'équipe data. Après mise à jour, relancez
`npm run build` puis `npm run migrate -w api`.

L'ancienne démo reste sur `/demo`. Les routes `/api/users` et `/api/session`
existent toujours côté API mais ne sont plus utilisées par le front. L'intégration
avec l'IA sera activée lorsque le contrat de l'API de l'équipe data sera validé.

Les cookies de session sont HttpOnly et SameSite=Strict, et Secure lorsque
`NODE_ENV=production` : dans ce cas, HTTPS est nécessaire. La limitation de
connexion est en mémoire par adresse IP (10 essais par 15 minutes et par
processus) ; elle doit être remplacée par une protection partagée adaptée au
déploiement et aux éventuels proxies avant une mise en production.

Pour vérifier l’API et la base, ouvrez [http://localhost:3000/api/health](http://localhost:3000/api/health) ; les questions enregistrées sont visibles sur [http://localhost:3000/api/questions](http://localhost:3000/api/questions).

## Intégration continue et tests

GitHub Actions construit l'API et le front, vérifie la configuration Compose et
exécute les tests d'intégration à chaque push et pull request. Les tests utilisent
PostgreSQL 17 et un service IA simulé : ils ne contactent pas le service de
l'équipe data.

Pour les lancer localement, démarrez PostgreSQL et renseignez `DATABASE_URL` dans
l'environnement du terminal, puis exécutez `npm run build` et `npm test`. Les
tests créent puis suppriment un schéma temporaire ; l'utilisateur PostgreSQL doit
avoir le droit de créer des schémas.

Ce workflow ne déploie pas l'application : une cible et des paramètres de
déploiement restent à définir.

## Décisions d'architecture

Les choix techniques et leurs compromis sont documentés dans les [ADR](docs/adr/README.md).
