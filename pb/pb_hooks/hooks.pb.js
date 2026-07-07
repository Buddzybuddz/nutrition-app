/// <reference path="../pb_data/types.d.ts" />

/* ─── Set subscription_end = now + 7 jours à la création de compte ───── */
onRecordCreateRequest((e) => {
    if (e.collection.name !== "_pb_users_auth_") {
        return e.next();
    }

    var d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    var iso = d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0") + " " +
        String(d.getHours()).padStart(2, "0") + ":" +
        String(d.getMinutes()).padStart(2, "0") + ":" +
        String(d.getSeconds()).padStart(2, "0") + ".000Z";

    e.record.set("subscription_end", iso);

    return e.next();
});

/* ─── Défense en profondeur : un utilisateur non-superuser ne peut jamais
   modifier ses propres champs de paywall, même si la règle de collection
   venait à être mal réécrite par erreur. Seuls les hooks serveur (stripe.pb.js,
   $app.save() hors contexte @request.auth) doivent piloter ces champs. ───── */
var LOCKED_SUBSCRIPTION_FIELDS = [
    "is_exempt",
    "subscription_status",
    "subscription_end",
    "subscription_cancel_at",
    "stripe_customer_id",
];

onRecordUpdateRequest((e) => {
    if (e.collection.name !== "_pb_users_auth_" || e.hasSuperuserAuth()) {
        return e.next();
    }

    var original = e.record.original();
    LOCKED_SUBSCRIPTION_FIELDS.forEach(function(field) {
        e.record.set(field, original.get(field));
    });

    return e.next();
});
