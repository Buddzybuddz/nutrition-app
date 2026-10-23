# Actions Utilisateurs — NutriDash
> Généré le 30 juin 2026 depuis NutriDash-CDC-V1.md + code source

---

## Rôles

| Rôle | Description |
|---|---|
| **Visiteur** | Utilisateur non authentifié, accède uniquement à la landing page |
| **Utilisateur** | Compte créé et connecté, accède à l'application complète |

---

## Règles absolues (transversales)

- Un **Visiteur** ne peut jamais accéder aux vues Dashboard, Suivi, Conseils, Profil
- Un **Utilisateur** dont le compte est `is_active = false` est déconnecté immédiatement
- Un **Utilisateur** sans profil physiologique rempli est redirigé vers la page Profil au login
- Toute suppression de compte efface toutes les données (RGPD — droit à l'effacement)
- Le paywall bloque l'accès après la période d'essai (7 jours) sans abonnement actif (sauf `is_exempt`)

---

## Rôle : Visiteur

### Actions autorisées

| # | Action | Critère d'acceptation |
|---|---|---|
| 1 | Voir la landing page | Page affichée avec hero, features, process, tarif, footer |
| 2 | Cliquer sur "Démarrer gratuitement" | Affiche le formulaire d'inscription |
| 3 | Cliquer sur "Connexion" (header) | Affiche le formulaire de connexion |
| 4 | S'inscrire (email + mot de passe) | Compte créé, connexion automatique, redirection vers Profil |
| 5 | Se connecter (email + mot de passe) | Connexion réussie, redirection vers Dashboard |
| 6 | Demander un reset de mot de passe | Email de réinitialisation envoyé, message de confirmation affiché |
| 7 | Consulter la page CGU | Page `/cgu.html` accessible |
| 8 | Consulter la page Confidentialité | Page `/confidentialite.html` accessible |

### Actions interdites

| # | Action interdite | Raison |
|---|---|---|
| I1 | Accéder au Dashboard sans être connecté | Authentification requise |
| I2 | Accéder à la page Profil sans être connecté | Authentification requise |
| I3 | Accéder à la page Suivi sans être connecté | Authentification requise |
| I4 | S'inscrire avec un email déjà utilisé | Email unique — erreur affichée |
| I5 | S'inscrire avec un mot de passe < 8 caractères | Validation — erreur affichée |

---

## Rôle : Utilisateur

### Actions autorisées

#### Profil

| # | Action | Critère d'acceptation |
|---|---|---|
| 9 | Remplir son profil physiologique | Date naissance, genre, poids, taille, objectif, jour pesée enregistrés |
| 10 | Voir le calcul BMR/TDEE en temps réel | Valeurs recalculées à chaque modification d'un champ profil |
| 11 | Modifier son profil | Modifications sauvegardées en local + cloud |
| 12 | Se déconnecter | Session effacée, retour landing page |
| 13 | Exporter ses données (CSV) | Fichier CSV téléchargé avec toutes les données |
| 14 | Supprimer son compte | Confirmation demandée, toutes les données supprimées, déconnexion |

#### Dashboard

| # | Action | Critère d'acceptation |
|---|---|---|
| 15 | Voir le dashboard du jour | Date du jour affichée, cercles calories et protéines à jour |
| 16 | Naviguer vers le jour précédent/suivant | Données du jour sélectionné chargées |
| 17 | Ajouter un repas | Type + calories + protéines saisis, cercles mis à jour immédiatement |
| 18 | Modifier un repas | Valeurs modifiées, cercles recalculés |
| 19 | Supprimer un repas | Repas retiré du journal, cercles recalculés |
| 20 | Ajouter une activité physique | Activité + calories brûlées saisies, objectif recalculé |
| 21 | Modifier une activité | Valeurs modifiées, objectif recalculé |
| 22 | Supprimer une activité | Activité retirée, objectif recalculé |
| 23 | Saisir une pesée (jour de pesée) | Poids enregistré, BMR/TDEE recalculé |
| 24 | Voir la progression journalière | Barre de progression et pourcentage affichés |

#### Suivi

| # | Action | Critère d'acceptation |
|---|---|---|
| 25 | Voir le bilan de la semaine en cours | Score, calories, protéines, poids affichés |
| 26 | Filtrer par période (7j/30j/90j/180j/365j) | Données filtrées sur la période sélectionnée |
| 27 | Voir le graphique d'évolution du poids | Courbe affichée avec les pesées de la période |
| 28 | Voir l'historique des objectifs | Liste des objectifs passés avec dates |

#### Conseils

| # | Action | Critère d'acceptation |
|---|---|---|
| 29 | Voir la page Conseils | 8 sections éducatives affichées |
| 30 | Ouvrir/fermer un accordéon | Section se déroule/referme, un seul ouvert à la fois |

### Actions interdites

| # | Action interdite | Raison |
|---|---|---|
| I6 | Accéder à l'app après expiration essai sans abonnement | Paywall actif (sauf is_exempt) |
| I7 | Supprimer son compte sans confirmation | Modale de confirmation obligatoire |
| I8 | Voir les données d'un autre utilisateur | Isolation par userId — filtres PocketBase stricts |
