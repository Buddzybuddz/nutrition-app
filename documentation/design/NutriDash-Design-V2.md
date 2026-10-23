# NutriDash — Design System & Wireframes V2
> Refonte graphique complète — Mobile First — 24 juin 2026

---

## Note de conception

Ce document remplace entièrement la V1 (neo-brutalist). Il part de zéro avec une nouvelle direction artistique, couvre tous les écrans de l'application et intègre les 4 fonctionnalités RGPD/V1+ (graphique poids, consentement inscription, export données, suppression compte).

**Style retenu :** Soft Modern — minimalisme organique avec surfaces douces, typographie propre, couleurs naturelles issues du monde de la nutrition et du bien-être. Aucune bordure épaisse. Aucune ombre portée décalée. L'information respire.

---

# PARTIE 1 — DESIGN SYSTEM

---

## DS-01 — Direction artistique

**Mots-clés :** Clarté · Confiance · Énergie douce · Précision · Naturel

**Concept :** L'interface disparaît au profit des données. Chaque écran permet à l'utilisateur de comprendre sa situation nutritionnelle en un regard, sans friction cognitive. Les couleurs évoquent le végétal et la vitalité — vert profond, blanc cassé naturel, touches de terracotta pour l'énergie. Les formes sont généreuses (radius large), les ombres subtiles (elevation douce), les espaces blancs intentionnels.

