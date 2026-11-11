# Hackathon

## Stack

- **API :** Node.js 24 et Express, sur le port 3000.
- **Front :** React (Vite, TypeScript et React Router), sur le port 5173.
- **Base de données :** PostgreSQL 17 ; **IA :** Ollama hébergé par l'équipe data.

## Démarrer en trois étapes

1. Clonez le dépôt et ouvrez le dossier dans VS Code.
2. Lancez **Dev Containers: Reopen in Container** depuis la palette de commandes. À la création du conteneur, les dépendances sont installées et `api/.env` est copié depuis `api/.env.example`. Si ce fichier existait déjà, retirez ses anciennes variables `AI_*` qui visaient le conteneur Ollama local.
3. Dans le terminal du conteneur, lancez `npm run build`, puis `npm run migrate -w api` pour créer les tables des comptes et des sessions. Les migrations sont relançables et conservent les données existantes. Lancez ensuite `npm run dev` et ouvrez [http://localhost:5173/inscription](http://localhost:5173/inscription).

L'inscription crée un compte. Connectez-vous ensuite sur `/connexion` pour
accéder à l'accueil et au profil ; la session expire après 12 heures.
La déconnexion est disponible sur le profil. Le bouton de commande est indicatif :
la fonctionnalité n'est pas encore disponible. L'ancienne démo reste sur `/demo`.
Les conditions d'utilisation sont à définir : leur case est inactive et aucune
acceptation n'est enregistrée. L'intégration avec l'IA sera activée lorsque le
contrat de l'API de l'équipe data sera validé.

Les cookies de session sont HttpOnly et SameSite=Strict, et Secure lorsque
`NODE_ENV=production` : dans ce cas, HTTPS est nécessaire. La limitation de
connexion est en mémoire par adresse IP (10 essais par 15 minutes et par
processus) ; elle doit être remplacée par une protection partagée adaptée au
déploiement et aux éventuels proxies avant une mise en production.

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
