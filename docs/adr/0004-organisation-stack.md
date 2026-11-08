# 0004 — Organisation et technologies de l'application

- **Statut :** En place
- **Date de rédaction :** 2026-11-08

## Contexte

Le projet comprend une interface web, une API et des services externes à ces
deux composants. Il faut pouvoir les développer ensemble et les distinguer.

## Décision

Organiser le dépôt en deux workspaces npm : `api` et `web`. L'API est écrite
en TypeScript avec Node.js et Express ; l'interface utilise Vite et
TypeScript. Les scripts à la racine permettent de lancer les deux serveurs de
développement ensemble et de construire les deux workspaces.

Les choix de persistance et d'IA sont documentés séparément dans les
[ADR 0005](0005-base-postgresql.md) et [ADR 0002](0002-ia-application-ollama.md).

## Alternatives de comparaison

- Dépôts séparés : séparation plus forte, mais coordination supplémentaire
  pour développer et faire évoluer l'API et le front ensemble.
- Application monolithique sans séparation front/API : organisation plus
  simple au départ, mais frontières moins explicites entre composants.

## Conséquences

- Les composants partagent un dépôt et peuvent être lancés par une commande.
- Leurs dépendances et scripts restent identifiés par workspace.
- Une modification traversant API et front nécessite de vérifier les deux
  composants ; les scripts communs ne remplacent pas cette validation.

## Références

- [Workspaces et scripts](../../package.json)
- [API](../../api/package.json)
- [Interface web](../../web/package.json)
