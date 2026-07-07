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
        return e.json(500, { error: String(err) });
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
        return e.json(500, { error: String(err) });
    }
}, $apis.requireAuth());

/* ─── POST /api/stripe/webhook ───────────────────────────────────────── */

routerAdd("POST", "/api/stripe/webhook", (e) => {
    /* Vérification du secret partagé via query param */
    var WEBHOOK_GUARD = $os.getenv("STRIPE_WEBHOOK_GUARD");
    var receivedSecret = e.request.url.query().get("secret");
    if (!WEBHOOK_GUARD || !receivedSecret || receivedSecret !== WEBHOOK_GUARD) {
        $app.logger().warn("Stripe webhook: secret invalide ou absent");
        return e.json(401, { error: "Unauthorized" });
    }

    var event;
    try {
        event = e.requestInfo().body;
    } catch(_) {
        return e.json(400, { error: "Impossible de lire le body" });
    }
    if (!event || !event.type) {
        return e.json(400, { error: "Event invalide" });
    }

    $app.logger().info("Stripe webhook reçu", "type", event.type);

    var obj = event.data && event.data.object;
    if (!obj) return e.json(200, { received: true });

    function updateUser(customerId, status, periodEnd) {
        try {
            var rows = $app.findRecordsByFilter(
                "users",
                "stripe_customer_id = {:id}",
                "",
                1, 0,
                { id: customerId }
            );
            if (!rows || rows.length === 0) return;
            var u = rows[0];
            u.set("subscription_status", status);
            var ts = periodEnd ? parseInt(String(periodEnd), 10) : 0;
            if (ts > 0) {
                var d = new Date(ts * 1000);
                var iso = d.getFullYear() + "-"
                    + String(d.getMonth() + 1).padStart(2, "0") + "-"
                    + String(d.getDate()).padStart(2, "0") + " "
                    + String(d.getHours()).padStart(2, "0") + ":"
                    + String(d.getMinutes()).padStart(2, "0") + ":"
                    + String(d.getSeconds()).padStart(2, "0") + ".000Z";
                u.set("subscription_end", iso);
            }
            $app.save(u);
        } catch(err) {
            $app.logger().error("Stripe webhook: erreur updateUser", "error", String(err));
        }
    }

    /* Depuis l'API Stripe 2026+, current_period_end n'est plus au niveau
       racine de la subscription mais sous items.data[0] */
    function itemPeriodEnd(subscription) {
        var item = subscription.items && subscription.items.data && subscription.items.data[0];
        return item ? item.current_period_end : null;
    }

    var type = event.type;
    if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
        var endTs = obj.cancel_at || itemPeriodEnd(obj);
        updateUser(obj.customer, obj.status, endTs);
    } else if (type === "customer.subscription.deleted") {
        updateUser(obj.customer, "canceled", itemPeriodEnd(obj));
    } else if (type === "invoice.payment_failed") {
        updateUser(obj.customer, "past_due", null);
    } else if (type === "invoice.payment_succeeded") {
        updateUser(obj.customer, "active", null);
    }

    return e.json(200, { received: true });
});
