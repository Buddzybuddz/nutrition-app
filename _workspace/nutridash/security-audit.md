# Rapport d'Audit Sécurité — NutriDash

Date : 2026-07-07
Mode : NOUVEAU_PROJET (audit exhaustif du code source du dépôt `nutrition-app`)
Auditeur : Agent Sécurité
Standards : OWASP Top 10:2025 · Top 100 Web Vulnerabilities · RGPD
Méthodologie : revue de code (100 % du périmètre indiqué) + **tests d'intrusion actifs sur l'instance PocketBase de développement locale** (`http://127.0.0.1:8090`) pour valider empiriquement les hypothèses de contournement, et vérifications en lecture seule (paramètres serveur, en-têtes HTTP) sur la production (`nutridash-pb.fly.dev`, `nutridash.fr`). Aucune donnée de production n'a été modifiée ou supprimée — seuls des comptes de test créés puis détruits pendant l'audit ont été utilisés.

## Résumé exécutif

- 🔴 Critique : 1
- 🟠 Haute : 3
- 🟡 Moyenne : 4
- 🔵 Faible : 3
- **Verdict global : ❌ BLOQUÉ** — une faille critique permet à n'importe quel utilisateur authentifié de s'octroyer un accès gratuit et permanent, annulant intégralement le modèle économique de l'application. Correction obligatoire avant tout lancement public/marketing.

## Threat Model

- **Assets critiques** : données de santé (poids, taille, date de naissance → catégorie RGPD sensible), état d'abonnement Stripe (`stripe_customer_id`, `subscription_status`), secrets serveur (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_GUARD`), intégrité du paywall (revenu récurrent).
- **Acteurs menaçants** : (1) utilisateur authentifié malveillant cherchant à contourner le paiement — **le plus probable et le plus dangereux ici**, car il ne nécessite aucun outil d'attaque, juste un compte gratuit ; (2) attaquant externe anonyme ciblant les endpoints publics (`/api/stripe/webhook`, formulaires) ; (3) toute personne ayant accès aux logs serveur (Fly.io, `_logs`/`auxiliary.db`) pouvant y récupérer des secrets en clair.
- **Vecteurs d'attaque identifiés** : contrôle d'accès applicatif insuffisant sur les champs d'un enregistrement (Mass Assignment / Broken Object Property Level Authorization), falsification de webhook par absence de vérification cryptographique, exposition de secrets dans des logs d'accès (query string), absence d'en-têtes de sécurité sur le site public.
- **Impact business maximal** : perte totale de revenu récurrent (accès payant contournable en une requête HTTP), facturation continue d'anciens clients ayant supprimé leur compte (préjudice financier + non-conformité), atteinte à la confiance utilisateur si l'exploitation devient publique.

---

## Vulnérabilités détectées

### 🔴 Contournement total du paywall via auto-modification du profil utilisateur (Mass Assignment / Broken Access Control)

