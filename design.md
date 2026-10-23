# Identité Visuelle et Design System (NutriDash)

Ce fichier documente les choix de design, la palette de couleurs et le comportement des composants front-end afin de garantir une cohérence visuelle tout au long du développement.

> **Référence complète :** `documentation/design/NutriDash-Design-V2.md` (wireframes détaillés + spécifications écran par écran)

## Framework CSS

Aucun framework externe — Vanilla CSS uniquement via `style.css`.

---

## Style Visuel — Soft Modern

**Mots-clés :** Clarté · Confiance · Énergie douce · Naturel

L'interface s'efface au profit des données. Surfaces douces, typographie propre, couleurs issues du monde de la nutrition. Formes généreuses (grand radius), ombres subtiles, espaces blancs intentionnels.

**Ce style n'est PAS :**
- Néo-brutaliste (plus de bordures épaisses noires, plus d'ombres décalées)
- Clinique ou médical (pas de bleu stérile)
- Surchargé (pas d'éléments décoratifs inutiles)

---

## Palette de Couleurs (Variables CSS)

### Couleurs principales

| Variable | Hex | Usage |
|---|---|---|
| `--color-primary` | `#2D6A4F` | Vert forêt — CTA principaux, nav active |
| `--color-primary-light` | `#52B788` | Vert moyen — hover, états intermédiaires |
| `--color-primary-xlight` | `#D8F3DC` | Vert très pâle — surfaces accent, fond cartes highlight |
| `--color-accent` | `#E07A5F` | Terracotta — calories, énergie, éléments chauds |
| `--color-accent-light` | `#FAE8E4` | Terracotta très pâle — surface accent chaud |

### Neutres

| Variable | Hex | Usage |
|---|---|---|
| `--color-bg` | `#F7F8F3` | Fond global (blanc cassé, légère teinte verte) |
| `--color-surface` | `#FFFFFF` | Surfaces cartes, modales |
| `--color-surface-2` | `#F0F4EE` | Surface secondaire, inputs, zones inactives |
| `--color-border` | `#E2E8DF` | Bordures subtiles |
| `--color-border-strong` | `#C7D4C3` | Bordures marquées, séparateurs |

### Textes

| Variable | Hex | Usage |
|---|---|---|
| `--color-text-1` | `#1A2E22` | Texte principal (vert très sombre) |
| `--color-text-2` | `#4A6358` | Texte secondaire |
| `--color-text-3` | `#8BA898` | Texte tertiaire, placeholders, labels discrets |

### États sémantiques

| Variable | Hex | Usage |
|---|---|---|
| `--color-success` | `#2D6A4F` | Succès (identique au primary) |
| `--color-warning` | `#F4A261` | Avertissement (orange doux) |
| `--color-danger` | `#C1121F` | Erreur, suppression |
| `--color-danger-light` | `#FFE8EA` | Surface erreur |
| `--color-info` | `#4361EE` | Informationnel |

---

## Typographie

| Rôle | Police | Poids | Chargement |
|---|---|---|---|
| Titres / Headings | **DM Sans** | 400 · 500 · 600 · 700 | Google Fonts |
| Corps / UI | **Inter** | 400 · 500 · 600 · 700 | Google Fonts |

```
https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap
```

### Échelle

| Usage | Taille | Police | Poids |
|---|---|---|---|
| Display / Hero | 32px | DM Sans | 700 |
| H1 | 28px | DM Sans | 700 |
| H2 | 22px | DM Sans | 600 |
| H3 | 18px | DM Sans | 600 |
| H4 / Label section | 15px | DM Sans | 600 |
| Body large | 16px | Inter | 400 |
| Body | 14px | Inter | 400 |
| Body small | 13px | Inter | 400 |
| Caption | 12px | Inter | 400 |
| Label UI | 12px | Inter | 600 (uppercase + letter-spacing 0.5px) |
| Chiffre data | 36–48px | DM Sans | 700 |

Taille minimale : **12px** (caption uniquement) — body minimum 14px sur mobile.

---

## Espacements

Grille de base : **4px**

| Token | Valeur |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

Padding horizontal global : **20px** (mobile) · **24–32px** (desktop)  
Gap entre cartes : **12px** (mobile) · **16px** (desktop)

---

## Bordures et Élévation

### Rayons

| Token | Valeur | Usage |
|---|---|---|
| `--radius-sm` | 8px | Chips, tags |
| `--radius-md` | 12px | Inputs, boutons |
| `--radius-lg` | 16px | Cards standard |
| `--radius-xl` | 24px | Cards featured, modales |
| `--radius-2xl` | 32px | Bottom sheets, hero cards |
| `--radius-full` | 9999px | Boutons pill, avatars, badges |

### Ombres (elevation douce — pas de décalé)

| Token | Valeur |
|---|---|
| `--shadow-1` | `0 1px 3px rgba(45,106,79,0.06), 0 1px 2px rgba(45,106,79,0.04)` |
| `--shadow-2` | `0 4px 12px rgba(45,106,79,0.08), 0 2px 4px rgba(45,106,79,0.04)` |
| `--shadow-3` | `0 8px 24px rgba(45,106,79,0.12), 0 4px 8px rgba(45,106,79,0.06)` |
| `--shadow-4` | `0 20px 48px rgba(45,106,79,0.16), 0 8px 16px rgba(45,106,79,0.08)` |

### Bordures

| Usage | Valeur |
|---|---|
| Card par défaut | `1px solid --color-border` |
| Card active | `1px solid --color-primary-light` |
| Input | `1.5px solid --color-border` |
| Input focus | `1.5px solid --color-primary` + ring `0 0 0 3px rgba(45,106,79,0.12)` |
| Input error | `1.5px solid --color-danger` + ring rouge |

---

## Composants

### Boutons

| Variant | Fond | Texte | Hauteur |
|---|---|---|---|
| Primary | `--color-primary` | Blanc | 52px |
| Secondary | `--color-primary-xlight` | `--color-primary` | 44px |
| Ghost | Transparent | `--color-primary` | 44px |
| Danger | `--color-danger` | Blanc | 44px |
| Disabled | `--color-surface-2` | `--color-text-3` | — |

Radius : `--radius-md` (boutons) · `--radius-full` (boutons pill)

### Cards

| Variant | Fond | Ombre | Radius |
|---|---|---|---|
| Default | `--color-surface` | `--shadow-1` | `--radius-lg` |
| Elevated | `--color-surface` | `--shadow-2` | `--radius-xl` |
| Colored | `--color-primary-xlight` | Aucune | `--radius-lg` |
| Accent | `--color-accent-light` | Aucune | `--radius-lg` |

Hover sur toutes les cards : ombre passe de `--shadow-1` à `--shadow-2`, transition 150ms ease-out.

### Navigation bottom (mobile)

4 onglets : **Accueil · Suivi · Conseils · Profil**  
Hauteur : 64px + safe-area-inset-bottom  
Fond : `--color-surface` + `border-top: 1px solid --color-border`  
Ombre : `0 -4px 16px rgba(45,106,79,0.06)`  
Icônes : Lucide SVG 24px, stroke-width 1.75  
Label : Inter 11px 600, uppercase, letter-spacing 0.4px  
État actif : icône + label `--color-primary`  
État inactif : `--color-text-3`

### Inputs

Hauteur : 52px · Fond : `--color-surface-2` · Radius : `--radius-md`  
Label flottant (floating label) — monte lors du focus/saisie.

### Cercles de progression

Technique : `conic-gradient` CSS ou SVG `stroke-dasharray`  
Diamètre : 120–140px (standard) · 160px (dashboard principal)  
Fill : `--color-accent` (calories) · `--color-primary` (protéines)  
Animation : transition 0.6s ease-out

---

## Icônes

Bibliothèque : **Lucide Icons** (SVG inline)  
Stroke-width : **1.75px** sur toutes les tailles  
Couleur : `currentColor`

Tailles : 16px (inline texte) · 20px (inputs) · 24px (nav, actions) · 28px (cartes) · 32px (illustrations)

---

## Animations

| Interaction | Durée | Easing |
|---|---|---|
| Hover carte | 150ms | ease-out |
| Focus input | 200ms | ease-out |
| Ouverture modale / bottom sheet | 280ms | cubic-bezier(0.32, 0.72, 0, 1) |
| Fermeture modale | 220ms | ease-in |
| Page transition | 300ms | ease-in-out |
| Progression cercle | 600ms | ease-out |
| Toast entrée | 250ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Toast sortie | 200ms | ease-in |

`prefers-reduced-motion` : toutes les animations réduites à opacity-only, 100ms max.
