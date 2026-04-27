# Règles et Standards du Projet Nutrition App

Ce fichier `agent.md` sert de référence pour comprendre l'architecture, la logique métier et les conventions de code de l'application.

## 🏗 Architecture

### 1. Stack Technique
- **Frontend** : Vanilla HTML / CSS / JavaScript (pas de framework type React ou Vue).
- **Backend / Base de données** : PocketBase.
  - Environnement de Développement : `http://127.0.0.1:8090`
  - Environnement de Production : `https://nutridash-pb.fly.dev` (hébergé sur Fly.io).

### 2. Organisation des Fichiers
- `index.html` : Point d'entrée unique de l'application (Single Page Application simulée avec masquage/affichage de divs via des classes `.hidden`).
- `style.css` : Feuille de style unique.
- `app.js` : Cœur de la logique métier, gestion de l'état (UI, profils, repas, activités).
- `auth-pb.js` : Logique d'authentification et de synchronisation relationnelle avec PocketBase.
- `pb-config.js` : Fichier de configuration isolant les variables d'environnement (URLs PocketBase de dev et prod).

## 🧠 Logique Métier et Gestion de l'État

### State Management
L'état de l'application est géré de manière synchrone en mémoire via un objet global `state` et persisté localement via `localStorage` pour éviter la perte de données :
```javascript
let state = {
    profile: null,
    history: {},
    currentViewDate: "",
    customActivities: [],
    weighIns: [],
    goalHistory: []
};
```
- Chaque utilisateur possède une clé `localStorage` unique (`nutridash_state_${userId}`) pour isoler les sessions.
- **Synchronisation PocketBase** : La fonction `saveState()` déclenche également `syncToCloud()` (définie dans `auth-pb.js`) pour mettre à jour la base de données de manière asynchrone.

### Formules et Calculs
- **BMR (Metabolisme de base)** : Calculé via la formule de Mifflin-St Jeor.
- **TDEE (Dépense énergétique quotidienne totale)** : BMR * 1.2 (Sédentaire par défaut).
- **Objectifs** : Prise de masse (TDEE * 1.1), Perte de poids (TDEE * 0.9), Maintien (TDEE * 1.0).

## 🧪 Frameworks de Tests

- **Environnement de développement :** Le projet de production reste en Vanilla JS sans bundler. Cependant, un environnement Node.js local (via `package.json`) est mis en place **exclusivement** pour l'exécution des tests.
- **Framework de tests unitaires :** Le projet utilise **Vitest**. Les fichiers de tests doivent être nommés avec l'extension `.test.js` et placés à côté des fichiers qu'ils testent, ou dans un dossier `__tests__`.
- **Testabilité et Architecture :** La logique métier pure (calculs, formatage de données, appels Appwrite) doit impérativement être découplée de la manipulation du DOM. Les fonctions purement algorithmiques (ex: `round015Up`, `formatFrenchFloat`, `getCalculations`) doivent être exportables et testables isolément.
- **Règle d'or de développement :** Toute nouvelle logique métier générée par l'agent doit être livrée avec son fichier de test unitaire associé. Les modifications de code existant doivent vérifier que les tests existants passent toujours.

## 📐 Conventions et Standards de Code

### JavaScript Vanilla
- **Portée globale** : L'architecture actuelle attache de nombreuses fonctions à l'objet `window` (ex: `window.navigateTo`, `window.deleteEntry`) car elles sont appelées directement via des attributs `onclick` dans le HTML.
- **Variables et Fonctions** : Utiliser `camelCase` pour les variables et les fonctions.
- **Manipulation du DOM** : Utilisation de `document.getElementById` et `document.querySelectorAll`. Les changements de vue se font en ajoutant/retirant la classe `.hidden`.

### Interactions avec PocketBase
- Toujours vérifier si `currentUser` existe avant de tenter une opération réseau.
- Privilégier les fonctions enveloppes (ex: `pb_saveMeal`, `pb_saveActivity`) situées dans `auth-pb.js` pour centraliser les appels API au backend.
- Les identifiants PocketBase (ID string) sont utilisés pour distinguer les entrées synchronisées de celles créées localement et non encore sauvegardées (ID générés localement type timestamp numérique).

### Dates
- Le projet manipule beaucoup de dates. Toujours formater pour PocketBase au format `YYYY-MM-DD HH:MM:SS` (via la fonction utilitaire `toPBDate`).
- Les comparaisons locales se font généralement sur des chaînes de caractères au format ISO tronqué : `YYYY-MM-DD`.

### Déploiement
- Le backend PocketBase se déploie via `fly deploy` (configuration `fly.toml` à la racine).

## 3. Catalogue de Compétences (Skills)
Pour exécuter des tâches complexes, tu as accès à une bibliothèque de compétences locales.
**Chemin absolu de la bibliothèque :** `/Users/JeremyBaudouin/Library/Application Support/Antigravity/skills`

**Règle de routage :**
- Avant de tenter d'écrire un script complexe de zéro (par exemple pour une analyse de données, un déploiement ou un test de charge), tu **dois obligatoirement** lister le contenu de ce dossier.
- Si le nom d'un sous-dossier ou d'un fichier `SKILL.md` correspond à l'intention de la tâche demandée, tu dois charger et suivre les instructions de cette compétence spécifique avant de poursuivre.

# Skill : Analyse et Nettoyage de Base de Données
**Trigger :** Utilise cette compétence si l'utilisateur demande d'auditer des données, de nettoyer des doublons, ou si tu rencontres une erreur de migration SQL dans le projet.

**Auto-amélioration et Création de Compétences :**
Si tu dois accomplir une tâche complexe et récurrente, mais qu'aucune compétence existante dans le répertoire source ne correspond à ce besoin, tu as l'autorisation de créer une nouvelle compétence :
1. **Fait appel au Skill Smith :** Utilise en priorité la compétence `10-andruia-skill-smith` si elle est disponible pour t'aider à structurer le nouvel outil.
2. **Création du dossier :** Crée un nouveau dossier avec un nom clair (sans espaces, séparé par des tirets) dans `/Users/JeremyBaudouin/Library/Application Support/Antigravity/skills/`.
3. **Rédaction du contrat :** Rédige obligatoirement un fichier `SKILL.md` à la racine de ce nouveau dossier. Il doit contenir un titre, un "Trigger" très explicite, et les instructions de fonctionnement.
4. **Développement :** Crée les scripts utilitaires (Python, JS, Node, etc.) nécessaires à l'intérieur de ce même dossier.
5. **Exécution :** Une fois la compétence créée, charge-la et utilise-la pour terminer la tâche initiale sur.
