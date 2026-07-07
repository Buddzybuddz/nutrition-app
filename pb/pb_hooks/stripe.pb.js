/// <reference path="../pb_data/types.d.ts" />

/* ─── POST /api/stripe/create-checkout-session ───────────────────────── */

routerAdd("POST", "/api/stripe/create-checkout-session", (e) => {
    var STRIPE_SECRET_KEY = $os.getenv("STRIPE_SECRET_KEY");
    var STRIPE_PRICE_ID   = $os.getenv("STRIPE_PRICE_ID");
    var APP_URL = $os.getenv("APP_URL") || "https://nutridash.fr";

    var info = e.requestInfo();
    if (!info.auth) return e.json(401, { error: "Non authentifié" });

    var userId    = info.auth.id;
    var userEmail = info.auth.get("email");

    /* Rate limiting via $app.store() — inline pour éviter toute dépendance
       à une closure externe au handler (non fiable dans le JSVM PocketBase) */
    var rlKey = "stripe_rl_" + userId;
    var rlNow = Date.now();
    var rlLast = $app.store().get(rlKey);
    if (rlLast && (rlNow - rlLast) < 30000) {
        return e.json(429, { error: "Trop de requêtes. Patientez 30 secondes." });
    }
    $app.store().set(rlKey, rlNow);

    /* Form-encode un objet plat */
    function encode(obj) {
        var parts = [];
        for (var k in obj) {
            var v = obj[k];
            if (typeof v === "object" && v !== null) {
                for (var sk in v) {
                    parts.push(encodeURIComponent(k + "[" + sk + "]") + "=" + encodeURIComponent(v[sk]));
                }
            } else {
                parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
        }
        return parts.join("&");
    }

    /* Appel API Stripe */
    function stripeCall(method, path, body) {
        var res = $http.send({
            method:  method,
            url:     "https://api.stripe.com/v1" + path,
            headers: {
                "Authorization": "Bearer " + STRIPE_SECRET_KEY,
                "Content-Type":  "application/x-www-form-urlencoded",
            },
            body:    body ? encode(body) : "",
            timeout: 30,
        });
        var data = JSON.parse(res.raw);
        if (res.statusCode >= 400) {
            throw new Error("Stripe " + res.statusCode + ": " + (data.error ? data.error.message : res.raw));
        }
        return data;
    }

    function createCustomer() {
        var params = {
            email: userEmail,
            "metadata[pb_user_id]": userId,
        };
        if (userName) params.name = userName;
        var customer = stripeCall("POST", "/customers", params);
        userRecord.set("stripe_customer_id", customer.id);
        $app.save(userRecord);
        return customer.id;
    }

    try {
        var userRecord = $app.findRecordById("users", userId);

        var currentStatus = userRecord.getString("subscription_status");
        if (currentStatus === "active" || currentStatus === "trialing") {
            return e.json(409, { error: "Vous avez déjà un abonnement actif." });
        }

        var customerId = userRecord.getString("stripe_customer_id");
        var userName = userRecord.getString("name");

        if (!customerId) {
            customerId = createCustomer();
        }

        var session;
        try {
            session = stripeCall("POST", "/checkout/sessions", {
                customer: customerId,
                mode: "subscription",
                "line_items[0][price]": STRIPE_PRICE_ID,
                "line_items[0][quantity]": "1",
                success_url: APP_URL + "/?stripe=success&session_id={CHECKOUT_SESSION_ID}",
                cancel_url:  APP_URL + "/?stripe=cancel",
                allow_promotion_codes: "true",
                locale: "fr",
            });
        } catch (sessionErr) {
            var errMsg = String(sessionErr);
            if (errMsg.indexOf("No such customer") !== -1) {
                customerId = createCustomer();
                session = stripeCall("POST", "/checkout/sessions", {
                    customer: customerId,
                    mode: "subscription",
                    "line_items[0][price]": STRIPE_PRICE_ID,
                    "line_items[0][quantity]": "1",
                    success_url: APP_URL + "/?stripe=success&session_id={CHECKOUT_SESSION_ID}",
                    cancel_url:  APP_URL + "/?stripe=cancel",
                    allow_promotion_codes: "true",
                    locale: "fr",
                });
            } else {
                throw sessionErr;
            }
        }

        return e.json(200, { url: session.url });
    } catch (err) {
        $app.logger().error("Stripe create-checkout-session: erreur", "error", String(err));
        return e.json(500, { error: "Une erreur est survenue, veuillez réessayer." });
    }
}, $apis.requireAuth());

/* ─── POST /api/stripe/portal ────────────────────────────────────────── */

routerAdd("POST", "/api/stripe/portal", (e) => {
    var STRIPE_SECRET_KEY = $os.getenv("STRIPE_SECRET_KEY");
    var APP_URL = $os.getenv("APP_URL") || "https://nutridash.fr";

    var info = e.requestInfo();
    if (!info.auth) return e.json(401, { error: "Non authentifié" });

    var userId = info.auth.id;
    var rlKey = "stripe_rl_" + userId + "_portal";
    var rlNow = Date.now();
    var rlLast = $app.store().get(rlKey);
    if (rlLast && (rlNow - rlLast) < 10000) {
        return e.json(429, { error: "Trop de requêtes. Patientez 10 secondes." });
    }
    $app.store().set(rlKey, rlNow);

    var customerId = info.auth.getString("stripe_customer_id");
    if (!customerId) return e.json(400, { error: "Aucun abonnement trouvé" });

    try {
        var res = $http.send({
            method: "POST",
            url:    "https://api.stripe.com/v1/billing_portal/sessions",
            headers: {
                "Authorization": "Bearer " + STRIPE_SECRET_KEY,
                "Content-Type":  "application/x-www-form-urlencoded",
            },
            body:    "customer=" + encodeURIComponent(customerId) + "&return_url=" + encodeURIComponent(APP_URL + "/"),
            timeout: 30,
        });
        var data = JSON.parse(res.raw);
        return e.json(200, { url: data.url });
    } catch (err) {
        $app.logger().error("Stripe portal: erreur", "error", String(err));
        return e.json(500, { error: "Une erreur est survenue, veuillez réessayer." });
    }
}, $apis.requireAuth());

/* ─── POST /api/stripe/cancel-subscription ───────────────────────────────
   Annulation immédiate de l'abonnement actif du compte authentifié.
   À appeler AVANT toute suppression de compte (RGPD art. 17) : une fois le
   compte PocketBase supprimé, l'utilisateur ne peut plus se connecter pour
   annuler lui-même via le portail Stripe, et continuerait à être facturé
   indéfiniment. Le customerId vient uniquement de l'auth du token — jamais
   d'un paramètre client, pour empêcher d'annuler l'abonnement d'un tiers. */

routerAdd("POST", "/api/stripe/cancel-subscription", (e) => {
    var STRIPE_SECRET_KEY = $os.getenv("STRIPE_SECRET_KEY");

    var info = e.requestInfo();
    if (!info.auth) return e.json(401, { error: "Non authentifié" });

    var customerId = info.auth.getString("stripe_customer_id");
    if (!customerId) return e.json(200, { ok: true, canceled: 0 });

    function stripeGet(path) {
        var res = $http.send({
            method:  "GET",
            url:     "https://api.stripe.com/v1" + path,
            headers: { "Authorization": "Bearer " + STRIPE_SECRET_KEY },
            timeout: 30,
        });
        var data = JSON.parse(res.raw);
        if (res.statusCode >= 400) {
            throw new Error("Stripe " + res.statusCode + ": " + (data.error ? data.error.message : res.raw));
        }
        return data;
    }

    function stripeDelete(path) {
        var res = $http.send({
            method:  "DELETE",
            url:     "https://api.stripe.com/v1" + path,
            headers: { "Authorization": "Bearer " + STRIPE_SECRET_KEY },
            timeout: 30,
        });
        var data = JSON.parse(res.raw);
        if (res.statusCode >= 400) {
            throw new Error("Stripe " + res.statusCode + ": " + (data.error ? data.error.message : res.raw));
        }
        return data;
    }

    try {
        var list = stripeGet("/subscriptions?customer=" + encodeURIComponent(customerId) + "&status=active&limit=10");
        var canceled = 0;
        (list.data || []).forEach(function(sub) {
            stripeDelete("/subscriptions/" + sub.id);
            canceled++;
        });
        return e.json(200, { ok: true, canceled: canceled });
    } catch (err) {
        $app.logger().error("Stripe cancel-subscription: erreur", "error", String(err));
        return e.json(500, { ok: false, error: "Une erreur est survenue, veuillez réessayer." });
    }
}, $apis.requireAuth());

/* ─── POST /api/stripe/webhook ───────────────────────────────────────── */

routerAdd("POST", "/api/stripe/webhook", (e) => {
    /* Rejet rapide via le secret partagé en query param (défense en
       profondeur additionnelle, pas la protection principale) */
    var WEBHOOK_GUARD = $os.getenv("STRIPE_WEBHOOK_GUARD");
    var receivedSecret = e.request.url.query().get("secret");
    if (!WEBHOOK_GUARD || !receivedSecret || receivedSecret !== WEBHOOK_GUARD) {
        $app.logger().warn("Stripe webhook: secret invalide ou absent");
        return e.json(401, { error: "Unauthorized" });
    }

    /* Corps brut requis pour la vérification HMAC — à lire avant tout
       parsing JSON, qui consommerait le flux de la requête */
    var rawBody = toString(e.request.body);

    /* Vérification de la signature officielle Stripe (HMAC-SHA256).
       Sans cette étape, n'importe qui connaissant le secret de query
       string (visible dans les logs d'accès) pourrait forger un event
       arbitraire. Voir https://docs.stripe.com/webhooks#verify-manually */
    var WEBHOOK_SECRET = $os.getenv("STRIPE_WEBHOOK_SECRET");
    var sigHeader = e.requestInfo().headers["stripe_signature"] || "";
    var sigParts = {};
    sigHeader.split(",").forEach(function(p) {
        var kv = p.split("=");
        if (kv.length === 2) sigParts[kv[0]] = kv[1];
    });
    var timestamp = sigParts["t"];
    var expectedSig = timestamp && WEBHOOK_SECRET
        ? $security.hs256(timestamp + "." + rawBody, WEBHOOK_SECRET)
        : "";

    if (!WEBHOOK_SECRET || !timestamp || !sigParts["v1"] || !expectedSig || !$security.equal(expectedSig, sigParts["v1"])) {
        $app.logger().warn("Stripe webhook: signature invalide ou absente");
        return e.json(401, { error: "Unauthorized" });
    }
    if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) {
        $app.logger().warn("Stripe webhook: signature expirée (anti-rejeu)");
        return e.json(401, { error: "Unauthorized" });
    }

    var event;
    try {
        event = JSON.parse(rawBody);
    } catch(_) {
        return e.json(400, { error: "Impossible de lire le body" });
    }
    if (!event || !event.type) {
        return e.json(400, { error: "Event invalide" });
    }

    $app.logger().info("Stripe webhook reçu", "type", event.type);

    var obj = event.data && event.data.object;
    if (!obj) return e.json(200, { received: true });

    function tsToIso(ts) {
        var d = new Date(ts * 1000);
        return d.getFullYear() + "-"
            + String(d.getMonth() + 1).padStart(2, "0") + "-"
            + String(d.getDate()).padStart(2, "0") + " "
            + String(d.getHours()).padStart(2, "0") + ":"
            + String(d.getMinutes()).padStart(2, "0") + ":"
            + String(d.getSeconds()).padStart(2, "0") + ".000Z";
    }

    /* cancelAt : timestamp Stripe (résiliation programmée), null (aucune
       résiliation programmée -> champ vidé) ou undefined (ne pas toucher
       au champ, utilisé pour les events factures qui n'en parlent pas) */
    /* Retourne false uniquement en cas d'erreur réelle (pour déclencher
       le retry Stripe sur les events de retrait d'accès) — "aucun
       utilisateur trouvé" n'est pas une erreur transitoire, un retry ne
       la résoudrait jamais. */
    function updateUser(customerId, status, periodEnd, cancelAt) {
        try {
            var rows = $app.findRecordsByFilter(
                "users",
                "stripe_customer_id = {:id}",
                "",
                1, 0,
                { id: customerId }
            );
            if (!rows || rows.length === 0) return true;
            var u = rows[0];
            u.set("subscription_status", status);
            var ts = periodEnd ? parseInt(String(periodEnd), 10) : 0;
            if (ts > 0) {
                u.set("subscription_end", tsToIso(ts));
            }
            if (cancelAt !== undefined) {
                var cts = cancelAt ? parseInt(String(cancelAt), 10) : 0;
                u.set("subscription_cancel_at", cts > 0 ? tsToIso(cts) : "");
            }
            $app.save(u);
            return true;
        } catch(err) {
            $app.logger().error("Stripe webhook: erreur updateUser", "error", String(err));
            return false;
        }
    }

    /* Depuis l'API Stripe 2026+, current_period_end n'est plus au niveau
       racine de la subscription mais sous items.data[0] */
    function itemPeriodEnd(subscription) {
        var item = subscription.items && subscription.items.data && subscription.items.data[0];
        return item ? item.current_period_end : null;
    }

    var type = event.type;
    var ok = true;
    /* Events de retrait/dégradation d'accès : un échec silencieux laisserait
       l'utilisateur "active" alors qu'il ne paie plus (fail-open). On force
       Stripe à retenter via un 5xx plutôt que d'avaler l'erreur. */
    var isDowngrade = false;

    if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
        var endTs = obj.cancel_at || itemPeriodEnd(obj);
        ok = updateUser(obj.customer, obj.status, endTs, obj.cancel_at || null);
    } else if (type === "customer.subscription.deleted") {
        isDowngrade = true;
        ok = updateUser(obj.customer, "canceled", itemPeriodEnd(obj), null);
    } else if (type === "invoice.payment_failed") {
        isDowngrade = true;
        ok = updateUser(obj.customer, "past_due", null);
    } else if (type === "invoice.payment_succeeded") {
        ok = updateUser(obj.customer, "active", null);
    }

    if (!ok && isDowngrade) {
        return e.json(500, { error: "Traitement échoué, merci de retenter" });
    }
    return e.json(200, { received: true });
});
