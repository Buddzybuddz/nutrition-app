# NutriDash — Cahier des Charges V2
> Document produit le 3 juillet 2026 — Confidentiel
> Met à jour le CDC V1 (24 juin 2026) après audit croisé documentation ↔ code source réel.

---

## Changelog V1 → V2

| # | Élément | V1 (24 juin 2026) | V2 (état réel constaté) |
|---|---|---|---|
| 1 | Prix abonnement | 10 €/mois | **5,99 €/mois** (commit `770599b`) |
| 2 | Durée essai gratuit | 14 jours (2 semaines) | **7 jours** |
| 3 | Direction artistique | Neo-brutalist, jaune `#FFD600` | **Soft Modern**, vert `#2D6A4F` / terracotta `#E07A5F` (remplacé par le Design System V2) |
| 4 | Logo | À compléter | **Monogramme N livré** (`Images/Logos/logo-nutridash-monogramme-N.png`) |
| 5 | Consentement RGPD (checkbox CGU) | ⚠️ À implémenter | ✅ **Implémenté** (`#rgpd-consent` à l'inscription) |
| 6 | Suppression de compte | ⚠️ À implémenter | ✅ **Implémenté** (`deleteAccount()` + modale de confirmation) |
| 7 | Export des données | ⚠️ À implémenter | ✅ **Implémenté** — CSV **et** JSON (au-delà du CSV seul prévu en V1) |
| 8 | Graphique évolution du poids | 💡 Nice to Have, non fait | ✅ **Implémenté** (Chart.js 4.4.7 + `date-fns` adapter) |
| 9 | Paiement Stripe | Phase 3 "À planifier" | ✅ **Implémenté en production** — paywall server-side (`pb/pb_hooks/stripe.pb.js`) |
| 10 | Schéma de données | 6 collections | **7 collections** — ajout de `user_data` (JSON générique : statut abonnement, exemption, données Stripe) |
| 11 | Application mobile Capacitor | 💡 Nice to Have | ❌ Toujours non fait — reste à l'état de projet |
| 12 | Notifications push | 💡 Nice to Have | ❌ Toujours non fait — reste à l'état de projet |
| 13 | SRI sur scripts CDN | 💡 Nice to Have | ✅ **Implémenté** (`integrity=` sur Chart.js, date-fns, PocketBase SDK) |
| 14 | Phase 2 — RGPD & Légal | "À faire" | ✅ **Terminé** (CGU + PP publiées, consentement, suppression, export) |
| 15 | Phase 3 — Lancement public | "À planifier" | 🟡 **En cours** — Stripe actif en prod, checklist go-live restante (voir mémoire projet) |

---

## Section 1 — Présentation du projet

### 1.1 Nom du projet

**NutriDash**

### 1.2 Résumé exécutif

NutriDash est une application web de suivi nutritionnel personnalisé, conçue pour les personnes qui veulent piloter leur alimentation avec précision sans dépendre d'une base de données d'aliments souvent erronée. L'utilisateur saisit directement ses calories et macros, l'application calcule ses besoins réels à partir de sa physiologie (formule Mifflin-St Jeor), suit sa progression quotidienne et analyse ses résultats sur plusieurs périodes. Elle se distingue des acteurs dominants (MyFitnessPal, Yazio) par sa sobriété fonctionnelle, son interface Soft Modern mobile-first, et son absence totale de BDD alimentaire — un choix délibéré qui élimine la principale source d'erreur des apps concurrentes. NutriDash est commercialisé à **5,99 €/mois avec 7 jours d'essai gratuit**, paiement géré via Stripe.

### 1.3 Contexte et genèse du projet

Le marché des applications de nutrition représente **2,5 milliards USD en 2024** et devrait atteindre **8,3 milliards USD en 2033** (CAGR 15,2 %). L'Europe représente environ 25 % de ce marché.

**Problème identifié :** Les applications de suivi nutritionnel dominantes (MyFitnessPal, Yazio, Cronometer) reposent sur des bases de données contributives contenant des millions d'erreurs de saisie. Les utilisateurs avancés — sportifs, personnes en sèche ou en prise de masse — qui pèsent eux-mêmes leurs aliments et connaissent leurs macros n'ont pas besoin d'une BDD : ils ont besoin d'un tableau de bord précis, rapide à saisir et qui calcule leurs besoins réels. Ces profils sont mal servis par des apps généralistes surchargées de fonctionnalités et de publicité.

NutriDash répond à ce besoin en supprimant la BDD et en mettant le calcul physiologique au centre : l'app sait exactement ce que l'utilisateur doit consommer selon son poids, sa taille, son âge, son sexe et son objectif.

### 1.4 Porteur de projet

| Champ | Détail |
|---|---|
| Nom | Jérémy Baudouin |
| Profil | Développeur — porteur de projet solo |
| Stack maîtrisée | JavaScript Vanilla, HTML/CSS, PocketBase |
| Expérience terrain | Développement, sécurisation et mise en conformité RGPD de NutriDash, intégration Stripe en production |

---

## Section 2 — Analyse du marché et de la concurrence

*(Inchangé depuis la V1 — aucune information nouvelle recueillie sur le marché ou les concurrents.)*

### 2.1 Taille et tendances du marché

| Indicateur | Valeur |
|---|---|
| Marché mondial nutrition apps (2024) | ~2,5 milliards USD |
| Projection 2033 | ~8,3 milliards USD |
| CAGR 2026–2033 | 15,2 % |
| Part Europe | ~25 % du marché mondial |
| Moteur principal | Préventif + nutrition personnalisée (IA/ML) |
| Frein principal | Confidentialité des données (RGPD) : impact ~25 % des utilisateurs potentiels |

### 2.2 Tableau comparatif des concurrents

| App | Fonctionnalités clés | Prix | Points forts | Points faibles |
|---|---|---|---|---|
| **MyFitnessPal** | BDD 14M aliments, scan code-barre, 50+ intégrations, macros | ~80 €/an | Base de données massive, intégrations fitness | BDD contributive = erreurs fréquentes, interface surchargée, orienté marché US |
| **Yazio** | BDD aliments française, suivi poids, sync montres, recettes | ~24 €/an | BDD française bien adaptée, interface claire | Publicités (version gratuite), fonctionnalités avancées payantes |
| **Cronometer** | Micronutriments, BDD 800K aliments vérifiés, macros | ~50 €/an | Données vérifiées manuellement, micronutriments précis | Interface anglophone, complexe pour débutants |
| **NutriScan** | IA photo → analyse nutritionnelle, cuisine française | À définir | Zéro saisie manuelle, adapté cuisine française | Dépend de la qualité IA, données estimées |
| **Nutrola** | IA photo → macros instantanés | À définir | Ultra-simple, aucune BDD à chercher | Estimations IA, pas de calcul physiologique personnalisé |
| **MacrosFirst** | Suivi macros manuel, planning repas | Freemium | Focus macros, interface épurée | Pas de calcul BMR/TDEE, moins connu en France |

### 2.3 Positionnement différenciant

NutriDash est la seule application qui :

1. **Calcule les besoins réels** à partir de la physiologie de l'utilisateur (BMR Mifflin-St Jeor + TDEE adapté à l'objectif) sans se contenter de moyennes génériques
2. **Supprime la BDD alimentaire** pour éliminer la principale source d'erreur — l'utilisateur saisit directement ce qu'il sait
3. **Analyse la performance par période** (semaine, mois, trimestre) avec tolérance dynamique et score motivant
4. **Traque l'historique des objectifs** pour contextualiser chaque période d'analyse
5. **Fonctionne offline-first** (localStorage) avec sync cloud asynchrone — zéro perte de données en cas de réseau instable

