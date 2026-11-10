# 0001 — Environnement de développement avec Dev Containers

- **Statut :** En place
- **Date de rédaction :** 2026-11-08

## Contexte

Les contributeurs ont besoin d'un environnement de développement cohérent pour
l'API, le front et leurs services, indépendamment de leur installation locale.

## Décision

Utiliser VS Code Dev Containers avec Docker Compose. VS Code s'attache au
service `dev`, construit depuis `.devcontainer/Dockerfile` et exécuté avec
l'utilisateur `node`. La configuration partage les extensions et réglages,
redirige les ports utiles et installe les dépendances à la création. Elle
crée `api/.env` depuis l'exemple uniquement s'il n'existe pas déjà.

Le service `dev` attend que PostgreSQL soit prêt. L'équipe data héberge
Ollama ; Compose ne démarre pas de service de modèle local.

## Alternatives de comparaison

- Installer manuellement Node.js et les services sur chaque poste : moins de
  dépendances à Docker, mais davantage de différences entre environnements.
- Utiliser Docker uniquement pour les services et installer les outils de
  développement sur l'hôte : compromis possible, avec une configuration
  locale à maintenir.

## Conséquences

- L'environnement et ses outils sont partagés et plus faciles à reproduire.
- Docker et une extension compatible Dev Containers sont nécessaires pour ce
  parcours. Le premier démarrage dépend du téléchargement des images et des
  dépendances et peut être long.
- Le démarrage de `dev` dépend de l'état de la base ; une récupération lente de
  PostgreSQL peut faire échouer le contrôle de santé avant qu'elle soit prête.

## Références

- [Configuration Dev Container](../../.devcontainer/devcontainer.json)
- [Dockerfile](../../.devcontainer/Dockerfile)
- [Docker Compose](../../compose.yaml)
