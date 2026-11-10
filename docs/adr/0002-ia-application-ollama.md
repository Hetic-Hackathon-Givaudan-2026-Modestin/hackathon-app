# 0002 — Ollama pour l'IA de l'application

- **Statut :** En cours — intégration avec l'équipe data à compléter
- **Date de rédaction :** 2026-11-08

## Contexte

L'API répond aux questions en appelant un modèle de langage. L'équipe data
héberge Ollama et fournit les données nécessaires aux réponses.

## Décision

Conserver Ollama comme moteur d'inférence, hébergé par l'équipe data.
L'application communique avec leur service via le tunnel ngrok documenté dans
l'ADR 0006. Le contrat d'API déterminera la configuration de l'appel, mais
aucun conteneur ni modèle Ollama local n'est maintenu dans ce dépôt.

## Alternatives de comparaison

- Héberger Ollama dans cette stack : davantage de contrôle local, mais
  duplication de l'infrastructure et des responsabilités de l'équipe data.
- Utiliser un autre fournisseur : changement de modèle et de contrat à
  convenir avec l'équipe data.

## Conséquences

- L'API technique ne doit pas implémenter la gestion des données ou de
  l'inférence détenues par l'équipe data ; elle consomme leur contrat d'API.
- L'application dépend de la disponibilité du service data et de son tunnel.
- Le choix porte sur l'IA de l'application, distincte de l'assistance au
  développement décrite dans [l'ADR 0003](0003-codage-assiste-ia.md).

## Références

- [ADR 0006](0006-integration-api-data-ngrok.md)