### 2.4 Opportunité identifiée

Les applications dominantes cherchent à couvrir 100 % des cas d'usage (débutants, régimes, recettes, scan, IA…) et deviennent des usines à gaz. Il existe un segment non adressé : les **utilisateurs autonomes** — sportifs, personnes en sèche ou en prise de masse — qui savent peser leurs aliments, connaissent leurs macros et veulent un outil de pilotage précis, rapide et sobre. Ce segment est prêt à payer pour un outil dédié et sans friction.

---

## Section 3 — Utilisateurs cibles

*(Personas inchangés — aucune donnée terrain nouvelle recueillie depuis la V1.)*

### 3.1 Personas

**Persona prioritaire — Julien**

| Champ | Détail |
|---|---|
| Nom fictif | Julien, 27 ans |
| Situation | Développeur web, pratique la musculation 4x/semaine |
| Habitudes digitales | Utilisateur intensif mobile, intolérant aux apps lentes ou surchargées |
| Rôle | Utilisateur quotidien : saisie repas matin et soir, pesée hebdomadaire |
| Problème principal | MyFitnessPal lui donne des valeurs erronées sur ses aliments maison — il a arrêté de lui faire confiance |
| Frustrations | BDD incohérentes, publicités, fonctionnalités inutiles qui ralentissent la saisie |
| Ce qu'il attend | Saisir 3 repas en moins de 2 minutes, voir ses macros en temps réel, analyser sa semaine en un coup d'œil |

---

**Persona 2 — Sophie**

| Champ | Détail |
|---|---|
| Nom fictif | Sophie, 34 ans |
| Situation | Cadre commerciale, veut perdre 8 kg après une grossesse |
| Habitudes digitales | Smartphone Android, utilise quelques apps santé, pas très technique |
| Rôle | Utilisatrice quotidienne : saisie des repas, suivi du poids hebdomadaire |
| Problème principal | A essayé Yazio mais se perd dans les menus et abandonne au bout de 2 semaines |
| Frustrations | Trop de choix, interface confuse, se sent jugée par les notifications agressives |
| Ce qu'elle attend | Un outil simple qui lui dit combien il lui reste à manger, et qui la félicite quand elle atteint son objectif |

---

**Persona 3 — Maxime**

| Champ | Détail |
|---|---|
| Nom fictif | Maxime, 41 ans |
| Situation | Triathlète amateur, objectif maintenance + optimisation récupération |
| Habitudes digitales | iPhone, connaît bien les apps fitness, utilise Garmin |
| Rôle | Utilisateur quotidien + analyse hebdomadaire poussée |
| Problème principal | Les apps ne tiennent pas compte de ses activités pour ajuster le TDEE en temps réel |
| Frustrations | Devoir tout recalculer manuellement quand il fait une sortie longue |
| Ce qu'il attend | Saisir ses activités et voir le TDEE cible se recalculer automatiquement |

### 3.2 Parcours utilisateur principal (User Journey)

