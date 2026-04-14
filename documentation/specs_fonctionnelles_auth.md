# Spécifications Fonctionnelles - Correction Authentification

Ce document détaille les règles de gestion pour corriger le flux d'inscription (Signup) et aligner les contraintes de sécurité.

## 1. Flux d'Inscription (Signup)

### Règle : Activation Automatique
- **Symptôme :** Les nouveaux comptes sont créés avec `is_active = false`, provoquant un rejet immédiat par le front-end.
- **Spécification :** Tout nouvel utilisateur créé via le formulaire d'inscription doit avoir le champ `is_active` initialisé à `true` au moment de la création de la ressource dans PocketBase.

### Règle : Gestion des Doublons
- **Symptôme :** Une erreur générique est affichée si l'email existe déjà.
- **Spécification :** Si PocketBase renvoie une erreur 400 indiquant que l'email est déjà utilisé, le message d'erreur doit explicitement indiquer : "Cet email est déjà associé à un compte. Veuillez vous connecter."

## 2. Validation des Mots de Passe

### Règle : Longueur Minimale
- **Contrainte Backend :** 8 caractères (par défaut dans PocketBase).
- **Contrainte Frontend :** Actuellement 6 caractères.
- **Spécification :** Tous les champs de mot de passe (Signup, Login, Confirm) doivent exiger un minimum de **8 caractères**. L'erreur doit être interceptée par le navigateur (`minlength="8"`) et détaillée par le serveur si la validation passe outre.

## 3. Feedback Utilisateur

### Règle : Persistance des Erreurs
- **Spécification :** Les messages d'erreur d'authentification ne doivent pas disparaître trop rapidement si l'action requiert une correction manuelle (ex: email déjà pris). Le délai passera de 5s à 8s.
