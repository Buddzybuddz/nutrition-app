# Profil Reel — NutriDash

Créé le 23/10/2026 (campagne `lancement-v2-octobre`). Aucun Reel vidéo produit auparavant : le fichier `2026-07-13_calcul-bmr-tdee-reel.png` de juillet est une image fixe.

- **Niveau de production** : Premium (musique, SFX et sound design, téléphone, typographie cinétique, fond cinématique).
- **Matières produit autorisées** : captures V2 fournies (`Images/Screenshot app/V2/`, compte de démo fictif) · écrans recréés avec texte · graphisme seul. Enregistrement réel de l'app : non autorisé pour l'instant.
- **Stratégie de variation** : par type de Reel, avec alternance (jamais trois Reels de même matière à la suite).
- **Musique** : **musiques originales synthétisées** par `scripts/synth-musique.py` du skill (aucune licence tierce ; les 5 pistes de la bibliothèque brag, toutes du même pack, ne sont plus utilisées : pack déjà employé sur un autre projet et licence non vérifiée). Un style, un tempo, une transposition et une graine par Reel. Pistes générées : `composition/assets/music/bed.mp3` de chaque Reel.
- **Identité** (lue dans `documentation/design/NutriDash-Design-V2.md` et la landing) : vert forêt #2D6A4F, vert profond #10201A, saumon #E07A5F, menthe #D8F3DC, blanc cassé #F7F8F3, texte #1A2E22 ; DM Sans (titres) et Inter (texte) ; logo `Images/Logos/logo-nutridash-monogramme-N - transparent.png`.
- **Durée cible** : 20 à 30 s, durée exacte calculée par `references/types-et-durees.md`.
- **Styles autorisés** : tous les styles compatibles (cinématique sombre, clair doux, bande-annonce cinéma, fausse messagerie, affiche éditoriale + gros chiffre, écran partagé). Carte animée et croquis tableau noir non retenus pour NutriDash.
- **Préférences de montage** (retours du 23/10/2026) : **jamais de coupure ni de silence de la musique** (`"silence_rupture": false` en messagerie ; la rupture passe par un flash, un impact ou une pause visuelle) ; **chaque Reel a une accroche en gros texte visible dès la première image, avec du mouvement et du son dès 0 s** (`hook`) ; décor et sons neutres (`"decor": "neutre"`).
- **Dynamisme** (retour du 23/10/2026) : le style « affiche » (très calme) a été jugé trop simple pour un Reel de clôture ; préférer la bande-annonce ou la cinématique sombre pour un chiffre choc.
- **Voix** : tutoiement dans les accroches et les légendes ; les textes recopiés de l'app (réponses de l'assistant, étapes de réflexion) gardent le « vous » de l'app.

## Empreintes (6 dimensions)

| Reel | Style | Typo et mise en page | Mouvement | Palette et fond | Musique et SFX | Structure |
|---|---|---|---|---|---|---|
| 2026-10-26 estimation | cinématique sombre | titre en 2 lignes + pastilles numérotées | balayages et bascules | noir et vert profond (sombre) | énergique (120 BPM) · SFX interface | standard en 6 temps |
| 2026-10-29 assistant | fausse messagerie | bulles de conversation | défilement de messages | neutres clairs (crème, menthe) | chaleureuse (96 BPM) · SFX messagerie | conversation |
| 2026-11-01 7 jours | bande-annonce cinéma | mots géants plein cadre | coupes sèches et chocs | cartes de couleurs franches sur noir | énergique (112 BPM, ré mineur) · SFX cinéma | bande-annonce |

Voisins : 26/10 → 29/10 : 6 dimensions sur 6 différentes. 29/10 → 01/11 : 6 sur 6 différentes (la palette passe du clair aux cartes de couleur sur noir).