```
[Utilisateur] Découverte landing page
      ↓
[Utilisateur] Clic "Démarrer gratuitement"
      ↓
[App] Affichage formulaire inscription (email + mdp + consentement CGU/PP)
      ↓
[Système] Création compte PocketBase → connexion automatique
      ↓
[App] Redirection vers formulaire Profil
      ↓
[Utilisateur] Saisie : date naissance, genre, poids, taille, objectif, jour de pesée
      ↓
[App] Calcul temps réel BMR + TDEE → affichage dynamique
      ↓
[Utilisateur] Validation profil
      ↓
[App] Sauvegarde cloud (profiles) + localStorage → redirection Dashboard
      ↓
[Utilisateur] Vue Dashboard : objectif calorique du jour affiché, cercles à 0%
      ↓
[Utilisateur] Clic "+ Ajouter un repas"
      ↓
[App] Modal repas : type pré-sélectionné (Petit-déjeuner), champs calories + protéines
      ↓
[Utilisateur] Saisie valeurs → validation
      ↓
[App] Mise à jour cercles de progression + journal du jour
      ↓
[Système] Sync asynchrone PocketBase (meals)
      ↓
[Utilisateur] Répète pour Déjeuner, Dîner ± Collation
      ↓
[App] Progression journalière 100% → message "Objectif atteint 🏆"
      ↓
[Utilisateur] Jour de pesée → saisie du poids
      ↓
[App] Recalcul BMR/TDEE + vérification objectif atteint
      ↓
[Utilisateur] Page Suivi → sélection période → bilan calories / protéines / poids
      ↓
[Système] Après 7 jours d'essai → paywall Stripe si aucun abonnement actif (sauf is_exempt)
```

### 3.3 Critères d'acceptation utilisateur

1. Un utilisateur peut saisir un repas complet (type + calories + protéines) en **moins de 20 secondes**
2. Les cercles de progression se mettent à jour **immédiatement** après validation d'un repas (sans rechargement)
3. Un nouvel utilisateur peut créer son compte, saisir son profil et voir son premier objectif en **moins de 3 minutes**
4. La page Suivi affiche un bilan de la semaine en **moins de 2 secondes** après sélection du filtre
5. L'application reste utilisable **sans connexion internet** (localStorage) et se resynchronise dès que le réseau revient
6. Sur mobile (iPhone 13, Android récent), toutes les interactions sont accessibles **d'une seule main**

---

## Section 4 — Objectifs du projet

### 4.1 Objectifs business (SMART)

| # | Objectif | Indicateur | Cible chiffrée | Échéance |
|---|---|---|---|---|
| B1 | Acquérir les premiers utilisateurs payants | Nombre d'abonnés actifs | 50 abonnés | M+3 après lancement |
| B2 | Atteindre la viabilité financière | MRR (Monthly Recurring Revenue) | 300 €/mois *(révisé — prix baissé à 5,99 €)* | M+6 |
| B3 | Valider la rétention | Taux rétention M1→M2 | ≥ 40 % | M+6 |
| B4 | Croissance organique | Abonnés actifs | 200 abonnés | M+12 |
| B5 | Lancer l'application mobile | App Store + Google Play | 1 version Capacitor publiée | À définir |

> **Note V2 :** B2 a été révisé à la baisse (500 € → 300 €/mois) suite au changement de prix de 10 € à 5,99 €/mois. Le nombre d'abonnés cible pour atteindre le MRR reste à recalculer une fois les premières données de conversion réelles disponibles.

### 4.2 Objectifs utilisateurs

1. L'utilisateur sait en temps réel combien de calories et de protéines il lui reste à consommer dans la journée
2. L'utilisateur comprend si sa semaine/son mois a été conforme à son objectif (sèche, masse, maintenance)
3. L'utilisateur voit l'évolution de son poids sur le long terme contextualisée par son objectif du moment
4. L'utilisateur reçoit des suggestions concrètes pour améliorer ses habitudes (page Conseils)
5. L'utilisateur peut modifier son objectif à tout moment sans perdre l'historique des périodes précédentes

### 4.3 KPIs de succès

| KPI | Définition | Cible |
|---|---|---|
| Taux d'activation | % utilisateurs ayant saisi ≥ 1 repas le jour J+1 de leur inscription | ≥ 60 % |
| Rétention M1→M2 | % abonnés ayant renouvelé après le premier mois | ≥ 40 % |
| Sessions/semaine | Nombre moyen de connexions par utilisateur actif par semaine | ≥ 5 |
| Délai 1ère saisie | Temps entre inscription et premier repas saisi | < 5 minutes |
| Taux conversion essai → payant | % d'utilisateurs qui souscrivent au terme des 7 jours d'essai | ≥ 25 % |
| NPS | Net Promoter Score (survey in-app à M+1) | ≥ 30 |
| Churn mensuel | % abonnés résiliés par mois | ≤ 8 % |

---

## Section 5 — Périmètre fonctionnel

### 5.1 Arborescence de l'application

