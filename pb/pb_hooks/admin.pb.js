/// <reference path="../pb_data/types.d.ts" />

/* ─── GET /api/admin/stats ───────────────────────────────────────────────
   Réservé aux comptes users.is_admin = true. Lecture seule.
   Toute la logique reste dans le callback (closures top-level non fiables). */

routerAdd("GET", "/api/admin/stats", (e) => {
    var info = e.requestInfo();
    if (!info.auth) return e.json(401, { error: "Non authentifié" });
    if (!info.auth.getBool("is_admin")) return e.json(403, { error: "Accès refusé" });

    var PRICE_EUR = 5.99;
    var users = $app.findAllRecords("users");
    var now = Date.now();

    /* Repas saisis par compte (entonnoir « a utilisé l'app ») */
    var mealRows = arrayOf(new DynamicModel({ "user": "", "n": 0 }));
    $app.db().newQuery("SELECT user, COUNT(*) AS n FROM meals GROUP BY user").all(mealRows);
    var mealsByUser = {};
    mealRows.forEach(function(r) { mealsByUser[r.user] = r.n; });
    var DAY = 24 * 60 * 60 * 1000;

    function ms(v) {
        var s = String(v || "");
        if (!s) return 0;
        var t = new Date(s.replace(" ", "T")).getTime();
        return isNaN(t) ? 0 : t;
    }

    var byStatus = { trial: 0, trial_expired: 0, active: 0, cancelling: 0, past_due: 0, canceled: 0, exempt: 0 };
    var perDay = {};
    var signups7 = 0, signups30 = 0, prev7 = 0, prev30 = 0, unverified = 0;
    var verified = 0, withMeal = 0;
    var rows = [];

    users.forEach(function(u) {
        var created = ms(u.get("created"));
        var end = ms(u.get("subscription_end"));
        var status = String(u.get("subscription_status") || "");
        var cancelAt = ms(u.get("subscription_cancel_at"));

        var label;
        if (u.getBool("is_exempt")) label = "exempt";
        else if (status === "active" || status === "trialing") label = cancelAt ? "cancelling" : "active";
        else if (status === "past_due" || status === "unpaid") label = "past_due";
        else if (status === "canceled") label = "canceled";
        else label = end > now ? "trial" : "trial_expired";
        byStatus[label]++;

        var age = now - created;
        if (age <= 7 * DAY) signups7++;
        else if (age <= 14 * DAY) prev7++;
        if (age <= 30 * DAY) signups30++;
        else if (age <= 60 * DAY) prev30++;
        if (age <= 90 * DAY) {
            var day = new Date(created).toISOString().slice(0, 10);
            perDay[day] = (perDay[day] || 0) + 1;
        }
        if (u.getBool("verified")) verified++; else unverified++;
        var meals = mealsByUser[u.id] || 0;
        if (meals > 0) withMeal++;

        rows.push({
            id: u.id,
            email: u.get("email"),
            name: u.get("name"),
            created: u.get("created"),
            verified: u.getBool("verified"),
            status: label,
            subscription_end: u.get("subscription_end"),
            stripe_customer_id: u.get("stripe_customer_id"),
            meals: meals,
        });
    });

    rows.sort(function(a, b) { return ms(b.created) - ms(a.created); });

    var paying = byStatus.active + byStatus.cancelling;
    var everTrial = users.length - byStatus.exempt;

    return e.json(200, {
        total: users.length,
        signups_7d: signups7,
        signups_30d: signups30,
        prev_signups_7d: prev7,
        prev_signups_30d: prev30,
        mrr: Math.round(paying * PRICE_EUR * 100) / 100,
        price: PRICE_EUR,
        funnel: { signed_up: users.length, verified: verified, with_meal: withMeal, paying: paying },
        unverified: unverified,
        by_status: byStatus,
        conversion_pct: everTrial > 0 ? Math.round((paying / everTrial) * 1000) / 10 : 0,
        per_day: perDay,
        users: rows.slice(0, 200),
    });
});
