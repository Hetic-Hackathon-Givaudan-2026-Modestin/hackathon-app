# Hackathon

## Stack

- **API :** Node.js 24 et Express, sur le port 3000.
- **Front :** React (Vite, TypeScript et React Router), sur le port 5173.
- **Base de données :** PostgreSQL 17 ; **IA :** service de scoring et Ollama.

## Démarrer en trois étapes

1. Clonez le dépôt et ouvrez le dossier dans VS Code.
2. Lancez **Dev Containers: Reopen in Container** depuis la palette de commandes. À la création du conteneur, les dépendances sont installées et `api/.env` est copié depuis `api/.env.example`. Si ce fichier existait déjà, retirez ses anciennes variables `AI_*` qui visaient le conteneur Ollama local.
3. Dans le terminal du conteneur, lancez `npm run build`, puis `npm run migrate -w api` (les migrations sont relançables et conservent les données existantes). Lancez ensuite `npm run dev` et ouvrez [http://localhost:5173](http://localhost:5173).

Pour le scoring en local, démarrez séparément votre service IA sur la machine
hôte, port 8000, ainsi qu'Ollama. Dans le Dev Container, l'adresse du service est
`http://host.docker.internal:8000`, et non `localhost:8000`. Configurez
`SCORING_BASE_URL` dans `api/.env` ; pour un fichier déjà créé, ajoutez cette
variable manuellement, car modifier `api/.env.example` ne le met pas à jour.
Si le service exige une clé, configurez aussi `SCORING_API_KEY` avec sa clé.
Redémarrez `npm run dev` après modification de la configuration.

Le parcours projet, sans compte, est sur `/` : une première étape collecte les
informations générales (dont « avez-vous déjà travaillé avec Givaudan ? »), une
seconde la description du projet. Le front envoie le formulaire à notre API,
affiche l'évaluation en cours puis le statut accepté, refusé ou en attente.
Les critères sont provisoires et le chat ainsi que la suite du parcours de refus
ne sont pas encore disponibles.

Le navigateur conserve localement l'identifiant et le jeton du dernier projet
pour retrouver son statut après fermeture ou rechargement. Un nouvel envoi
remplace cet accès ; effacer les données du navigateur le supprime également.
Le jeton est accessible aux scripts de la page : ce mécanisme est provisoire et
nécessite un environnement sécurisé. Si une réponse réseau est perdue, l'envoi
peut avoir été enregistré et un nouvel essai peut créer un doublon.

Côté API, `POST /api/projects` enregistre le projet et le décide : un client déjà
passé chez Givaudan est accepté directement ; sinon le projet, sans nom, email ni
entreprise, est envoyé au service de scoring (`SCORING_BASE_URL`, `SCORING_API_KEY`, voir
`api/.env.example`), qui retourne un score de 0 à 100. À partir de 65, il est
accepté, sinon refusé ; si l'évaluation échoue, il reste `pending`. La réponse
contient un jeton d'accès secret, affiché une seule fois (seul son hash est stocké),
à envoyer en `Authorization: Bearer` sur `GET /api/projects/{id}` pour lire le
statut. Le contrat de scoring (`POST /score`, réponse `{ "score": n }`) est
provisoire. Après mise à jour, relancez
`npm run build` puis `npm run migrate -w api`.

L'évaluation est synchrone et attend au plus 120 secondes. En cas de délai
dépassé ou d'erreur, le projet reste en attente : aucun réessai automatique
n'est actuellement prévu. Les scores et critères sont provisoires et destinés
à la démonstration ; ils ne constituent pas une décision métier validée.

L'ancienne démo reste sur `/demo`. Les routes `/api/users` et `/api/session`
existent toujours côté API mais ne sont plus utilisées par le front.

Les cookies de session sont HttpOnly et SameSite=Strict, et Secure lorsque
`NODE_ENV=production` : dans ce cas, HTTPS est nécessaire. La limitation de
connexion est en mémoire par adresse IP (10 essais par 15 minutes et par
processus) ; elle doit être remplacée par une protection partagée adaptée au
déploiement et aux éventuels proxies avant une mise en production.

Pour vérifier l’API et la base, ouvrez [http://localhost:3000/api/health](http://localhost:3000/api/health) ; les questions enregistrées sont visibles sur [http://localhost:3000/api/questions](http://localhost:3000/api/questions).

## Intégration continue et tests

GitHub Actions construit l'API et le front, vérifie la configuration Compose et
exécute les tests d'intégration à chaque push et pull request. Les tests utilisent
PostgreSQL 17 et un service IA simulé : ils ne contactent pas le modèle réel.

Pour les lancer localement, démarrez PostgreSQL et renseignez `DATABASE_URL` dans
l'environnement du terminal, puis exécutez `npm run build` et `npm test`. Les
tests créent puis suppriment un schéma temporaire ; l'utilisateur PostgreSQL doit
avoir le droit de créer des schémas.

Ce workflow ne déploie pas l'application : une cible et des paramètres de
déploiement restent à définir.

## Décisions d'architecture

Les choix techniques et leurs compromis sont documentés dans les [ADR](docs/adr/README.md).
