# 0006 — Intégration de l'API de l'équipe data via ngrok

- **Statut :** En cours — contrat d'API et paramètres de sécurité à convenir
- **Date de rédaction :** 2026-11-10

## Contexte

L'équipe data héberge Ollama et fournit les données et le modèle auxquels
l'application doit accéder. L'API technique reçoit la demande du front,
l'envoie au service data, puis renvoie sa réponse au front.

## Décision

Utiliser un tunnel ngrok pour joindre l'API de l'équipe data pendant cette
phase du projet. L'URL du tunnel doit être fournie à l'API technique par
configuration d'environnement ; elle ne doit pas être écrite en dur dans le
code ni dans le dépôt.

Le contrat de l'API data doit préciser la route, le format des requêtes et des
réponses, l'authentification, les délais de réponse et les erreurs retournées.

## Alternatives de comparaison

- Réseau Docker partagé : adapté si les deux services sont exécutés sur la même
  infrastructure.
- Déploiement d'une API data sur une infrastructure accessible : solution à
  privilégier lorsqu'un environnement durable sera disponible.

## Conséquences

- Une URL ngrok peut changer ou cesser d'être disponible ; sa mise à jour ne
  doit pas nécessiter de modification du code.
- L'accès au service data doit être protégé selon le mécanisme convenu avec
  l'équipe data.
- L'API technique doit signaler explicitement les erreurs ou délais d'appel au
  service data au lieu de produire une réponse artificielle.

## Points restant à décider

- Schéma exact des requêtes et réponses.
- Mécanisme d'authentification et gestion des secrets.
- Limites de temps, de taille et de débit des appels.

## Références

- [ADR 0002](0002-ia-application-ollama.md)
