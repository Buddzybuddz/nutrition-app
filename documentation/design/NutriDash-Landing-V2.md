# NutriDash — Wireframe Landing Page V2

**Version** : 2.0  
**Date** : 2026-06-25  
**Scope** : Refonte complète de la landing page (`#landing-page`)  
**Contrainte principale** : Vanilla JS + vanilla CSS, prefix `lp-`, zéro image externe, zéro framework CSS

---

## DESIGN SYSTEM — LANDING V2

### Palette de couleurs

| Token CSS                  | Valeur hex | Rôle                                     |
|----------------------------|------------|------------------------------------------|
| `--color-primary`          | `#2D6A4F`  | Vert forêt — boutons primaires, icônes   |
| `--color-primary-light`    | `#52B788`  | Vert clair — hover, accents subtils      |
| `--color-primary-xlight`   | `#D8F3DC`  | Vert très clair — tags, badges discrets  |
| `--color-accent`           | `#E07A5F`  | Terracotta — numéros process, emphases   |
| `--color-accent-light`     | `#FAE8E4`  | Terracotta pâle — fond badge pricing     |
| `--color-bg`               | `#F7F8F3`  | Fond unique de toute la landing          |
| `--color-surface`          | `#FFFFFF`  | Fond des cartes et composants flottants  |
| `--color-surface-2`        | `#F0F4EE`  | Fond alternatif très doux (hover cards)  |
| `--color-border`           | `#E2E8DF`  | Bordures légères                         |
| `--color-border-strong`    | `#C7D4C3`  | Bordures accentuées                      |
| `--color-text-1`           | `#1A2E22`  | Texte principal (titres h1, h2)          |
| `--color-text-2`           | `#4A6358`  | Texte secondaire (sous-titres, corps)    |
| `--color-text-3`           | `#8BA898`  | Texte tertiaire (meta, captions)         |

