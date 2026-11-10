# 0007 — Réévaluation du choix du SGBD

- **Statut :** Proposé — comparaison MySQL/PostgreSQL en cours
- **Date de rédaction :** 2026-11-10

## Contexte

L'application stocke actuellement les questions et réponses dans PostgreSQL.
L'équipe évalue désormais PostgreSQL et MySQL avant de confirmer le SGBD à
utiliser.

## Décision

Aucune décision de remplacement n'est prise à ce stade. PostgreSQL reste la
configuration actuelle, définie dans l'ADR 0005, jusqu'à la validation d'un
choix.

La décision finale doit comparer les besoins de l'application, les
compétences de l'équipe, les environnements de déploiement, les migrations et
les besoins d'exploitation.

## Alternatives de comparaison

- Conserver PostgreSQL : compatible avec la configuration et le code actuels.
- Adopter MySQL : nécessite d'adapter la configuration, le pilote et les
  scripts d'initialisation ou migrations.

## Conséquences

- Aucun changement de code ou d'infrastructure ne doit être réalisé au seul
  motif de cette évaluation.
- Si MySQL est retenu, un ADR qui remplace l'ADR 0005 sera nécessaire et les
  changements associés devront être planifiés.

## Références

- [ADR 0005](0005-base-postgresql.md)
