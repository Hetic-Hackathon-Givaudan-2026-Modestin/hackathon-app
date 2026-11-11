# Hackathon

## Stack

- **API :** Node.js 24 et Express, sur le port 3000.
- **Front :** React (Vite, TypeScript et React Router), sur le port 5173.
- **Base de données :** PostgreSQL 17 ; **IA :** Ollama hébergé par l'équipe data.

## Démarrer en trois étapes

1. Clonez le dépôt et ouvrez le dossier dans VS Code.
2. Lancez **Dev Containers: Reopen in Container** depuis la palette de commandes. À la création du conteneur, les dépendances sont installées et `api/.env` est copié depuis `api/.env.example`. Si ce fichier existait déjà, retirez ses anciennes variables `AI_*` qui visaient le conteneur Ollama local.
3. Dans le terminal du conteneur, lancez `npm run dev`, puis ouvrez [http://localhost:5173](http://localhost:5173). L'intégration avec l'IA sera activée lorsque le contrat de l'API de l'équipe data sera validé.

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