**Règle absolue** : `--color-bg` (#F7F8F3) est le fond de TOUTE la page.  
Seule exception autorisée : le bloc CTA final utilise `--color-primary` (#2D6A4F) en fond.  
Aucun autre bloc ne doit avoir un fond de couleur différente.

---

### Typographie

| Token CSS         | Police              | Usage                               | Graisse       |
|-------------------|---------------------|-------------------------------------|---------------|
| `--font-heading`  | DM Sans             | H1, H2, H3, boutons, logo           | 600–700       |
| `--font-main`     | Inter               | Corps de texte, listes, meta        | 400–500       |

**Échelle typographique landing** :

| Classe suggérée      | font-size      | line-height | font-weight | Usage                    |
|----------------------|----------------|-------------|-------------|--------------------------|
| `.lp-display`        | clamp(3rem, 6vw, 5rem) | 1.1  | 700         | H1 hero                  |
| `.lp-heading-2`      | clamp(2rem, 3.5vw, 2.75rem) | 1.2 | 600     | H2 sections              |
| `.lp-heading-3`      | 1.25rem (20px) | 1.3         | 600         | H3 cartes                |
| `.lp-body-lg`        | 1.125rem (18px) | 1.65       | 400         | Sous-titres hero         |
| `.lp-body`           | 1rem (16px)    | 1.6         | 400         | Texte courant            |
| `.lp-body-sm`        | 0.875rem (14px) | 1.5        | 400         | Meta, captions, listes   |
| `.lp-label`          | 0.8125rem (13px) | 1.4       | 500         | Badges, tags             |

---

### Tokens d'espacement

Grille de base : **8px**

| Token              | Valeur | Usage                             |
|--------------------|--------|-----------------------------------|
| `--sp-1`           | 8px    | Micro-espacement interne          |
| `--sp-2`           | 16px   | Gap interne composants            |
| `--sp-3`           | 24px   | Padding cartes                    |
| `--sp-4`           | 32px   | Gap entre éléments de section     |
| `--sp-5`           | 48px   | Padding section mobile            |
| `--sp-6`           | 64px   | Padding section desktop           |
| `--sp-7`           | 96px   | Espacement entre sections desktop |
| `--sp-8`           | 128px  | Espacement hero desktop           |

---

### Tokens de radius

| Token              | Valeur | Usage                            |
|--------------------|--------|----------------------------------|
| `--lp-radius-sm`   | 8px    | Badges, tags, inputs             |
| `--lp-radius-md`   | 12px   | Boutons                          |
| `--lp-radius-lg`   | 16px   | Cartes features                  |
| `--lp-radius-xl`   | 24px   | Carte pricing, grands composants |
| `--lp-radius-2xl`  | 32px   | Hero graphique CSS               |
| `--lp-radius-full` | 9999px | Badges pill, indicateurs ronds   |

---

### Ombres

| Token           | Valeur CSS                                                                 | Usage           |
|-----------------|----------------------------------------------------------------------------|-----------------|
| `--lp-shadow-1` | `0 1px 3px rgba(45,106,79,0.06), 0 1px 2px rgba(45,106,79,0.04)`         | Repos cartes    |
| `--lp-shadow-2` | `0 4px 12px rgba(45,106,79,0.08), 0 2px 4px rgba(45,106,79,0.04)`        | Hover cartes    |
| `--lp-shadow-3` | `0 8px 24px rgba(45,106,79,0.12), 0 4px 8px rgba(45,106,79,0.06)`        | Carte pricing   |

---

### Style UI

**Style retenu** : Soft Modern Premium  
- Fond unique et aéré — pas d'alternance de blocs colorés  
- Hiérarchie par l'espacement et la typographie, non par la couleur de fond  
- Cartes blanches avec ombre douce sur fond `#F7F8F3`  
- Pas d'images externes — graphique hero pur CSS, icônes SVG inline  
- Transitions douces 200–300ms, ease-out pour entrée, ease-in pour sortie  
- Séparateurs : espace vertical généreux (80–96px entre sections) suffit — pas de `<hr>` visible  
- Un seul bloc de couleur de fond différente : le CTA final en `#2D6A4F`

---

## SCREEN MAP

### Arborescence

```
[Landing Page — /]
├── Header (sticky)
├── Section Hero
├── Section Features (3 cartes)
├── Section Process (3 étapes)
├── Section Pricing (1 carte centrée)
├── Section CTA Final
└── Footer
```

Toutes les sections appartiennent à une page unique (SPA, pas de routing).  
Le clic sur les CTA appelle `showAuthPage(true)` (inscription) ou `showAuthPage(false)` (connexion).

---

## WIREFRAMES DÉTAILLÉS — SECTION PAR SECTION

---

## S-01 — HEADER

**Classe** : `.lp-header`  
**Comportement** : sticky top, fond `--color-bg` (#F7F8F3) avec légère transparence + backdrop-filter blur(8px) au scroll  
**Z-index** : 100

### Layout ASCII

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo "NutriDash"]                    [Bouton "Connexion"]     │
│  lp-logo (DM Sans 600, 20px)           lp-btn-ghost             │
└─────────────────────────────────────────────────────────────────┘

Desktop : max-width 1200px, centré, padding H 40px
Mobile  : padding H 20px, hauteur 56px
```

### Composants

**C-01 — Logo `.lp-logo`**
- Type : texte pur, pas d'image
- Contenu : `Nutri` en `--color-text-1` + `Dash` en `--color-primary`
- Font : DM Sans, 600, 20px
- Comportement : clic → scroll vers le haut (`window.scrollTo({top:0})`)
- Pas de hover (logo non-lien conventionnel)

**C-02 — Bouton Connexion `.lp-btn-ghost`**
- Type : button
- Label : "Connexion"
- Action : `onclick="showAuthPage(false)"`
- Style : fond transparent, border 1.5px solid `--color-border-strong`, texte `--color-text-1`, radius `--lp-radius-md`
- Padding : 10px 20px
- Hover : fond `--color-surface-2`, border `--color-primary`, texte `--color-primary`
- Transition : 200ms ease-out

### Spécifications CSS

```css
.lp-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 64px;
  background: rgba(247, 248, 243, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid transparent;
  transition: border-color 200ms ease;
}

/* Au scroll : ajouter via JS la classe .lp-header--scrolled */
.lp-header--scrolled {
  border-bottom-color: var(--color-border);
}

@media (max-width: 768px) {
  .lp-header { padding: 0 20px; height: 56px; }
}
```

---

## S-02 — HERO

**Classe** : `.lp-hero`  
**Objectif** : capter l'attention immédiatement, communiquer la valeur en 5 secondes, déclencher le clic CTA

### Layout ASCII — Desktop (> 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  padding-top: 96px  padding-bottom: 96px                       │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │  CONTENU TEXTE (55%)     │  │  GRAPHIQUE CSS (45%)     │    │
│  │                          │  │                          │    │
│  │  H1 : "Maîtrisez votre   │  │  ┌────────────────────┐ │    │
│  │  nutrition,              │  │  │  MOCK-UI CSS       │ │    │
│  │  au gramme près."        │  │  │  Card blanche      │ │    │
│  │                          │  │  │  radius 16px       │ │    │
│  │  Sous-titre 18px         │  │  │  ombre douce       │ │    │
│  │  (2 lignes max)          │  │  │                    │ │    │
│  │                          │  │  │  [Barre kcal CSS]  │ │    │
│  │  [CTA Primaire]          │  │  │  [Macro pills CSS] │ │    │
│  │                          │  │  │  [Stats row CSS]   │ │    │
│  │  ✓ 14j gratuits          │  │  └────────────────────┘ │    │
│  │  ✓ Sans engagement       │  │                          │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layout ASCII — Mobile (< 768px)

```
┌──────────────────────────────┐
│  padding: 64px 20px 48px     │
│                              │
│  H1 (clamp 2.5rem→3.5rem)   │
│                              │
│  Sous-titre (16px)           │
│                              │
│  [CTA pleine largeur]        │
│                              │
│  ✓ 14j gratuits · ✓ Sans eng│
│                              │
│  ┌──────────────────────┐    │
│  │  MOCK-UI CSS         │    │
│  │  (version compacte)  │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

### Composants

**C-03 — Titre H1 `.lp-hero-title`**
- Contenu : "Maîtrisez votre nutrition, au gramme près."
- Font : DM Sans 700, clamp(2.75rem, 5vw, 4.5rem)
- Couleur : `--color-text-1`
- Line-height : 1.08
- Max-width : 560px
- Note : la virgule crée une respiration visuelle — ne pas supprimer

**C-04 — Sous-titre `.lp-hero-subtitle`**
- Contenu : "Calculez vos besoins caloriques réels, suivez vos repas et atteignez vos objectifs sans approximation."
- Font : Inter 400, 18px (clamp 16px→18px)
- Couleur : `--color-text-2`
- Line-height : 1.65
- Max-width : 480px
- Margin-top : 20px

**C-05 — Bouton CTA primaire `.lp-btn-primary`**
- Label : "Démarrer gratuitement →"
- Action : `onclick="showAuthPage(true)"`
- Style : fond `--color-primary`, texte blanc, radius `--lp-radius-md` (12px)
- Font : DM Sans 600, 16px
- Padding : 14px 28px
- Margin-top : 32px
- Hover : fond `#245A42` (primary 15% plus sombre), transform translateY(-1px), shadow-2
- Active : transform translateY(0), shadow-1
- Transition : 200ms ease-out
- Cursor : pointer

**C-06 — Meta `.lp-hero-meta`**
- Contenu : "✓ 14 jours gratuits  ·  ✓ Sans engagement  ·  ✓ Annulation immédiate"
- Font : Inter 400, 13px
- Couleur : `--color-text-3`
- Margin-top : 16px
- Les checkmarks (✓) sont en `--color-primary`

**C-07 — Graphique Hero CSS `.lp-hero-graphic`**
- Type : div décoratif pur CSS, zéro image externe
- Description visuelle : mini mock-up d'interface NutriDash simulé en CSS
- Fond : `--color-surface` (blanc), border-radius `--lp-radius-xl` (24px)
- Ombre : `--lp-shadow-3`
- Contenu CSS interne (markup HTML léger) :

```
┌─────────────────────────────────────────┐
│  En-tête mock                           │
│  "Aujourd'hui"  |  "1 847 kcal"         │
│  .lp-mock-header (padding 16px)         │
│─────────────────────────────────────────│
│  Barre de progression kcal              │
│  .lp-mock-bar-track (fond #E2E8DF h6px)│
│  .lp-mock-bar-fill (fond #2D6A4F, 72%) │
│─────────────────────────────────────────│
│  Macros pills (flex row, gap 8px)       │
│  [Prot: 142g] [Gluc: 220g] [Lip: 58g]  │
│  Chaque pill: fond #F0F4EE, radius 8px  │
│  texte 12px, DM Sans 600               │
│─────────────────────────────────────────│
│  3 petites lignes repas (skeleton-like) │
│  .lp-mock-meal-row (flex, border-b)     │
│  "Petit déjeuner · 520 kcal"           │
│  "Déjeuner · 680 kcal"                 │
│  "Collation · 210 kcal"                │
└─────────────────────────────────────────┘
```

- Border : 1px solid `--color-border`
- Max-width : 380px
- Transform desktop : rotate(-2deg) — légère inclinaison premium
- Pseudo-élément `::before` : forme blob vert très clair (`--color-primary-xlight` #D8F3DC, opacity 0.5, border-radius 60% 40% 70% 30%, blur 40px) positionné derrière le mock, z-index -1, pour un halo doux sans image

### Spécifications CSS

```css
.lp-hero {
  padding: 96px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.lp-hero-inner {
  display: grid;
  grid-template-columns: 55fr 45fr;
  gap: 64px;
  align-items: center;
}

.lp-hero-graphic {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--lp-radius-xl);
  box-shadow: var(--lp-shadow-3);
  border: 1px solid var(--color-border);
  padding: 24px;
  transform: rotate(-2deg);
  transform-origin: center center;
  max-width: 380px;
  margin-left: auto;
}

.lp-hero-graphic::before {
  content: '';
  position: absolute;
  inset: -40px;
  background: var(--color-primary-xlight);
  border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
  opacity: 0.45;
  z-index: -1;
  filter: blur(40px);
}

@media (max-width: 1024px) {
  .lp-hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 48px;
  }
  .lp-hero-graphic {
    transform: none;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .lp-hero { padding: 64px 20px 48px; }
}
```

### Interactions

| Déclencheur                    | Action                            |
|--------------------------------|-----------------------------------|
| Clic `.lp-btn-primary`         | `showAuthPage(true)` — inscription|
| Hover `.lp-btn-primary`        | fond #245A42 + translateY(-1px)   |
| Hover `.lp-hero-graphic`       | transform: rotate(0deg) — redresse le mock |

---

## S-03 — FEATURES

**Classe** : `.lp-features`  
**Objectif** : démontrer les 3 piliers fonctionnels — TDEE, Journal, Historique

### Layout ASCII — Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│  padding: 80px 40px                                             │
│                                                                 │
│  H2 : "Votre corps mérite mieux                                 │
│         que des approximations."                                │
│  (centré, max-width 600px, marge auto)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  CARD TDEE   │  │  CARD JOURNAL│  │  CARD HISTO  │         │
│  │  C-08        │  │  C-09        │  │  C-10        │         │
│  │              │  │              │  │              │         │
│  │  [Icône SVG] │  │  [Icône SVG] │  │  [Icône SVG] │         │
│  │  H3 titre    │  │  H3 titre    │  │  H3 titre    │         │
│  │  Texte corps │  │  Texte corps │  │  Texte corps │         │
│  │  (3–4 lignes)│  │  (3–4 lignes)│  │  (3–4 lignes)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  gap: 24px, 3 colonnes égales                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layout ASCII — Mobile

```
┌──────────────────────────────┐
│  padding: 64px 20px          │
│  H2 centré                   │
│  ┌──────────────────────┐    │
│  │  CARD (pleine larg.) │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │  CARD                │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │  CARD                │    │
│  └──────────────────────┘    │
│  gap: 16px, 1 colonne        │
└──────────────────────────────┘
```

### Composants

**C-08 — Card Feature TDEE**

Classe : `.lp-feature-card`

Structure interne :
```
[Icône SVG — 40px × 40px — couleur #2D6A4F]
[H3 : "Calculateur TDEE Intelligent"]
[P : "Découvrez instantanément combien de calories vous
devez consommer pour atteindre votre objectif réel."]
```

**C-09 — Card Feature Journal**

Structure interne :
```
[Icône SVG — 40px × 40px — couleur #2D6A4F]
[H3 : "Journal de bord intuitif"]
[P : "Ajoutez vos repas en moins de 20 secondes.
Suivez vos calories et vos protéines sans effort."]
```

**C-10 — Card Feature Historique**

Structure interne :
```
[Icône SVG — 40px × 40px — couleur #2D6A4F]
[H3 : "Analyse de l'évolution"]
[P : "Surveillez vos progrès semaine après semaine.
Pilotez vos résultats par les données, pas les émotions."]
```

**Styles communs `.lp-feature-card`** :
- Fond : `--color-surface` (blanc)
- Border : 1px solid `--color-border`
- Border-radius : `--lp-radius-lg` (16px)
- Padding : 32px 28px
- Box-shadow : `--lp-shadow-1`
- Hover : box-shadow `--lp-shadow-2`, transform translateY(-3px), border-color `--color-border-strong`
- Transition : 250ms ease-out
- Display : flex, flex-direction: column, gap: 16px

**Icônes SVG inline — spécifications**

Toutes les icônes : `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.75"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, couleur héritée depuis `.lp-feature-icon { color: var(--color-primary); }`, width/height : 40px, wrapper div avec fond `--color-primary-xlight`, border-radius `--lp-radius-sm` (8px), padding 10px.

Icône 1 — TDEE (flamme / énergie) :
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
     stroke-linecap="round" stroke-linejoin="round" width="40" height="40"
     aria-hidden="true">
  <!-- Flame path : forme de flamme stylisée -->
  <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-2.5-1.5-5-2-6.5
           C14 8 14.5 10 14 11.5c-.5-1-2-3-2-9.5z"/>
  <!-- Étincelle centrale -->
  <circle cx="12" cy="13" r="1.5" fill="currentColor" stroke="none"/>
</svg>
```

Icône 2 — Journal (livre ouvert) :
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
     stroke-linecap="round" stroke-linejoin="round" width="40" height="40"
     aria-hidden="true">
  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
</svg>
```

Icône 3 — Historique (graphique ligne croissante) :
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
     stroke-linecap="round" stroke-linejoin="round" width="40" height="40"
     aria-hidden="true">
  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
</svg>
```

### Spécifications CSS

```css
.lp-features {
  padding: 80px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.lp-features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 48px;
}

.lp-feature-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--color-primary-xlight);
  border-radius: var(--lp-radius-sm);
  color: var(--color-primary);
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .lp-features-grid { grid-template-columns: 1fr; gap: 16px; }
}

@media (max-width: 768px) {
  .lp-features { padding: 64px 20px; }
}
```

---

## S-04 — PROCESS

**Classe** : `.lp-process`  
**Objectif** : rassurer l'utilisateur sur la méthode — 3 étapes simples et concrètes

### Layout ASCII — Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│  padding: 80px 40px                                             │
│                                                                 │
│  H2 : "Le Process NutriDash"  (centré)                         │
│  Sous-titre intro centré (max-width 540px)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  "01"  [grand, terracotta, 80px, DM Sans 700]       │ │  │
│  │  │  "Fixer le cap"  [H3, #1A2E22, 20px, DM Sans 600]  │ │  │
│  │  │  - Identité métabolique (âge, poids, taille)        │ │  │
│  │  │  - Choix de l'objectif (Sèche, Masse, Maintien)     │ │  │
│  │  │  - Calcul automatique de votre budget kcal/prot     │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                         [ligne verticale 2px, #E2E8DF]  │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  "02"  [même style]                                 │ │  │
│  │  │  "Piloter au quotidien"                             │ │  │
│  │  │  - Saisie des repas en moins de 20 secondes         │ │  │
│  │  │  - Saisie de l'activité physique                    │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                         [ligne verticale]                │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  "03"  [même style]                                 │ │  │
│  │  │  "Analyser & Ajuster"                               │ │  │
│  │  │  - Rendez-vous hebdomadaire de pesée                │ │  │
│  │  │  - Suivi de votre objectif                          │ │  │
│  │  │  - Ajustement basé sur les données réelles          │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Encart highlight (fond blanc, border-l 3px #2D6A4F)     │ │
│  │  "L'avantage NutriDash : ce process élimine               │ │
│  │  l'incertitude. Vous ne testez pas un régime,             │ │
│  │  vous pilotez vos résultats."                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Desktop alternatif — colonne unique, max-width 720px centré

Le process est une liste verticale unique centrée, pas une grille.  
Les numéros sont en très grand format à gauche, le texte à droite.  
Un connecteur vertical (ligne CSS 2px, `--color-border`) relie les étapes.

### Composants

**C-11 — Étape Process `.lp-process-step`**

Structure interne :
```
[Numéro .lp-step-number] + [Corps .lp-step-body]
```

Disposition : flex row, gap 32px, align-items flex-start

**Numéro `.lp-step-number`** :
- Contenu : "01", "02", "03"
- Font : DM Sans 700, 72px
- Couleur : `--color-accent` (#E07A5F)
- Line-height : 1
- Min-width : 80px — alignement constant
- Sélection impossible (`user-select: none`)

**Corps `.lp-step-body`** :
- H3 `.lp-step-title` : DM Sans 600, 20px, `--color-text-1`, margin-bottom 12px
- Liste `.lp-step-list` : style-type none, Inter 400, 15px, `--color-text-2`, line-height 1.6
- Chaque `<li>` : padding-left 16px, position relative
- `li::before` : content `"—"`, couleur `--color-primary`, position absolute, left 0

**Connecteur `.lp-step-connector`** :
- Séparateur entre étapes : line verticale 2px, `--color-border`, hauteur 32px
- Positionné à gauche, alignée sur le centre du numéro (margin-left: 36px)
- Pas de connecteur après la dernière étape

**Encart highlight `.lp-process-highlight`** :
- Fond : `--color-surface` (blanc)
- Border-left : 3px solid `--color-primary`
- Border-radius : `--lp-radius-sm` (8px)
- Padding : 20px 24px
- Margin-top : 48px
- Texte : Inter 400, 15px, `--color-text-2`, font-style italic
- Max-width : 600px, marge auto

### Spécifications CSS

```css
.lp-process {
  padding: 80px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.lp-process-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 720px;
  margin: 48px auto 0;
}

.lp-process-step {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  padding-bottom: 40px;
  position: relative;
}

/* Connecteur vertical entre étapes */
.lp-process-step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 36px; /* centre du numéro ~80px/2 = 40px - 4px offset */
  top: 80px;  /* sous le numéro */
  bottom: 0;
  width: 2px;
  background: var(--color-border);
}

.lp-step-number {
  font-family: var(--font-heading);
  font-size: 72px;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
  min-width: 80px;
  user-select: none;
}

@media (max-width: 768px) {
  .lp-process { padding: 64px 20px; }
  .lp-step-number { font-size: 48px; min-width: 56px; }
  .lp-process-step { gap: 20px; }
}
```

---

## S-05 — PRICING

**Classe** : `.lp-pricing`  
**Objectif** : convertir — une seule offre, claire, avec preuve de non-risque (14j gratuits)

### Layout ASCII

```
┌─────────────────────────────────────────────────────────────────┐
│  padding: 80px 40px                                             │
│                                                                 │
│  H2 : "Tarif Simple & Transparent"  (centré)                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │  Carte Pricing (max-width: 480px, marge auto)   │           │
│  │                                                 │           │
│  │  ┌───────────────────────────┐                  │           │
│  │  │  Badge "14 jours gratuits"│  (pill terracotta)│          │
│  │  └───────────────────────────┘                  │           │
│  │                                                 │           │
│  │  10€          /mois                             │           │
│  │  [72px, DM Sans 700, #1A2E22] [18px, text-3]   │           │
│  │                                                 │           │
│  │  ─────────────────────────────────────          │           │
│  │                                                 │           │
│  │  [✓]  Accès complet à toutes les fonctionnalités│           │
│  │  [✓]  Synchronisation cloud illimitée           │           │
│  │  [✓]  Historique illimité                       │           │
│  │  [✓]  Sans engagement, résiliation à tout moment│           │
│  │                                                 │           │
│  │  ─────────────────────────────────────          │           │
│  │                                                 │           │
│  │  [Bouton "Commencer l'essai →"]  (pleine larg.) │           │
│  │                                                 │           │
│  │  "Pas de carte bancaire requise pour l'essai"  │           │
│  │  [centré, 13px, text-3]                         │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Composants

**C-12 — Carte Pricing `.lp-pricing-card`**
- Fond : `--color-surface` (blanc)
- Border : 1px solid `--color-border`
- Border-radius : `--lp-radius-xl` (24px)
- Box-shadow : `--lp-shadow-3`
- Padding : 40px
- Max-width : 480px
- Margin : 48px auto 0

**C-13 — Badge `.lp-pricing-badge`**
- Contenu : "14 jours gratuits"
- Style : pill (`--lp-radius-full`), fond `--color-accent-light` (#FAE8E4), texte `--color-accent` (#E07A5F)
- Font : DM Sans 600, 13px
- Padding : 6px 16px
- Display : inline-block
- Margin-bottom : 24px

**C-14 — Prix `.lp-pricing-price`**
- Montant : `<span class="lp-price-amount">10€</span>` — DM Sans 700, 72px, `--color-text-1`
- Période : `<span class="lp-price-period">/ mois</span>` — Inter 400, 18px, `--color-text-3`
- Alignement : baseline (flex align-items: baseline, gap 8px)

**C-15 — Séparateur `.lp-pricing-divider`**
- `<hr>` ou div 1px, fond `--color-border`
- Margin : 28px 0

**C-16 — Liste avantages `.lp-pricing-list`**
- Style : list-style none, flex column, gap 12px
- Chaque `<li>` : flex row, gap 10px, align-items flex-start, Inter 400, 15px, `--color-text-2`
- Icône checkmark SVG inline :

```svg
<svg class="lp-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     width="18" height="18" aria-hidden="true">
  <polyline points="20 6 9 17 4 12"/>
</svg>
```

- La `.lp-check-icon` : couleur `--color-primary`, flex-shrink 0, margin-top 1px (alignement baseline)

**C-17 — CTA Pricing `.lp-btn-primary` (variante pleine largeur)**
- Label : "Commencer l'essai →"
- Action : `onclick="showAuthPage(true)"`
- Width : 100%
- Style identique à C-05 mais width: 100%, justify-content: center
- Margin-top : 28px

**C-18 — Note sous le bouton**
- Contenu : "Pas de carte bancaire requise pour démarrer l'essai."
- Font : Inter 400, 13px
- Couleur : `--color-text-3`
- Text-align : center
- Margin-top : 12px

### Spécifications CSS

```css
.lp-pricing {
  padding: 80px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.lp-pricing-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--lp-radius-xl);
  box-shadow: var(--lp-shadow-3);
  padding: 40px;
  max-width: 480px;
  margin: 48px auto 0;
}

.lp-pricing-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.lp-price-amount {
  font-family: var(--font-heading);
  font-size: 72px;
  font-weight: 700;
  color: var(--color-text-1);
  line-height: 1;
}

.lp-price-period {
  font-family: var(--font-main);
  font-size: 18px;
  color: var(--color-text-3);
}

@media (max-width: 768px) {
  .lp-pricing { padding: 64px 20px; }
  .lp-pricing-card { padding: 28px 24px; }
  .lp-price-amount { font-size: 56px; }
}
```

---

## S-06 — CTA FINAL

**Classe** : `.lp-cta-final`  
**Objectif** : dernière chance de conversion avant le footer  
**Fond** : `--color-primary` (#2D6A4F) — seul bloc à fond coloré différent, autorisé car bloc de conversion

### Layout ASCII

```
┌─────────────────────────────────────────────────────────────────┐
│  background: #2D6A4F                                            │
│  padding: 80px 40px                                             │
│                                                                 │
│                  H2 (blanc, centré)                             │
│         "Prêt à reprendre le contrôle ?"                        │
│                                                                 │
│              Sous-titre (blanc 75%, centré)                     │
│  "Rejoignez les utilisateurs qui pilotent                       │
│   leur alimentation avec précision."                            │
│                                                                 │
│         [Bouton "Démarrer gratuitement →"]  (blanc)            │
│                                                                 │
│    ✓ 14 jours gratuits  ·  ✓ Sans engagement                   │
│    (texte blanc 60%, 13px)                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Composants

**C-19 — Titre `.lp-cta-final-title`**
- Contenu : "Prêt à reprendre le contrôle ?"
- Font : DM Sans 700, clamp(2rem, 3.5vw, 2.75rem)
- Couleur : `#FFFFFF`
- Text-align : center

**C-20 — Sous-titre `.lp-cta-final-subtitle`**
- Contenu : "Rejoignez les utilisateurs qui pilotent leur alimentation avec précision."
- Font : Inter 400, 18px
- Couleur : `rgba(255, 255, 255, 0.78)`
- Text-align : center
- Max-width : 480px, marge auto
- Margin-top : 16px

**C-21 — Bouton CTA blanc `.lp-btn-white`**
- Label : "Démarrer gratuitement →"
- Action : `onclick="showAuthPage(true)"`
- Style : fond blanc, texte `--color-primary` (#2D6A4F), radius `--lp-radius-md`
- Font : DM Sans 600, 16px
- Padding : 14px 32px
- Margin-top : 32px
- Hover : fond `--color-primary-xlight` (#D8F3DC), texte `--color-primary`
- Transition : 200ms ease-out
- Display : block, marge auto (centré)

**C-22 — Meta `.lp-cta-final-meta`**
- Contenu : "✓ 14 jours gratuits  ·  ✓ Sans engagement  ·  ✓ Annulation immédiate"
- Font : Inter 400, 13px
- Couleur : `rgba(255, 255, 255, 0.60)`
- Text-align : center
- Margin-top : 16px

### Décoration CSS (sans image)

Élément décoratif subtil : deux cercles grands, très transparents, en `rgba(255,255,255,0.04)`, border-radius 50%, positionnés en absolute overflow hidden sur le conteneur.

```css
.lp-cta-final {
  position: relative;
  overflow: hidden;
  background: var(--color-primary);
  padding: 96px 40px;
  text-align: center;
}

.lp-cta-final::before,
.lp-cta-final::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  pointer-events: none;
}

.lp-cta-final::before {
  width: 600px;
  height: 600px;
  top: -200px;
  right: -150px;
}

.lp-cta-final::after {
  width: 400px;
  height: 400px;
  bottom: -150px;
  left: -100px;
}

@media (max-width: 768px) {
  .lp-cta-final { padding: 64px 20px; }
}
```

---

## S-07 — FOOTER

**Classe** : `.lp-footer`  
**Fond** : `--color-bg` (#F7F8F3) — continu avec le reste de la page  
**Border-top** : 1px solid `--color-border`

### Layout ASCII — Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│  border-top: 1px solid #E2E8DF                                  │
│  padding: 32px 40px                                             │
│                                                                 │
│  [Logo "NutriDash"]   © 2026 NutriDash   [CGU] · [Confid.]     │
│  (flex row, space-between, align-items center)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layout ASCII — Mobile

```
┌──────────────────────────────┐
│  padding: 24px 20px          │
│  flex-direction: column      │
│  align-items: center         │
│  gap: 12px                   │
│                              │
│  [Logo "NutriDash"]          │
│  © 2026 NutriDash            │
│  [CGU] · [Confidentialité]   │
│                              │
└──────────────────────────────┘
```

### Composants

**C-23 — Logo footer `.lp-logo.lp-logo-footer`**
- Même rendu que le header : `Nutri` en `--color-text-1` + `Dash` en `--color-primary`
- Font : DM Sans 600, 18px
- Pas de version blanche (fond footer = `--color-bg`)

**C-24 — Copyright `.lp-footer-copy`**
- Contenu : "© 2026 NutriDash"
- Font : Inter 400, 13px
- Couleur : `--color-text-3`

**C-25 — Liens légaux `.lp-footer-links`**
- Liens : `<a href="/cgu.html" target="_blank" rel="noopener">CGU</a>` + `·` + `<a href="/confidentialite.html" target="_blank" rel="noopener">Confidentialité</a>`
- Font : Inter 400, 13px
- Couleur liens : `--color-text-3`
- Hover : `--color-primary`, underline
- Le séparateur `·` : `--color-border-strong`, aria-hidden="true"

### Spécifications CSS

```css
.lp-footer {
  border-top: 1px solid var(--color-border);
  padding: 32px 40px;
}

.lp-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.lp-footer-links {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lp-footer-links a {
  font-size: 13px;
  color: var(--color-text-3);
  text-decoration: none;
  transition: color 150ms ease;
}

.lp-footer-links a:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .lp-footer { padding: 24px 20px; }
  .lp-footer-inner {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }
}
```

---

## INVENTAIRE COMPLET DES COMPOSANTS

| ID   | Composant                    | Section       | Classes CSS                          | Priorité |
|------|------------------------------|---------------|--------------------------------------|----------|
| C-01 | Logo                         | Header        | `.lp-logo`                           | MVP      |
| C-02 | Bouton Connexion ghost       | Header        | `.lp-btn-ghost`                      | MVP      |
| C-03 | Titre H1 hero                | Hero          | `.lp-hero-title`                     | MVP      |
| C-04 | Sous-titre hero              | Hero          | `.lp-hero-subtitle`                  | MVP      |
| C-05 | Bouton CTA primaire          | Hero          | `.lp-btn-primary`                    | MVP      |
| C-06 | Meta hero (reassurance)      | Hero          | `.lp-hero-meta`                      | MVP      |
| C-07 | Graphique CSS mock-ui        | Hero          | `.lp-hero-graphic`                   | MVP      |
| C-08 | Card Feature TDEE            | Features      | `.lp-feature-card`                   | MVP      |
| C-09 | Card Feature Journal         | Features      | `.lp-feature-card`                   | MVP      |
| C-10 | Card Feature Historique      | Features      | `.lp-feature-card`                   | MVP      |
| C-11 | Étape Process (×3)           | Process       | `.lp-process-step`                   | MVP      |
| C-12 | Carte Pricing                | Pricing       | `.lp-pricing-card`                   | MVP      |
| C-13 | Badge "14 jours"             | Pricing       | `.lp-pricing-badge`                  | MVP      |
| C-14 | Prix                         | Pricing       | `.lp-pricing-price`                  | MVP      |
| C-15 | Séparateur pricing           | Pricing       | `.lp-pricing-divider`                | MVP      |
| C-16 | Liste avantages              | Pricing       | `.lp-pricing-list`                   | MVP      |
| C-17 | CTA Pricing                  | Pricing       | `.lp-btn-primary` (full-width)       | MVP      |
| C-18 | Note "sans carte bancaire"   | Pricing       | `.lp-pricing-note`                   | MVP      |
| C-19 | Titre CTA final              | CTA Final     | `.lp-cta-final-title`                | MVP      |
| C-20 | Sous-titre CTA final         | CTA Final     | `.lp-cta-final-subtitle`             | MVP      |
| C-21 | Bouton blanc CTA final       | CTA Final     | `.lp-btn-white`                      | MVP      |
| C-22 | Meta CTA final               | CTA Final     | `.lp-cta-final-meta`                 | MVP      |
| C-23 | Logo footer                  | Footer        | `.lp-logo.lp-logo-footer`            | MVP      |
| C-24 | Copyright                    | Footer        | `.lp-footer-copy`                    | MVP      |
| C-25 | Liens légaux                 | Footer        | `.lp-footer-links`                   | MVP      |

---

## VARIANTS DE BOUTONS

| Classe            | Fond              | Texte              | Usage                        |
|-------------------|-------------------|--------------------|------------------------------|
| `.lp-btn-primary` | `--color-primary` | blanc              | CTA principal hero et pricing|
| `.lp-btn-ghost`   | transparent       | `--color-text-1`   | Connexion header             |
| `.lp-btn-white`   | blanc             | `--color-primary`  | CTA final (fond vert)        |

Règles communes à tous les boutons :
```css
/* Base commune */
font-family: var(--font-heading);
font-size: 16px;
font-weight: 600;
border-radius: var(--lp-radius-md);
padding: 14px 28px;
cursor: pointer;
border: none;
transition: all 200ms ease-out;
display: inline-flex;
align-items: center;
gap: 6px;
```

---

## SUPPRESSION DES ÉLÉMENTS EXISTANTS

Les éléments suivants sont à **supprimer** dans `index.html` et leurs références CSS dans `style.css` :

| Élément à supprimer          | Remplacement                              |
|------------------------------|-------------------------------------------|
| `<img src="hero.png">`       | `.lp-hero-graphic` (div CSS)              |
| `<img src="icon_tdee.png">`  | SVG inline flamme (C-08)                  |
| `<img src="tdee.png">`       | Supprimé — pas de mockup dans les cards   |
| `<img src="icon_dashboard.png">` | SVG inline livre ouvert (C-09)        |
| `<img src="dashboard.png">`  | Supprimé                                  |
| `<img src="icon_history.png">` | SVG inline graphique ligne (C-10)       |
| `<img src="history.png">`    | Supprimé                                  |
| `<section class="lp-goals">` | Supprimé — fusionné dans CTA final        |
| `<img src="targets.png">`    | Supprimé                                  |

La section `.lp-goals` (Sèche/Masse) est **supprimée** dans la V2. Son message clé ("adaptez votre objectif instantanément") est absorbé par la description de l'étape 1 du Process.

---

## RÈGLES RESPONSIVE GLOBALES

### Breakpoints

| Nom       | Valeur          | Comportement                               |
|-----------|-----------------|--------------------------------------------|
| Mobile    | < 768px         | 1 colonne, padding réduit, textes clampés  |
| Tablet    | 768px – 1024px  | Grilles adaptées, hero en colonne unique   |
| Desktop   | > 1024px        | Grilles 2–3 colonnes, max-width 1200px     |

### Règle de conteneur universel

```css
.lp-section-inner {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
```

Toutes les sections ont un padding horizontal 40px desktop / 20px mobile.  
Toutes les sections sont centrées avec `max-width: 1200px, margin: 0 auto`.

---

## ACCESSIBILITÉ

| Critère                       | Implémentation                                                     |
|-------------------------------|--------------------------------------------------------------------|
| Contraste texte               | #1A2E22 sur #F7F8F3 → ratio ~12.8:1 (AAA)                        |
| Contraste bouton primaire     | blanc sur #2D6A4F → ratio ~7.5:1 (AAA)                           |
| Contraste terracotta accent   | #E07A5F sur fond blanc → décoratif uniquement (numéros process)   |
| Alt text images               | N/A — plus d'images, SVG aria-hidden="true" sur tous les décoratifs |
| Keyboard navigation           | Tous les boutons sont des `<button>` natifs                        |
| Focus states                  | Conserver focus-visible natif ou outline 2px `--color-primary`     |
| Texte minimum                 | 13px minimum (labels), 16px corps                                  |
| Zoom support                  | Viewport meta sans `user-scalable=no`                              |
| Sémantique HTML               | `<header>`, `<section>`, `<footer>`, `<h1>` unique, `<h2>` par section |
| aria-hidden                   | Sur tous les SVG décoratifs et le pseudo graphique hero            |

---

## COPYWRITING FINAL PAR SECTION

### Header
- Logo : "NutriDash" (Nutri normal + Dash en vert)
- Bouton : "Connexion"

### Hero
- H1 : "Maîtrisez votre nutrition, au gramme près."
- Sous-titre : "Calculez vos besoins caloriques réels, suivez vos repas et atteignez vos objectifs sans approximation."
- CTA : "Démarrer gratuitement →"
- Meta : "✓ 14 jours gratuits  ·  ✓ Sans engagement  ·  ✓ Annulation immédiate"
- Mock-ui label : "Aujourd'hui · 1 847 kcal" / Macros : "Prot 142g · Gluc 220g · Lip 58g"

### Features
- H2 : "Votre corps mérite mieux que des approximations."
- Card 1 — Titre : "Calculateur TDEE Intelligent" / Texte : "Découvrez instantanément combien de calories vous devez consommer pour atteindre votre objectif réel."
- Card 2 — Titre : "Journal de bord intuitif" / Texte : "Ajoutez vos repas en moins de 20 secondes. Suivez vos calories et vos protéines sans effort."
- Card 3 — Titre : "Analyse de l'évolution" / Texte : "Surveillez vos progrès semaine après semaine. Pilotez vos résultats par les données, pas les émotions."

### Process
- H2 : "Le Process NutriDash"
- Intro : "Pour obtenir des résultats visibles et durables, la clé n'est pas la restriction — c'est la précision."
- Étape 01 — "Fixer le cap" : Identité métabolique (âge, poids, taille) · Choix de l'objectif (Sèche, Masse, Maintien) · Calcul automatique de votre budget kcal/prot
- Étape 02 — "Piloter au quotidien" : Saisie des repas en moins de 20 secondes · Saisie de l'activité physique
- Étape 03 — "Analyser & Ajuster" : Rendez-vous hebdomadaire de pesée · Suivi de votre objectif · Ajustement basé sur les données réelles
- Highlight : "L'avantage NutriDash : ce process élimine l'incertitude. Vous ne testez pas un régime — vous pilotez vos résultats."

### Pricing
- H2 : "Tarif Simple & Transparent"
- Badge : "14 jours gratuits"
- Prix : "10€ / mois"
- Liste : "Accès complet à toutes les fonctionnalités" · "Synchronisation cloud illimitée" · "Historique illimité" · "Sans engagement, résiliation à tout moment"
- CTA : "Commencer l'essai →"
- Note sous bouton : "Pas de carte bancaire requise pour démarrer l'essai."

### CTA Final
- H2 : "Prêt à reprendre le contrôle ?"
- Sous-titre : "Rejoignez les utilisateurs qui pilotent leur alimentation avec précision."
- CTA : "Démarrer gratuitement →"
- Meta : "✓ 14 jours gratuits  ·  ✓ Sans engagement  ·  ✓ Annulation immédiate"

### Footer
- Logo : "NutriDash"
- Copyright : "© 2026 NutriDash"
- Liens : "CGU" · "Confidentialité"

---

## ANIMATIONS ET MICRO-INTERACTIONS

| Élément                        | Animation                                           | Durée / Easing        |
|--------------------------------|-----------------------------------------------------|-----------------------|
| Boutons primaires (hover)      | fond + translateY(-1px) + shadow                    | 200ms ease-out        |
| Cartes features (hover)        | shadow-2 + translateY(-3px) + border-color          | 250ms ease-out        |
| Header (scroll)                | border-bottom apparaît (opacity 0→1)               | 200ms ease            |
| Hero graphic (hover)           | rotate(-2deg) → rotate(0deg)                        | 300ms ease-out        |
| Bouton ghost (hover)           | fond surface-2, border + texte primary              | 200ms ease-out        |
| Liens footer (hover)           | color text-3 → primary                              | 150ms ease            |
| Tous les focus-visible         | outline 2px `--color-primary`, offset 2px           | immédiat              |

**Pas d'animation d'entrée au scroll** (intersection observer) — non requis pour la V2, ajout possible en V3.  
**prefers-reduced-motion** : toutes les transitions ci-dessus doivent être désactivées si `@media (prefers-reduced-motion: reduce)`.

```css
@media (prefers-reduced-motion: reduce) {
  .lp-btn-primary,
  .lp-btn-ghost,
  .lp-btn-white,
  .lp-feature-card,
  .lp-hero-graphic,
  .lp-footer-links a,
  .lp-header {
    transition: none !important;
    transform: none !important;
  }
}
```

---

## CHECKLIST DE VALIDATION FINALE

- [ ] Fond `--color-bg` (#F7F8F3) unifié sur toutes les sections sauf CTA final
- [ ] Aucune image externe — zéro `<img>` dans la landing (suppression hero.png, icon_*.png, *.png)
- [ ] SVG inline sur toutes les icônes features, avec `aria-hidden="true"`
- [ ] Graphique hero pur CSS (`.lp-hero-graphic`) sans aucun fichier image
- [ ] Section `.lp-goals` supprimée de index.html
- [ ] Header sticky fonctionnel avec backdrop-filter
- [ ] Classe `.lp-header--scrolled` activée au scroll via JS (1 ligne d'event listener)
- [ ] Tous les CTAs appellent `showAuthPage(true)` ou `showAuthPage(false)` selon le cas
- [ ] Footer avec liens `/cgu.html` et `/confidentialite.html`, `target="_blank" rel="noopener"`
- [ ] Responsive vérifié sur 375px, 768px, 1024px, 1440px
- [ ] Contraste couleurs texte/fond ≥ 4.5:1 (WCAG AA) sur toutes les sections
- [ ] `prefers-reduced-motion` : transitions désactivées
- [ ] `<h1>` unique sur la page (hero), `<h2>` pour chaque section, `<h3>` pour les sous-titres cartes
- [ ] Pas de `user-scalable=no` dans le viewport meta
- [ ] `.lp-step-number` avec `user-select: none` (les "01" "02" "03" ne doivent pas être sélectionnables)
- [ ] Bouton CTA final `.lp-btn-white` : fond blanc, texte `--color-primary` (pas noir)
- [ ] Note "Pas de carte bancaire requise" présente sous le bouton pricing

---

*Wireframe produit par l'agent Designer NutriDash — Refonte Landing V2*