**Ce que ce style n'est PAS :**
- Pas clinique / médical (pas de bleu stérile)
- Pas surjoué wellness (pas de gradients arc-en-ciel pastel)
- Pas neo-brutalist (plus de bordures épaisses noires, plus d'ombres décalées)
- Pas surchargé (pas d'éléments décoratifs inutiles)

---

## DS-02 — Palette de couleurs

### Couleurs principales

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#2D6A4F` | Vert forêt — CTA principaux, nav active, accents |
| `--color-primary-light` | `#52B788` | Vert moyen — hover, états intermédiaires |
| `--color-primary-xlight` | `#D8F3DC` | Vert très pâle — surfaces d'accent, fond cartes highlight |
| `--color-accent` | `#E07A5F` | Terracotta — calories, énergie, éléments chauds |
| `--color-accent-light` | `#FAE8E4` | Terracotta très pâle — surface accent chaud |

### Neutres

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#F7F8F3` | Fond global (blanc cassé naturel, légère teinte verte) |
| `--color-surface` | `#FFFFFF` | Surfaces cartes, modales |
| `--color-surface-2` | `#F0F4EE` | Surface secondaire, inputs, zones inactives |
| `--color-border` | `#E2E8DF` | Bordures subtiles |
| `--color-border-strong` | `#C7D4C3` | Bordures plus marquées (séparateurs) |

### Textes

| Token | Hex | Usage |
|---|---|---|
| `--color-text-1` | `#1A2E22` | Texte principal (vert très sombre) |
| `--color-text-2` | `#4A6358` | Texte secondaire (vert moyen sombre) |
| `--color-text-3` | `#8BA898` | Texte tertiaire, placeholders, labels discrets |

### États sémantiques

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#2D6A4F` | Succès (même que primary — cohérence verte) |
| `--color-warning` | `#F4A261` | Avertissement (orange doux) |
| `--color-danger` | `#C1121F` | Erreur, danger, suppression |
| `--color-danger-light` | `#FFE8EA` | Surface erreur |
| `--color-info` | `#4361EE` | Informationnel (bleu discret) |

### Ratios de contraste WCAG AA

- `--color-text-1` (#1A2E22) sur `--color-bg` (#F7F8F3) : ratio ~15:1 — AAA
- `--color-primary` (#2D6A4F) sur `--color-surface` (#FFFFFF) : ratio ~7.2:1 — AAA
- `#FFFFFF` sur `--color-primary` (#2D6A4F) : ratio ~7.2:1 — AAA
- `--color-accent` (#E07A5F) sur `--color-surface` (#FFFFFF) : ratio ~3.8:1 — AA large text
- `--color-danger` (#C1121F) sur `--color-surface` (#FFFFFF) : ratio ~5.9:1 — AA

---

## DS-03 — Typographie

### Paire typographique

| Rôle | Police | Justification |
|---|---|---|
| **Headings** | **DM Sans** (Google Fonts) | Géométrique mais organique, excellent sur mobile, caractère fort sans agressivité |
| **Body / UI** | **Inter** (Google Fonts) | Référence pour les interfaces numériques, lisibilité parfaite à toutes tailles |

Chargement : `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap`

### Echelle typographique

| Usage | Taille | Police | Poids | Line-height |
|---|---|---|---|---|
| Display / Hero | 32px | DM Sans | 700 | 1.2 |
| H1 | 28px | DM Sans | 700 | 1.25 |
| H2 | 22px | DM Sans | 600 | 1.3 |
| H3 | 18px | DM Sans | 600 | 1.35 |
| H4 / Label section | 15px | DM Sans | 600 | 1.4 |
| Body large | 16px | Inter | 400 | 1.6 |
| Body | 14px | Inter | 400 | 1.6 |
| Body small | 13px | Inter | 400 | 1.5 |
| Caption | 12px | Inter | 400 | 1.4 |
| Label UI | 12px | Inter | 600 | 1 (uppercase + letter-spacing 0.5px) |
| Chiffre data | 36–48px | DM Sans | 700 | 1 |
| Chiffre moyen | 24px | DM Sans | 600 | 1.1 |

Taille minimale absolue : **12px** (caption uniquement) — body minimum 14px sur mobile.

---

## DS-04 — Espacements

Grille de base : **4px** (système Material Design)

| Token | Valeur | Usage |
|---|---|---|
| `space-1` | 4px | Micro-espacement interne |
| `space-2` | 8px | Espacement entre éléments liés |
| `space-3` | 12px | Padding compact (chips, tags) |
| `space-4` | 16px | Padding standard (cards mobile) |
| `space-5` | 20px | Espacement moyen |
| `space-6` | 24px | Padding généreux (sections) |
| `space-8` | 32px | Espacement large (entre sections) |
| `space-10` | 40px | Espacement XL |
| `space-12` | 48px | Espacement XXL |
| `space-16` | 64px | Hero spacing |

**Padding horizontal global (mobile 375px) :** 20px de chaque côté
**Padding horizontal global (desktop) :** 24–32px
**Gap entre cartes (grille) :** 12px (mobile) / 16px (desktop)

---

## DS-05 — Bordures et élévation

### Rayons

| Token | Valeur | Usage |
|---|---|---|
| `--radius-sm` | 8px | Chips, tags, petits composants |
| `--radius-md` | 12px | Inputs, boutons |
| `--radius-lg` | 16px | Cards standard |
| `--radius-xl` | 24px | Cards featured, modales |
| `--radius-2xl` | 32px | Bottom sheets, hero cards |
| `--radius-full` | 9999px | Boutons pill, avatars, badges |

### Ombres (elevation douce)

| Token | Valeur | Usage |
|---|---|---|
| `--shadow-1` | `0 1px 3px rgba(45,106,79,0.06), 0 1px 2px rgba(45,106,79,0.04)` | Cards au repos |
| `--shadow-2` | `0 4px 12px rgba(45,106,79,0.08), 0 2px 4px rgba(45,106,79,0.04)` | Cards hover, inputs focus |
| `--shadow-3` | `0 8px 24px rgba(45,106,79,0.12), 0 4px 8px rgba(45,106,79,0.06)` | Modales, bottom sheets |
| `--shadow-4` | `0 20px 48px rgba(45,106,79,0.16), 0 8px 16px rgba(45,106,79,0.08)` | Modales critiques, toasts |

### Bordures

Toutes les bordures sont **optionnelles et subtiles** — utilisées pour délimiter, non pour styliser.

| Usage | Valeur |
|---|---|
| Card par défaut | `1px solid --color-border` |
| Card active | `1px solid --color-primary-light` |
| Input | `1.5px solid --color-border` |
| Input focus | `1.5px solid --color-primary` + ring `0 0 0 3px rgba(45,106,79,0.12)` |
| Input error | `1.5px solid --color-danger` + ring rouge |
| Séparateur | `1px solid --color-border` |

---

## DS-06 — Composants — Spécifications

### Boutons

| Variant | Fond | Texte | Border | Usage |
|---|---|---|---|---|
| Primary | `--color-primary` | Blanc | Aucune | Action principale unique par écran |
| Secondary | `--color-primary-xlight` | `--color-primary` | Aucune | Actions secondaires |
| Ghost | Transparent | `--color-primary` | `1px solid --color-border` | Tertiaire, annulation |
| Danger | `--color-danger` | Blanc | Aucune | Destruction, suppression |
| Danger Ghost | `--color-danger-light` | `--color-danger` | `1px solid --color-danger` | Danger secondaire |
| Disabled | `--color-surface-2` | `--color-text-3` | Aucune | Tous états désactivés |

Dimensions : height 52px (primary mobile), 44px (secondary/ghost), padding horizontal 20px.
Border-radius : `--radius-md` (12px) pour boutons, `--radius-full` pour boutons pill.

### Cards

| Variant | Fond | Ombre | Radius | Usage |
|---|---|---|---|---|
| Default | `--color-surface` | `--shadow-1` | `--radius-lg` | Cards standard |
| Elevated | `--color-surface` | `--shadow-2` | `--radius-xl` | Cards mises en avant |
| Colored | `--color-primary-xlight` | Aucune | `--radius-lg` | Cards d'état, highlight |
| Accent | `--color-accent-light` | Aucune | `--radius-lg` | Cards calories, énergie |
| Glass | `rgba(255,255,255,0.72) + backdrop-filter: blur(12px)` | `--shadow-2` | `--radius-xl` | Hero, top banner |

### Navigation mobile (bottom bar)

4 onglets maximum : Accueil · Suivi · Conseils · Profil
- Hauteur : 64px + safe area bottom
- Fond : `--color-surface` + `border-top: 1px solid --color-border`
- Ombre vers le haut : `0 -4px 16px rgba(45,106,79,0.06)`
- Icônes : 24px, SVG Lucide (stroke-width 1.75)
- Label : 11px Inter 600, uppercase, letter-spacing 0.4px
- État actif : icône + label `--color-primary`, pastille verte sous l'icône
- État inactif : `--color-text-3`

### Inputs

- Height : 52px (mobile)
- Fond : `--color-surface-2`
- Radius : `--radius-md`
- Label flottant (floating label) : monte lors du focus/saisie
- Padding : 16px horizontal, label collapsé en top
- Icône leading optionnelle : 20px, `--color-text-3`

### Cercles de progression

Style donut — `conic-gradient` ou SVG `<circle stroke-dasharray>`.
- Diamètre : 140px (mobile standard) / 160px (dashboard principal)
- Fond anneau : `--color-border` 8px width
- Fill anneau : `--color-primary` (calories) / `--color-accent` (protéines)
- Centre : fond blanc, valeur numérique DM Sans 700 32px
- Animation : transition 0.6s ease-out sur la valeur dashoffset

---

## DS-07 — Icônes

Bibliothèque : **Lucide Icons** (SVG inline ou sprite)
Stroke-width : **1.75px** — cohérent sur toutes les tailles
Couleur : hérite du contexte (currentColor)

Tailles standard :
- 16px — inline dans texte, badges
- 20px — boutons, inputs (leading icon)
- 24px — navigation, actions principales
- 28px — cartes d'action
- 32px — illustrations légères

---

## DS-08 — Animations

| Interaction | Durée | Easing |
|---|---|---|
| Hover carte | 150ms | ease-out |
| Focus input | 200ms | ease-out |
| Ouverture modale | 280ms | cubic-bezier(0.32, 0.72, 0, 1) |
| Fermeture modale | 220ms | ease-in |
| Page transition | 300ms | ease-in-out |
| Progression cercle | 600ms | ease-out |
| Barre de progression | 500ms | ease-out |
| Toast entrée | 250ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Toast sortie | 200ms | ease-in |

Respect de `prefers-reduced-motion` : toutes les animations réduites à opacity-only, durée 100ms maximum.

---

# PARTIE 2 — CARTE DES ÉCRANS

---

## Arborescence

```
NutriDash
│
├── Landing Page                    [E-01] PUBLIC
│
├── Authentification                [E-02] PUBLIC
│   ├── Connexion
│   ├── Inscription + RGPD          [NOUVEAU]
│   └── Reset mot de passe
│
├── Onboarding                      [E-03] POST-INSCRIPTION
│   └── Saisie profil physiologique
│
└── App (utilisateur connecté)
    │
    ├── Dashboard — Accueil         [E-04] ONGLET 1
    │   ├── Header date + nav jours
    │   ├── Carte pesée (jour J)
    │   ├── Anneau Calories
    │   ├── Anneau Protéines
    │   ├── Boutons actions
    │   └── Journal du jour
    │
    ├── Modal Ajout repas            [M-01] MODALE
    ├── Modal Ajout activité         [M-02] MODALE
    ├── Modal Objectif atteint       [M-03] MODALE
    │
    ├── Suivi / Historique          [E-05] ONGLET 2
    │   ├── Filtre période
    │   ├── Bilan score
    │   ├── Stats calories
    │   ├── Stats protéines
    │   ├── Stats poids + graphique  [NOUVEAU]
    │   └── Historique objectifs
    │
    ├── Conseils                    [E-06] ONGLET 3
    │   └── 8 sections expandables
    │
    └── Profil / Paramètres         [E-07] ONGLET 4
        ├── Info compte
        ├── Formulaire physiologique
        ├── Stats BMR/TDEE
        ├── Mes données (export)     [NOUVEAU]
        └── Zone danger (suppression)[NOUVEAU]

Modales critiques
└── Confirmation suppression compte  [M-04] NOUVEAU
```

---

## Tableau de priorisation

| # | Ecran | Priorité | Phase |
|---|---|---|---|
| E-01 | Landing Page | MVP | Phase 3 (lancement) |
| E-02 | Auth (connexion + inscription RGPD + reset) | MVP | Phase 2 |
| E-03 | Onboarding profil | MVP | Phase 0 (existant) |
| E-04 | Dashboard | MVP | Phase 0 (existant) |
| M-01 | Modal repas | MVP | Phase 0 (existant) |
| M-02 | Modal activité | MVP | Phase 0 (existant) |
| M-03 | Modal objectif atteint | Should Have | Phase 0 (existant) |
| E-05 | Suivi + graphique poids | MVP + V1+ | Phase 0 + Phase 4 |
| E-06 | Conseils | Should Have | Phase 0 (existant) |
| E-07 | Profil + export + suppression | MVP + RGPD | Phase 2 |
| M-04 | Modal suppression compte | RGPD | Phase 2 |

---

# PARTIE 3 — WIREFRAMES DÉTAILLÉS

> Référence : mobile 375px. Toutes les mesures en px.
> Les annotations [ ] décrivent les règles de comportement et les états.

---

## E-01 — Landing Page

**Route :** `/` (hash `#landing-page`)
**Accès depuis :** URL directe
**Mène vers :** Auth inscription / Auth connexion
**Objectif :** Convertir un visiteur en inscrit en moins de 30 secondes.

---

### Layout mobile (375px)

```
┌─────────────────────────────────────────┐  375px
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  NutriDash          [Connexion] │    │  H: 60px — Header sticky
│  │  logo DM Sans 700   btn ghost   │    │  bg: rgba(247,248,243,0.92)
│  └─────────────────────────────────┘    │  backdrop-filter: blur(8px)
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │  HERO SECTION
│  │   ┌─────────────────────────┐   │    │  bg: linear-gradient(
│  │   │  [Image hero — mockup   │   │    │    180deg,
│  │   │   téléphone dashboard]  │   │    │    #D8F3DC 0%,
│  │   │   border-radius: 24px   │   │    │    #F7F8F3 100%)
│  │   │   shadow-3              │   │    │
│  │   └─────────────────────────┘   │    │
│  │                                 │    │
│  │  Maîtrisez votre               │    │  DM Sans 700 32px
│  │  nutrition.                     │    │  color: --color-text-1
│  │                                 │    │
│  │  Calculez vos besoins réels,    │    │  Inter 400 16px
│  │  suivez vos calories et         │    │  color: --color-text-2
│  │  atteignez vos objectifs        │    │  line-height: 1.6
│  │  avec précision.                │    │
│  │                                 │    │
│  │  ┌─────────────────────────┐   │    │  btn Primary — height 52px
│  │  │  Démarrer gratuitement  │   │    │  bg: --color-primary
│  │  │       →                 │   │    │  color: white
│  │  └─────────────────────────┘   │    │  radius: --radius-full
│  │                                 │    │
│  │  ✓ 14 jours gratuits   ✓ Sans  │    │  Inter 13px --color-text-3
│  │    engagement                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ─────────────────────────────────────  │  padding: 32px 20px
│                                         │
│  SECTION FEATURES                       │
│                                         │
│  Votre corps mérite                     │  DM Sans 600 22px
│  mieux que des approximations.          │  --color-text-1
│                                         │
│  ┌─────────────────────────────────┐   │  Card feature 1
│  │  ┌────┐                         │   │  bg: --color-surface
│  │  │ 🎯 │  Calculateur TDEE       │   │  border: --color-border
│  │  │icon│  Intelligent            │   │  radius: --radius-lg
│  │  └────┘  DM Sans 600 16px       │   │  shadow-1
│  │                                 │   │  padding: 20px
│  │  Découvrez instantanément       │   │  Inter 14px --color-text-2
│  │  combien de calories vous       │   │
│  │  devez consommer.               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Card feature 2
│  │  ┌────┐                         │   │
│  │  │ 📊 │  Journal intuitif       │   │
│  │  │icon│  DM Sans 600 16px       │   │
│  │  └────┘                         │   │
│  │  Ajoutez vos repas en           │   │
│  │  moins de 20 secondes.          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Card feature 3
│  │  ┌────┐                         │   │
│  │  │ 📈 │  Analyse complète       │   │
│  │  │icon│  DM Sans 600 16px       │   │
│  │  └────┘                         │   │
│  │  Suivez votre évolution          │   │
│  │  semaine après semaine.          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  SECTION PROCESS (3 étapes)             │
│  bg: --color-primary-xlight             │
│  padding: 40px 20px                     │
│                                         │
│  Le Process NutriDash                   │  DM Sans 600 22px
│                                         │
│  ① Fixer le cap     ──────────────     │  Numéro cercle --color-primary
│  │  Profil + objectif + calcul TDEE    │  DM Sans 600 15px
│  ↓                                      │
│  ② Piloter au quotidien ──────────     │
│  │  Saisie repas + activités            │
│  ↓                                      │
│  ③ Analyser & Ajuster ─────────────   │
│  │  Bilan hebdo + pesée + graphique     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  SECTION TARIF                          │
│  padding: 40px 20px                     │
│                                         │
│  ┌─────────────────────────────────┐   │  Pricing card
│  │  ┌──────────────────────────┐   │   │  bg: --color-primary
│  │  │  14 jours gratuits       │   │   │  color: white
│  │  │  pill badge              │   │   │  radius: --radius-xl
│  │  └──────────────────────────┘   │   │  shadow-3
│  │                                 │   │  padding: 32px 24px
│  │      10€                        │   │  DM Sans 700 48px white
│  │      /mois                      │   │  Inter 400 16px rgba(255,255,255,0.8)
│  │                                 │   │
│  │  ✓  Accès complet              │   │  Inter 15px white
│  │  ✓  Sync cloud illimitée       │   │  gap: 12px entre items
│  │  ✓  Historique illimité        │   │
│  │  ✓  Sans engagement            │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  btn ghost inversé
│  │  │  Commencer l'essai →    │   │   │  bg: white
│  │  └─────────────────────────┘   │   │  color: --color-primary
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  FOOTER                                 │  bg: --color-text-1
│  NutriDash                              │  DM Sans 600 20px white
│  © 2026                                 │  Inter 13px rgba(255,255,255,0.5)
│  CGU · Confidentialité                  │  liens Inter 13px --color-primary-light
│                                         │
└─────────────────────────────────────────┘
```

### Layout desktop (adaptatif > 768px)

Sur desktop : Header + Hero en 2 colonnes (texte gauche, mockup droite), Features en grille 3 colonnes, Process en horizontal.

### Interactions

| Déclencheur | Action |
|---|---|
| Clic "Démarrer gratuitement" | Navigate → Auth, formulaire inscription visible |
| Clic "Connexion" (header) | Navigate → Auth, formulaire connexion visible |
| Clic "Commencer l'essai" (pricing) | Navigate → Auth, formulaire inscription visible |
| Clic "CGU" (footer) | Nouvelle tab → `/cgu.html` |
| Clic "Confidentialité" (footer) | Nouvelle tab → `/confidentialite.html` |

### Critères d'acceptation

- [ ] Le CTA principal "Démarrer gratuitement" est visible sans scroll sur iPhone SE (375x667)
- [ ] Le logo et le bouton Connexion sont visibles dans le header sticky
- [ ] Le header reste lisible en scrollant (backdrop blur sur fond semi-transparent)
- [ ] Sur desktop (>768px), le hero passe en 2 colonnes

---

## E-02 — Authentification

**Route :** hash `#auth-screen`
**Accès depuis :** Landing (CTA), Header (Connexion)
**Mène vers :** Onboarding (inscription) / Dashboard (connexion) / Landing (retour)
**Objectif :** Permettre inscription et connexion rapides. Recueillir le consentement RGPD à l'inscription.

---

### E-02a — Formulaire Connexion

```
┌─────────────────────────────────────────┐  375px
│                                         │
│  ← Retour à l'accueil                   │  Inter 14px 500 --color-text-2
│     tap target 44px                     │  icon: arrow-left 20px
│                                         │
│  ┌─────────────────────────────────┐    │  Padding horizontal: 20px
│  │                                 │    │
│  │       NutriDash                 │    │  DM Sans 700 28px --color-primary
│  │                                 │    │  text-align: center
│  │  Bon retour !                   │    │  DM Sans 600 22px --color-text-1
│  │  Connectez-vous pour            │    │  Inter 400 15px --color-text-2
│  │  retrouver vos données.         │    │
│  │                                 │    │
│  │  ┌─────────────────────────┐   │    │  Input Email
│  │  │ ✉  Email                │   │    │  [floating label]
│  │  │                         │   │    │  height: 56px
│  │  │  julien@example.com     │   │    │  bg: --color-surface-2
│  │  └─────────────────────────┘   │    │  radius: --radius-md
│  │                                 │    │
│  │  ┌─────────────────────────┐   │    │  Input Mot de passe
│  │  │ 🔒  Mot de passe        │   │    │  [floating label]
│  │  │                         │   │    │  icon trailing: eye (toggle)
│  │  │  ••••••••               │   │    │
│  │  └─────────────────────────┘   │    │
│  │                                 │    │
│  │                    Mot de passe │    │  Inter 13px 500 --color-primary
│  │                         oublié ?│    │  text-align: right
│  │                                 │    │  tap 44px min
│  │  ┌─────────────────────────┐   │    │  btn Primary
│  │  │     Se connecter  →     │   │    │  height: 52px
│  │  └─────────────────────────┘   │    │  bg: --color-primary
│  │                                 │    │  radius: --radius-full
│  │  ────────── ou ──────────       │    │  séparateur Inter 13px --color-text-3
│  │                                 │    │
│  │  Pas encore de compte ?         │    │  Inter 14px --color-text-2
│  │  ┌─────────────────────────┐   │    │  btn Secondary
│  │  │   Créer un compte       │   │    │  height: 48px
│  │  └─────────────────────────┘   │    │  bg: --color-primary-xlight
│  │                                 │    │  color: --color-primary
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │  [si erreur API]
│  │  ✕  Email ou mot de passe       │    │  bg: --color-danger-light
│  │     incorrect.                  │    │  border-left: 3px solid --color-danger
│  └─────────────────────────────────┘    │  Inter 14px --color-danger
│                                         │  radius: --radius-sm
└─────────────────────────────────────────┘
```

**Etat loading du bouton "Se connecter" :**
```
┌─────────────────────────────────┐
│   ◌  Connexion en cours…        │   spinner 20px blanc + label
└─────────────────────────────────┘
```

---

### E-02b — Formulaire Inscription + RGPD

```
┌─────────────────────────────────────────┐  375px
│                                         │
│  ← Retour à l'accueil                   │
│                                         │
│       NutriDash                         │  DM Sans 700 28px --color-primary
│                                         │
│  Créez votre compte                     │  DM Sans 600 22px --color-text-1
│  gratuitement.                          │
│  14 jours d'essai offerts.              │  Inter 400 14px --color-text-2
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ✉  Adresse email                │   │  Input Email
│  │  votre@email.com                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔒  Mot de passe                │   │  Input Password
│  │  Min. 8 caractères              │   │  [eye toggle trailing]
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔒  Confirmer le mot de passe   │   │  Input Confirm
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Bloc RGPD
│  │  ┌───┐                          │   │  bg: --color-surface
│  │  │ ☐ │  J'ai lu et j'accepte   │   │  border: 1.5px solid --color-border
│  │  └───┘  les Conditions         │   │  radius: --radius-md
│  │         Générales d'Utilisation │   │  padding: 16px
│  │         et la Politique de      │   │  Inter 14px --color-text-1
│  │         confidentialité.        │   │
│  │                                 │   │  [liens CGU et PP]
│  │  CGU  et  Politique de          │   │  Inter 14px 600 --color-primary
│  │  confidentialité               │   │  underline
│  │                                 │   │
│  │  ⚠ Obligatoire pour créer      │   │  Inter 12px --color-text-3
│  │    votre compte.                │   │  [visible en permanence]
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  btn Primary
│  │   Créer mon compte →            │   │  DISABLED si checkbox non cochée
│  └─────────────────────────────────┘   │  opacity: 0.45, cursor: not-allowed
│                                         │  ACTIF si cochée: --color-primary
│  Déjà un compte ?                       │  Inter 14px --color-text-2
│  → Me connecter                         │  lien --color-primary Inter 14px 600
│                                         │
└─────────────────────────────────────────┘
```

**Détail état checkbox RGPD :**
```
DÉCOCHÉ                         COCHÉ
┌───┐                           ┌───┐
│   │  (fond blanc)             │ ✓ │  (fond --color-primary)
└───┘                           └───┘
border: --color-border          border: --color-primary
                                checkmark blanc SVG
```

**Règles comportementales du bloc RGPD :**
- La zone entière (label wrapping checkbox + texte) est cliquable → tap target ≥ 44px hauteur
- "CGU" et "Politique de confidentialité" sont des liens indépendants qui n'activent PAS la checkbox (pour que l'utilisateur puisse lire sans accepter par mégarde)
- Le bouton CTA passe de `disabled` à `enabled` uniquement après coché
- La checkbox cochée est persistante — si l'utilisateur recharge, elle revient à l'état décoché (pas de sauvegarde locale du consentement avant soumission)

---

### E-02c — Reset mot de passe

```
┌─────────────────────────────────────────┐
│                                         │
│  ← Retour à la connexion                │
│                                         │
│       NutriDash                         │
│                                         │
│  Mot de passe oublié ?                  │  DM Sans 600 22px
│                                         │
│  Entrez votre email et nous             │  Inter 400 15px --color-text-2
│  vous enverrons un lien de              │
│  réinitialisation.                      │
│                                         │
│  ┌─────────────────────────────────┐   │  Input Email
│  │ ✉  Adresse email                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  btn Primary
│  │  Envoyer le lien →              │   │
│  └─────────────────────────────────┘   │
│                                         │
│                                         │
│  ┌─────────────────────────────────┐   │  [état succès — s'affiche après submit]
│  │  ✓  Email envoyé !              │   │  bg: --color-primary-xlight
│  │     Vérifiez votre boîte mail.  │   │  border-left: 3px solid --color-primary
│  │     Le lien est valable 15 min. │   │  Inter 14px --color-primary
│  └─────────────────────────────────┘   │  radius: --radius-sm
│                                         │
└─────────────────────────────────────────┘
```

---

## E-03 — Onboarding Profil

**Route :** hash `#profile-view` (premier accès uniquement)
**Accès depuis :** Inscription réussie (redirect automatique)
**Mène vers :** Dashboard
**Objectif :** Collecter les données physiologiques et calculer BMR/TDEE en temps réel avant la première utilisation.

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────────────────────────┐   │  Progress indicator
│  │  ●●●○  Étape 1 sur 1            │   │  [ou barre de progression]
│  └─────────────────────────────────┘   │  Inter 13px --color-text-3
│                                         │
│  Personnalisez votre profil             │  DM Sans 600 22px --color-text-1
│  pour des objectifs précis.             │  Inter 400 14px --color-text-2
│                                         │
│  ┌─────────────────────────────────┐   │  Formulaire card
│  │                                 │   │  bg: --color-surface
│  │  Date de naissance              │   │  shadow-1, radius-xl
│  │  ┌─────────────────────────┐   │   │  padding: 24px
│  │  │  📅  01/01/1997         │   │   │  Input date
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  Sexe                           │   │  Label DM Sans 600 14px
│  │  ┌──────────┐ ┌──────────┐     │   │  Segmented control 2 options
│  │  │  Homme   │ │  Femme   │     │   │  [H activé] bg: --color-primary
│  │  └──────────┘ └──────────┘     │   │  [F] bg: --color-surface-2
│  │                                 │   │  height: 44px chacun
│  │  Poids actuel      Taille       │   │  2 colonnes (form-row)
│  │  ┌───────────┐ ┌───────────┐   │   │
│  │  │  75.5 kg  │ │  180 cm   │   │   │
│  │  └───────────┘ └───────────┘   │   │
│  │                                 │   │
│  │  Mon objectif                   │   │  Select stylisé
│  │  ┌─────────────────────────┐   │   │  radius: --radius-md
│  │  │  Maintien ▾             │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  [conditionnel — si objectif=perte]
│  │  │  Poids visé (kg)        │   │   │  animation fadeIn 200ms
│  │  │  70 kg                  │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  Jour de pesée hebdomadaire     │   │
│  │  ┌─────────────────────────┐   │   │  Select
│  │  │  Lundi ▾                │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Carte BMR/TDEE — temps réel
│  │  Vos besoins calculés           │   │  bg: --color-primary-xlight
│  │                                 │   │  radius: --radius-lg
│  │  BMR           TDEE Objectif    │   │  padding: 16px
│  │  1 847 kcal    2 032 kcal       │   │  DM Sans 700 24px --color-primary
│  │                                 │   │  [update à chaque frappe]
│  │  Protéines cibles : 152 g/j     │   │  Inter 14px --color-text-2
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  btn Primary
│  │  Commencer NutriDash →          │   │  height: 52px, radius: --radius-full
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Comportement BMR/TDEE :**
- Recalcul déclenché à chaque modification d'un champ (debounce 300ms)
- La carte BMR/TDEE s'affiche dès que poids + taille + date naissance + sexe sont renseignés
- Animation : la carte slide-in depuis le bas (translateY 20px → 0, opacity 0 → 1, 250ms)

---

## E-04 — Dashboard

**Route :** hash `#dashboard-view` (onglet 1)
**Accès depuis :** Bottom nav "Accueil", inscription/connexion réussie
**Mène vers :** Modal repas (M-01), Modal activité (M-02), Jour précédent/suivant
**Objectif :** Vue principale quotidienne — voir sa progression et saisir ses repas/activités.

```
┌─────────────────────────────────────────┐  375px
│                                         │
│  ┌─────────────────────────────────┐   │  HEADER
│  │  Lundi 24 juin     Bonjour 👋   │   │  bg: --color-surface
│  │  ←            NutriDash    →    │   │  Inter 13px --color-text-3 (date)
│  └─────────────────────────────────┘   │  DM Sans 600 18px --color-text-1 (titre)
│                                         │  Flèches nav: 40x40px
│                                         │  [← désactivé si jour actuel]
│  padding: 20px                          │
│                                         │
│  ┌─────────────────────────────────┐   │  BARRE PROGRESSION JOURNALIÈRE
│  │  Ma progression  ──────  67%    │   │  bg: --color-surface
│  │  ┌───────────────────────────┐  │   │  radius: --radius-lg
│  │  │████████████░░░░░░░░░░░░░│  │   │  shadow-1, padding: 16px
│  │  └───────────────────────────┘  │   │  barre height: 10px
│  │  1 360 / 2 032 kcal             │   │  fill gradient: --color-primary-light → --color-primary
│  └─────────────────────────────────┘   │  Inter 13px --color-text-2
│                                         │
│  ┌─────────────────────────────────┐   │  CARTE PESÉE — visible si jour = jour pesée
│  │  ⚖️  C'est l'heure de peser !   │   │  bg: --color-primary-xlight
│  │                                 │   │  border: 1px solid --color-primary-light
│  │  ┌──────────────────┐ ┌──────┐  │   │  radius: --radius-lg
│  │  │  75.5 kg         │ │  ✓   │  │   │  padding: 16px
│  │  └──────────────────┘ └──────┘  │   │  input + btn primary compact
│  └─────────────────────────────────┘   │  [masquée si pesée déjà saisie]
│                                         │
│  ┌─────────────────────────────────┐   │  RAPPEL OBJECTIF
│  │  🎯  Sèche — déficit -10%       │   │  bg: transparent
│  └─────────────────────────────────┘   │  Inter 13px --color-text-3, padding: 4px 0
│                                         │
│  ┌──────────────┐ ┌──────────────┐     │  2 ANNEAUX — grille 2 colonnes
│  │              │ │              │     │  Cards bg: --color-surface
│  │   Calories   │ │  Protéines   │     │  radius: --radius-lg
│  │              │ │              │     │  shadow-1, padding: 20px
│  │   ┌──────┐   │ │   ┌──────┐   │     │
│  │   │ 672  │   │ │   │  48  │   │     │  DM Sans 700 32px --color-text-1
│  │   │ kcal │   │ │   │   g  │   │     │  Inter 12px --color-text-3
│  │   │  ⬇   │   │ │   │  ⬇   │   │     │  Anneau: diamètre 120px
│  │   └──────┘   │ │   └──────┘   │     │  fill: --color-accent (cals)
│  │              │ │              │     │  fill: --color-primary (prot)
│  │  Obj 2032    │ │  Obj 152g    │     │  Inter 12px --color-text-3
│  │  Cons 1360   │ │  Cons 48g    │     │
│  └──────────────┘ └──────────────┘     │
│                                         │
│  ┌─────────────┐ ┌─────────────┐       │  BOUTONS ACTIONS — 2 colonnes
│  │  + Repas    │ │ + Activité  │       │  btn Primary (repas)
│  │  🍳         │ │ 🏃          │       │  btn Secondary (activité)
│  └─────────────┘ └─────────────┘       │  height: 52px chacun
│                                         │  radius: --radius-md
│  ─────────────────────────────────────  │  séparateur --color-border
│                                         │
│  Journal du 24 juin                     │  DM Sans 600 16px --color-text-1
│                                         │  padding-top: 16px
│  ┌─────────────────────────────────┐   │  HISTORY ITEM — Repas
│  │  🌅  Petit-déjeuner             │   │  bg: --color-surface, shadow-1
│  │      450 kcal · 35 g prot       │   │  radius: --radius-md, padding: 14px 16px
│  │                          ✏ 🗑   │   │  Inter 14px --color-text-1 (titre)
│  └─────────────────────────────────┘   │  Inter 13px --color-text-3 (détails)
│                                         │  icons edit/delete 20px trailing
│  ┌─────────────────────────────────┐   │  HISTORY ITEM — Activité
│  │  🏃  Musculation                │   │  identique + accent vert
│  │      +300 kcal brûlées          │   │
│  │                          ✏ 🗑   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  EMPTY STATE (si aucun repas)
│  │  ┌─────────────────────────┐   │   │  bg: --color-surface-2
│  │  │  🍽️                     │   │   │  border: 1px dashed --color-border
│  │  │  Aucun repas aujourd'hui│   │   │  radius: --radius-lg
│  │  │                         │   │   │  DM Sans 600 15px --color-text-2
│  │  │  Ajoutez votre premier  │   │   │  Inter 14px --color-text-3
│  │  │  repas pour commencer.  │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐   │  BOTTOM NAVIGATION (fixe)
│  │  🏠      📊      💡      👤     │   │  height: 64px + safe-area
│  │  Accueil  Suivi  Conseils Profil│   │  bg: --color-surface
│  └─────────────────────────────────┘   │  border-top: 1px --color-border
│                                         │  Accueil: --color-primary (actif)
└─────────────────────────────────────────┘
```

**Etats de l'anneau calories :**
```
Normal (< 90%)     Atteint (90-100%)    Dépassé (> 100%)
  ┌──────┐           ┌──────┐              ┌──────┐
  │ 672  │ vert      │ 2010 │ vert foncé   │ 2200 │ orange/rouge
  │ kcal │ fill      │ kcal │ fill plein   │ kcal │ fill --color-danger
  └──────┘           └──────┘              └──────┘
```

---

## M-01 — Modal Ajout / Edition Repas

**Type :** Bottom sheet (mobile) / Modal centré (desktop)
**Accès depuis :** Bouton "+ Repas" (dashboard)
**Objectif :** Saisir type + calories + protéines en moins de 20 secondes.

```
┌─────────────────────────────────────────┐
│  ░░░░░░░░░ [fond sombre flou] ░░░░░░░░ │  backdrop: rgba(26,46,34,0.6)
│                                         │  backdrop-filter: blur(4px)
│                                         │
│  ┌─────────────────────────────────┐   │  BOTTOM SHEET
│  │  ─────  [drag handle]  ─────    │   │  bg: --color-surface
│  │                                 │   │  border-radius: 24px 24px 0 0
│  │  Saisie Journalière        ✕    │   │  shadow-4, padding: 24px
│  │  DM Sans 600 20px               │   │  ✕ btn: 36x36px, bg --color-surface-2
│  │                                 │   │
│  │  Type de repas                  │   │  Label DM Sans 600 14px
│  │  ┌──────────────────────────┐   │   │
│  │  │  🌅 Petit-déjeuner  ▾   │   │   │  Select stylisé
│  │  └──────────────────────────┘   │   │  height: 52px
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │  BLOC IA hint
│  │  │  🤖  Besoin d'estimer ? │   │   │  bg: --color-primary-xlight
│  │  │  Demandez à une IA :    │   │   │  border: 1px --color-primary-light
│  │  │  "100g poulet, 150g riz │   │   │  radius: --radius-md
│  │  │  — calories et          │   │   │  Inter 13px --color-text-2
│  │  │  protéines ?"           │   │   │  [collapsible — expandable tap]
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  Calories (kcal)  Protéines (g) │   │  2 colonnes
│  │  ┌────────────┐ ┌────────────┐  │   │  Inputs numériques
│  │  │   450      │ │    35      │  │   │  height: 56px
│  │  │  kcal      │ │    g       │  │   │  DM Sans 700 24px centré
│  │  └────────────┘ └────────────┘  │   │  [suffix unité affiché en placeholder]
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │  btn Primary
│  │  │  Ajouter le repas   →   │   │   │  height: 52px
│  │  └──────────────────────────┘   │   │  [label = "Modifier" si edit]
│  │                                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Comportement modal :**
- Ouverture : slide-up depuis le bas (translateY 100% → 0), 280ms
- Fermeture : drag-down handle, tap backdrop, ou bouton ✕
- En mode édition (tap ✏) : le select est pré-rempli, les inputs ont les valeurs existantes, le CTA dit "Enregistrer les modifications"

---

## M-02 — Modal Ajout Activité

```
┌─────────────────────────────────────────┐
│  ░░░░ [fond sombre] ░░░░                │
│                                         │
│  ┌─────────────────────────────────┐   │  BOTTOM SHEET
│  │  ─────  [drag handle]  ─────    │   │  identique structure M-01
│  │                                 │   │
│  │  Activité supplémentaire   ✕    │   │
│  │                                 │   │
│  │  Activité                       │   │
│  │  ┌──────────────────────────┐   │   │  Select — liste activités
│  │  │  🏃 Musculation      ▾  │   │   │  + option "Personnalisée"
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │  [conditionnel — si "Personnalisée"]
│  │  │  Description de l'       │   │   │  Input texte
│  │  │  activité                │   │   │
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │  Checkbox "Enregistrer"
│  │  │  ☐  Enregistrer dans    │   │   │
│  │  │     ma liste             │   │   │
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  Calories brûlées               │   │
│  │  ┌──────────────────────────┐   │   │  Input numérique
│  │  │  300          kcal       │   │   │  DM Sans 700 24px centré
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │  btn Primary
│  │  │  Ajouter l'activité  →  │   │   │
│  │  └──────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## M-03 — Modal Objectif Atteint

```
┌─────────────────────────────────────────┐
│  ░░░░ [fond sombre + confettis] ░░░░   │
│                                         │
│  ┌─────────────────────────────────┐   │  Modal centré
│  │                                 │   │  bg: --color-surface
│  │           🎉                    │   │  radius: --radius-xl
│  │        (64px)                   │   │  shadow-4, padding: 32px 24px
│  │                                 │   │  text-align: center
│  │  Objectif Atteint !             │   │  DM Sans 700 24px --color-primary
│  │                                 │   │
│  │  Félicitations ! Tu as atteint  │   │  Inter 15px --color-text-2
│  │  ton objectif de poids.         │   │  line-height: 1.6
│  │  Quel est ton prochain défi ?   │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │  btn Primary
│  │  │  Fixer un nouvel         │   │   │
│  │  │  objectif         →      │   │   │
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │  btn Ghost
│  │  │  Continuer en maintien   │   │   │
│  │  └──────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## E-05 — Suivi / Historique + Graphique Poids

**Route :** hash `#history-view` (onglet 2)
**Accès depuis :** Bottom nav "Suivi"
**Objectif :** Analyser sa performance nutritionnelle et visualiser l'évolution de son poids sur une période.

```
┌─────────────────────────────────────────┐  375px
│                                         │
│  Suivi                                  │  DM Sans 600 22px --color-text-1
│                                         │  padding: 20px 20px 0
│  ┌─────────────────────────────────┐   │  FILTRE PÉRIODE
│  │  ◂  Semaine en cours  ▸         │   │  bg: --color-surface
│  │                                 │   │  radius: --radius-lg
│  │  Du 18 au 24 juin 2026          │   │  shadow-1, padding: 12px 16px
│  └─────────────────────────────────┘   │  Inter 13px --color-text-3
│                                         │  Chips période:
│  ┌──┐ ┌───┐ ┌───┐ ┌────┐ ┌────┐        │
│  │7j│ │30j│ │90j│ │180j│ │365j│        │  Chips scrollables horizontalement
│  └──┘ └───┘ └───┘ └────┘ └────┘        │  actif: bg --color-primary, text blanc
│                                         │  inactif: bg --color-surface-2, text --color-text-2
│                                         │
│  ┌─────────────────────────────────┐   │  BILAN SCORE
│  │  ┌──────────────────────────┐   │   │  bg: --color-primary
│  │  │  Score de la semaine     │   │   │  radius: --radius-xl
│  │  │                          │   │   │  padding: 24px
│  │  │     ●●●            2/3   │   │   │  color: white
│  │  │                          │   │   │  DM Sans 700 36px (score)
│  │  │  Bon travail ! Vos cals  │   │   │  Inter 14px rgba(255,255,255,0.85)
│  │  │  et votre poids sont au  │   │   │
│  │  │  rendez-vous. Continuez  │   │   │
│  │  │  sur les protéines.      │   │   │
│  │  └──────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │  Section "Détails"
│  Détails                                │  DM Sans 600 15px --color-text-2
│                                         │
│  ┌─────────────────────────────────┐   │  CARTE CALORIES
│  │  🔥  Calories                   │   │  bg: --color-surface
│  │                                 │   │  radius: --radius-lg
│  │  ┌───────────┐ ┌───────────┐   │   │  shadow-1, padding: 16px
│  │  │  Consommé │ │  Objectif │   │   │
│  │  │  12 840   │ │  14 224   │   │   │  DM Sans 700 24px --color-text-1
│  │  │   kcal    │ │   kcal    │   │   │  Inter 12px --color-text-3 (label)
│  │  └───────────┘ └───────────┘   │   │
│  │                                 │   │
│  │  Ecart : -1 384 kcal            │   │  Inter 14px 600
│  │  ┌─────────────────────────┐   │   │  bg: --color-primary-xlight
│  │  │  ✓  Dans les objectifs  │   │   │  radius: --radius-sm padding: 8px 12px
│  │  └─────────────────────────┘   │   │  --color-primary, icon check
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  CARTE PROTEINES
│  │  🥩  Protéines                  │   │  identique structure
│  │                                 │   │
│  │  ┌───────────┐ ┌───────────┐   │   │
│  │  │  Consommé │ │  Objectif │   │   │
│  │  │    752 g  │ │  1 064 g  │   │   │
│  │  └───────────┘ └───────────┘   │   │
│  │                                 │   │
│  │  Ecart : -312 g                 │   │  Inter 14px 600
│  │  ┌─────────────────────────┐   │   │  bg: --color-accent-light
│  │  │  ⚠  En dessous de      │   │   │  --color-accent, icon alert
│  │  │     l'objectif          │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  CARTE POIDS — ENRICHIE
│  │  ⚖️  Poids                       │   │  bg: --color-surface
│  │                                 │   │  radius: --radius-lg
│  │  ┌──────────┐  →  ┌──────────┐  │   │  shadow-1, padding: 20px
│  │  │  Début   │     │  Fin     │  │   │
│  │  │ 18/06    │     │ 24/06    │  │   │  Inter 12px --color-text-3
│  │  │ 76.2 kg  │     │ 74.8 kg  │  │   │  DM Sans 700 28px --color-text-1
│  │  └──────────┘     └──────────┘  │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  Badge bilan
│  │  │  -1.4 kg  ↓             │   │   │  bg: --color-primary-xlight
│  │  └─────────────────────────┘   │   │  DM Sans 600 18px --color-primary
│  │                                 │   │
│  │  ─────────────────────────────  │   │  Séparateur --color-border
│  │                                 │   │
│  │  Évolution du poids             │   │  DM Sans 600 14px --color-text-2
│  │                                 │   │  padding-top: 16px
│  │  ┌──────────────────────────┐   │   │
│  │  │                          │   │   │  GRAPHIQUE Chart.js Line
│  │  │   76.2 ●                 │   │   │  height: 200px (mobile)
│  │  │        ╲                 │   │   │  canvas responsive
│  │  │         ●  75.5          │   │   │
│  │  │              ╲           │   │   │  Dataset poids: #52B788
│  │  │               ● 74.8    │   │   │  stroke 2.5px, points 5px
│  │  │ ───────────────────────  │   │   │  fill: rgba(82,183,136,0.08)
│  │  │  Objectif : 70 kg - - - -│   │   │
│  │  │                          │   │   │  Dataset objectif: --color-accent
│  │  │  18/06  20/06  22/06 24/06│  │   │  borderDash [5,3], pas de fill
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  ● Mon poids  ─── Objectif     │   │  Légende inline sous chart
│  │    (vert)         (terracotta)  │   │  Inter 12px --color-text-3
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  CARTE OBJECTIFS (historique)
│  │  🎯  Objectifs                  │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  Chips chronologiques
│  │  │  01/06  Perte de poids  │   │   │
│  │  └─────────────────────────┘   │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │  01/03  Maintien        │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  BOTTOM NAV (fixe)
│  │  🏠      📊      💡      👤     │   │
│  │  Accueil  Suivi  Conseils Profil│   │  Suivi: --color-primary (actif)
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Spécifications Chart.js complètes :**

```javascript
// Config Chart.js — Graphique poids
{
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Mon poids',
        data: weighIns, // [{x: ISO_date, y: kg}]
        borderColor: '#52B788',
        backgroundColor: 'rgba(82,183,136,0.08)',
        fill: true,
        tension: 0.3,           // courbe légèrement lissée
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#52B788',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#52B788',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      },
      {
        // Dataset objectif — visible si goal=loss && targetWeight
        label: 'Objectif',
        data: targetLine, // ligne horizontale à targetWeight
        borderColor: '#E07A5F',
        backgroundColor: 'transparent',
        fill: false,
        borderDash: [5, 3],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        display: false  // légende custom en HTML sous le chart
      },
      tooltip: {
        backgroundColor: '#1A2E22',
        titleFont: { family: 'DM Sans', size: 13, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            // format: "Lun 24 juin"
            return new Date(items[0].raw.x)
              .toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'long' });
          },
          label: (ctx) => ` ${ctx.raw.y.toFixed(1)} kg`
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: { day: 'dd/MM' }
        },
        grid: { color: 'rgba(226,232,223,0.6)', drawBorder: false },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#8BA898',
          maxTicksLimit: 7
        }
      },
      y: {
        grid: { color: 'rgba(226,232,223,0.6)', drawBorder: false },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#8BA898',
          callback: (v) => `${v} kg`
        }
      }
    }
  }
}
```

**État vide (aucune pesée) :**
```
┌─────────────────────────────────┐
│  ─────────────────────────────  │
│                                 │
│  Aucune pesée enregistrée       │  DM Sans 600 15px --color-text-2
│  sur cette période.             │
│                                 │
│  Rendez-vous le lundi sur le   │  Inter 14px --color-text-3
│  tableau de bord pour saisir   │
│  votre poids.                   │
│                                 │
└─────────────────────────────────┘
```

---

## E-06 — Conseils

**Route :** hash `#advice-view` (onglet 3)
**Objectif :** Proposer du contenu éducatif nutrition accessible, lisible d'une main, sans défilement excessif.

