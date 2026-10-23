# NutriDash — Design System & Wireframes V1
> Document produit le 24 juin 2026 — Agent Designer

---

## Préambule

Ce document remplit deux fonctions :

1. **Formalisation du design system existant** : l'app étant déjà implémentée en HTML/CSS/JS Vanilla, les tokens CSS réels sont extraits de `style.css` et normalisés ici comme source de vérité unique.
2. **Wireframes des fonctionnalités manquantes** : les 4 fonctionnalités "Nice to Have" identifiées dans le CDC (graphique poids, suppression compte, export données, consentement RGPD) sont spécifiées avec le même niveau de précision que les écrans existants.

---

# PARTIE 1 — DESIGN SYSTEM

---

## DS-01 — Palette de couleurs

### Couleurs de base (extraites de style.css)

| Token | Valeur hex | Usage |
|---|---|---|
| `--bg-main` | `#fdfbf6` | Fond global de l'application (crème chaud) |
| `--bg-card` | `#ffffff` | Fond des cartes et composants élevés |
| `--border-color` | `#1e1e19` | Bordures, ombres, texte principal |
| `--text-main` | `#1e1e19` | Texte principal — contraste maximal |
| `--text-muted` | `#5e5e54` | Texte secondaire, labels, placeholders |

### Couleurs d'accent

