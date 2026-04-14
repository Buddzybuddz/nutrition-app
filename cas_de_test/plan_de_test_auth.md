# Plan de Test - Authentification PocketBase

Ce document liste les scénarios de tests pour valider les corrections apportées au flux d'inscription et à la sécurité des mots de passe.

## 1. Tests d'Inscription (Signup)

| ID | Scénario | Résultat Attendu |
| :--- | :--- | :--- |
| **TEST-01** | Création d'un nouveau compte (email unique, mdp 8+ chars) | Succès, redirection vers le tableau de bord (is_active = true). |
| **TEST-02** | Création d'un compte avec un email DEJA existant | Message d'erreur explicite : "Cet email est déjà utilisé". Pas de création. |
| **TEST-03** | Mot de passe inférieur à 8 caractères | Blocage natif du navigateur (via minlength) ou erreur explicite de PocketBase. |
| **TEST-04** | Confirmation de mot de passe différente | Message d'erreur : "Les mots de passe ne correspondent pas." |

## 2. Tests de Sécurité & Accès

| ID | Scénario | Résultat Attendu |
| :--- | :--- | :--- |
| **TEST-05** | Connexion avec un compte dont is_active = false | Message d'erreur : "Compte désactivé." |
| **TEST-06** | Accès à une page protégée sans être connecté | Redirection vers la page login ou landing page. |

## 3. Procédure de Validation Manuelle
1.  Supprimer l'utilisateur `test@test.com` dans l'interface PocketBase.
2.  Aller sur la page d'inscription de l'app.
3.  Tenter l'inscription avec `test@test.com` et un mot de passe de 8 caractères.
4.  Vérifier que l'accès au tableau de bord est immédiat (plus de message "Compte désactivé").