```
┌─────────────────────────────────────────┐
│                                         │
│  Conseils                               │  DM Sans 600 22px --color-text-1
│  Nutrition & Bien-être                  │  Inter 14px --color-text-3
│                                         │
│  ┌─────────────────────────────────┐   │  TIP DU JOUR (random)
│  │  💡 Le saviez-vous ?            │   │  bg: --color-primary
│  │                                 │   │  radius: --radius-xl, padding: 20px
│  │  L'œil est souvent un           │   │  DM Sans 600 14px blanc
│  │  mauvais juge. Peser ses        │   │  Inter 14px rgba(255,255,255,0.85)
│  │  aliments 3 semaines suffit     │   │  [contenu rotatif au rechargement]
│  │  à calibrer le cerveau.         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐   │  Accordion item 1
│  │  🍎  Nutrition & Base      ❯    │   │  bg: --color-surface
│  └─────────────────────────────────┘   │  radius: --radius-lg, shadow-1
│                                         │  padding: 16px 20px, height: 60px
│  ┌─────────────────────────────────┐   │  [tap → expand, icône rotate 90°]
│  │  🍎  Nutrition & Base      ∨    │   │  ÉTAT OUVERT:
│  │  ─────────────────────────────  │   │  bg: --color-primary-xlight
│  │  Quels aliments privilégier ?   │   │  border: 1px --color-primary-light
│  │  • Protéines : Poulet, œufs…   │   │  radius: --radius-xl
│  │  • Glucides : Riz complet…      │   │  contenu: Inter 14px --color-text-2
│  │  • Graisses : Avocat, noix…     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Accordion item 2
│  │  💧  Hydratation           ❯    │   │  idem, fermé
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Accordion item 3
│  │  😴  Sommeil & Récupération ❯   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Accordion item 4
│  │  🧠  Micro-nutriments      ❯    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Accordion item 5
│  │  🍎  Collations intelligentes ❯ │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Accordion item 6
│  │  ⚖️  Peser ses aliments    ❯    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Accordion item 7
│  │  ⏱️  Techniques rapides    ❯    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  Accordion item 8
│  │  🧠  Explications techniques ❯  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  BOTTOM NAV
│  │  🏠      📊      💡      👤     │   │  Conseils: --color-primary (actif)
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Comportement accordion :**
- Un seul accordion ouvert à la fois (ferme l'ouvert si on en tap un autre)
- Animation : height 0 → auto (via max-height transition), opacity 0 → 1, 200ms ease-out
- L'icône ❯ tourne 90° à l'ouverture (transition 200ms)

---

## E-07 — Profil / Paramètres

**Route :** hash `#profile-view` (onglet 4)
**Objectif :** Modifier le profil physiologique + gérer ses données personnelles (export RGPD + suppression compte).