```
NutriDash
├── Landing Page (#landingpage)
│   ├── Hero + CTA "Démarrer gratuitement"
│   ├── Fonctionnalités (3 cartes)
│   ├── Process (3 étapes)
│   ├── Tarif (5,99 €/mois, 7 jours d'essai)
│   └── Footer
│
├── Authentification (#login)
│   ├── Formulaire Connexion
│   ├── Formulaire Inscription (+ consentement CGU/PP)
│   └── Formulaire Reset mot de passe
│
├── Profil (#profil)
│   ├── Formulaire : naissance, genre, poids, taille, objectif, jour pesée
│   ├── Export des données (CSV, JSON)
│   └── Suppression de compte (avec confirmation)
│
├── Dashboard (#tableaudebord)
│   ├── Navigation dates (← Jour →)
│   ├── Barre progression journalière
│   ├── Carte pesée (si jour configuré)
│   ├── Cercle Calories
│   ├── Cercle Protéines
│   ├── Boutons actions (+ Repas / + Activité)
│   └── Journal du jour (liste repas + activités)
│
├── Suivi (#historique)
│   ├── Filtres période (7j / 30j / 90j / 180j / 365j)
│   ├── Analyse Calories
│   ├── Analyse Protéines
│   ├── Historique Poids (courbe Chart.js)
│   ├── Historique Objectifs
│   └── Bilan score (3 critères)
│
├── Conseils (#conseils)
│   └── 8 sections éducatives statiques (expandables)
│
└── Paywall (transversal)
    └── Bloque l'accès après 7 jours d'essai sans abonnement actif (sauf is_exempt) — checkout Stripe

Modals transversaux
├── Modal Repas (ajout / édition)
├── Modal Activité (ajout / édition)
├── Modal Gestion activités custom
├── Modal Objectif atteint (félicitations)
└── Modal Supprimer compte
```

### 5.2 Liste des fonctionnalités par priorité (MoSCoW)

| Fonctionnalité | Priorité | Statut | Critère d'acceptation |
|---|---|---|---|
| Inscription / Connexion email + mdp | ✅ Must Have | ✅ Fait | Un utilisateur peut créer un compte et se connecter en < 2 min |
| Saisie profil physiologique | ✅ Must Have | ✅ Fait | BMR et TDEE calculés et affichés après validation du formulaire |
| Calcul BMR (Mifflin-St Jeor) + TDEE | ✅ Must Have | ✅ Fait | Valeurs correctes vérifiées contre calcul manuel pour homme et femme |
| Dashboard avec cercles de progression | ✅ Must Have | ✅ Fait | Cercles mis à jour < 500 ms après ajout d'un repas |
| Navigation entre les jours | ✅ Must Have | ✅ Fait | L'utilisateur peut consulter n'importe quel jour passé |
| Ajout / édition / suppression de repas | ✅ Must Have | ✅ Fait | Repas saisi et visible dans le journal en < 20 secondes |
| Ajout / édition / suppression d'activité | ✅ Must Have | ✅ Fait | Activité saisie et TDEE recalculé immédiatement |
| Pesée hebdomadaire | ✅ Must Have | ✅ Fait | Carte pesée visible le jour configuré, poids sauvegardé en historique |
| Sync locale (localStorage) | ✅ Must Have | ✅ Fait | Données persistantes après fermeture du navigateur sans connexion |
| Sync cloud (PocketBase) | ✅ Must Have | ✅ Fait | Données synchronisées sur un second appareil après connexion |
| Page Suivi avec filtres temporels | ✅ Must Have | ✅ Fait | Bilan affiché en < 2 s pour chaque filtre |
| Analyse calories / protéines / poids par période | ✅ Must Have | ✅ Fait | Valeurs cohérentes avec le journal sur la période sélectionnée |
| Historique des objectifs | ✅ Must Have | ✅ Fait | Chaque changement d'objectif tracé et affiché dans la chronologie |
| Déconnexion sécurisée | ✅ Must Have | ✅ Fait | Déconnexion efface le localStorage et redirige vers landing |
| Paiement Stripe (abonnement mensuel) | ✅ Must Have *(reclassé depuis V1)* | ✅ Fait | Paywall server-side, checkout Stripe fonctionnel en prod |
| Consentement RGPD formalisé (CGU + PP) | ✅ Must Have *(reclassé)* | ✅ Fait | Checkbox obligatoire à l'inscription avant création de compte |
| Bouton "Supprimer mon compte" | ✅ Must Have *(reclassé)* | ✅ Fait | Suppression totale des données avec confirmation |
| Export données utilisateur (CSV + JSON) | ✅ Must Have *(reclassé)* | ✅ Fait | Fichiers téléchargeables contenant tout l'historique |
| Activités personnalisées (création + gestion) | 🟡 Should Have | ✅ Fait | Activité custom apparaît dans la liste à la prochaine saisie |
| Score bilan motivant (3 critères) | 🟡 Should Have | ✅ Fait | Message adapté au score 3/3, 2/3 ou < 2/3 |
| Modal objectif atteint (félicitations) | 🟡 Should Have | ✅ Fait | Modal affiché quand poids ≤ poids cible (goal=loss) |
| Page Conseils (contenu éducatif) | 🟡 Should Have | ✅ Fait | 8 sections expandables accessibles sans connexion |
| Réinitialisation mot de passe | 🟡 Should Have | ✅ Fait | Email de reset envoyé via SMTP PocketBase |
| Graphique évolution du poids (courbe) | 💡 Nice to Have *(fait plus tôt que prévu)* | ✅ Fait | Chart.js — courbe temporelle avec points de pesée sur la période filtrée |
| SRI hashes pour scripts CDN | 💡 Nice to Have *(fait plus tôt que prévu)* | ✅ Fait | Attribut `integrity` présent sur Chart.js, date-fns, PocketBase SDK |
| Application mobile iOS / Android (Capacitor) | 💡 Nice to Have | ❌ Non fait | App installable depuis App Store et Google Play |
| Notifications de rappel (pesée, saisie) | 💡 Nice to Have | ❌ Non fait | Notification push envoyée le jour de pesée configuré |