| Token | Valeur hex | Usage sémantique |
|---|---|---|
| `--accent-primary` | `#ff6b6b` | Accent chaud (logo, close-btn, hover primary) |
| `--accent-secondary` | `#4dabf7` | Accent froid (nav active, liens, badges) |
| `--accent-warning` | `#fcc419` | CTA primaires (boutons jaune, sidebar #fff3bf) |
| `--accent-success` | `#51cf66` | Etats succès, boutons secondaires, confirmation |
| `--accent-danger` | `#fa5252` | Etats d'erreur, suppression, déconnexion |
| `--accent-purple` | `#cc5de8` | IA, section "Le saviez-vous", éléments distinctifs |

### Couleurs de surface contextuelles

| Usage | Valeur |
|---|---|
| Sidebar | `#fff3bf` (jaune pâle) |
| Progress card calories | `#e7f5ff` (bleu pâle) |
| Progress card protéines | `#ffe3e3` (rose pâle) |
| Actions card | `#d3f9d8` (vert pâle) |
| Stats BMR/TDEE | `#fff0f6` (rose clair) |
| Bilan suivi | `#fff9db` (jaune clair) |
| Weigh-in card | `#e3f2fd` (bleu très pâle) |
| Fond motif dot | Dots `#1e1e19` 2px sur `#fdfbf6`, grille 30px |

### Ratios de contraste (WCAG AA)

- `#1e1e19` sur `#fdfbf6` : ratio ~16:1 — WCAG AAA
- `#1e1e19` sur `#fff3bf` : ratio ~12:1 — WCAG AAA
- `#ffffff` sur `#4dabf7` (nav active) : ratio ~3.2:1 — acceptable pour texte large (18px+)
- `#fa5252` sur `#ffffff` : ratio ~4.5:1 — WCAG AA

---

## DS-02 — Typographie

### Paire typographique retenue

| Rôle | Police | Graisse | Usage |
|---|---|---|---|
| `--font-heading` | **Fredoka** | 500 / 600 / 700 | Titres h1–h4, logo, nav-btn, boutons, valeurs numériques |
| `--font-main` | **Nunito** | 600 / 700 / 800 | Corps de texte, labels, paragraphes, inputs |
| Données techniques | `monospace` système | normal | Aucun usage actuel — réservé pour export code |

Chargement : `https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800`

### Echelle typographique

| Classe / usage | Taille | Police | Poids |
|---|---|---|---|
| Logo | `2.5rem` | Fredoka | 700 |
| h2 principal | `2.2rem` (desktop) / `1.7–1.8rem` (mobile) | Fredoka | 700 |
| h3 carte | `1.4rem` | Fredoka | 700 |
| Valeur cercle | `2.8rem` (desktop) / `2.2rem` (mobile) | Fredoka | 700 |
| Valeur macro | `4rem` | Fredoka | 700 |
| Nav button | `1.1rem` | Fredoka | 700 |
| Label formulaire | `1.05rem` | Nunito | 800 |
| Corps texte | `1rem` | Nunito | 600–700 |
| Texte secondaire | `0.85–0.9rem` | Nunito | 700–800 |
| Texte minimum | `0.8rem` | Nunito | 700 |

Taille minimale absolue : **14px (0.875rem)** — conforme CDC 7.4.

---

## DS-03 — Espacements et grille

Grille de base : **8px**

| Token | Valeur | Usage |
|---|---|---|
| `space-xs` | 4px | Petits écarts internes |
| `space-sm` | 8px | Gaps dans les listes |
| `space-md` | 12–16px | Padding interne cards (mobile) |
| `space-lg` | 24px | Padding cards (desktop : 1.5rem) |
| `space-xl` | 32px | Padding main-content (mobile : 1.25rem) |
| `space-2xl` | 48px | Sections landing (3–4rem) |
| `space-3xl` | 80px | Sections landing desktop (5rem) |

**Sidebar desktop** : 260px fixe
**Main content padding** : `2rem 3rem` (desktop) / `1.25rem` (mobile)
**Modal max-width** : 450px (simple) / 850px (IA large)
**Card padding** : `1.5rem` (desktop) / `1.2rem` (mobile)

---

## DS-04 — Bordures, ombres et rayons

### Rayons

| Token | Valeur | Usage |
|---|---|---|
| `--radius-lg` | `24px` | Cards principales, modales, pricing card |
| `--radius-md` | `16px` | Cards secondaires, bilan stat cards |
| `--radius-sm` | `12px` | Inputs, selects, boutons, tags |
| `--radius-full` | `50%` | Cercles de progression, close-btn, action icons |

### Bordures

| Token | Valeur | Usage |
|---|---|---|
| `--border-thick` | `3px solid #1e1e19` | Toutes les bordures principales |
| Bordure dashed | `3px dashed #1e1e19` | Séparateurs h3, états vides |
| Bordure dashed fin | `2px dashed #1e1e19` | Séparateurs internes cartes |

### Ombres (neo-brutalist hard shadow)

| Token | Valeur | Etat |
|---|---|---|
| `--shadow-hard` | `4px 4px 0px #1e1e19` | État normal |
| `--shadow-hard-hover` | `6px 6px 0px #1e1e19` | État hover |
| `--shadow-hard-active` | `0px 0px 0px #1e1e19` | État pressed (enfoncé) |
| Modale | `12px 12px 0px #1e1e19` | Modale elevated |
| Card pricing | `12px 12px 0px #1e1e19` | Landing card premium |

### Transitions

`all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)` — ressort élastique, signature visuelle NutriDash

---

## DS-05 — Composants UI — Inventaire

| Composant | ID | Écrans | Variants |
|---|---|---|---|
| Button | C-01 | Tous | Primary (jaune) / Secondary (vert) / Danger (rouge) / Ghost (transparent) / Disabled |
| Input | C-02 | Auth, Profil, Modales | Default / Focus (bleu ring) / Error (rouge) |
| Select | C-03 | Profil, Modales, Suivi | Identique Input |
| Card | C-04 | Tous | Default / Hover (-2px translateY) / Colored surface |
| Modal overlay | C-05 | Dashboard, Profil | Simple (450px) / Large IA (850px) |
| Nav button | C-06 | Sidebar | Default / Active (bleu) / Hover (bleu pâle) |
| Progress circle | C-07 | Dashboard | Normal / Danger (rouge > objectif) |
| History item | C-08 | Dashboard | Repas / Activité / Edit hover / Delete hover |
| Badge / Pill | C-09 | Suivi, IA | Status badge pulsant / Macro pill cals / Macro pill prot |
| Empty state | C-10 | Dashboard, Suivi | Dashed border, texte centré |
| Error banner | C-11 | Auth | Fond #ffe0e0, bordure rouge |
| Details expandable | C-12 | Conseils | Closed / Open (bg #fff9db, scale 1.02) |
| Progress bar | C-13 | Dashboard | Fill gradient bleu→rouge, transition élastique |
| Bilan stat card | C-14 | Suivi | Calories (top bar jaune) / Protéines (top bar bleu) |

---

## DS-06 — Style UI

**Style retenu : Neo-Brutalist**

Signatures visuelles :
- Bordures noires épaisses 3px sur tous les composants sans exception
- Ombres portées décalées (hard shadow) — pas de box-shadow floue
- Fond crème #fdfbf6 avec pattern de points (#1e1e19, 2px, grille 30px)
- Sidebar jaune #fff3bf — seule zone de couleur de structure
- Transitions élastiques `cubic-bezier(0.34, 1.56, 0.64, 1)` sur hover
- Effet "press" (translate +4px,+4px + ombre 0) sur :active
- Rotation légère sur les images hero (+2deg / -2deg)
- Text-shadow blanc 2px sur les titres h2 pour lisibilité sur motif

Ce que le style évite : gradients doux, ombres floues, bordures arrondies généreuses, palettes pastel wellness, icônes trop colorées.

---

# PARTIE 2 — CARTE DES ÉCRANS

---

## Phase 1.1 — Arborescence

```
NutriDash (SPA)
├── Landing Page (#landing-page)
│   ├── Header (logo + bouton Connexion)
│   ├── Hero (titre + CTA + image)
│   ├── Features (3 cartes)
│   ├── Process (3 étapes)
│   ├── Pricing (carte tarifaire)
│   ├── Goals (texte + image)
│   └── Footer (logo + baseline)
│
├── Auth Screen (#auth-screen) [NOUVEAU: + bloc RGPD]
│   ├── Formulaire Connexion
│   ├── Formulaire Inscription [NOUVEAU: checkbox RGPD]
│   └── Formulaire Reset mot de passe
│
└── App (#app) — Layout sidebar + main
    ├── Dashboard (#dashboard-view)
    │   ├── Header date + navigation ← →
    │   ├── Barre progression journalière
    │   ├── Carte pesée (jour configuré)
    │   ├── Carte Calories restantes (cercle)
    │   ├── Carte Protéines restantes (cercle)
    │   ├── Carte Actions (+ Repas / + Activité)
    │   └── Journal du jour (liste)
    │
    ├── Profil (#profile-view) [NOUVEAU: + bouton supprimer compte]
    │   ├── Header email + déconnexion
    │   ├── Formulaire profil
    │   ├── Stats BMR/TDEE
    │   └── [NOUVEAU] Zone données personnelles (export + suppression)
    │
    ├── Suivi (#history-view) [NOUVEAU: + graphique poids]
    │   ├── Filtre période
    │   ├── Carte Calories
    │   ├── Carte Protéines
    │   ├── Carte Poids [NOUVEAU: + graphique Chart.js]
    │   └── Carte Objectifs
    │
    └── Conseils (#advice-view)
        └── 8 sections expandables (statique)

Modales transversales
├── Modal Repas (ajout/édition) [existant]
├── Modal Activité (ajout/édition) [existant]
├── Modal Gestion activités custom [existant]
├── Modal Objectif atteint [existant]
└── [NOUVEAU] Modal Confirmation suppression compte (E-08)
```

---

## Phase 1.2 — Tableau de priorisation

| # | Écran / Composant | Priorité | Persona | User Story | Phase CDC |
|---|---|---|---|---|---|
| E-01 | Landing Page | MVP | Tous | US-001 | Phase 0 — Existant |
| E-02 | Auth — Connexion | MVP | Tous | US-002 | Phase 0 — Existant |
| E-03 | Auth — Inscription + RGPD | MVP+RGPD | Tous | US-002 | Phase 2 — A implémenter |
| E-04 | Auth — Reset mot de passe | Should Have | Tous | — | Phase 0 — Existant |
| E-05 | Profil physiologique + zone données | MVP+RGPD | Julien, Sophie | US-003 | Phase 0+2 — Partiel |
| E-06 | Dashboard | MVP | Julien, Sophie, Maxime | US-004 à 007 | Phase 0 — Existant |
| E-07 | Suivi + graphique poids | MVP+V1+ | Maxime, Julien | US-008 | Phase 0+4 — Partiel |
| E-08 | Modal Suppression compte | RGPD | Tous | — | Phase 2 — A implémenter |
| E-09 | Export données (JSON/CSV) | RGPD | Tous | — | Phase 2 — A implémenter |
| E-10 | Conseils | Should Have | Sophie | — | Phase 0 — Existant |

---

# PARTIE 3 — WIREFRAMES DÉTAILLÉS

> Seuls les écrans nouveaux ou les modifications de l'existant sont spécifiés en détail. Les écrans existants sont décrits brièvement pour référence.

---

## E-01 — Landing Page (Existant — référence)

**URL** : `/` (hash `#landing-page`)
**Statut** : Implémentée. Aucune modification requise en Phase 2.
**Structure actuelle** : Header sticky / Hero 2 colonnes / Features 3 colonnes / Process 3 étapes / Pricing card centré / Goals 2 colonnes inversées / Footer centré.

**Point d'attention futur** : Ajouter un lien "CGU" et "Politique de confidentialité" dans le footer avant lancement public (Phase 3).

---

## E-02 — Auth — Connexion (Existant — référence)

**URL** : hash `#auth-screen` avec `#login-form` visible
**Statut** : Implémentée. Aucune modification requise.
**Layout** : Carte centré 420px max, fond motif dots, logo NutriDash, formulaire email + mdp, lien "Mot de passe oublié", lien "S'inscrire".

---

## E-03 — Auth — Inscription + Consentement RGPD

**URL** : hash `#auth-screen` avec `#signup-form` visible
**Accès depuis** : Landing page (CTA "Démarrer gratuitement") / Lien "S'inscrire" dans formulaire connexion
**Mène vers** : Dashboard → Profil (premier accès) ou Dashboard (reconnexion)
**Persona(s)** : Tous (premier contact avec l'app)
**User Story** : En tant que nouvel utilisateur, je veux créer mon compte et consentir aux CGU en moins de 2 minutes.
**Objectif principal** : Créer un compte sécurisé avec recueil du consentement RGPD explicite.

### Layout général

```
┌────────────────────────────────────┐
│  ← Accueil                         │
│                                    │
│         NutriDash                  │
│                                    │
│    ┌──────────────────────────┐    │
│    │  Créer un compte          │    │
│    │                          │    │
│    │  Email                   │    │
│    │  [input email          ] │    │
│    │                          │    │
│    │  Mot de passe            │    │
│    │  [input password       ] │    │
│    │                          │    │
│    │  Confirmer mot de passe  │    │
│    │  [input password       ] │    │
│    │                          │    │
│    │  ┌────────────────────┐  │    │
│    │  │ ☐  J'accepte les   │  │    │
│    │  │    CGU et la PP    │  │    │
│    │  └────────────────────┘  │    │
│    │                          │    │
│    │  [Créer mon compte     ] │    │  ← CTA btn-primary DISABLED si checkbox non cochée
│    │                          │    │
│    │  Déjà un compte ?        │    │
│    │  → Se connecter          │    │
│    └──────────────────────────┘    │
└────────────────────────────────────┘
```

**Responsive** : Mobile-first. Carte 100% largeur sur < 420px, padding 1rem.
**Breakpoints** : Mobile (< 480px) / Desktop (> 480px, max-width 420px)

### Composants

**C-02a — Champ Email**
- Type : Input `type="email"` required
- Placeholder : `votre@email.com`
- Focus : border `--accent-secondary` + ring bleu `0 0 0 4px #e7f5ff`
- Erreur : border `--accent-danger` + message inline sous le champ
- Micro-copy erreur : "Adresse email invalide" / "Cet email est déjà utilisé"

**C-02b — Champ Mot de passe**
- Type : Input `type="password"` required minlength="8"
- Placeholder : `Min. 8 caractères`
- Erreur force : aucune indication de force demandée (MVP — juste longueur min)

**C-02c — Champ Confirmation mot de passe**
- Type : Input `type="password"` required
- Validation JS : compare avec champ mdp à la soumission
- Micro-copy erreur : "Les mots de passe ne correspondent pas"

**C-NEW-01 — Bloc Consentement RGPD**
- Type : Zone cliquable (label englobant checkbox + texte)
- Structure :
  ```
  ┌─────────────────────────────────────────────┐
  │  ☐  J'ai lu et j'accepte les               │
  │     Conditions Générales d'Utilisation      │
  │     et la Politique de confidentialité.     │
  │     (Obligatoire)                           │
  └─────────────────────────────────────────────┘
  ```
- Bordure : `2px solid --border-color`
- Fond : `#f8f9fa`
- Border-radius : `--radius-sm`
- Padding : `0.75rem 1rem`
- "CGU" et "Politique de confidentialité" : liens `<a>` ouvrant dans un nouvel onglet (`target="_blank"`)
- Couleur des liens : `--accent-secondary`
- Label "(Obligatoire)" : texte `--accent-danger`, font-size 0.85rem
- Comportement :
  - Checkbox non cochée → bouton "Créer mon compte" reste `disabled` (opacity 0.5, cursor not-allowed)
  - Checkbox cochée → bouton s'active (couleur normale + shadow)
  - La zone entière (label) est cliquable, pas seulement la checkbox (zone tactile ≥ 44px)

**États du CTA "Créer mon compte"**
- Désactivé (checkbox non cochée) : `background: #f1f3f5`, `color: --text-muted`, `opacity: 0.6`, `cursor: not-allowed`, shadow supprimée
- Actif (checkbox cochée) : `btn-primary` standard (fond jaune, shadow 4px)
- Loading (soumission en cours) : spinner blanc dans le bouton, label "Création en cours…", bouton désactivé pendant l'appel API

### Interactions et transitions

| Déclencheur | Action | Destination |
|---|---|---|
| Coche checkbox | Active le bouton CTA | Même vue — bouton devient cliquable |
| Clic "CGU" | Navigation | Nouvelle tab → page `/cgu.html` (à créer) |
| Clic "Politique de confidentialité" | Navigation | Nouvelle tab → page `/confidentialite.html` (à créer) |
| Soumission formulaire (valide) | API PocketBase `users.create()` | Connexion auto → redirect Profil |
| Soumission formulaire (erreur API) | Affiche `#auth-error` banner | Même vue, focus sur le banner |
| Clic "← Accueil" | Navigation | Landing page |
| Clic "Se connecter" | Toggle formulaire | Masque `#signup-form`, affiche `#login-form` |

### Cas limites

- **Email déjà utilisé** : Message banner rouge "Un compte existe déjà avec cet email. Connectez-vous."
- **Mots de passe non identiques** : Message inline sous le champ confirm "Les mots de passe ne correspondent pas"
- **Erreur réseau** : Message banner "Impossible de créer le compte. Vérifiez votre connexion."
- **CGU non consultées** : Aucune obligation de lecture — la checkbox suffit juridiquement comme preuve de consentement actif (opt-in explicite conforme RGPD)

### Critères d'acceptation UI

- [ ] Le bouton "Créer mon compte" est visuellement désactivé tant que la checkbox n'est pas cochée
- [ ] Un clic sur la zone entière du bloc RGPD (pas seulement la checkbox) toggle le consentement
- [ ] Les liens CGU et PP s'ouvrent dans un nouvel onglet
- [ ] Un message d'erreur clair et visible (banner rouge) s'affiche en cas d'échec API
- [ ] L'état "loading" du bouton est visible pendant l'appel API (spinner ou label "Création en cours…")
- [ ] Sur mobile (375px), la zone checkbox est suffisamment grande pour être activée sans zoom

---

## E-05 — Profil + Zone données personnelles

**URL** : hash `#profile-view`
**Accès depuis** : Sidebar (bouton "Profil")
**Mène vers** : Dashboard (après sauvegarde) / Modal suppression compte (E-08) / Téléchargement fichier (E-09)
**Persona(s)** : Tous
**Objectif principal** : Modifier son profil physiologique ET gérer ses données personnelles (export + suppression).

### Layout général (delta vs existant)

L'écran existant comprend : header email/déconnexion + formulaire + stats BMR/TDEE.

**AJOUT EN BAS DE PAGE** : une nouvelle section "Mes données personnelles" après la carte stats BMR/TDEE.

```
┌────────────────────────────────────────────────┐
│  Votre Profil                                  │
├────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐ │
│ │ julien@example.com         [Déconnexion]   │ │  ← Existant
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │  Formulaire profil (existant)              │ │
│ │  Date naissance / Sexe / Poids / Taille    │ │
│ │  Objectif / Jour pesée                     │ │
│ │  [Enregistrer le profil]                   │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │  Statistiques BMR/TDEE (existant)          │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ NOUVEAU ─────────────────────────────────┐  │
│ │  Mes données personnelles                  │  │
│ │                                            │  │
│ │  "Conformément au RGPD, vous avez le droit │  │
│ │   d'accéder, exporter et supprimer         │  │
│ │   vos données."                            │  │
│ │                                            │  │
│ │  [Exporter mes données (JSON)]             │  │  ← btn Ghost/Secondary
│ │  [Exporter mes données (CSV)]              │  │  ← btn Ghost/Secondary
│ │                                            │  │
│ │  ──────────────────────────────────────    │  │
│ │                                            │  │
│ │  Zone danger                               │  │
│ │  "La suppression est définitive et         │  │
│ │   irréversible."                           │  │
│ │  [Supprimer mon compte]                    │  │  ← btn Danger
│ └───────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

**Responsive** : Mobile-first. Zone données en colonne unique sur mobile.

### Composants NOUVEAUX

**C-NEW-02 — Section "Mes données personnelles"**
- Type : Card (`.card`) avec bordure dashed rouge en bas (zone danger)
- Titre : "Mes données personnelles" en Fredoka 1.3rem, border-bottom 3px dashed
- Intro RGPD : texte Nunito 0.9rem, couleur `--text-muted`, italique, max-width 500px
- Contenu : 2 boutons export (côte à côte desktop, colonne mobile) + séparateur + zone danger

**C-NEW-03 — Boutons Export**
- Type : Deux boutons Ghost (fond transparent, bordure `--border-color`, shadow hard)
- Icônes : SVG Lucide `download` (16px, inline)
- Labels : "Exporter en JSON" / "Exporter en CSV"
- Largeur : `auto`, min 180px
- Disposition : `display: flex; gap: 0.75rem; flex-wrap: wrap`
- État loading : spinner sur le bouton cliqué, label "Génération…"
- État succès : label temporaire "Téléchargement lancé !" 2 secondes (vert), puis retour au label initial

**C-NEW-04 — Séparateur Zone Danger**
- `border-top: 2px dashed --accent-danger`
- `margin: 1.5rem 0`
- Label au-dessus : "Zone critique" en `--accent-danger`, font-size 0.75rem, uppercase, letter-spacing 0.1em

**C-NEW-05 — Bouton "Supprimer mon compte"**
- Type : Button Danger
- Style : `background: --accent-danger`, `color: #ffffff`, border `--accent-danger`, shadow `4px 4px 0 rgba(250,82,82,0.4)`
- Label : "Supprimer mon compte"
- Icône : SVG Lucide `trash-2` (16px, inline, à gauche du label)
- Largeur : `width: auto`, padding `0.8rem 1.5rem`
- Hover : `background: #ff8787`, shadow renforcée
- Clic → ouvre Modal E-08 (confirmation)

### Interactions et transitions

| Déclencheur | Action | Destination |
|---|---|---|
| Clic "Exporter en JSON" | Génère blob JSON + déclenche download | Même vue — fichier `nutridash-export-YYYY-MM-DD.json` |
| Clic "Exporter en CSV" | Génère blob CSV + déclenche download | Même vue — fichier `nutridash-export-YYYY-MM-DD.csv` |
| Clic "Supprimer mon compte" | Ouvre modale de confirmation | Modal E-08 en overlay |

### Critères d'acceptation UI

- [ ] Les boutons export sont clairement distincts du bouton suppression (couleur + séparateur)
- [ ] La zone danger est visuellement signalée (trait rouge, label "Zone critique")
- [ ] Un état de chargement est visible pendant la génération du fichier d'export
- [ ] Le fichier téléchargé a un nom formaté `nutridash-export-YYYY-MM-DD.{json|csv}`
- [ ] Sur mobile (375px), les 3 boutons s'empilent verticalement sans débordement

---

## E-06 — Dashboard (Existant — référence)

**URL** : hash `#dashboard-view`
**Statut** : Implémenté. Aucune modification en Phase 2.
**Layout** : Sidebar gauche 260px + main-content. Grid dashboard avec progression bar (full), weigh-in card (full), cercle calories, cercle protéines, actions card, journal (full).
**Mobile** : Sidebar → barre haute sticky. Grid → colonne unique. Ordre CSS `order:` pour prioriser les actions.

---

## E-07 — Suivi + Graphique évolution du poids

**URL** : hash `#history-view`
**Accès depuis** : Sidebar (bouton "Suivi")
**Mène vers** : Aucune navigation sortante (consultation uniquement)
**Persona(s)** : Julien, Maxime, Sophie
**User Story** : En tant qu'utilisateur, je veux voir l'évolution de mon poids sur une courbe temporelle afin de visualiser ma progression vers mon objectif.
**Objectif principal** : Afficher le graphique linéaire des pesées sur la période sélectionnée, avec la ligne d'objectif cible si défini.

### Layout général (delta vs existant)

La carte "Poids" existante affiche uniquement les valeurs textuelles début/fin/bilan. Elle est **enrichie** d'un graphique Chart.js sous le contenu textuel existant.

```
┌────────────────────────────────────────────────────┐
│  Suivi                                             │
├────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ Période : [select filtre 7j/30j/90j/180j/365j] │ │  ← Existant
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ┌────────────────┐  ┌───────────────────────────┐  │
│ │ Carte Calories │  │ Carte Protéines            │  │  ← Existant
│ │ (existant)     │  │ (existant)                 │  │
│ └────────────────┘  └───────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────── NOUVEAU ───┐ │
│ │ ⚖️ Poids                                       │ │
│ │                                                │ │
│ │  Début 15/06       →        Fin 24/06          │ │  ← Valeurs texte (existant)
│ │  75.2 kg                    73.8 kg            │ │
│ │  ┌────────────────────────┐                    │ │
│ │  │       Bilan : -1.4 kg  │                    │ │
│ │  └────────────────────────┘                    │ │
│ │  ─────────────────────────────────────────     │ │  ← Séparateur dashed
│ │                                                │ │
│ │  Évolution du poids                            │ │  ← Titre sous-section
│ │                                                │ │
│ │  ┌──────────────────────────────────────────┐  │ │
│ │  │                                          │  │ │
│ │  │    Chart.js — LineChart                  │  │ │
│ │  │    Hauteur : 250px (desktop)             │  │ │
│ │  │    Hauteur : 200px (mobile)              │  │ │
│ │  │                                          │  │ │
│ │  └──────────────────────────────────────────┘  │ │
│ │                                                │ │
│ │  ○ Pesée  ─── Objectif (si défini)             │ │  ← Légende
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ┌────────────────┐  ┌───────────────────────────┐  │
│ │ Carte Objectifs│  │ (vide si 4 cartes)         │  │  ← Existant
│ └────────────────┘  └───────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Responsive** : Mobile → carte Poids full width, graphique 200px, 1 colonne. Desktop → grille 2 colonnes, carte Poids peut être full width (`grid-column: 1 / -1`).

### Composants NOUVEAUX

**C-NEW-06 — Graphique linéaire poids (Chart.js)**
- Type : `Line` chart Chart.js (déjà chargé via CDN dans `index.html`)
- ID canvas : `#weight-chart`
- Conteneur : `<div style="position: relative; height: 250px;">` puis `<canvas id="weight-chart">`
- Position dans la carte : après le bloc texte début/fin/bilan, après séparateur dashed

**Données du dataset principal (pesées)**
- Dataset : tableau d'objets `{x: date_ISO, y: poids_kg}` depuis la collection `weigh_ins`
- Label : "Mon poids (kg)"
- Couleur ligne : `--accent-secondary` (#4dabf7)
- Épaisseur ligne : 2.5px
- Points : `pointRadius: 5`, `pointBackgroundColor: #ffffff`, `pointBorderColor: #4dabf7`, `pointBorderWidth: 2`
- Remplissage : `fill: true`, `backgroundColor: rgba(77, 171, 247, 0.08)` — zone sous la courbe très légère

**Dataset secondaire (ligne objectif)**
- Condition : visible uniquement si `profile.goal === "loss"` ET `profile.targetWeight` défini
- Dataset : ligne horizontale (ou oblique vers la date estimée) à `y = targetWeight`
- Label : "Objectif"
- Couleur : `--accent-success` (#51cf66)
- Ligne : `borderDash: [6, 3]` (pointillée)
- Points : `pointRadius: 0` (invisible)

**Options Chart.js**
```
{
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        font: { family: 'Nunito', size: 12, weight: '700' },
        color: '#5e5e54',
        boxWidth: 16,
        padding: 16
      }
    },
    tooltip: {
      backgroundColor: '#1e1e19',
      titleFont: { family: 'Fredoka', size: 13 },
      bodyFont: { family: 'Nunito', size: 12 },
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => `${ctx.parsed.y} kg`
      }
    }
  },
  scales: {
    x: {
      type: 'time',
      time: { unit: 'day', displayFormats: { day: 'dd/MM' } },
      grid: { color: 'rgba(30,30,25,0.06)' },
      ticks: { font: { family: 'Nunito', size: 11 }, color: '#5e5e54' }
    },
    y: {
      grid: { color: 'rgba(30,30,25,0.06)' },
      ticks: {
        font: { family: 'Nunito', size: 11 },
        color: '#5e5e54',
        callback: (v) => `${v} kg`
      }
    }
  }
}
```

**Sous-titre de la section graphique**
- Texte : "Évolution du poids"
- Style : Fredoka 1rem, `--text-muted`, margin-bottom 0.75rem
- Séparateur au-dessus : `border-top: 2px dashed --border-color`, margin 1rem 0

**État vide (aucune pesée sur la période)**
- Message `.empty-state` : "Aucune pesée enregistrée sur cette période."
- CTA : "Rendez-vous sur le tableau de bord le jour de votre pesée pour saisir votre poids."
- Le canvas est masqué (`display: none`), l'empty-state est affiché à la place

**État chargement**
- Skeleton gris `#f1f3f5` de 250px de hauteur, border-radius `--radius-sm`, animation de pulsation légère

### Interactions et transitions

| Déclencheur | Action | Comportement |
|---|---|---|
| Changement du filtre période | Rechargement des données | Le graphique se re-render avec les nouvelles données, animation `update()` Chart.js |
| Survol d'un point de pesée | Tooltip Chart.js | Affiche "DD/MM/YYYY : XX.X kg" sur fond noir |
| Aucune pesée sur la période | Masquage canvas | Empty-state affiché, légende masquée |

### Critères d'acceptation UI

- [ ] Le graphique est visible sur tous les filtres ayant au moins 2 pesées
- [ ] La ligne d'objectif (pointillée verte) s'affiche uniquement si l'objectif "perte de poids" a un poids cible défini
- [ ] L'empty-state remplace proprement le canvas quand aucune pesée n'est disponible
- [ ] Sur mobile (375px), le graphique est lisible sans scroll horizontal
- [ ] Le tooltip affiche la date et le poids au format `DD/MM : X.X kg`
- [ ] Le changement de filtre met à jour le graphique en < 500ms
- [ ] La légende est lisible (texte ≥ 12px, contraste suffisant)

---

## E-08 — Modal Confirmation Suppression de compte

**URL** : Modal overlay (z-index 1000), pas de route propre
**Accès depuis** : Bouton "Supprimer mon compte" (E-05)
**Mène vers** : Landing page (après suppression réussie) / Retour Profil (annulation)
**Persona(s)** : Tous
**Objectif principal** : Obtenir une confirmation explicite et irréversible avant la suppression totale des données utilisateur.

### Layout général

```
┌────────────────────────────────────────┐
│  [Fond sombre flou backdrop]           │
│                                        │
│  ┌────────────────────────────────┐    │
│  │  ✕                             │    │  ← close-btn (MAIS ce modal n'a PAS de close-btn)
│  │                                │    │     → Seule fermeture : bouton "Annuler"
│  │  ⚠️                            │    │
│  │                                │    │
│  │  Supprimer définitivement      │    │
│  │  votre compte ?                │    │
│  │                                │    │
│  │  "Cette action est             │    │
│  │   irréversible. Toutes vos     │    │
│  │   données (repas, activités,   │    │
│  │   pesées, profil) seront       │    │
│  │   définitivement supprimées."  │    │
│  │                                │    │
│  │  ┌───────────────────────────┐ │    │
│  │  │ Tapez SUPPRIMER pour      │ │    │  ← Champ de confirmation
│  │  │ confirmer                 │ │    │
│  │  │ [input text             ] │ │    │
│  │  └───────────────────────────┘ │    │
│  │                                │    │
│  │  [Supprimer définitivement]    │    │  ← btn Danger (DISABLED si input ≠ "SUPPRIMER")
│  │  [Annuler]                     │    │  ← btn Ghost
│  └────────────────────────────────┘    │
└────────────────────────────────────────┘
```

**Responsive** : Mobile-first. Modal 90% largeur, max 450px. Padding 1.5rem (desktop) / 1.25rem 1rem (mobile).

### Composants

**C-NEW-07 — Icône d'avertissement**
- Emoji ou SVG Lucide `alert-triangle` (64px, couleur `--accent-danger`)
- Centré, margin-bottom 1rem

**C-NEW-08 — Titre modal**
- Texte : "Supprimer définitivement votre compte ?"
- Police : Fredoka 1.6rem, couleur `--text-main`
- Centré, margin-bottom 0.75rem

**C-NEW-09 — Texte d'avertissement**
- Texte : "Cette action est irréversible. Toutes vos données (repas, activités, pesées, profil) seront définitivement supprimées et ne pourront pas être récupérées."
- Police : Nunito 1rem 700, `--text-muted`
- Background : `#fff5f5`, border `2px solid --accent-danger`, border-radius `--radius-sm`, padding `0.75rem 1rem`
- margin-bottom 1.5rem

**C-NEW-10 — Champ de confirmation textuelle**
- Label : "Pour confirmer, tapez SUPPRIMER ci-dessous :"
- Font-weight 800, couleur `--text-main`
- Input `type="text"` placeholder `SUPPRIMER`
- Validation JS : `input.value === "SUPPRIMER"` (casse exacte)
- Note UX : la casse exacte "SUPPRIMER" (majuscules) est volontaire — elle ralentit l'utilisateur et confirme l'intention
- Feedback inline : si l'utilisateur commence à taper sans majuscules, aucun message d'erreur n'est affiché pendant la saisie — le bouton reste simplement désactivé

**C-NEW-11 — CTA "Supprimer définitivement"**
- Style : btn Danger (`--accent-danger`, blanc, shadow rouge)
- Largeur : 100%
- État désactivé (input ≠ "SUPPRIMER") : opacity 0.5, cursor not-allowed, background `#f1f3f5`, couleur `--text-muted`
- État actif (input === "SUPPRIMER") : couleur danger normale
- État loading (appel API en cours) : spinner blanc dans le bouton, label "Suppression en cours…"
- Icône : `trash-2` Lucide (16px) à gauche du label

**C-NEW-12 — CTA "Annuler"**
- Style : btn Ghost (fond transparent, border `--border-color`, couleur `--text-main`)
- Largeur : 100%
- Comportement : ferme la modale, retour à la vue Profil sans modification

**Absence de close-btn ×**
- Ce modal ne possède PAS le bouton × habituel en haut à droite.
- Justification UX : forcer une décision consciente — l'utilisateur doit explicitement cliquer "Annuler" ou taper "SUPPRIMER". Le backdrop-click (clic en dehors de la modale) est également désactivé pour ce modal uniquement.

### Interactions et transitions

| Déclencheur | Action | Destination |
|---|---|---|
| Saisie "SUPPRIMER" dans l'input | Active le bouton danger | Même modal |
| Clic "Supprimer définitivement" (actif) | Appel API : delete toutes les collections user + PB auth delete | Spinner → redirect Landing Page |
| Suppression réussie | Efface localStorage + déconnecte + message toast "Compte supprimé" | Landing page |
| Suppression échouée | Message inline rouge sous les boutons | Même modal, retry possible |
| Clic "Annuler" | Ferme modal | Vue Profil |
| Clic backdrop | AUCUNE ACTION | Reste sur le modal |
| Touche Escape | Ferme le modal (comportement standard) | Vue Profil |

### Cas limites

- **Erreur réseau** : Message "La suppression a échoué. Vérifiez votre connexion." + bouton "Réessayer" inline
- **Session expirée** : Suppression échoue → "Votre session a expiré. Reconnectez-vous pour supprimer votre compte."
- **Suppression partielle** (si une collection échoue) : L'UI doit afficher une erreur et ne PAS rediriger — l'utilisateur doit contacter le support

### Critères d'acceptation UI

- [ ] Le bouton "Supprimer définitivement" est visuellement désactivé jusqu'à saisie exacte de "SUPPRIMER"
- [ ] Le backdrop-click ne ferme PAS ce modal
- [ ] L'état loading est visible pendant l'appel de suppression
- [ ] Après suppression réussie : localStorage effacé, session PocketBase terminée, redirection Landing
- [ ] La modale est accessible au clavier (focus trap entre les éléments interactifs)
- [ ] Sur mobile, le bouton danger est entièrement visible sans scroll (modal max-height gérée)

---

## E-09 — Export données utilisateur

**URL** : Pas de vue dédiée — déclenchement depuis le bouton dans E-05 (Profil)
**Accès depuis** : Bouton "Exporter en JSON" ou "Exporter en CSV" (E-05)
**Mène vers** : Téléchargement navigateur (aucune navigation)
**Persona(s)** : Tous (droit de portabilité RGPD)
**Objectif principal** : Permettre à l'utilisateur de télécharger l'intégralité de ses données sous un format structuré.

### Spécifications UX du déclenchement

Le clic sur un bouton export déclenche une séquence en 3 états visuels sur le bouton lui-même :

**État 1 — Idle (normal)**
```
[⬇ Exporter en JSON]
```
Style ghost : fond transparent, bordure noire, shadow hard.

**État 2 — Loading (fetch en cours)**
```
[⟳ Génération…]
```
- Spinner SVG inline (animation 360deg 0.8s linear infinite)
- Bouton désactivé (pointer-events none)
- L'autre bouton d'export est également désactivé pendant ce temps

**État 3 — Succès (téléchargement déclenché)**
```
[✓ Téléchargement lancé !]
```
- Couleur texte `--accent-success`, fond `#d3f9d8`
- Durée : 2 secondes, puis retour à l'état Idle
- Le download est déclenché côté JS via `URL.createObjectURL(blob)` + click programmatique sur un `<a>` temporaire

### Structure du fichier JSON

```json
{
  "export_date": "2026-06-24T10:00:00Z",
  "user": {
    "email": "julien@example.com"
  },
  "profile": {
    "birthDate": "1999-03-15",
    "gender": "Homme",
    "weight": 75.5,
    "height": 180,
    "goal": "loss",
    "targetWeight": 70,
    "weighInDay": 1
  },
  "meals": [
    { "date": "2026-06-24", "mealType": "breakfast", "name": "", "calories": 450, "protein": 35 }
  ],
  "activities_log": [
    { "date": "2026-06-24", "name": "Musculation 1h", "calories_burned": 300 }
  ],
  "weigh_ins": [
    { "date": "2026-06-17", "weight": 75.5 },
    { "date": "2026-06-24", "weight": 74.8 }
  ],
  "goal_history": [
    { "date": "2026-05-01", "goal": "maintenance" },
    { "date": "2026-06-01", "goal": "loss" }
  ]
}
```

### Structure du fichier CSV

Le CSV comprend plusieurs sections séparées par une ligne vide et un header de section :

```
# PROFIL
Genre,Date naissance,Poids (kg),Taille (cm),Objectif,Poids cible (kg),Jour pesée
Homme,1999-03-15,75.5,180,loss,70,Lundi

# REPAS
Date,Type,Calories (kcal),Protéines (g)
2026-06-24,breakfast,450,35
...

# ACTIVITÉS
Date,Activité,Calories brûlées
2026-06-24,Musculation 1h,300
...

# PESÉES
Date,Poids (kg)
2026-06-17,75.5
2026-06-24,74.8
```

### Nom des fichiers

- JSON : `nutridash-export-YYYY-MM-DD.json`
- CSV : `nutridash-export-YYYY-MM-DD.csv`

### Cas limites

- **Aucune donnée** (compte vide) : Le fichier est généré avec des tableaux vides — pas de message d'erreur, le bouton fonctionne normalement
- **Erreur réseau** : Message inline rouge sous les boutons "L'export a échoué. Vérifiez votre connexion et réessayez."
- **Données volumineuses** (> 1 an d'historique) : L'état loading peut durer 2–3 secondes — le spinner reste visible tout ce temps

### Critères d'acceptation UI

- [ ] Les états idle / loading / succès sont clairement distincts visuellement
- [ ] Les deux boutons sont désactivés pendant qu'un export est en cours
- [ ] Le fichier téléchargé contient toutes les collections (profil, repas, activités, pesées, historique objectifs)
- [ ] Le nom du fichier inclut la date du jour au format YYYY-MM-DD
- [ ] L'état succès dure 2 secondes puis revient à idle sans action de l'utilisateur

---

# PARTIE 4 — FLUX UX TRANSVERSAUX

---

## Flux 4.1 — Onboarding (premier accès)

```
Landing page
  ↓ Clic "Démarrer gratuitement"
Auth screen — formulaire inscription visible
  ↓ Saisie email + mdp + confirmation + checkbox RGPD
  ↓ Clic "Créer mon compte" [RGPD validé]
  ↓ Spinner "Création en cours…"
  ↓ PocketBase: users.create() + authWithPassword()
Dashboard (cercles à 0%, journal vide)
  ↓ [Redirect auto si profil incomplet → Profil]
Profil — formulaire vide
  ↓ Saisie : date naissance / sexe / poids / taille / objectif / jour pesée
  ↓ BMR et TDEE s'affichent en temps réel (JS)
  ↓ Clic "Enregistrer le profil"
Dashboard — objectif calorique du jour affiché, cercles à 0%
  ↓ AHA MOMENT : l'utilisateur voit pour la première fois son objectif personnalisé
  ↓ Clic "+ Ajouter un repas"
Modal repas — type pré-sélectionné (Petit-déjeuner)
  ↓ Saisie calories + protéines
  ↓ Validation
Dashboard — cercles mis à jour, repas dans le journal
```

**Aha moment** : L'instant où les cercles de progression se mettent à jour après le premier repas saisi — l'utilisateur comprend la valeur du produit (< 3 min).

**Checkpoint RGPD** : La checkbox est le seul gate obligatoire avant la création de compte. Elle est placée juste avant le CTA, dans le flux naturel de la saisie — pas dans une étape interstitielle séparée.

---

## Flux 4.2 — Authentification

**Inscription** :
1. Landing → `#auth-screen` (signup-form)
2. Email + mdp + confirm + checkbox RGPD cochée
3. Submit → PB `users.create()` + connexion auto → Dashboard

**Connexion** :
1. Landing → `#auth-screen` (login-form)
2. Email + mdp
3. Submit → PB `authWithPassword()` → Dashboard

**Reset mot de passe** :
1. Login form → clic "Mot de passe oublié ?"
2. `#reset-form` visible
3. Saisie email → PB `requestPasswordReset(email)`
4. Message succès inline : "Email de réinitialisation envoyé. Vérifiez votre boîte mail."
5. Retour à login-form

**Déconnexion** :
1. Profil → clic "Déconnexion"
2. PB `authStore.clear()` + `localStorage.clear()` (scope user)
3. Redirect → Landing page

---

## Flux 4.3 — Paiement / Upgrade (Phase 3 — non spécifié ici)

Phase 3 non démarrée — hors périmètre Phase 2. Stripe sera intégré après la conformité RGPD.

---

## Flux 4.4 — Suppression de compte (flux RGPD)

```
Profil (E-05)
  ↓ Scroll jusqu'à "Mes données personnelles"
  ↓ Clic "Supprimer mon compte" [bouton danger]
Modal confirmation (E-08) — backdrop bloquant
  ↓ Lecture du message d'avertissement
  ↓ Saisie "SUPPRIMER" dans l'input
  ↓ Bouton "Supprimer définitivement" s'active
  ↓ Clic
  ↓ Spinner "Suppression en cours…"
  ↓ API : delete meals / activities_log / weigh_ins / daily_stats / goal_history / profiles / users
  ↓ localStorage.clear()
  ↓ authStore.clear()
Landing page + toast "Votre compte a été supprimé."
```

**Durée cible** : < 30 secondes (critère CDC 5.2).

---

## Flux 4.5 — Gestion d'erreur global

| Situation | Comportement |
|---|---|
| URL invalide / hash inconnu | Redirect vers Landing page |
| Erreur 500 API PocketBase | Banner rouge en haut de la vue active : "Une erreur serveur est survenue. Réessayez dans quelques instants." |
| Session expirée (token JWT 24h) | Redirect silencieuse → `#auth-screen` + message "Votre session a expiré. Reconnectez-vous." |
| Perte de connexion | Les données locales (localStorage) restent accessibles. Sync cloud suspendue. Aucun message bloquant (offline-first). |
| Données corrompues localStorage | Purge localStorage + message "Vos données locales ont été réinitialisées. Reconnectez-vous pour resynchroniser." |

---

# PARTIE 5 — DESIGN SYSTEM AMORCE (Composants)

---

## 5.1 — Inventaire complet des composants

| ID | Composant | Écrans | Variants | Priorité |
|---|---|---|---|---|
| C-01 | Button | Tous | Primary (jaune) / Secondary (vert) / Danger (rouge) / Ghost (transparent) / Disabled | MVP |
| C-02 | Input text/number/date/email/password | Auth, Profil, Modales, Dashboard | Default / Focus / Error / Disabled | MVP |
| C-03 | Select | Profil, Modales, Suivi | Identique C-02 | MVP |
| C-04 | Card | Tous | Default / Colored / Hover / Full-width | MVP |
| C-05 | Modal overlay | Dashboard, Profil | Simple 450px / Large 850px / Bloquant (E-08) | MVP |
| C-06 | Nav button | Sidebar | Default / Active / Hover | MVP |
| C-07 | Progress circle | Dashboard | Normal (vert) / Danger (rouge) | MVP |
| C-08 | History item | Dashboard | Repas / Activité / Edit hover / Delete hover | MVP |
| C-09 | Badge / Pill | Suivi, IA, RGPD | Status badge / Macro pill cals / Macro pill prot / Danger label | MVP |
| C-10 | Empty state | Dashboard, Suivi | Dashed border, CTA optionnel | MVP |
| C-11 | Error banner | Auth, Modales | Fond #ffe0e0, border danger | MVP |
| C-12 | Details expandable | Conseils | Closed / Open | Should Have |
| C-13 | Progress bar | Dashboard | Fill gradient, animation élastique | MVP |
| C-14 | Bilan stat card | Suivi | Calories / Protéines | MVP |
| C-NEW-01 | Bloc consentement RGPD | Auth inscription | Unchecked / Checked | Phase 2 |
| C-NEW-02 | Section données personnelles | Profil | Normal / Loading export | Phase 2 |
| C-NEW-03 | Bouton export | Profil | Idle / Loading / Succès | Phase 2 |
| C-NEW-04 | Séparateur zone danger | Profil | Statique | Phase 2 |
| C-NEW-05 | Bouton supprimer compte | Profil | Normal / Hover | Phase 2 |
| C-NEW-06 | Graphique linéaire Chart.js | Suivi | Avec données / Empty / Loading skeleton | Phase 4 |
| C-NEW-07 | Icône avertissement | Modal suppression | Statique | Phase 2 |
| C-NEW-10 | Input confirmation "SUPPRIMER" | Modal suppression | Empty / Partial / Match | Phase 2 |

---

## 5.2 — Tokens de design (référence normalisée)

### Couleurs

```css
--bg-main: #fdfbf6;
--bg-card: #ffffff;
--border-color: #1e1e19;
--accent-primary: #ff6b6b;
--accent-secondary: #4dabf7;
--accent-warning: #fcc419;
--accent-success: #51cf66;
--accent-danger: #fa5252;
--accent-purple: #cc5de8;
--text-main: #1e1e19;
--text-muted: #5e5e54;
```

### Typographie

```css
--font-heading: 'Fredoka', sans-serif;
--font-main: 'Nunito', sans-serif;
```

### Espacements

```css
/* Grille 8px */
space-xs: 4px
space-sm: 8px
space-md: 16px
space-lg: 24px    /* 1.5rem */
space-xl: 32px    /* 2rem */
space-2xl: 48px   /* 3rem */
```

### Bordures et ombres

```css
--border-thick: 3px solid #1e1e19;
--radius-lg: 24px;
--radius-md: 16px;
--radius-sm: 12px;
--shadow-hard: 4px 4px 0px #1e1e19;
--shadow-hard-hover: 6px 6px 0px #1e1e19;
--shadow-hard-active: 0px 0px 0px #1e1e19;
--transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 5.3 — Éléments RGPD obligatoires

| Élément | Statut | Emplacement |
|---|---|---|
| Checkbox consentement CGU + PP | A implémenter (E-03) | Formulaire inscription |
| Liens CGU et Politique de confidentialité | A créer (pages `/cgu.html` + `/confidentialite.html`) | Bloc consentement + Footer landing |
| Page gestion données personnelles | A implémenter (E-05 bas de page) | Vue Profil |
| Export données JSON / CSV | A implémenter (E-09) | Vue Profil |
| Suppression de compte | A implémenter (E-08) | Vue Profil → Modal |
| Mentions légales dans le footer | A ajouter | Footer Landing page |
| Bandeau cookies | Non requis actuellement (aucun analytics ni cookie tiers) | N/A |

---

# PARTIE 6 — PROMPT DESIGNER

```
## Prompt Design — NutriDash

Tu es un designer UX/UI expert. Crée les maquettes haute-fidélité de NutriDash, une application web de suivi nutritionnel personnalisé.

### Contexte produit
SPA (Single Page Application) JS Vanilla. Pas de base de données alimentaire — l'utilisateur saisit directement calories et protéines. L'app calcule les besoins via la formule Mifflin-St Jeor. Cible : sportifs et personnes autonomes en sèche ou prise de masse.

### Cible principale
Persona : Julien, 27 ans, développeur web, musculation 4x/semaine. Mobile-first, impatient, intolèrant aux apps lentes ou surchargées. Il veut saisir 3 repas en moins de 2 minutes.

### Direction artistique
Style : Neo-Brutalist — Énergique, Direct, Précis
Couleur primaire (CTA) : #fcc419 (jaune)
Couleur accent (liens, nav active) : #4dabf7 (bleu)
Couleur danger : #fa5252 (rouge)
Couleur succès : #51cf66 (vert)
Fond global : #fdfbf6 (crème) + pattern de points noirs 30px
Fond sidebar : #fff3bf (jaune pâle)
Texte principal : #1e1e19 (presque noir)
Typo titres : Fredoka (Google Fonts) — arrondi, chaleureux, fort
Typo corps : Nunito (Google Fonts) — lisible, modern
Bordures : 3px solid #1e1e19 sur TOUS les composants
Ombres : 4px 4px 0px #1e1e19 (hard shadow — PAS de box-shadow floue)
Radius : 24px (cards) / 12px (inputs, boutons)
Transitions : cubic-bezier(0.34, 1.56, 0.64, 1) — ressort élastique

### Écran prioritaire 1 — Inscription avec consentement RGPD
Structure :
- Carte centrée max-width 420px, fond blanc, border 3px, shadow 12px 12px
- Logo NutriDash en haut (Fredoka)
- Titre "Créer un compte"
- Input email + Input mdp + Input confirm mdp
- Bloc checkbox RGPD (fond #f8f9fa, border 2px, radius 12px, padding 0.75rem 1rem)
  avec liens "CGU" et "Politique de confidentialité" en bleu
- CTA "Créer mon compte" (fond #fcc419, disabled si checkbox non cochée)
- Lien "Déjà un compte ? Se connecter"

Contraintes :
- Mobile-first (375px iPhone SE)
- Checkbox zone cliquable ≥ 44px hauteur
- WCAG AA minimum

### Écran prioritaire 2 — Modal suppression de compte
Structure :
- Overlay sombre backdrop blur 4px
- Modal max-width 450px, shadow 12px 12px
- Icône alerte triangle (rouge, 48px)
- Titre "Supprimer définitivement votre compte ?"
- Texte d'avertissement (fond #fff5f5, border rouge)
- Label "Tapez SUPPRIMER pour confirmer"
- Input text placeholder "SUPPRIMER"
- CTA danger (disabled si input ≠ "SUPPRIMER") + CTA annuler ghost
- PAS de bouton × (fermeture uniquement via Annuler)

### Écran prioritaire 3 — Graphique évolution du poids (dans vue Suivi)
Structure :
- Intégré dans la carte "Poids" existante
- Sous le bloc texte début/fin/bilan, séparateur dashed
- Titre "Évolution du poids" Fredoka 1rem muted
- Canvas Chart.js Line chart 250px hauteur
- Dataset 1 : points pesées (bleu #4dabf7, fill très léger)
- Dataset 2 : ligne objectif pointillée (vert #51cf66) si poids cible défini
- Légende en bas, tooltip dark

Une fois les 3 écrans validés, enchaîne avec la section "Mes données personnelles" dans la vue Profil.
Réutilise strictement le design system NutriDash (tokens, ombres, typographie) sur chaque écran.
```

---

*NutriDash — Design V1 — 24 juin 2026*
*Produit par l'Agent Designer à partir du CDC V1, du code index.html et de style.css*