```
┌─────────────────────────────────────────┐
│                                         │
│  Profil                                 │  DM Sans 600 22px --color-text-1
│                                         │
│  ┌─────────────────────────────────┐   │  HEADER COMPTE
│  │  ●  julien@gmail.com            │   │  bg: --color-surface
│  │     [avatar initiale]           │   │  radius: --radius-lg, shadow-1
│  │                    [Déconnexion]│   │  padding: 16px 20px
│  └─────────────────────────────────┘   │  avatar: 40x40px rond, bg --color-primary-xlight
│                                         │  initiale DM Sans 600 18px --color-primary
│                                         │  btn Déconnexion: ghost small
│  ─────────────────────────────────────  │
│  Mon profil physiologique               │  DM Sans 600 15px --color-text-2
│                                         │
│  ┌─────────────────────────────────┐   │  FORMULAIRE
│  │                                 │   │  bg: --color-surface
│  │  Date de naissance              │   │  radius: --radius-xl
│  │  ┌─────────────────────────┐   │   │  shadow-1, padding: 24px
│  │  │  📅  01/01/1997         │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  Sexe                           │   │
│  │  ┌──────────┐ ┌──────────┐     │   │  Segmented control
│  │  │  Homme   │ │  Femme   │     │   │
│  │  └──────────┘ └──────────┘     │   │
│  │                                 │   │
│  │  Poids          Taille          │   │
│  │  ┌───────────┐ ┌───────────┐   │   │
│  │  │  75.5 kg  │ │  180 cm   │   │   │
│  │  └───────────┘ └───────────┘   │   │
│  │                                 │   │
│  │  Objectif                       │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │  Perte de poids ▾       │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  [conditionnel]
│  │  │  Poids visé : 70 kg     │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  Jour de pesée                  │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │  Lundi ▾                │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  Carte BMR/TDEE inline
│  │  │  BMR : 1 847 kcal       │   │   │  bg: --color-primary-xlight
│  │  │  TDEE : 2 032 kcal      │   │   │  radius: --radius-md, padding: 12px
│  │  └─────────────────────────┘   │   │  Inter 14px --color-text-2
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  btn Primary
│  │  │  Enregistrer le profil  │   │   │
│  │  └─────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│  Mes données personnelles               │  DM Sans 600 15px --color-text-2
│                                         │
│  ┌─────────────────────────────────┐   │  SECTION DONNÉES RGPD
│  │  Conformément au RGPD, vous     │   │  bg: --color-surface
│  │  pouvez accéder, exporter et    │   │  radius: --radius-xl, shadow-1
│  │  supprimer vos données.         │   │  padding: 24px
│  │                                 │   │  Inter 14px --color-text-2
│  │  ─────────────────────────────  │   │
│  │  Export de vos données          │   │  DM Sans 600 14px --color-text-1
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  btn Ghost
│  │  │  ⬇  Exporter en JSON   │   │   │  height: 48px
│  │  └─────────────────────────┘   │   │  radius: --radius-md
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  btn Ghost
│  │  │  ⬇  Exporter en CSV    │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  ─────────────────────────────  │   │  séparateur --color-border
│  │                                 │   │
│  │  ⚠ Zone critique                │   │  DM Sans 600 13px --color-danger
│  │                                 │   │  uppercase, letter-spacing
│  │  La suppression est             │   │  Inter 13px --color-text-3
│  │  définitive et irréversible.    │   │
│  │  Toutes vos données seront      │   │
│  │  effacées.                      │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │  btn Danger Ghost
│  │  │  🗑  Supprimer mon      │   │   │  height: 48px
│  │  │       compte            │   │   │  bg: --color-danger-light
│  │  └─────────────────────────┘   │   │  color: --color-danger
│  │                                 │   │  border: 1px --color-danger
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  BOTTOM NAV
│  │  🏠      📊      💡      👤     │   │  Profil: --color-primary (actif)
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Etats boutons export :**
```
IDLE              LOADING            SUCCÈS
┌───────────────┐ ┌───────────────┐  ┌───────────────┐
│ ⬇ Exporter   │ │ ◌ Génération… │  │ ✓ Téléchargé !│
│   en JSON     │ │   (spinner)   │  │               │
└───────────────┘ └───────────────┘  └───────────────┘
ghost             disabled           bg: --color-primary-xlight
                  opacity 0.6        color: --color-primary
                                     durée: 2s puis retour idle
