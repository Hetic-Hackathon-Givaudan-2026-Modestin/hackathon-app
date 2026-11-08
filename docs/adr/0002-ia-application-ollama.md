# 0002 — Ollama pour l'IA de l'application

- **Statut :** En cours — configuration présente dans le projet, validation de bout en bout à compléter
- **Date de rédaction :** 2026-11-08

## Contexte

L'API répond aux questions en appelant un modèle de langage. Elle utilisait
précédemment Gemini via l'API compatible OpenAI de Google ; le projet s'oriente
désormais vers Ollama dans un conteneur.

## Décision

Utiliser le service `ollama` de Docker Compose avec son API compatible OpenAI.
Un service `ollama-pull` télécharge `llama3.2:3b` et les modèles sont conservés
dans un volume Docker. L'API est configurée par `AI_BASE_URL`, `AI_MODEL` et
`AI_API_KEY` ; aucune clé n'est nécessaire pour l'instance Ollama locale.

Le modèle demandé par l'API et celui téléchargé par `ollama-pull` doivent
correspondre si la configuration est modifiée.

## Alternatives de comparaison

- Conserver Gemini : modèle hébergé et infrastructure locale plus légère, mais
  accès réseau et clé API nécessaires.
- Utiliser un autre fournisseur compatible OpenAI : configuration de l'API
  potentiellement réutilisable, sous réserve de compatibilité et de
  disponibilité du modèle.

## Conséquences

- L'inférence utilise les ressources de la machine hébergeant Ollama, sans clé
  de fournisseur pour l'instance locale.
- Le premier téléchargement du modèle nécessite une connexion réseau et de
  l'espace disque. Les performances dépendent des ressources disponibles.
- La disponibilité du serveur Ollama ne garantit pas que le téléchargement du
  modèle soit terminé : une requête peut échouer tant que celui-ci manque.
- La configuration actuelle n'active pas explicitement un GPU. Les images
  Ollama utilisent le tag `latest`, donc leur version n'est pas figée.
- Le choix porte sur l'IA de l'application, distincte de l'assistance au
  développement décrite dans [l'ADR 0003](0003-codage-assiste-ia.md).

## Références

- [Docker Compose](../../compose.yaml)
- [Configuration d'exemple](../../api/.env.example)
- [API](../../api/src/index.ts)
