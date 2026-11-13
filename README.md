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
Pour la démonstration du chat, démarrez le service IA avec
`COLLECTION_NAME=givbot-demo` et vérifiez que son endpoint `/health` indique
une collection non vide. La collection doit avoir été indexée au préalable.

Le parcours projet, sans compte, est sur `/` : après les informations générales
(dont « avez-vous déjà travaillé avec Givaudan ? »), GivBot pose successivement
des questions sur le type de produit, le budget par kg d'arôme, le volume annuel
d'arôme acheté, la zone de vente, l'avancement, la date de lancement et le
positionnement. Le budget et le volume peuvent rester non définis. Le brief
structuré est envoyé à notre API, qui affiche ensuite le statut accepté, refusé
ou en attente.
Les projets acceptés peuvent ouvrir le chat avec GivBot ; la suite du parcours
de refus reste à définir. Les critères sont provisoires.

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
provisoire. Le nom, l'email et l'entreprise ne sont pas transmis au scoring ;
les nouvelles réponses de brief le sont. À titre provisoire, un projet à moins
ou égal à 100 kg d'arôme/an positionné entrée de gamme, ou à partir de 5 000 kg/an
positionné premium, perd 10 points. Le budget €/kg est transmis comme contexte
et n'ajoute pas de points à lui seul. Ces seuils et pénalités sont à faire
valider par l'équipe métier. Après mise à jour, relancez
`npm run build` puis `npm run migrate -w api`.

L'évaluation est synchrone et attend au plus 120 secondes. En cas de délai
dépassé ou d'erreur, le projet reste en attente : aucun réessai automatique
n'est actuellement prévu. Les scores et critères sont provisoires et destinés
à la démonstration ; ils ne constituent pas une décision métier validée.
Le service IA local effectue jusqu'à trois tentatives d'extraction en demandant
au modèle de corriger ses réponses invalides ; il renvoie une erreur si aucune
réponse n'est vérifiable.

Pour une démonstration, il est possible de remplacer temporairement uniquement le
scoring par Claude : ajoutez `SCORING_PROVIDER=claude` et
`ANTHROPIC_API_KEY=...` dans `api/.env` (avec `ANTHROPIC_MODEL` facultatif).
La clé reste côté API, et le chat continue d'utiliser le service configuré par
`SCORING_BASE_URL`. Retirez `SCORING_PROVIDER` pour rétablir le service de
scoring habituel.

Pour une présentation uniquement, `DEMO_ACCEPT_PROJECTS=true npm run dev`
accepte les projets sans évaluation ni score. La réponse de création contient
`demoMode: true` et ces projets sont enregistrés sans score ni motif de décision.
Ne pas utiliser ce mode pour des projets réels ; redémarrer sans cette variable
pour rétablir l'évaluation normale.

Le chat utilise le même service IA (`POST /ask`), avec le jeton du projet et
uniquement si son statut est accepté. La description du projet et les messages
sont transmis au service IA : évitez d'y saisir des informations sensibles.
Les messages sont enregistrés dans PostgreSQL et l'historique du service IA est
lié au projet. La base documentaire de l'IA doit être chargée pour répondre.
Le contenu, les références et l'aperçu sensoriel sont fictifs ; la fiche et la
commande ne sont pas disponibles. Relancez la migration après mise à jour.
En cas d'erreur après l'envoi, actualisez la conversation avant de réessayer :
le service IA et PostgreSQL tiennent chacun un historique, qui peut diverger
si une réponse est perdue ou si l'enregistrement échoue.

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