```

---

## M-04 — Modal Confirmation Suppression de Compte

**Type :** Modal centré (bloquant)
**Accès depuis :** Bouton "Supprimer mon compte" (E-07)
**Objectif :** Obtenir une confirmation explicite et ralentie avant suppression irréversible.

```
┌─────────────────────────────────────────┐
│                                         │
│  ░░░░ [fond sombre — backdrop] ░░░░     │  rgba(26,46,34,0.75)
│       [backdrop-filter: blur(6px)]      │
│                                         │
│        ┌─────────────────────────┐      │  MODAL CENTRÉ
│        │                         │      │  bg: --color-surface
│        │   ┌─────────────────┐   │      │  radius: --radius-xl
│        │   │       ⚠️         │   │      │  shadow-4, width: 335px
│        │   │   (48px rouge)   │   │      │  padding: 32px 24px
│        │   └─────────────────┘   │      │  text-align: center
│        │                         │      │
│        │  Supprimer votre        │      │  DM Sans 700 20px --color-danger
│        │  compte ?               │      │
│        │                         │      │
│        │  ┌─────────────────┐   │      │  bloc avertissement
│        │  │ ⚠ Cette action  │   │      │  bg: --color-danger-light
│        │  │ est irréversible│   │      │  border-left: 3px solid --color-danger
│        │  │ Toutes vos      │   │      │  radius: --radius-sm
│        │  │ données seront  │   │      │  padding: 12px 14px
│        │  │ définitivement  │   │      │  Inter 13px --color-danger
│        │  │ supprimées.     │   │      │  text-align: left
│        │  └─────────────────┘   │      │
│        │                         │      │
│        │  Pour confirmer,        │      │  Inter 14px 600 --color-text-1
│        │  tapez SUPPRIMER :      │      │  text-align: left
│        │                         │      │
│        │  ┌─────────────────┐   │      │  Input confirmation
│        │  │  SUPPRIMER      │   │      │  bg: --color-surface-2
│        │  └─────────────────┘   │      │  height: 52px
│        │                         │      │  DM Sans 600 16px centré
│        │                         │      │  placeholder: "SUPPRIMER"
│        │  ┌─────────────────┐   │      │  btn Danger — DISABLED par défaut
│        │  │  Supprimer      │   │      │  height: 52px
│        │  │  définitivement │   │      │  opacity 0.4 si input ≠ "SUPPRIMER"
│        │  └─────────────────┘   │      │  opacity 1 et actif si match exact
│        │                         │      │
│        │  ┌─────────────────┐   │      │  btn Ghost
│        │  │     Annuler     │   │      │  height: 48px
│        │  └─────────────────┘   │      │  --color-text-2
│        │                         │      │
│        └─────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

