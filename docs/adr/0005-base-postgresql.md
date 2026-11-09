# 0005 — PostgreSQL pour les données

- **Statut :** En place
- **Date de rédaction :** 2026-11-08

## Contexte

L'application doit conserver les questions et réponses et pouvoir les
consulter depuis l'API.

## Décision

Utiliser PostgreSQL 17 dans le service `db` de Docker Compose. L'API s'y
connecte avec le client `pg` et `DATABASE_URL`. En développement, les données
sont conservées dans `db/data`, ignoré par Git, et les scripts de `db/init`
initialisent le schéma et des données de test lors de la première création de
la base.

## Alternatives de comparaison

- SQLite : installation plus légère, mais modèle de déploiement et de
  concurrence différent.
- Base PostgreSQL hébergée : pas de conteneur local à administrer, mais
  dépendance au réseau et à une infrastructure externe.

## Conséquences

- Les données survivent au redémarrage du conteneur tant que `db/data` est
  conservé ; supprimer ce dossier supprime les données locales.
- Les scripts d'initialisation ne constituent pas un système de migrations
  pour une base déjà initialisée.
- Le montage du répertoire local peut ralentir les opérations de disque,
  notamment sur certains environnements Docker Desktop. Une base interrompue
  peut nécessiter une récupération avant d'accepter les connexions.

## Références

- [Docker Compose](../../compose.yaml)
- [Scripts d'initialisation](../../db/init/)
- [API](../../api/src/index.ts)
