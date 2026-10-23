# NutriDash — Cahier des Charges V1
> Document produit le 24 juin 2026 — Confidentiel

---

## Section 1 — Présentation du projet

### 1.1 Nom du projet

**NutriDash**

### 1.2 Résumé exécutif

NutriDash est une application web de suivi nutritionnel personnalisé, conçue pour les personnes qui veulent piloter leur alimentation avec précision sans dépendre d'une base de données d'aliments souvent erronée. L'utilisateur saisit directement ses calories et macros, l'application calcule ses besoins réels à partir de sa physiologie (formule Mifflin-St Jeor), suit sa progression quotidienne et analyse ses résultats sur plusieurs périodes. Elle se distingue des acteurs dominants (MyFitnessPal, Yazio) par sa sobriété fonctionnelle, son interface neo-brutalist mobile-first, et son absence totale de BDD alimentaire — un choix délibéré qui élimine la principale source d'erreur des apps concurrentes. NutriDash est commercialisé à 10 €/mois avec 2 semaines d'essai gratuit.

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
| Expérience terrain | Développement et déploiement complet de NutriDash V1 |

---

## Section 2 — Analyse du marché et de la concurrence

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

### 3.1 Personas

**Persona prioritaire — Julien**

| Champ | Détail |
|---|---|
| Nom fictif | Julien, 27 ans |
| Situation | Développeur web, pratique la musculation 4x/semaine |
| Habitudes digitales | Utilisateur intensif mobile, intolèrant aux apps lentes ou surchargées |
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
| Ce qu'il attend | Un outil simple qui lui dit combien il lui reste à manger, et qui la félicite quand elle atteint son objectif |

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
[App] Affichage formulaire inscription (email + mdp)
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
| B2 | Atteindre la viabilité financière | MRR (Monthly Recurring Revenue) | 500 €/mois | M+6 |
| B3 | Valider la rétention | Taux rétention M1→M2 | ≥ 40 % | M+6 |
| B4 | Croissance organique | Abonnés actifs | 200 abonnés | M+12 |
| B5 | Lancer l'application mobile | App Store + Google Play | 1 version Capacitor publiée | À définir |

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
│   ├── Tarif
│   └── Footer
│
├── Authentification (#login)
│   ├── Formulaire Connexion
│   ├── Formulaire Inscription
│   └── Formulaire Reset mot de passe
│
├── Profil (#profil)
│   └── Formulaire : naissance, genre, poids, taille, objectif, jour pesée
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
│   ├── Historique Poids
│   ├── Historique Objectifs
│   └── Bilan score (3 critères)
│
└── Conseils (#conseils)
    └── 8 sections éducatives statiques (expandables)

Modals transversaux
├── Modal Repas (ajout / édition)
├── Modal Activité (ajout / édition)
├── Modal Gestion activités custom
├── Modal Objectif atteint (félicitations)
└── Modal Supprimer compte (À implémenter)
```

### 5.2 Liste des fonctionnalités par priorité (MoSCoW)

| Fonctionnalité | Priorité | Critère d'acceptation |
|---|---|---|
| Inscription / Connexion email + mdp | ✅ Must Have | Un utilisateur peut créer un compte et se connecter en < 2 min |
| Saisie profil physiologique | ✅ Must Have | BMR et TDEE calculés et affichés après validation du formulaire |
| Calcul BMR (Mifflin-St Jeor) + TDEE | ✅ Must Have | Valeurs correctes vérifiées contre calcul manuel pour homme et femme |
| Dashboard avec cercles de progression | ✅ Must Have | Cercles mis à jour < 500 ms après ajout d'un repas |
| Navigation entre les jours | ✅ Must Have | L'utilisateur peut consulter n'importe quel jour passé |
| Ajout / édition / suppression de repas | ✅ Must Have | Repas saisi et visible dans le journal en < 20 secondes |
| Ajout / édition / suppression d'activité | ✅ Must Have | Activité saisie et TDEE recalculé immédiatement |
| Pesée hebdomadaire | ✅ Must Have | Carte pesée visible le jour configuré, poids sauvegardé en historique |
| Sync locale (localStorage) | ✅ Must Have | Données persistantes après fermeture du navigateur sans connexion |
| Sync cloud (PocketBase) | ✅ Must Have | Données synchronisées sur un second appareil après connexion |
| Page Suivi avec filtres temporels | ✅ Must Have | Bilan affiché en < 2 s pour chaque filtre |
| Analyse calories / protéines / poids par période | ✅ Must Have | Valeurs cohérentes avec le journal sur la période sélectionnée |
| Historique des objectifs | ✅ Must Have | Chaque changement d'objectif tracé et affiché dans la chronologie |
| Déconnexion sécurisée | ✅ Must Have | Déconnexion efface le localStorage et redirige vers landing |
| Activités personnalisées (création + gestion) | 🟡 Should Have | Activité custom apparaît dans la liste à la prochaine saisie |
| Score bilan motivant (3 critères) | 🟡 Should Have | Message adapté au score 3/3, 2/3 ou < 2/3 |
| Modal objectif atteint (félicitations) | 🟡 Should Have | Modal affiché quand poids ≤ poids cible (goal=loss) |
| Page Conseils (contenu éducatif) | 🟡 Should Have | 8 sections expandables accessibles sans connexion |
| Réinitialisation mot de passe | 🟡 Should Have | Email de reset reçu en < 5 minutes |
| Graphique évolution du poids (courbe) | 💡 Nice to Have | Courbe temporelle avec points de pesée et objectif affiché |
| Application mobile iOS / Android (Capacitor) | 💡 Nice to Have | App installable depuis App Store et Google Play |
| Export données utilisateur (CSV / JSON) | 💡 Nice to Have | Fichier téléchargeable contenant tout l'historique |
| Notifications de rappel (pesée, saisie) | 💡 Nice to Have | Notification push envoyée le jour de pesée configuré |
| Consentement RGPD formalisé (CGU + PP) | 💡 Nice to Have | Checkbox obligatoire à l'inscription avant création de compte |
| Bouton "Supprimer mon compte" | 💡 Nice to Have | Suppression totale des données en < 30 secondes avec confirmation |
| SRI hashes pour scripts CDN | 💡 Nice to Have | Attribut integrity présent sur toutes les balises script externes |

### 5.3 User Stories (Must Have)

- En tant que **Julien** (sportif en prise de masse), je veux saisir mon petit-déjeuner en moins de 20 secondes afin de ne pas perdre de temps avant l'entraînement.
- En tant que **Sophie** (objectif perte de poids), je veux voir immédiatement combien de calories il me reste à consommer afin de mieux décider quoi manger au dîner.
- En tant que **Maxime** (triathlète), je veux saisir ma sortie vélo et voir le TDEE cible se recalculer afin de savoir combien manger en plus ce jour-là.
- En tant qu'utilisateur, je veux que mes données soient sauvegardées localement afin de pouvoir consulter mon journal même sans internet.
- En tant qu'utilisateur, je veux changer mon objectif (sèche → maintenance) et conserver l'historique des périodes précédentes afin d'analyser chaque phase séparément.
- En tant qu'utilisateur, je veux naviguer vers un jour passé afin de corriger une saisie oubliée.
- En tant qu'utilisateur, je veux voir l'analyse de ma semaine en un coup d'œil afin de savoir si j'ai respecté mes objectifs.
- En tant qu'utilisateur, je veux saisir mon poids le jour prévu afin de mettre à jour mes besoins caloriques calculés.

### 5.4 Flux utilisateur principal

```
1.  Arrivée sur la landing page
2.  Clic "Démarrer gratuitement" → page #login (formulaire inscription visible)
3.  Saisie email + mot de passe (min. 8 car.) + confirmation
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
```

---

## Section 6 — Spécifications techniques

### 6.1 Architecture technique

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | HTML5 / CSS3 / JavaScript Vanilla (SPA) | Zéro dépendance framework, performances maximales, bundle < 100 KB |
| Backend / API | PocketBase (Go, binaire unique) | Auth + BDD + API REST intégrés, déploiement trivial, open source |
| Base de données | SQLite (intégré PocketBase) | Suffisant jusqu'à ~100k utilisateurs, inclus dans PocketBase |
| Authentification | PocketBase Auth (email/password) | Nativement intégré, tokens JWT, durée de session 24h |
| Stockage local | localStorage (clé isolée par user) | Offline-first, sync différée |
| Hébergement backend | Fly.io | Déploiement Go simplifié, région EU (Frankfurt), tarif pay-as-you-go |
| Hébergement frontend | Statique (Fly.io / Netlify / Vercel) | Fichiers statiques, CDN intégré |
| Mobile (V2) | Capacitor (iOS + Android) | Wrapping WebView, réutilise 100 % du code existant |
| Charts (V2) | Chart.js (CDN jsdelivr) | Légère, adaptée aux graphiques de progression |

### 6.2 Schéma de données simplifié

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

### 6.3 Intégrations tierces

| Service | Outil retenu | Usage | Coût |
|---|---|---|---|
| Backend | PocketBase | Auth + BDD + API | Gratuit (open source) |
| Hébergement PB | Fly.io | Serveur PocketBase en prod | ~3-5 €/mois (shared-cpu-1x) |
| CDN PocketBase SDK | jsDelivr | Chargement SDK JS client | Gratuit |
| CDN Chart.js | jsDelivr | Graphiques (V2) | Gratuit |
| Polices | Google Fonts | Poppins (UI) | Gratuit |
| Paiement (V2) | Stripe | Abonnement mensuel 10 €/mois | 1,5 % + 0,25 € / transaction |
| Emails transactionnels | PocketBase SMTP | Reset mdp, confirmation | Gratuit (SMTP propre) |

### 6.4 Exigences de performance

| Critère | Cible |
|---|---|
| Chargement initial (3G) | < 3 secondes |
| Mise à jour des cercles après saisie | < 500 ms |
| Réponse API PocketBase (create meal) | < 800 ms |
| Chargement historique 6 mois | < 2 secondes |
| Disponibilité backend (SLA Fly.io) | ≥ 99,5 % |
| Taille bundle JS total | < 150 KB (hors SDK PocketBase) |

### 6.5 Sécurité et conformité RGPD

**Données collectées**

| Donnée | Sensibilité | Usage |
|---|---|---|
| Email | Moyenne | Authentification, reset mdp |
| Date de naissance | Haute (âge → calculs) | Calcul BMR uniquement |
| Poids, taille | Haute (santé) | Calculs nutritionnels |
| Historique repas / activités | Moyenne | Analyses suivi |

**Mesures de sécurité implémentées**
- Tokens JWT PocketBase, durée 24h (session courte)
- `emailVisibility: false` à l'inscription
- `escapeHtml()` sur tout contenu utilisateur injecté en DOM
- Logs conditionnés à `isDev` (aucune donnée interne exposée en prod)
- CSP via meta tag (default-src self, connect-src limité)
- Règles PocketBase : `user = @request.auth.id` sur toutes les collections
- `deleteRule` activée sur profiles et goal_history

**Droits utilisateurs (RGPD)**

| Droit | Statut |
|---|---|
| Accès aux données | ✅ Via export (À implémenter) |
| Rectification | ✅ Formulaire profil |
| Suppression | ⚠️ À implémenter (bouton "Supprimer mon compte") |
| Portabilité | ⚠️ À implémenter (export JSON/CSV) |
| Consentement | ⚠️ À implémenter (checkbox CGU + PP à l'inscription) |

**Documents légaux à produire avant lancement public**
- Conditions Générales d'Utilisation (CGU)
- Politique de confidentialité
- Politique de cookies (si analytics ajoutés)

### 6.6 Hébergement et infrastructure

| Tier | Coût mensuel | Capacité |
|---|---|---|
| Dev local | 0 € | 1 utilisateur |
| Fly.io shared-cpu-1x (prod actuel) | ~3-5 € | Jusqu'à ~500 utilisateurs actifs |
| Fly.io performance-1x | ~15-20 € | Jusqu'à ~5 000 utilisateurs actifs |
| Migration vers VPS (Hetzner) | ~5-10 € | Contrôle total, DB > 1 Go |

---

## Section 7 — Design et expérience utilisateur

### 7.1 Direction artistique

**Mots-clés :** Précision · Brutalité graphique · Lisibilité · Énergie · Confiance

**Valeurs visuelles :**
- Neo-brutalist : bordures noires épaisses, ombres portées décalées, contrastes forts
- Couleur primaire jaune (#FFD600) sur fond crème/blanc cassé
- Typographie grasse, textes en majuscules pour les labels
- Densité de dots pattern en arrière-plan

**Ce que l'app ne doit PAS paraître :**
- Médical ou clinique (pas de bleu stérile, pas de croix)
- Flou ou générique (pas de gradients pastel type "wellness")
- Surchargée (pas de sidebar encombrée, pas de notifications intrusives)

### 7.2 Références visuelles

| Référence | Ce qu'on en retient |
|---|---|
| Linear.app | Navigation latérale sobre, densité d'information sans surcharge |
| Notion | Typographie claire, hiérarchie visuelle sans couleur excessive |
| Strava | Cercles de progression, gamification subtile |
| Apps neo-brutalist (Lemon Squeezy) | Bordures épaisses, contraste noir/jaune, énergie graphique |

### 7.3 Charte graphique

| Élément | Valeur |
|---|---|
| Couleur primaire | Jaune #FFD600 |
| Couleur secondaire | Noir #1A1A1A |
| Fond | Crème #FAFAF5 |
| Couleur succès | Vert #22C55E |
| Couleur alerte | Rouge #EF4444 |
| Typographie principale | Poppins (Google Fonts) |
| Typographie code/données | Monospace système |
| Style icônes | Lucide Icons (ligne fine) |
| Bordures | 2-3px solid #1A1A1A |
| Ombres | 4-6px décalage, couleur sombre |
| Logo | À compléter |

### 7.4 Exigences d'accessibilité

- Contraste texte/fond : ratio ≥ 4,5:1 (WCAG AA)
- Taille de texte minimale : 14px
- Zones tactiles : ≥ 44×44pt (standard Apple / Google Material)
- Pas de transmission d'information par la couleur seule (toujours icône + texte)

### 7.5 Approche responsive

**Mobile First.** Contexte d'usage principal : debout, d'une main, entre deux activités (avant ou après un repas). L'interface doit être entièrement utilisable sur iPhone SE (375px) sans zoom ni scroll horizontal. La navigation latérale se transforme en barre basse sur mobile.

### 7.6 Livrables UX attendus

- [x] User flows principaux (existants dans le code)
- [x] Maquettes haute fidélité (implémentées)
- [ ] Design system formalisé (composants, tokens de couleur documentés)
- [ ] Tests utilisateurs (minimum 5 personnes sur parcours inscription → première saisie)
- [ ] Prototype Figma cliquable pour présentation investisseurs (si besoin)

---

## Section 8 — Modèle économique

### 8.1 Modèle de revenus

Abonnement mensuel avec essai gratuit. Pas de version freemium permanente — l'essai de 2 semaines constitue la fenêtre de conversion.

| Plan | Prix | Fonctionnalités incluses |
|---|---|---|
| Essai gratuit | 0 € (14 jours) | Accès complet à toutes les fonctionnalités |
| Abonnement mensuel | 10 €/mois | Accès complet, sync cloud illimitée, historique illimité |
| Abonnement annuel (À définir) | À définir (~80-90 €/an) | Idem + 2 mois offerts |

### 8.2 Stratégie d'acquisition

| Canal | Justification |
|---|---|
| SEO / contenu (blog nutrition, calcul BMR) | Requêtes à forte intention : "calculer TDEE", "sèche musculaire calories" |
| Communautés Reddit / forums fitness | Présence là où se trouve le persona Julien (r/fitness, forum-musculation.com) |
| Instagram / TikTok (contenu éducatif) | Persona Sophie — contenu "comment je suis ma nutrition" |
| Bouche à oreille | Produit de niche → utilisateurs satisfaits convertissent leurs pairs |
| Product Hunt | Lancement V1 pour visibilité initiale internationale |

### 8.3 Projections financières simplifiées (12 mois)

*Ces projections sont indicatives — basées sur des hypothèses conservatrices.*

| Période | Nouveaux utilisateurs | Abonnés payants | MRR |
|---|---|---|---|
| M1-M2 (lancement) | 50 | 15 | 150 € |
| M3-M4 | 80 | 35 | 350 € |
| M5-M6 | 120 | 60 | 600 € |
| M7-M9 | 200 | 100 | 1 000 € |
| M10-M12 | 350 | 180 | 1 800 € |

**Hypothèses :** taux de conversion essai→payant = 30 %, churn mensuel = 8 %, acquisition 100 % organique/communauté.

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
- Livrable : Application sécurisée, 0 critique, 0 haut

**Phase 2 — Conformité RGPD & Légal (À faire)**
- Durée estimée : 1-2 semaines
- CGU + Politique de confidentialité rédigées
- Checkbox consentement à l'inscription
- Bouton "Supprimer mon compte"
- Export données utilisateur (JSON/CSV)
- Livrable : Application conforme RGPD avant lancement public

**Phase 3 — Lancement public (À planifier)**
- Durée estimée : 1 semaine
- Intégration paiement Stripe (abonnement mensuel)
- Page tarif avec CTA "Démarrer l'essai"
- Soumission Product Hunt
- Livrable : App en production avec monétisation active

**Phase 4 — V1+ Should Have (Post-lancement)**
- Durée estimée : 1 mois
- Graphique d'évolution du poids (courbe Chart.js)
- Améliorations UX basées sur retours utilisateurs
- Livrable : Version enrichie avec analytics

**Phase 5 — Mobile V2 (Selon traction)**
- Durée estimée : 2-4 semaines
- Build Capacitor iOS + Android
- Soumission App Store + Google Play
- Notifications push (pesée, rappel saisie)
- Livrable : Applications natives publiées

### 9.2 Critères de validation par phase

| Phase | Critère de validation |
|---|---|
| Phase 2 — RGPD | CGU publiées + checkbox inscription + bouton suppression fonctionnel |
| Phase 3 — Lancement | Paiement Stripe fonctionnel, 1er abonné payant enregistré |
| Phase 4 — V1+ | Graphique poids affiché sur 3 filtres temporels, NPS mesuré |
| Phase 5 — Mobile | App installable depuis App Store (TestFlight) sans crash |

---

## Section 10 — Budget et ressources

### 10.1 Enveloppe budgétaire

| Poste | Coût estimé |
|---|---|
| Développement (solo, déjà réalisé) | 0 € (temps personnel) |
| Hébergement PocketBase / Fly.io | 3-5 €/mois |
| Nom de domaine (.com) | ~15 €/an |
| Stripe (frais transaction) | 1,5 % + 0,25 € / paiement |
| Outils design (Figma gratuit) | 0 € |
| Rédaction CGU / PP (template) | 0-50 € (template juridique) |
| Marketing initial | À définir |
| **Total MVP mensuel** | **~20-25 €/mois** |
| **Total annuel post-lancement** | **~250-300 €/an (hors marketing)** |

### 10.2 Ressources internes

| Rôle | Responsable |
|---|---|
| Développement fullstack | Jérémy Baudouin |
| Design UI | Jérémy Baudouin |
| Tests utilisateurs | À recruter (5 bêta-testeurs) |
| Marketing / acquisition | À définir |
| Rédaction légale | À définir (template ou avocat) |

### 10.3 Profils recherchés

Dans un second temps, si croissance :
- **Bêta-testeurs** (5-10 personnes) : profils sportifs, utilisateurs habituels d'apps nutrition, disponibles pour 30 min de test guidé
- **Rédacteur juridique** : pour CGU et politique de confidentialité conformes RGPD (ou template validé)

### 10.4 Modèle de collaboration

**Solo bootstrapped.** Développement, design et lancement assurés par le porteur de projet seul. Pas de financement externe prévu à ce stade. Croissance organique avant tout investissement marketing.

---

## Checklist Qualité

| Critère | Statut |
|---|---|
| ☑ Tous les objectifs sont SMART | ✅ |
| ☑ Chaque fonctionnalité Must Have a un critère d'acceptation testable | ✅ |
| ☑ Les contraintes RGPD sont mentionnées | ✅ (avec items à implémenter identifiés) |
| ☑ Le modèle économique est cohérent avec la cible | ✅ |
| ☑ Le budget est réaliste par rapport aux fonctionnalités | ✅ |
| ☑ Le document peut être lu sans explication orale | ✅ |
| ☑ Les informations manquantes sont marquées "À définir" | ✅ |

---

*NutriDash — CDC V1 — Juin 2026*