**Règles critiques de ce modal :**
- PAS de bouton ✕ (fermeture uniquement via "Annuler")
- PAS de fermeture au tap du backdrop
- La touche Escape ferme le modal et revient au Profil
- Input `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"` pour éviter la suggestion "SUPPRIMER" par le clavier
- "SUPPRIMER" en majuscules exactes — toute autre casse laisse le bouton désactivé

**Etats du CTA "Supprimer définitivement" :**
```
INPUT VIDE          INPUT PARTIEL       INPUT = "SUPPRIMER"   LOADING
──────────────────  ──────────────────  ──────────────────     ─────────────────
┌──────────────┐    ┌──────────────┐    ┌──────────────┐        ┌──────────────┐
│ Supprimer    │    │ Supprimer    │    │ Supprimer    │        │ ◌ Suppression│
│ définitiv... │    │ définitiv... │    │ définitiv... │        │   en cours…  │
└──────────────┘    └──────────────┘    └──────────────┘        └──────────────┘
bg: --color-danger  idem                bg: --color-danger      idem
opacity: 0.4        opacity: 0.4        opacity: 1              opacity: 1
cursor: not-allowed                     cursor: pointer         cursor: not-allowed
                                        shadow-1                spinner blanc 20px
```

**Séquence après suppression réussie :**
1. Spinner dans le bouton "Suppression en cours…"
2. Suppression de toutes les collections PocketBase (users/profiles/meals/activities_log/weigh_ins/daily_stats/goal_history)
3. `localStorage.clear()`
4. `authStore.clear()`
5. Redirect vers Landing page
6. Toast en bas : "Votre compte a été supprimé." (bg: --color-surface, border-left vert, 4 secondes)

