# Plan de Test : Nouvelle Structure PocketBase

Ce document détaille les scénarios de test pour valider la migration du stockage JSON monolithique vers une structure relationnelle fragmentée.

## 🧪 Scénarios de Test

### 1. Initialisation du Profil (Post-Inscription)
- **Action** : Créer un compte et remplir le formulaire de profil.
- **Validation** : 
    - [ ] Un record est créé dans la collection `profiles`.
    - [ ] Le champ `user` correspond à l'ID de l'utilisateur authentifié.
    - [ ] Les calculs BMR/TDEE sont corrects en base.

### 2. Journalisation Alimentaire (Repas)
- **Action** : Ajouter un repas (ex: "Déjeuner", 600 kcal, 30g protéines).
- **Validation** :
    - [ ] Un record est créé dans la collection `meals`.
    - [ ] Une entrée est créée dans `daily_stats` pour la date du jour (si absente).
    - [ ] Le dashboard affiche la mise à jour immédiate du compteur "Consommé".

### 3. Activités et Dépense Énergétique
- **Action** : Ajouter une activité personnalisée (ex: "Yoga", 150 kcal).
- **Validation** :
    - [ ] Un record est créé dans `activities_log`.
    - [ ] L'objectif calorique du jour sur le dashboard augmente de 150 kcal.

### 4. Suivi de Poids et Cascade
- **Action** : Enregistrer une nouvelle pesée.
- **Validation** :
    - [ ] Un record est créé dans `weigh_ins`.
    - [ ] Le champ `weight` dans la collection `profiles` est mis à jour automatiquement.
    - [ ] L'objectif en protéines (2g/kg) est mis à jour sur le dashboard.

### 5. Sécurité et Isolation (Règles API)
- **Action** : Tenter de lire la liste complète des repas sans filtre.
- **Validation** :
    - [ ] PocketBase ne retourne **que** les records appartenant à l'utilisateur (`user = @request.auth.id`).
    - [ ] Un utilisateur déconnecté reçoit une erreur 403.

### 6. Résilience et Chargement Cloud
- **Action** : Se déconnecter, vider le cache local, et se reconnecter.
- **Validation** :
    - [ ] L'application reconstruit l'état (`state`) en agrégeant les données des collections `daily_stats`, `meals` et `activities_log`.
    - [ ] L'historique des jours précédents est accessible sans perte.

---

> [!IMPORTANT]
> **Action requise :** Validez-vous ce plan de test pour passer à l'**Étape 4 : UI/UX** ?