> **Note V2 :** quatre fonctionnalités classées « Nice to Have » en V1 (consentement RGPD, suppression de compte, export des données, paiement Stripe) ont en réalité été implémentées et sont désormais requises pour le lancement public — elles sont reclassées en **Must Have** dans cette V2, conformément à leur statut réel de blocantes légales/business.

### 5.3 User Stories (Must Have)

- En tant que **Julien** (sportif en prise de masse), je veux saisir mon petit-déjeuner en moins de 20 secondes afin de ne pas perdre de temps avant l'entraînement.
- En tant que **Sophie** (objectif perte de poids), je veux voir immédiatement combien de calories il me reste à consommer afin de mieux décider quoi manger au dîner.
- En tant que **Maxime** (triathlète), je veux saisir ma sortie vélo et voir le TDEE cible se recalculer afin de savoir combien manger en plus ce jour-là.
- En tant qu'utilisateur, je veux que mes données soient sauvegardées localement afin de pouvoir consulter mon journal même sans internet.
- En tant qu'utilisateur, je veux changer mon objectif (sèche → maintenance) et conserver l'historique des périodes précédentes afin d'analyser chaque phase séparément.
- En tant qu'utilisateur, je veux naviguer vers un jour passé afin de corriger une saisie oubliée.
- En tant qu'utilisateur, je veux voir l'analyse de ma semaine en un coup d'œil afin de savoir si j'ai respecté mes objectifs.
- En tant qu'utilisateur, je veux saisir mon poids le jour prévu afin de mettre à jour mes besoins caloriques calculés.
- En tant qu'utilisateur, je veux cocher mon consentement aux CGU à l'inscription afin que mon usage du service soit conforme au RGPD.
- En tant qu'utilisateur, je veux pouvoir m'abonner via Stripe après mes 7 jours d'essai afin de continuer à utiliser l'application sans interruption.
- En tant qu'utilisateur, je veux pouvoir supprimer mon compte et toutes mes données afin d'exercer mon droit à l'effacement RGPD.
- En tant qu'utilisateur, je veux exporter mes données en CSV ou JSON afin d'exercer mon droit à la portabilité RGPD.

### 5.4 Flux utilisateur principal

```
1.  Arrivée sur la landing page
2.  Clic "Démarrer gratuitement" → page #login (formulaire inscription visible)
3.  Saisie email + mot de passe (min. 8 car.) + confirmation + consentement CGU/PP
4.  Validation → création compte PocketBase + connexion automatique
5.  Redirection vers #profil (formulaire vide)
6.  Saisie : date de naissance, genre, poids actuel, taille, objectif, jour de pesée
7.  Le BMR et TDEE s'affichent en temps réel pendant la saisie
8.  Si objectif = "Perte de poids" → champ "Poids visé" apparaît
9.  Validation profil → sauvegarde cloud + localStorage
10. Redirection vers #tableaudebord
11. Le dashboard affiche le TDEE cible du jour, cercles à 0 %
12. Clic "+ Repas" → modal avec type pré-sélectionné (Petit-déjeuner)
13. Saisie calories + protéines → validation
14. Cercles mis à jour, entrée visible dans le journal
15. Répétition pour Déjeuner, Dîner (± Collation, ± Activité)
16. Jour de pesée : carte "Votre pesée ⚖️" affichée → saisie poids → recalcul BMR/TDEE
17. Navigation vers #historique → filtre "Semaine en cours"
18. Lecture bilan : calories ✅ / protéines ⚠️ / poids ✅ → score 2/3 → message adapté
19. Au terme des 7 jours d'essai : paywall affiché si aucun abonnement actif → checkout Stripe
```

---

## Section 6 — Spécifications techniques

### 6.1 Architecture technique

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | HTML5 / CSS3 / JavaScript Vanilla (SPA) | Zéro dépendance framework runtime, performances maximales |
| Backend / API | PocketBase (Go, binaire unique) | Auth + BDD + API REST intégrés, déploiement trivial, open source |
| Base de données | SQLite (intégré PocketBase) | Suffisant jusqu'à ~100k utilisateurs, inclus dans PocketBase |
| Authentification | PocketBase Auth (email/password) | Nativement intégré, tokens JWT, durée de session 24h |
| Stockage local | localStorage (clé isolée par user) | Offline-first, sync différée |
| Paiement | Stripe (Checkout + hooks PocketBase serveur) | Paywall server-side (`pb/pb_hooks/stripe.pb.js`), source de vérité côté serveur |
| Hébergement backend | Fly.io | Déploiement Go simplifié, région EU (Frankfurt), tarif pay-as-you-go |
| Hébergement frontend | Statique (nutridash.fr) | Fichiers statiques, CDN intégré |
| Mobile (V2 future) | Capacitor (iOS + Android) | Non démarré — wrapping WebView, réutiliserait 100 % du code existant |
| Charts | Chart.js 4.4.7 + date-fns adapter (CDN jsdelivr, SRI) | Graphique d'évolution du poids, déjà en production |

### 6.2 Schéma de données

**users** (natif PocketBase)
- email, password, is_active

**profiles** (1 par utilisateur)
- user (FK), birthDate, gender, weight, height, goal, targetWeight, weighInDay, customActivities (JSON)