**En cas d'erreur de suppression :**
```
┌─────────────────────────────────┐
│  ✕  La suppression a échoué.    │  bg: --color-danger-light
│     Vérifiez votre connexion    │  border-left: 3px --color-danger
│     et réessayez.               │  Inter 13px --color-danger
│                      [Réessayer]│  lien --color-danger 13px 600
└─────────────────────────────────┘
```

---

# PARTIE 4 — FLUX UX TRANSVERSAUX

---

## Flux 4.1 — Onboarding complet (premier accès)

```
Landing Page
  │
  ▼ [CTA "Démarrer gratuitement"]
  │
Auth — Inscription
  │  Saisie email + mdp + confirm
  │  Coche checkbox RGPD ← CHECKPOINT OBLIGATOIRE
  │  Clic "Créer mon compte"
  │  Spinner "Création en cours…"
  │  PocketBase: users.create() + authWithPassword()
  │
  ▼ [Redirect automatique]
  │
Onboarding Profil (E-03)
  │  Saisie date naissance / sexe / poids / taille
  │  Sélection objectif + jour pesée
  │  BMR/TDEE s'affichent en temps réel
  │  ★ AHA MOMENT : l'utilisateur voit ses besoins personnalisés
  │  Clic "Commencer NutriDash →"
  │
  ▼ [Redirect Dashboard]
  │
Dashboard — Jour J (E-04)
  │  Cercles à 0%
  │  Objectif calorique affiché
  │  ★ 2e AHA MOMENT : clic "+ Repas" → cercles bougent après validation
  │
  ▼ [Activation complète]
```

---

## Flux 4.2 — Saisie quotidienne (utilisateur actif)

```
Dashboard (E-04)
  │
  ▼ [Clic "+ Repas"]
  │
Modal repas (M-01) — Bottom sheet slide-up
  │  Sélection type (Petit-déj pré-sélectionné selon heure)
  │  Saisie calories + protéines
  │  Clic "Ajouter le repas"
  │
  ▼ [Bottom sheet se ferme — animation slide-down]
  │
Dashboard mis à jour
  │  Cercles animés vers nouvelle valeur (0.6s ease-out)
  │  Item ajouté dans le journal
  │  Barre progression mise à jour
  │
  [Si poids cible atteint]
  ▼ [Modal objectif atteint (M-03)]
```

---

## Flux 4.3 — Authentification complète

**Connexion :**
```
Auth connexion → email + mdp → PB authWithPassword() → Dashboard
```

**Reset mot de passe :**
```
Auth connexion → tap "Mot de passe oublié ?" → Auth reset
  → email → PB requestPasswordReset() → message succès inline
  → tap "Retour à la connexion"
```

**Déconnexion :**
```
Profil (E-07) → tap "Déconnexion" → PB authStore.clear() + localStorage.clear() → Landing
```

---

## Flux 4.4 — Suppression de compte (RGPD)

```
Profil (E-07)
  │ Scroll jusqu'à "Zone critique"
  │ Lecture du warning
  │ Tap "Supprimer mon compte"
  │
  ▼ [Modal M-04 — backdrop bloquant]
  │
Modal confirmation
  │ Lecture avertissement
  │ Saisie "SUPPRIMER" (majuscules exactes)
  │ Bouton danger s'active
  │ Tap "Supprimer définitivement"
  │
  ▼ [Spinner + appels API]
  │
  │ DELETE: meals, activities_log, weigh_ins,
  │         daily_stats, goal_history, profiles, users
  │ localStorage.clear()
  │ authStore.clear()
  │
  ▼ [Redirect Landing + toast confirmation]

Durée cible : < 30 secondes après tap du bouton
```

