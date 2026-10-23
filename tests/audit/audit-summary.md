# Synthèse Audit Visuel — NutriDash
Date : 30 juin 2026 | URL : http://127.0.0.1:8090/ | Navigateur : chrome

---

## Erreurs console

| Message | Fichier | Sévérité |
|---|---|---|
| `frame-ancestors` directive ignorée dans `<meta>` | index.html:5 | ⚠️ Benign — CSP meta ne supporte pas frame-ancestors, utiliser un header HTTP à la place |

> Aucune erreur JS bloquante détectée sur la landing page et le formulaire d'auth.

---

## Images

| Src | Statut |
|---|---|
| `Images/lp-illustration.png` | 🔴 Non chargée (naturalWidth=0) |
| Autres images (hero.png, icônes, etc.) | ✅ OK |

> **Action requise :** vérifier que `Images/lp-illustration.png` existe et est accessible via PocketBase `--publicDir`.

---

## Liens internes

| URL | Code HTTP | Statut |
|---|---|---|
| `/cgu.html` | 200 | ✅ OK |
| `/confidentialite.html` | 200 | ✅ OK |

---

## Titre de page

| Constat | Valeur actuelle | Recommandé |
|---|---|---|
| `<title>` | `Dashboard Nutrition` | `NutriDash — Suivi nutritionnel` |

> Le titre affiché dans l'onglet du navigateur ne correspond pas au nom de marque.

---

## Responsive mobile (390px)

- ✅ Pas d'overflow horizontal détecté
- ✅ CTA "Démarrer gratuitement" visible sans scroll

---

## Points validés

- ✅ Landing page affichée correctement (hero, features, process, tarif, footer)
- ✅ Clic "Démarrer gratuitement" → formulaire inscription affiché
- ✅ Bouton "Créer mon compte" disabled tant que la checkbox CGU n'est pas cochée
- ✅ Lien "Me connecter" → bascule vers formulaire connexion
- ✅ Formulaire connexion présent (email + mot de passe + bouton Se connecter)
- ✅ Liens CGU et Confidentialité accessibles (200 OK)

---

## Points à corriger avant les tests E2E

1. 🔴 Image `lp-illustration.png` non chargée
2. ⚠️ Titre `<title>` à mettre à jour
3. ⚠️ CSP `frame-ancestors` → passer en HTTP header (Fly.io config)

---

## Screenshots générés

- `tests/audit/audit-homepage.png` — Landing page desktop
- `tests/audit/audit-mobile.png` — Landing page mobile 390px
- `tests/audit/audit-inscription.png` — Formulaire inscription
- `tests/audit/audit-login-error.png` — Formulaire connexion (erreur auth attendue)
