# Composition — Reel du 26/10/2026

Généré par `~/.claude/skills/reel-instagram/generateurs/telephone/generer-reel.py spec.json` (depuis `composition/`).
Retouche : modifier `spec.json`, relancer le générateur, puis `npx hyperframes check` et `npx hyperframes render . --quality high --video-bitrate 10M -o ../2026-10-26_annonce-v2-estimation-ia-reel.mp4`.
Dossier `composition/.hyperframes/` supprimé après rendu (régénérable).
Stand-ins : valeurs du compte de démo fictif (195, 198, 35 kcal ; 428 kcal ; 43 g ; 710/1896 kcal ; 1186 kcal ; 99 g).

## Univers neutre (skill corrigé le 23/10/2026)
Le générateur `telephone` est désormais neutre par défaut : `spec.json` porte `"decor": "neutre"` (pas de terrain) et
`"sfx": {"cta": "switch"}` (son brag à la place du sifflet, pas de foule). Musique : piste originale synthétisée (`synth-musique.py --style energique --bpm 120 --graine 3`, première mesure à 0 s), volume 0,96 → −15,0 LUFS.
Plus aucune retouche manuelle de `index.html` : régénérer avec le générateur suffit.
