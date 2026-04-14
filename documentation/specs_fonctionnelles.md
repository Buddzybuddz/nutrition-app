# Spécifications Fonctionnelles : Restructuration de la Base de Données

## 📖 Le Récit de la Donnée
Actuellement, votre application de nutrition fonctionne comme un "journal intime" où toutes les pages sont collées ensemble dans un seul champ (`data` dans `users`). Pour permettre une analyse précise de vos progrès, une visualisation graphique de votre poids et une gestion fluide de vos repas, nous allons transformer ce journal en un **système de classement intelligent**.

## 🏗️ Architecture des Collections (PocketBase)

### 1. Profil Utilisateur (`profiles`)
**Rôle :** Identité biométrique et réglages de base.
- `user` (Relation) : Lien unique vers le compte.
- `birthDate` (Date) : Pour le calcul dynamique de l'âge.
- `gender` (Select) : `male`, `female`.
- `height` (Number) : Taille en cm.
- `goal` (Select) : `loss`, `gain`, `maintenance`.
- `targetWeight` (Number) : Poids objectif.
- `weighInDay` (Number) : Jour de la semaine (0-6).
- `customActivities` (JSON) : Liste des modèles d'activités créés par l'utilisateur.

### 2. Statistiques Journalières (`daily_stats`)
**Rôle :** Le "sommaire" de chaque journée. Sert à charger rapidement le dashboard.
- `user` (Relation).
- `date` (Date/String) : Format `YYYY-MM-DD`.
- `baseTDEE` (Number) : Le TDEE calculé à cette date précise (snapshot).
- `goalMultiplier` (Number) : Le multiplicateur d'objectif à cette date (snapshot).

### 3. Journal Alimentaire (`meals`)
**Rôle :** Chaque repas est une pièce d'évidence.
- `user` (Relation).
- `date` (Date/String) : Pour lier au jour.
- `mealType` (Select) : `Breakfast`, `Lunch`, `Dinner`, `Snack`.
- `name` (String) : Nom du repas ou aliment.
- `calories` (Number).
- `protein` (Number).

### 4. Journal d'Activités (`activities_log`)
**Rôle :** Dépenses énergétiques supplémentaires.
- `user` (Relation).
- `date` (Date/String).
- `name` (String).
- `calories` (Number).

### 5. Suivi de Poids (`weigh_ins`)
**Rôle :** La "ligne de vérité" pour votre transformation.
- `user` (Relation).
- `date` (Date/String).
- `weight` (Number).

### 6. Historique des Objectifs (`goal_history`)
**Rôle :** Suivre l'évolution de votre motivation.
- `user` (Relation).
- `previousGoal` (String).
- `newGoal` (String).
- `dateChanged` (Date).

---

## 🛠️ Règles de Gestion & Flux de Données

### A. Flux d'Ajout d'un Repas
1. L'utilisateur saisit un repas.
2. Une entrée est créée dans **`meals`**.
3. L'application recalcule le total consommé pour la vue en cours.
4. Si c'est le premier repas du jour, une entrée **`daily_stats`** est initialisée avec les paramètres du profil actuel (TDEE, Goal).

### B. Flux de Pesée
1. L'utilisateur enregistre son poids.
2. Une entrée est créée dans **`weigh_ins`**.
3. Le champ `weight` dans **`profiles`** est mis à jour.
4. Le TDEE est recalculé pour les futures entrées.

### C. Sécurité (API Rules)
- **Règle Universelle** : Sur TOUTES les collections, la règle est `user = @request.auth.id`.
- Aucun utilisateur ne peut lire ou modifier les repas/poids d'un autre utilisateur.

---

## 📈 Impact Attendu
- **Dashboard instantané** : Chargement uniquement des données du jour requis.
- **Analytique** : Possibilité de générer des graphiques sans traiter un blob JSON complexe.
- **Scalabilité** : La base peut supporter des années de données sans ralentissement.

---

> [!IMPORTANT]
> **Action requise :** Validez-vous ces spécifications pour passer à l'**Étape 3 (Création des Tests)** ?