- **Catégorie OWASP 2025** : A01 — Broken Access Control (cf. aussi #40 *Inadequate Authorization* et #92 *Inconsistent Validation* du catalogue Top 100)
- **Description** : La règle `updateRule` de la collection `users` (`_pb_users_auth_`) est `id = @request.auth.id`. Cette règle contrôle **qui** peut modifier l'enregistrement, mais ne restreint **aucun champ**. Or les champs `is_exempt`, `subscription_status`, `subscription_end` et `subscription_cancel_at` — qui sont précisément ceux lus par le paywall côté serveur (règle `PAYWALL` injectée dans `meals`, `activities_log`, `weigh_ins`, `daily_stats`, `goal_history`, `profiles`, `user_data` par `pb/pb_migrations/1782864000_paywall_rules.js`) et côté client (`checkAccess()` dans `index.html:1967-1986`) — sont des champs **custom, non `system`** (confirmé via `GET /api/collections/users` : `"system": false` pour tous ces champs). Rien n'empêche un utilisateur authentifié de les modifier lui-même via un simple `PATCH` sur son propre enregistrement.
- **Localisation** :
  - `pb/pb_migrations/1775762200_updated_users.js`, `1782482482_updated_users_stripe.js`, `1782488189_updated_users_is_exempt.js`, `1783447333_updated_users_cancel_at.js` (ajout des champs sans restriction d'écriture)
  - `pb/pb_migrations/1782864000_paywall_rules.js` (la règle `PAYWALL` fait confiance à `@request.auth.is_exempt` / `@request.auth.subscription_status` / `@request.auth.subscription_end`, qui sont sous le contrôle de l'utilisateur lui-même)
  - `index.html:1980-1982` (le front fait la même confiance aveugle, mais ce n'est qu'un symptôme — la vraie faille est côté serveur)
- **Root cause** : Absence de verrouillage au niveau champ (*field-level write protection*) sur des attributs sensibles d'une collection `auth`, combinée à l'usage de ces mêmes attributs comme source de vérité pour l'autorisation d'accès (`@request.auth.*`) dans les règles d'autres collections.
- **Preuve de concept (exécutée sur l'instance de développement locale, compte de test créé puis supprimé)** :
  ```bash
  # 1. Inscription d'un compte de test standard (aucun droit particulier)
  curl -X POST http://127.0.0.1:8090/api/collections/users/records \
    -H "Content-Type: application/json" \
    -d '{"email":"pentest@example.com","password":"TestPass1234!","passwordConfirm":"TestPass1234!"}'

  # 2. Authentification standard (token utilisateur normal, pas admin)
  curl -X POST http://127.0.0.1:8090/api/collections/users/auth-with-password \
    -H "Content-Type: application/json" \
    -d '{"identity":"pentest@example.com","password":"TestPass1234!"}'
  # → renvoie un token JWT "utilisateur", is_exempt=false, subscription_status=""

  # 3. Auto-élévation de privilèges — AUCUN droit admin requis
  curl -X PATCH http://127.0.0.1:8090/api/collections/users/records/<own_id> \
    -H "Authorization: <token utilisateur>" \
    -H "Content-Type: application/json" \
    -d '{"is_exempt": true, "subscription_status": "active"}'
  ```
  **Résultat observé** : `200 OK`, l'enregistrement retourné contient bien `"is_exempt":true,"subscription_status":"active"`. À partir de cet instant, `checkAccess()` côté front renvoie `true` indéfiniment, et toutes les règles PocketBase `PAYWALL` (`meals`, `profiles`, `weigh_ins`, etc.) s'évaluent à `true` pour ce compte — accès complet et permanent à l'application, sans jamais payer, sans même passer par les 7 jours d'essai. **Le même comportement a été confirmé (lecture des règles de collection uniquement, sans test destructif) sur la production** (`nutridash-pb.fly.dev`), qui a exactement le même schéma de règles.
- **Impact business** : n'importe quel visiteur peut créer un compte gratuit puis s'octroyer un abonnement "actif" à vie en une seule requête HTTP, sans jamais interagir avec Stripe. Le modèle payant (5,99 €/mois) devient intégralement contournable. C'est la faille la plus grave de l'audit car elle est triviale à exploiter (aucune connaissance technique poussée, aucun secret à obtenir), silencieuse (aucune alerte, aucun log anormal côté Stripe puisqu'aucun paiement n'est impliqué) et détruit directement le revenu.
- **Correction recommandée** (PocketBase 0.23+ supporte le modificateur `:isset` dans les règles, permettant d'interdire l'écriture de champs précis sans toucher au reste de la règle) :
  ```js
  // pb/pb_migrations/XXXXXXXXXX_lock_subscription_fields.js
  migrate((app) => {
      const col = app.findCollectionByNameOrId("users");
      const base = "id = @request.auth.id";
      const lockedFields =
          "@request.body.is_exempt:isset = false && " +
          "@request.body.subscription_status:isset = false && " +
          "@request.body.subscription_end:isset = false && " +
          "@request.body.subscription_cancel_at:isset = false && " +
          "@request.body.stripe_customer_id:isset = false";
      col.updateRule = base + " && (" + lockedFields + ")";
      return app.save(col);
  }, (app) => { /* rollback: restaurer l'ancienne règle */ });
  ```
  En complément (défense en profondeur), ajouter un hook `onRecordUpdateRequest` sur `users` qui, si la requête n'a pas `e.hasSuperuserAuth()`, restaure explicitement `subscription_status`, `is_exempt`, `subscription_end`, `subscription_cancel_at` et `stripe_customer_id` à leur valeur d'origine (`e.record.original().get(...)`) avant `e.next()` — de façon à neutraliser toute tentative même si une règle venait à être modifiée par erreur plus tard. Seuls les hooks serveur (`stripe.pb.js`, exécutés avec les privilèges de l'application via `$app.save(...)`, hors du contexte `@request.auth`) doivent pouvoir modifier ces champs.
  **Cette correction est bloquante avant tout lancement public.**

---

### 🟠 Webhook Stripe sans vérification de signature cryptographique — secret partagé en query string

- **Catégorie OWASP 2025** : A08 — Software and Data Integrity Failures (également A04 — Cryptographic Failures, absence d'authentification cryptographique des données entrantes)
- **Description** : `routerAdd("POST", "/api/stripe/webhook", ...)` (`pb/pb_hooks/stripe.pb.js:166-249`) protège l'endpoint uniquement par comparaison d'un secret statique transmis en query string (`?secret=...`, variable `STRIPE_WEBHOOK_GUARD`). La signature HMAC officielle de Stripe (en-tête `Stripe-Signature`, vérifiable avec `STRIPE_WEBHOOK_SECRET`) est **provisionnée en secret Fly.io mais jamais lue ni vérifiée dans le code** (confirmé : `fly secrets list -a nutridash-pb` liste `STRIPE_WEBHOOK_SECRET` comme déployé, `grep` sur `stripe.pb.js` ne montre aucun usage de cette variable).
- **Localisation** : `pb/pb_hooks/stripe.pb.js:166-173`
- **Root cause** : Le mécanisme d'authentification choisi (secret partagé statique) n'apporte ni intégrité du message (rien ne garantit que le corps de la requête provient réellement de Stripe et n'a pas été forgé), ni protection anti-rejeu (le même `?secret=...` reste valable indéfiniment), ni comparaison en temps constant (`receivedSecret !== WEBHOOK_GUARD` est vulnérable en théorie à une attaque temporelle, bien que peu praticable sur HTTPS avec la latence réseau).
- **Scénario d'exploitation concret** : ce secret transite en clair dans l'URL. Or l'équipe projet a elle-même documenté (mémoire projet, incident du 2026-07-07) que les requêtes HTTP complètes de PocketBase — y compris les query strings — sont journalisées dans `_logs`/`auxiliary.db` et accessibles via l'API Admin ou `flyctl ssh sftp get`. Toute personne pouvant lire ces logs (accès Fly.io compromis, sauvegarde du volume exfiltrée, futur collaborateur avec accès trop large) récupère le secret et peut alors forger un `POST /api/stripe/webhook?secret=<guard>` avec un corps JSON arbitraire, par exemple :
  ```json
  { "type": "customer.subscription.updated",
    "data": { "object": { "customer": "cus_XXXXXXXXXXXX", "status": "active", "items": {"data":[{"current_period_end": 9999999999}]} } } }
  ```
  Il suffit de connaître un `stripe_customer_id` valide — trivialement le sien propre (visible via `pb.collection('users').authRefresh()`, champ non masqué) — pour s'auto-activer un abonnement "actif" sans jamais payer, ou pour perturber l'état d'abonnement d'un tiers si son `customer_id` est obtenu autrement (ex. fuite Stripe, ingénierie sociale).
- **Impact business** : falsification de l'état d'abonnement pour n'importe quel `stripe_customer_id`, en contournement complet de Stripe — un second chemin de contournement du paiement, indépendant du Finding critique ci-dessus.
- **Correction recommandée** : implémenter la vérification officielle Stripe avec les primitives déjà disponibles dans le JSVM PocketBase (`$security.hs256` pour HMAC-SHA256, `$security.equal` pour la comparaison en temps constant) :
  ```js
  routerAdd("POST", "/api/stripe/webhook", (e) => {
      var WEBHOOK_SECRET = $os.getenv("STRIPE_WEBHOOK_SECRET");
      var sigHeader = e.requestInfo().headers["stripe_signature"] || "";
      var rawBody = toString(e.request.body); // corps brut, nécessaire pour le HMAC

      var parts = {};
      sigHeader.split(",").forEach(function(p) {
          var kv = p.split("=");
          parts[kv[0]] = kv[1];
      });
      var timestamp = parts["t"];
      var expected  = $security.hs256(timestamp + "." + rawBody, WEBHOOK_SECRET);

      if (!timestamp || !parts["v1"] || !$security.equal(expected, parts["v1"])) {
          $app.logger().warn("Stripe webhook: signature invalide");
          return e.json(401, { error: "Unauthorized" });
      }
      // tolérance anti-rejeu (5 min, comme la lib officielle Stripe)
      if (Math.abs(Date.now()/1000 - parseInt(timestamp, 10)) > 300) {
          return e.json(401, { error: "Timestamp trop ancien" });
      }
      var event = JSON.parse(rawBody);
      // ... suite du traitement inchangée
  });
  ```
  Conserver `STRIPE_WEBHOOK_GUARD` uniquement en défense en profondeur additionnelle si souhaité, mais ne plus s'appuyer dessus comme unique protection. Vérifier l'API exacte `e.request.body` / `toString()` / accès aux en-têtes dans la documentation PocketBase 0.36.9 au moment de l'implémentation (usage confirmé de `toString(e.request.body)` dans `pb_data/types.d.ts:169`, mais à valider en conditions réelles avant déploiement).

---

### 🟠 Suppression de compte n'annule pas l'abonnement Stripe actif

- **Catégorie OWASP 2025** : A06 — Insecure Design (logique métier défaillante) ; impact direct sur le droit à l'effacement RGPD (art. 17)
- **Description** : `deleteAccount()` (`index.html:1868-1893`) supprime les enregistrements PocketBase (`profiles`, `meals`, `daily_stats`, `activities_log`, `weigh_ins`, `goal_history`, `user_data`) puis le compte `users` lui-même, mais **n'appelle jamais l'API Stripe pour annuler l'abonnement** (`DELETE /v1/subscriptions/:id` ou équivalent). Le `stripe_customer_id` et l'abonnement actif restent intacts côté Stripe.
- **Localisation** : `index.html:1868-1893` (fonction `deleteAccount`)
- **Root cause** : le flux de suppression traite uniquement la base PocketBase, sans orchestration avec le fournisseur de paiement tiers.
- **Scénario d'exploitation concret (pas une attaque, mais un préjudice réel et systématique)** : un client abonné supprime son compte via "Supprimer mon compte" (RGPD). Son abonnement Stripe continue d'être facturé 5,99 €/mois. Comme le compte PocketBase n'existe plus, il ne peut plus se connecter pour accéder à `/api/stripe/portal` et annuler lui-même l'abonnement. Il doit contacter le support ou faire un litige bancaire (chargeback) — préjudice financier direct et image dégradée, en plus d'un manquement à l'esprit de l'article 17 RGPD (le traitement continue — facturation récurrente — après une demande d'effacement).
- **Correction recommandée** : avant de supprimer le compte, appeler côté serveur (nouvel endpoint `POST /api/stripe/cancel-and-delete` protégé par `$apis.requireAuth()`) qui annule l'abonnement Stripe (`DELETE https://api.stripe.com/v1/subscriptions/{id}` ou `POST .../subscriptions/{id}` avec `cancel_at_period_end` selon la politique voulue) **avant** de renvoyer l'autorisation de supprimer les données PocketBase. Documenter clairement dans les CGU si la suppression du compte entraîne une résiliation immédiate ou en fin de période déjà payée.

---

### 🟠 SMTP désactivé en production — réinitialisation de mot de passe et vérification d'email probablement non fonctionnelles

- **Catégorie OWASP 2025** : A07 — Authentication Failures (récupération de compte)
- **Description** : Une vérification en lecture seule des paramètres serveur PocketBase en production (`GET /api/settings`, compte superuser) montre `smtp.enabled: false`. Le `Dockerfile` (image Alpine minimale, sans agent mail local) ne fournit aucun relais SMTP alternatif. Le CDC (section 6.5 et user story "réinitialisation mot de passe") indique pourtant "email de reset envoyé via SMTP PocketBase" comme fonctionnalité livrée.
- **Localisation** : configuration serveur PocketBase en production (hors dépôt Git — à corriger dans la configuration Fly.io / interface admin PocketBase) ; `Dockerfile` (absence de tout relais mail).
- **Root cause** : configuration SMTP jamais renseignée/activée en production, probablement testée uniquement en développement où l'envoi d'email n'est pas critique.
- **Impact** : si confirmé en usage réel, les utilisateurs ayant oublié leur mot de passe n'ont aucun moyen de le réinitialiser (perte de compte définitive, ou contournement dangereux si un support manuel non sécurisé est mis en place en remplacement). Absence de vérification d'email ⇒ le champ `verified` reste probablement à `false` pour tous les comptes, affaiblissant l'hypothèse de propriété de l'adresse email dans tout futur mécanisme de sécurité qui s'appuierait dessus.
- **Correction recommandée** : configurer un fournisseur SMTP transactionnel (ex. Resend, Postmark, SES en région EU) dans les paramètres PocketBase production, puis tester en conditions réelles le flux "mot de passe oublié" de bout en bout sur `nutridash.fr`.

---

### 🟡 En-têtes de sécurité absents sur le site public (nutridash.fr) — CSP affaiblie par `'unsafe-inline'`

- **Catégorie OWASP 2025** : A02 — Security Misconfiguration (cf. #26 *Missing Security Headers*, #59 *Clickjacking* du catalogue Top 100)
- **Description** : `pb_hooks/security.pb.js` applique de bons en-têtes (`X-Frame-Options`, CSP `frame-ancestors 'none'`, HSTS, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`) — mais **uniquement sur les réponses de l'API PocketBase** (`nutridash-pb.fly.dev`). Le site réellement visité par les utilisateurs (`nutridash.fr`, hébergé sur GitHub Pages) ne renvoie **aucun de ces en-têtes** au niveau HTTP (vérifié par `curl -I https://nutridash.fr/`) : pas de `X-Frame-Options`, pas de `Strict-Transport-Security`, pas de `X-Content-Type-Options`, pas de `Content-Security-Policy` HTTP. Seule une CSP en balise `<meta>` existe dans `index.html:6`, qui (a) ne s'applique pas à `cgu.html` et `confidentialite.html` (aucune CSP dans ces deux fichiers), (b) ne peut pas porter la directive `frame-ancestors` (ignorée par les navigateurs en balise `meta`, donc **aucune protection anti-clickjacking réelle** sur le site public), et (c) autorise `script-src 'self' 'unsafe-inline'`, ce qui annule une grande partie de l'intérêt défensif de la CSP contre le XSS si une faille d'injection venait à être introduite ailleurs.
- **Localisation** : absence d'en-têtes HTTP sur `nutridash.fr` (GitHub Pages) ; `index.html:6` (CSP meta avec `unsafe-inline`) ; `cgu.html`, `confidentialite.html` (aucune CSP).
- **Impact** : la page principale de l'application (contenant les données de santé de l'utilisateur, le bouton de suppression de compte, le paywall) peut être chargée dans une `<iframe>` par un site tiers malveillant (clickjacking / UI redress), et toute future faille XSS ne serait pas mitigée par la CSP à cause de `'unsafe-inline'`.
- **Correction recommandée** : GitHub Pages ne permet pas nativement de définir des en-têtes HTTP personnalisés. Options : (1) passer par un proxy Cloudflare (gratuit) devant `nutridash.fr` avec une règle "Transform Rules" ajoutant les en-têtes manquants ; (2) migrer l'hébergement du front vers une plateforme supportant des en-têtes custom (Vercel, Netlify, Fly.io lui-même). À minima, retirer `'unsafe-inline'` du `script-src` en déplaçant les scripts inline vers des fichiers externes ou en utilisant des nonces, et dupliquer la balise CSP sur `cgu.html`/`confidentialite.html`.

---

### 🟡 Messages d'erreur bruts renvoyés au client depuis les endpoints Stripe

- **Catégorie OWASP 2025** : A09 — Logging & Alerting (fuite d'information via erreurs) / #33 *Information Disclosure*
- **Description** : `pb/pb_hooks/stripe.pb.js:121` et `:160` renvoient `e.json(500, { error: String(err) })`, exposant directement au client le message d'erreur interne (potentiellement des détails de l'API Stripe, des chemins internes, ou la structure exacte de l'échec).
- **Localisation** : `pb/pb_hooks/stripe.pb.js:121`, `:160`
- **Impact** : reconnaissance facilitée pour un attaquant (compréhension de la stack, des messages d'erreur Stripe exacts), sans être en soi critique puisque ces endpoints exigent déjà `$apis.requireAuth()`.
- **Correction recommandée** : logger `String(err)` côté serveur (`$app.logger().error(...)`, déjà fait pour le webhook) et renvoyer au client un message générique (`"Une erreur est survenue, veuillez réessayer."`).

---

### 🟡 Échec silencieux (fail-open partiel) dans la mise à jour d'état d'abonnement du webhook

- **Catégorie OWASP 2025** : A10 — Exceptional Conditions (nouveau 2025)
- **Description** : `updateUser(...)` dans `pb/pb_hooks/stripe.pb.js:203-227` encapsule toute la logique de mise à jour dans un `try/catch` qui, en cas d'erreur, se contente de logger (`$app.logger().error(...)`) puis continue silencieusement — le handler retourne malgré tout `200 { received: true }` à Stripe. Si l'erreur survient précisément lors d'un événement de **downgrade** (`customer.subscription.deleted`, `invoice.payment_failed`), l'utilisateur conserve son statut `active` en base alors qu'il ne paie plus, sans que Stripe ne retente l'envoi (puisqu'il reçoit un 200).
- **Localisation** : `pb/pb_hooks/stripe.pb.js:203-227`
- **Root cause** : gestion d'erreur uniforme (log-and-continue) qui ne distingue pas les échecs sur le chemin d'octroi d'accès (impact limité si échoue — l'utilisateur ne paie pas plus longtemps) des échecs sur le chemin de retrait d'accès (impact réel — fail-open).
- **Correction recommandée** : en cas d'échec de `updateUser` sur un événement de résiliation/échec de paiement, retourner un code d'erreur 5xx à Stripe pour déclencher son mécanisme de retry automatique (Stripe retente pendant plusieurs jours), plutôt que d'avaler l'erreur. Ajouter une alerte (email/Slack) sur ces échecs.

---

### 🟡 Réutilisation des identifiants superuser entre développement et production

- **Catégorie OWASP 2025** : A07 — Authentication Failures / hygiène opérationnelle
- **Description** : la documentation interne du projet confirme que le même compte superuser PocketBase (mêmes email/mot de passe) est utilisé à la fois en développement local et en production. Ceci n'est pas un défaut du code applicatif mais un choix opérationnel qui élargit la surface d'attaque : toute compromission du poste de développement (malware, vol de session, fuite de la mémoire de l'assistant IA local, etc.) expose directement les pleins pouvoirs d'administration sur la production (accès à toutes les données utilisateurs, capacité à modifier n'importe quelle règle de collection).
- **Localisation** : hors dépôt Git (configuration du compte superuser PocketBase) — signalé ici car découvert pendant l'audit et directement pertinent pour la sécurité de l'infrastructure de production.
- **Correction recommandée** : créer un compte superuser distinct par environnement, avec un mot de passe fort et unique en production, activer si possible une authentification à deux facteurs sur l'accès admin, et restreindre l'accès à l'interface `/_/` de production par IP/VPN si le volume de trafic administratif le permet.

---

### 🔵 CORS permissif (`Access-Control-Allow-Origin: *`) sur l'API PocketBase

- **Catégorie OWASP 2025** : A02 — Security Misconfiguration / #35 *Misconfigured CORS*
- **Description** : confirmé par `curl -i -X OPTIONS` sur `127.0.0.1:8090` : `Access-Control-Allow-Origin: *`. C'est le comportement par défaut de PocketBase. Le risque réel est limité car l'authentification se fait par token Bearer (pas de cookie de session envoyé automatiquement par le navigateur), donc pas de CSRF classique — mais cela permet à n'importe quel site tiers d'interroger l'API publique avec un token volé par un autre biais, ou de construire un client concurrent consommant directement l'API.
- **Correction recommandée** : si non nécessaire pour un usage tiers légitime, restreindre les origines autorisées à `https://nutridash.fr` (et `http://127.0.0.1:*` en dev) via la configuration PocketBase.

### 🔵 Rate limiting Stripe en mémoire locale (non partagé en cas de scale horizontal)

- **Catégorie OWASP 2025** : A04 (déni de service partiel) — non exploitable aujourd'hui
- **Description** : `$app.store()` dans `stripe.pb.js` est un état en mémoire propre à chaque instance du process. `fly.toml` a actuellement `min_machines_running = 1`, donc pas de risque immédiat, mais si l'application est scalée horizontalement à l'avenir, chaque machine aura son propre compteur de rate-limit, diluant la protection anti-abus proportionnellement au nombre d'instances.
- **Correction recommandée** : documenter cette limite architecturale ; si scale horizontal envisagé, migrer vers un rate-limiting basé sur le SQLite partagé de PocketBase ou un service externe (Redis/Upstash).

### 🔵 Énumération de comptes à l'inscription

- **Catégorie OWASP 2025** : #96 *Account Enumeration*
- **Description** : la création de compte avec un email déjà existant renvoie une erreur de validation explicite ("email déjà utilisé"), permettant de déterminer si une adresse est déjà inscrite. Risque faible et largement répandu (comportement standard PocketBase), mentionné pour complétude.
- **Correction recommandée** : optionnel — accepter d'assumer ce risque mineur, ou implémenter un message générique côté front sans bloquer réellement la création.

---

## Points positifs constatés (à ne pas re-designer)

- **Échappement XSS** : usage cohérent et correct de `escapeHtml()` sur le contenu utilisateur injecté en DOM (`app.js`, `index.html`) sur tous les échantillons vérifiés (repas, activités personnalisées, historique, objectifs).
- **Isolation multi-tenant (IDOR)** : toutes les collections "owned" (`meals`, `activities_log`, `weigh_ins`, `daily_stats`, `goal_history`, `profiles`, `user_data`) utilisent de manière cohérente `user = @request.auth.id` (ou équivalent relationnel) dans `listRule`/`viewRule`/`createRule`/`updateRule`/`deleteRule` — pattern standard et fiable de PocketBase, aucune anomalie relevée.
- **Secrets** : aucune clé Stripe (secrète ou publique), aucun mot de passe, aucun token n'est présent en clair dans le code front (`index.html`, `app.js`, `auth-pb.js`, `pb-config.js`) — bonne séparation via variables d'environnement côté serveur (`$os.getenv(...)`).
- **Supply chain (A03)** : `npm audit` ne remonte **aucune vulnérabilité** (0 critical/high/moderate/low). Le lock file (`package-lock.json`) est commité. Surface de dépendances runtime minimale (aucune dépendance de production, uniquement des devDependencies de test : Vitest, Playwright). SRI (`integrity=`) correctement appliqué sur les 3 scripts CDN chargés (Chart.js, date-fns, PocketBase SDK).
- **En-têtes API backend** : `pb_hooks/security.pb.js` couvre correctement `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy` sur les réponses de l'API PocketBase elle-même.
- **RGPD (documents et droits)** : CGU et politique de confidentialité publiées et détaillées, mention explicite de l'hébergement UE (Fly.io, région CDG/Paris), des sous-traitants (Stripe, Fly.io), de la durée de conservation, du droit de réclamation CNIL. Export CSV/JSON et suppression de compte implémentés côté fonctionnel (voir toutefois le Finding 🟠 sur l'annulation Stripe manquante).
- **Rate limiting production** : contrairement à l'instance de développement locale (`rateLimits.enabled: false`), la production a bien `rateLimits.enabled: true`, avec une règle `*:auth` (2 requêtes/3s) qui limite le brute-force sur l'authentification.

---

## Supply Chain (A03)

```
npm audit --json → {"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0}
```
`package-lock.json` présent et commité. Aucune dépendance de production (uniquement `@playwright/test` et `vitest` en devDependencies). SRI présent sur les 3 CDN externes utilisés en front (`cdn.jsdelivr.net`). Aucune action requise à ce stade.

## Conditions exceptionnelles (A10)

- Voir Finding 🟡 "Échec silencieux dans la mise à jour d'état d'abonnement du webhook" — seul cas de fail-open partiel identifié.
- Le hook `onRecordCreateRequest` (`pb_hooks/hooks.pb.js`) fixe systématiquement `subscription_end = now + 7 jours` à toute création d'enregistrement dans `_pb_users_auth_`, sans condition d'erreur — comportement attendu, pas de risque identifié.
- Pas de race condition identifiée dans le flux d'auth/paywall (les vérifications sont soit synchrones côté règle PocketBase — atomiques par construction SQLite — soit en lecture seule côté front).

## Headers de sécurité

| En-tête | API PocketBase (`nutridash-pb.fly.dev`) | Site public (`nutridash.fr`) |
|---|---|---|
| `X-Frame-Options` | ✅ `DENY` | ❌ Absent |
| `Content-Security-Policy` | ✅ `frame-ancestors 'none'` | ⚠️ Présent en `<meta>` seulement, `'unsafe-inline'`, pas de `frame-ancestors` |
| `Strict-Transport-Security` | ✅ `max-age=31536000; includeSubDomains` | ❌ Absent |
| `X-Content-Type-Options` | ✅ `nosniff` | ⚠️ Présent en `<meta>` seulement (`index.html`), absent de `cgu.html`/`confidentialite.html` |
| `Referrer-Policy` | ✅ `strict-origin-when-cross-origin` | ❌ Absent |
| `Permissions-Policy` | ✅ `geolocation=(), microphone=(), camera=()` | ❌ Absent |

## Conformité RGPD

- [x] Consentement collecte — checkbox CGU/PP obligatoire à l'inscription (`#rgpd-consent`)
- [x] Politique de confidentialité — `confidentialite.html`, complète (sous-traitants, durée de conservation, hébergement UE, CNIL)
- [x] Droit de suppression — implémenté, **mais incomplet** : ne couvre pas l'annulation de l'abonnement Stripe actif (voir Finding 🟠)
- [x] Minimisation des données — données collectées cohérentes avec l'usage déclaré (poids/taille/date de naissance pour les calculs BMR/TDEE uniquement)
- [x] Hébergement UE — Fly.io région CDG (Paris) confirmé dans `fly.toml` (`primary_region = 'cdg'`) et dans `confidentialite.html`

---

## Recommandations générales

1. **Priorité immédiate** : corriger le Finding 🔴 (verrouillage des champs `is_exempt`/`subscription_status`/`subscription_end`/`subscription_cancel_at`/`stripe_customer_id` sur la collection `users`) avant toute communication publique/marketing sur le lancement. C'est un correctif de quelques lignes (une migration PocketBase) à impact business majeur.
2. Regrouper la correction du webhook (signature Stripe) avec celle du paywall — les deux touchent le même fichier `stripe.pb.js` et peuvent être livrées ensemble.
3. Ajouter un test E2E Playwright (ou un test d'intégration ciblé) qui échoue si un utilisateur non-admin parvient à modifier `is_exempt`/`subscription_status` sur son propre compte — cela transforme cette vulnérabilité en régression détectable automatiquement pour l'avenir.
4. Envisager un test de bout en bout du flux "mot de passe oublié" en production dès que possible pour confirmer/infirmer le Finding 🟠 sur SMTP.
5. Prioriser la migration des en-têtes de sécurité sur `nutridash.fr` (Cloudflare gratuit devant GitHub Pages est la solution la plus rapide) avant d'investir dans d'autres durcissements.
