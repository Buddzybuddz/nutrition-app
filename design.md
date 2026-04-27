# Identité Visuelle et Design System (NutriDash)

Ce fichier documente les choix de design, la palette de couleurs et le comportement des composants front-end afin de garantir une cohérence visuelle tout au long du développement.

## 🎨 Philosophie et Framework

- **Framework CSS** : Aucun framework externe (Vanilla CSS). Le style est entièrement géré en interne via `style.css`.
- **Style Visuel** : **Néo-brutalisme / Playful**. L'interface se caractérise par des bordures épaisses, des ombres portées nettes (sans flou), des angles arrondis et des couleurs pastel/vives contrastantes.

## 🖌 Palette de Couleurs (Variables CSS)

Les couleurs sont définies à la racine (`:root`) sous forme de variables CSS.

### Couleurs de Structure
- **Fond principal (`--bg-main`)** : `#fdfbf6` (Crème clair) avec un motif de grille en pointillé.
- **Fond de carte (`--bg-card`)** : `#ffffff` (Blanc pur).
- **Bordures et Ombres (`--border-color`)** : `#1e1e19` (Presque noir).

### Couleurs d'Accentuation
- **Primaire (`--accent-primary`)** : `#ff6b6b` (Corail / Rouge clair)
- **Secondaire (`--accent-secondary`)** : `#4dabf7` (Bleu clair)
- **Avertissement / Mise en avant (`--accent-warning`)** : `#fcc419` (Jaune)
- **Succès (`--accent-success`)** : `#51cf66` (Vert)
- **Danger (`--accent-danger`)** : `#fa5252` (Rouge vif)
- **Violet (`--accent-purple`)** : `#cc5de8` (Violet)

### Typographie et Textes
- **Texte principal (`--text-main`)** : `#1e1e19`
- **Texte secondaire/atténué (`--text-muted`)** : `#5e5e54`
- **Police des Titres (`--font-heading`)** : `'Fredoka', sans-serif` (Ronde et amicale).
- **Police du Corps (`--font-main`)** : `'Nunito', sans-serif` (Lisible et douce).

## 🧩 Comportement des Composants

L'interactivité de l'application repose sur le "feedback visuel" physique, typique du néo-brutalisme.

### 1. Boutons (`.btn`)
- **État par défaut** : Fond coloré ou blanc, bordure épaisse (`3px solid #1e1e19`), ombre portée dure (`4px 4px 0px #1e1e19`).
- **Survol (`:hover`)** : Élévation du bouton (translation vers le haut/gauche) et agrandissement de l'ombre (`6px 6px 0px`).
- **Clic (`:active`)** : Enfoncement du bouton (translation vers le bas/droite) et disparition de l'ombre (`0px 0px 0px`) pour simuler un bouton physique qu'on presse.

### 2. Cartes (`.card`)
- **Apparence** : Fond blanc, bords arrondis (`--radius-lg: 24px`), bordure épaisse et ombre dure.
- **Interaction** : Léger soulèvement au survol avec agrandissement de l'ombre portée pour inciter au clic ou mettre en valeur l'élément survolé.

### 3. Vues et Transitions
- **Animation d'apparition (`bounceIn`)** : Lorsqu'une vue est affichée (en retirant la classe `.hidden`), elle apparaît avec un léger effet de rebond (scale de 0.9 à 1) géré par la courbe de bézier `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- **Inputs et Formulaires** : Les champs de saisie ont une ombre interne (`inset`) et affichent un anneau de focus coloré (généralement bleu `--accent-secondary`) lorsqu'ils sont actifs.

### 4. Indicateurs Circulaires (Progress Circles)
- Utilisés pour les jauges de calories et de protéines.
- Reposent sur la propriété CSS `conic-gradient` pour créer un remplissage circulaire dynamique et coloré (vert pour le succès, rouge en cas de dépassement).

## 5. Catalogue de Compétences (Skills)
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
5. **Exécution :** Une fois la compétence créée, charge-la et utilise-la pour terminer la tâche initiale.