---

## Flux 4.5 — Export données (RGPD portabilité)

```
Profil (E-07)
  │ Section "Export de vos données"
  │ Tap "Exporter en JSON" ou "Exporter en CSV"
  │
  ▼ [Bouton passe en état loading]
  │
  │ Fetch toutes les collections user
  │ Génération blob JSON ou CSV
  │ URL.createObjectURL(blob)
  │ Click programmatique sur <a download>
  │
  ▼ [Bouton passe en état succès 2s]
  │
  ▼ [Bouton revient en état idle]

Fichier JSON : nutridash-export-YYYY-MM-DD.json
Fichier CSV  : nutridash-export-YYYY-MM-DD.csv
```

---

## Flux 4.6 — Gestion d'erreur global

| Situation | Comportement |
|---|---|
| Session expirée (JWT 24h) | Redirect silencieuse → Auth connexion + banner "Votre session a expiré." |
| Erreur 500 PocketBase | Toast rouge 4s en bas : "Erreur serveur. Réessayez dans quelques instants." |
| Perte de connexion | Données localStorage disponibles. Toast info 4s : "Mode hors-ligne — vos données locales sont disponibles." |
| Hash/route invalide | Redirect Landing page |
| Données localStorage corrompues | Purge + banner info : "Données locales réinitialisées. Reconnectez-vous." |
| Timeout API (> 10s) | Message inline : "La requête a pris trop de temps." + bouton "Réessayer" |

---

# PARTIE 5 — INVENTAIRE DES COMPOSANTS

| ID | Composant | Ecrans | Variants | Priorité |
|---|---|---|---|---|
| C-01 | Button | Tous | Primary / Secondary / Ghost / Danger / Danger Ghost / Disabled | MVP |
| C-02 | Input (text, email, number, date, password) | Auth, Profil, Modales | Default / Focus / Error / Disabled | MVP |
| C-03 | Input password (eye toggle) | Auth | Default / Show / Hide | MVP |
| C-04 | Select stylisé | Profil, Modales | Default / Focus / Disabled | MVP |
| C-05 | Segmented control | Profil | 2 options | MVP |
| C-06 | Card | Tous | Default / Colored / Accent / Elevated / Glass | MVP |
| C-07 | Bottom sheet (modal mobile) | M-01, M-02 | Normal / Bloquant | MVP |
| C-08 | Modal centré | M-03, M-04 | Info / Critique (sans ✕) | MVP |
| C-09 | Bottom navigation | App | 4 onglets / actif / inactif | MVP |
| C-10 | Anneau de progression | Dashboard | Normal / Atteint / Dépassé | MVP |
| C-11 | Barre de progression | Dashboard | 0–100% / dépassé | MVP |
| C-12 | History item | Dashboard | Repas / Activité / Edit / Delete | MVP |
| C-13 | Empty state | Dashboard, Suivi | Avec CTA / Sans CTA | MVP |
| C-14 | Error banner / Success banner | Auth, Formulaires | Error / Success / Info / Warning | MVP |
| C-15 | Toast | Global | Success / Error / Info | MVP |
| C-16 | Accordion | Conseils | Fermé / Ouvert | Should Have |
| C-17 | Chips période (filtre) | Suivi | Actif / Inactif | MVP |
| C-18 | Score bilan | Suivi | 3/3 / 2/3 / <2/3 | Should Have |
| C-19 | Avatar initiale | Profil | Défaut vert | MVP |
| C-20 | Checkbox RGPD | Auth inscription | Décoché / Coché | RGPD |
| C-21 | Bouton export (3 états) | Profil | Idle / Loading / Succès | RGPD |
| C-22 | Graphique linéaire Chart.js | Suivi | Avec données / Empty / Loading skeleton | V1+ |
| C-23 | Input confirmation "SUPPRIMER" | M-04 | Vide / Partiel / Match | RGPD |
| C-24 | Carte BMR/TDEE inline | Profil, Onboarding | Normal | MVP |

---

# PARTIE 6 — PROMPT DESIGNER

```markdown
## Prompt Design — NutriDash V2 (Refonte)

Tu es un designer UX/UI expert en applications mobile santé et nutrition.
Crée les maquettes haute-fidélité de NutriDash dans un style moderne
et épuré, adapté à un public de sportifs autonomes et de personnes
soucieuses de leur nutrition.

### Contexte produit
Application web SPA (JavaScript Vanilla). Pas de base de données
alimentaire — l'utilisateur saisit directement calories et protéines.
Calcul des besoins via Mifflin-St Jeor. Abonnement 10€/mois, 14 jours
d'essai gratuit.

### Persona prioritaire
Julien, 27 ans, développeur web, musculation 4x/semaine. Mobile-first,
impatient, intolèrant aux apps lentes ou surchargées. Saisie < 20
secondes par repas.

### Direction artistique
Style : Soft Modern — Minimalisme organique, naturel, précis.
Palette :
  Primaire (CTA, actif) : #2D6A4F (vert forêt)
  Primaire light (hover) : #52B788
  Primaire xlight (surface) : #D8F3DC
  Accent (calories, énergie) : #E07A5F (terracotta)
  Accent light (surface) : #FAE8E4
  Fond global : #F7F8F3 (blanc cassé naturel)
  Surface carte : #FFFFFF
  Surface 2 (input) : #F0F4EE
  Texte 1 (principal) : #1A2E22
  Texte 2 (secondaire) : #4A6358
  Texte 3 (discret) : #8BA898
  Danger : #C1121F
Typographie :
  Headings : DM Sans (Google Fonts) — weights 400 500 600 700
  UI/Body : Inter (Google Fonts) — weights 400 500 600 700
Ombres : douces, teintées vert foncé (pas de noir pur)
Radius : 8px (chips) / 12px (inputs, boutons) / 16px (cards) / 24px (xl)
Bordures : optionnelles, 1–1.5px, #E2E8DF (subtil)
Icônes : Lucide, stroke-width 1.75, currentColor
Animations : 150–280ms, ease-out, prefers-reduced-motion respecté

### Ce qui est INTERDIT dans ce design
- Bordures épaisses noires (neo-brutalist)
- Hard shadows décalées (ombres portées décalées type 4px 4px 0 black)
- Fond crème avec dots pattern
- Police Fredoka ou Nunito
- Dégradés arc-en-ciel ou palettes pastel "wellness"
- Emojis comme icônes UI (seulement dans le contenu éducatif)

### Référence WCAG AA obligatoire
Tous les couples texte/fond doivent respecter 4.5:1 minimum.

### Ecran 1 — Dashboard (E-04)
Mobile 375px. Référence de l'identité visuelle.

Structure (du haut vers le bas) :
1. Header : date + navigation jours (← →), hauteur 60px
2. Barre progression journalière (card) : titre + % + barre gradient
3. Carte pesée (conditionnelle) : input kg + btn valider
4. Rappel objectif : chip discret
5. 2 anneaux côte à côte : Calories (terracotta, #E07A5F) + Protéines (vert, #2D6A4F)
   — diamètre 120px, valeur numérique DM Sans 700 32px
6. 2 boutons actions : "+ Repas" (primary) + "+ Activité" (secondary)
7. Journal du jour : liste d'items (repas + activités)
8. Bottom navigation fixe : 4 onglets (Accueil actif)

Contraintes :
- Mobile-first 375px
- Bottom nav height 64px + safe area
- Zones tactiles ≥ 44px
- WCAG AA minimum

### Ecran 2 — Bottom sheet Ajout repas (M-01)
Overlay sombre + bottom sheet radius 24px 24px 0 0.
Drag handle + titre + ✕ + select type repas + 2 inputs numériques (cals/prot) + CTA.

### Ecran 3 — Modal suppression compte (M-04)
Modal centré 335px, bloquant. Pas de ✕. Icône alerte rouge, warning,
input confirmation "SUPPRIMER", 2 boutons (danger + annuler ghost).

Une fois les 3 écrans validés, enchaîne avec :
E-02b (inscription + RGPD) → E-05 (Suivi + graphique) → E-07 (Profil complet).
Réutilise strictement les tokens de cette spec sur chaque écran.
```

---

# PARTIE 7 — CHECKLIST QUALITÉ

| Critère | Statut |
|---|---|
| Tous les écrans MVP ont une fiche wireframe ASCII complète | ✓ |
| Chaque écran a un objectif principal en 1 phrase | ✓ |
| Chaque composant a ses états documentés | ✓ |
| Les flux transversaux sont couverts (onboarding, auth, RGPD) | ✓ |
| Les 4 fonctionnalités nouvelles sont spécifiées | ✓ (E-02b RGPD / E-05 graphique / E-07 export / M-04 suppression) |
| Le design system est complet (tokens, composants, animations) | ✓ |
| Mobile-first 375px sur tous les wireframes | ✓ |
| WCAG AA vérifiés sur les couples couleur principaux | ✓ |
| Zones tactiles ≥ 44px documentées | ✓ |
| Le prompt Designer est exploitable directement | ✓ |
| Le style est cohérent avec l'univers santé/nutrition | ✓ |
| Aucune reproduction du neo-brutalist existant | ✓ |

---

*NutriDash — Design System & Wireframes V2 — Refonte complète*
*24 juin 2026 — Agent Designer*
*Style : Soft Modern (vert forêt + terracotta + blanc cassé / DM Sans + Inter)*
