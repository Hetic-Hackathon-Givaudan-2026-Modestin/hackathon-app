# Hackathon

## Stack

- **API :** Node.js 24 et Express, sur le port 3000.
- **Front :** Vite et TypeScript, sur le port 5173.
- **Base de données :** PostgreSQL 17 ; **IA :** Ollama (conteneur du compose) via son API compatible OpenAI.

## Démarrer en trois étapes

1. Clonez le dépôt et ouvrez le dossier dans VS Code.
2. Lancez **Dev Containers: Reopen in Container** depuis la palette de commandes. À la création du conteneur, les dépendances sont installées et `api/.env` est copié depuis `api/.env.example`. Aucune clé IA n’est nécessaire : le service `ollama` télécharge le modèle `AI_MODEL` (`llama3.2:3b`) au premier démarrage via `ollama-pull`.
3. Dans le terminal du conteneur, lancez `npm run dev`, puis ouvrez [http://localhost:5173](http://localhost:5173). Posez une question dans le formulaire pour tester l’IA.

Pour vérifier l’API et la base, ouvrez [http://localhost:3000/api/health](http://localhost:3000/api/health) ; les questions enregistrées sont visibles sur [http://localhost:3000/api/questions](http://localhost:3000/api/questions).

## Décisions d'architecture

Les choix techniques et leurs compromis sont documentés dans les [ADR](docs/adr/README.md).