**meals**
- user (FK), date, mealType (breakfast|lunch|snack|dinner), name, calories, protein

**activities_log**
- user (FK), date, name, calories_burned

**weigh_ins**
- user (FK), date, weight

**daily_stats** (snapshot par jour)
- user (FK), date, baseTDEE, goal, goalMultiplier

**goal_history**
- user (FK), date, goal

**user_data** *(nouveau — non documenté en V1)*
- user (FK), data (JSON libre — statut abonnement Stripe, `is_exempt`, dates d'essai et métadonnées paywall)

### 6.3 Intégrations tierces

| Service | Outil retenu | Usage | Coût |
|---|---|---|---|
| Backend | PocketBase | Auth + BDD + API | Gratuit (open source) |
| Hébergement PB | Fly.io | Serveur PocketBase en prod | ~3-5 €/mois (shared-cpu-1x) |
| CDN PocketBase SDK | jsDelivr (SRI) | Chargement SDK JS client | Gratuit |
| CDN Chart.js + date-fns | jsDelivr (SRI) | Graphique évolution du poids — **en production** | Gratuit |
| Polices | Google Fonts | DM Sans (titres) + Inter (UI) | Gratuit |
| Paiement | Stripe | Abonnement mensuel 5,99 €/mois — **en production** | 1,5 % + 0,25 € / transaction |
| Emails transactionnels | PocketBase SMTP | Reset mdp, confirmation | Gratuit (SMTP propre) |

### 6.4 Exigences de performance

| Critère | Cible |
|---|---|
| Chargement initial (3G) | < 3 secondes |
| Mise à jour des cercles après saisie | < 500 ms |
| Réponse API PocketBase (create meal) | < 800 ms |
| Chargement historique 6 mois | < 2 secondes |
| Disponibilité backend (SLA Fly.io) | ≥ 99,5 % |

### 6.5 Sécurité et conformité RGPD

**Données collectées**

| Donnée | Sensibilité | Usage |
|---|---|---|
| Email | Moyenne | Authentification, reset mdp |
| Date de naissance | Haute (âge → calculs) | Calcul BMR uniquement |
| Poids, taille | Haute (santé) | Calculs nutritionnels |
| Historique repas / activités | Moyenne | Analyses suivi |
| Données Stripe (customer_id, statut abonnement) | Moyenne | Facturation |

**Mesures de sécurité implémentées**
- Tokens JWT PocketBase, durée 24h (session courte)
- `emailVisibility: false` à l'inscription
- `escapeHtml()` sur tout contenu utilisateur injecté en DOM
- Logs conditionnés à `isDev` (aucune donnée interne exposée en prod)
- CSP via meta tag (default-src self, connect-src limité)
- Règles PocketBase : `user = @request.auth.id` sur toutes les collections
- `deleteRule` activée sur profiles et goal_history
- Hashes SRI sur tous les scripts CDN externes
- Paywall vérifié **côté serveur** (hook PocketBase), non contournable côté client

**Droits utilisateurs (RGPD)**

| Droit | Statut |
|---|---|
| Accès aux données | ✅ Fait (export CSV + JSON) |
| Rectification | ✅ Fait (formulaire profil) |
| Suppression | ✅ Fait (bouton "Supprimer mon compte" + modale de confirmation) |
| Portabilité | ✅ Fait (export JSON/CSV) |
| Consentement | ✅ Fait (checkbox CGU + PP obligatoire à l'inscription) |

> **Note V2 :** les 5 droits RGPD identifiés comme lacunes en V1 sont désormais tous couverts. Le CDC V1 marquait ce chantier "⚠️ À implémenter" — il est clos.

**Documents légaux**
- Conditions Générales d'Utilisation (CGU) — publiées (`cgu.html`)
- Politique de confidentialité — publiée (`confidentialite.html`)
- Politique de cookies — à évaluer si des outils d'analytics sont ajoutés (non fait à ce jour)

### 6.6 Hébergement et infrastructure

| Tier | Coût mensuel | Capacité |
|---|---|---|
| Dev local | 0 € | 1 utilisateur |
| Fly.io shared-cpu-1x (prod actuel) | ~3-5 € | Jusqu'à ~500 utilisateurs actifs |
| Fly.io performance-1x | ~15-20 € | Jusqu'à ~5 000 utilisateurs actifs |
| Migration vers VPS (Hetzner) | ~5-10 € | Contrôle total, DB > 1 Go |

---

## Section 7 — Design et expérience utilisateur

> **Changement majeur V2 :** la direction artistique neo-brutalist de la V1 (jaune `#FFD600`, bordures épaisses, ombres décalées) a été **entièrement remplacée** par un design system "Soft Modern", formalisé dans `documentation/design/NutriDash-Design-V2.md` et `design.md` à la racine. Le style.css actuel confirme cette bascule (113 usages des tokens Soft Modern contre 22 résidus neo-brutalist non encore nettoyés).

### 7.1 Direction artistique

**Mots-clés :** Clarté · Confiance · Énergie douce · Naturel

**Valeurs visuelles :**
- Soft Modern : surfaces douces, grand radius, ombres subtiles (jamais décalées)
- Couleur primaire vert forêt `#2D6A4F`, accent terracotta `#E07A5F`, fond blanc cassé à teinte verte `#F7F8F3`
- Typographie DM Sans (titres) + Inter (corps), hiérarchie claire sans excès de couleur
- Espaces blancs intentionnels, densité d'information maîtrisée

**Ce que l'app ne doit PAS paraître :**
- Neo-brutaliste (l'ancienne direction V1 est abandonnée — plus de bordures noires épaisses, plus d'ombres portées décalées)
- Médical ou clinique (pas de bleu stérile, pas de croix)
- Surchargée (pas de sidebar encombrée, pas de notifications intrusives)

### 7.2 Références visuelles

| Référence | Ce qu'on en retient |
|---|---|
| Linear.app | Navigation latérale sobre, densité d'information sans surcharge |
| Notion | Typographie claire, hiérarchie visuelle sans couleur excessive |
| Strava | Cercles de progression, gamification subtile |
| Apps "wellness" naturelles | Palette verte/terracotta, surfaces douces, ombres non décalées |

### 7.3 Charte graphique

| Élément | Valeur |
|---|---|
| Couleur primaire | Vert forêt `#2D6A4F` |
| Couleur primaire claire | `#52B788` |
| Couleur accent | Terracotta `#E07A5F` |
| Fond | Blanc cassé teinté vert `#F7F8F3` |
| Couleur succès | Vert `#2D6A4F` |
| Couleur alerte | Rouge `#C1121F` |
| Typographie titres | DM Sans (Google Fonts) |
| Typographie corps | Inter (Google Fonts) |
| Style icônes | Lucide Icons (ligne fine, stroke-width 1.75px) |
| Ombres | Elevation douce, non décalée (`--shadow-1` à `--shadow-4`) |
| Radius | 8 à 32px selon composant, pill pour boutons/badges |
| Logo | Monogramme N — livré (`Images/Logos/logo-nutridash-monogramme-N.png`) |

> Détail complet des tokens, composants et animations : voir `design.md` et `documentation/design/NutriDash-Design-V2.md`.

### 7.4 Exigences d'accessibilité

- Contraste texte/fond : ratio ≥ 4,5:1 (WCAG AA)
- Taille de texte minimale : 14px (12px caption uniquement)
- Zones tactiles : ≥ 44×44pt (standard Apple / Google Material)
- Pas de transmission d'information par la couleur seule (toujours icône + texte)

### 7.5 Approche responsive

**Mobile First.** Contexte d'usage principal : debout, d'une main, entre deux activités (avant ou après un repas). L'interface est entièrement utilisable sur iPhone SE (375px) sans zoom ni scroll horizontal. Navigation basse à 4 onglets (Accueil, Suivi, Conseils, Profil) confirmée en production.

### 7.6 Livrables UX

- [x] User flows principaux (existants dans le code)
- [x] Maquettes haute fidélité (implémentées)
- [x] Design system formalisé (`design.md` + Design V2 — composants, tokens de couleur documentés)
- [ ] Tests utilisateurs (minimum 5 personnes sur parcours inscription → première saisie) — non fait à ce jour
- [ ] Prototype Figma cliquable pour présentation investisseurs — non nécessaire à ce stade (produit déjà en prod)

---

## Section 8 — Modèle économique

### 8.1 Modèle de revenus

Abonnement mensuel avec essai gratuit. Pas de version freemium permanente — l'essai de 7 jours constitue la fenêtre de conversion.

| Plan | Prix | Fonctionnalités incluses |
|---|---|---|
| Essai gratuit | 0 € (7 jours) | Accès complet à toutes les fonctionnalités |
| Abonnement mensuel | **5,99 €/mois** | Accès complet, sync cloud illimitée, historique illimité |
| Abonnement annuel | À définir | Non implémenté à ce jour |

> **Note V2 :** le prix a été réduit de 10 € à 5,99 €/mois et la durée d'essai de 14 à 7 jours (commit `770599b — feat: paywall server-side + correction prix 5,99€`). Le paiement Stripe est en production, vérifié côté serveur.

### 8.2 Stratégie d'acquisition

| Canal | Justification |
|---|---|
| SEO / contenu (blog nutrition, calcul BMR) | Requêtes à forte intention : "calculer TDEE", "sèche musculaire calories" |
| Communautés Reddit / forums fitness | Présence là où se trouve le persona Julien (r/fitness, forum-musculation.com) |
| Instagram / TikTok (contenu éducatif) | Persona Sophie — contenu "comment je suis ma nutrition" |
| Bouche à oreille | Produit de niche → utilisateurs satisfaits convertissent leurs pairs |
| Product Hunt | Lancement V1 pour visibilité initiale internationale |

### 8.3 Projections financières simplifiées (12 mois)

*Ces projections sont indicatives — basées sur des hypothèses conservatrices, révisées suite à la baisse de prix.*

| Période | Nouveaux utilisateurs | Abonnés payants | MRR (à 5,99 €) |
|---|---|---|---|
| M1-M2 (lancement) | 50 | 15 | ~90 € |
| M3-M4 | 80 | 35 | ~210 € |
| M5-M6 | 120 | 60 | ~360 € |
| M7-M9 | 200 | 100 | ~600 € |
| M10-M12 | 350 | 180 | ~1 080 € |

**Hypothèses :** taux de conversion essai→payant = 25-30 %, churn mensuel = 8 %, acquisition 100 % organique/communauté. Le MRR cible de la Section 4.1 (B2) a été révisé de 500 € à 300 €/mois pour tenir compte du nouveau prix.

---

## Section 9 — Planning et livrables

### 9.1 Phases du projet

**Phase 0 — Fondations (Terminé)**
- Architecture PocketBase + frontend SPA
- Collections de données (profiles, meals, activities_log, weigh_ins, daily_stats, goal_history)
- Authentification email/password
- Sync local/cloud
- Livrable : MVP fonctionnel déployé sur Fly.io

**Phase 1 — Sécurité & Stabilisation (Terminé)**
- Audit OWASP complet (2 itérations)
- Suppression clé API exposée, XSS corrigés, logs conditionnés
- Purge données personnelles de l'historique git
- Règles PocketBase sécurisées
- SRI sur tous les scripts CDN
- Livrable : Application sécurisée, 0 critique, 0 haut

**Phase 2 — Conformité RGPD & Légal (Terminé)**
- CGU + Politique de confidentialité rédigées et publiées
- Checkbox consentement à l'inscription
- Bouton "Supprimer mon compte" fonctionnel
- Export des données utilisateur (CSV + JSON)
- Livrable : Application conforme RGPD — **atteint**

**Phase 3 — Lancement public (En cours)**
- Intégration paiement Stripe (abonnement mensuel) — **fait**, paywall server-side en production
- Prix ajusté à 5,99 €/mois, essai 7 jours — **fait**
- Nouveau logo (monogramme N) — **fait**
- Page tarif avec CTA "Démarrer l'essai" — **fait**
- Soumission Product Hunt — **restant**
- Checklist go-live complète (voir suivi projet) — **restant**
- Livrable : App en production avec monétisation active — **partiellement atteint**

**Phase 4 — V1+ Should Have (Terminé en avance)**
- Graphique d'évolution du poids (courbe Chart.js) — **fait**, plus tôt que prévu
- Améliorations UX basées sur retours utilisateurs — en continu
- Livrable : Version enrichie avec analytics — **partiellement atteint** (graphique fait, analytics non commencés)

**Phase 5 — Mobile V2 (Selon traction, non démarré)**
- Durée estimée : 2-4 semaines
- Build Capacitor iOS + Android
- Soumission App Store + Google Play
- Notifications push (pesée, rappel saisie)
- Livrable : Applications natives publiées

### 9.2 Critères de validation par phase

| Phase | Critère de validation | Statut |
|---|---|---|
| Phase 2 — RGPD | CGU publiées + checkbox inscription + bouton suppression fonctionnel | ✅ Validé |
| Phase 3 — Lancement | Paiement Stripe fonctionnel, 1er abonné payant enregistré | 🟡 Paiement fonctionnel ; premier abonné payant à confirmer |
| Phase 4 — V1+ | Graphique poids affiché sur 3 filtres temporels, NPS mesuré | 🟡 Graphique fait ; NPS non mesuré (pas encore d'utilisateurs payants en nombre) |
| Phase 5 — Mobile | App installable depuis App Store (TestFlight) sans crash | ❌ Non démarré |

---

## Section 10 — Budget et ressources

### 10.1 Enveloppe budgétaire

| Poste | Coût estimé |
|---|---|
| Développement (solo, déjà réalisé) | 0 € (temps personnel) |
| Hébergement PocketBase / Fly.io | 3-5 €/mois |
| Nom de domaine (nutridash.fr) | ~15 €/an |
| Stripe (frais transaction) | 1,5 % + 0,25 € / paiement |
| Outils design (Figma gratuit) | 0 € |
| Rédaction CGU / PP | 0 € (déjà rédigées et publiées) |
| Marketing initial | À définir |
| **Total MVP mensuel** | **~20-25 €/mois** |
| **Total annuel post-lancement** | **~250-300 €/an (hors marketing)** |

### 10.2 Ressources internes

| Rôle | Responsable |
|---|---|
| Développement fullstack | Jérémy Baudouin |
| Design UI | Jérémy Baudouin |
| Tests utilisateurs | À recruter (5 bêta-testeurs) — non fait à ce jour |
| Marketing / acquisition | À définir |
| Rédaction légale | Fait (CGU + PP publiées) |

### 10.3 Profils recherchés

Dans un second temps, si croissance :
- **Bêta-testeurs** (5-10 personnes) : profils sportifs, utilisateurs habituels d'apps nutrition, disponibles pour 30 min de test guidé
- **Rédacteur juridique** : pour révision annuelle des CGU/PP si évolution réglementaire

### 10.4 Modèle de collaboration

**Solo bootstrapped.** Développement, design et lancement assurés par le porteur de projet seul. Pas de financement externe prévu à ce stade. Croissance organique avant tout investissement marketing.

---

## Checklist Qualité

| Critère | Statut |
|---|---|
| ☑ Tous les objectifs sont SMART | ✅ |
| ☑ Chaque fonctionnalité Must Have a un critère d'acceptation testable | ✅ |
| ☑ Les contraintes RGPD sont mentionnées et leur statut réel vérifié dans le code | ✅ |
| ☑ Le modèle économique reflète le prix réellement facturé (5,99 €) | ✅ |
| ☑ Le budget est réaliste par rapport aux fonctionnalités | ✅ |
| ☑ Le document peut être lu sans explication orale | ✅ |
| ☑ Les écarts V1 → V2 sont tracés et justifiés (changelog) | ✅ |
| ☑ Les informations manquantes sont marquées "À définir" | ✅ |

---

*NutriDash — CDC V2 — Juillet 2026*
