# 0003 — Codage assisté par l'IA

- **Statut :** Proposé — pratiques à valider par l'équipe
- **Date de rédaction :** 2026-11-08

## Contexte

L'IA a été utilisée pour assister des travaux de développement du projet.
Cet usage est distinct du modèle Ollama appelé par l'application et ne
suppose pas que l'assistant de développement fonctionne en local.

## Décision proposée

Autoriser l'utilisation d'assistants IA pour aider à comprendre, écrire ou
documenter le code, sans en faire un prérequis ni imposer un fournisseur
particulier. La personne qui intègre une modification reste responsable de sa
compréhension, de sa revue et de sa validation, y compris les tests adaptés.

Avant de transmettre du code ou des données à un service externe, vérifier les
autorisations et les conditions applicables ; ne pas lui communiquer de
secrets ni de données sensibles sans autorisation.

## Alternatives de comparaison

- Développement sans assistant : moins de dépendance à un outil externe, mais
  pas d'aide automatique pour l'exploration ou la rédaction.
- Imposer un outil unique : pratique plus uniforme, mais dépendance à son
  fournisseur et à ses conditions d'accès.

## Conséquences

- L'assistance peut accélérer certaines tâches, mais ses propositions peuvent
  être erronées, inadaptées ou soulever des questions de confidentialité et de
  licence.
- Les tests et la revue restent nécessaires ; l'utilisation d'un assistant ne
  remplace pas la responsabilité humaine.
- Les outils, données autorisées et modalités de validation restent à
  confirmer par l'équipe.
