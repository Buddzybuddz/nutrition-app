/// <reference path="../pb_data/types.d.ts" />

/* Collection des utilisateurs : on la reconnaît par son IDENTIFIANT (« _pb_users_auth_ »), pas par son nom
   (« users »). Les constantes sont déclarées DANS les handlers : une variable de niveau fichier n'est pas
   visible depuis un handler dans le JSVM PocketBase (ReferenceError), voir pb_hooks/ai-lib.js. */

/* ─── À la création d'un compte : essai de 7 jours, et aucun champ privilégié choisi par le client ───── */
onRecordCreateRequest((e) => {
    if (e.collection.id !== "_pb_users_auth_") {
        return e.next();
    }

    /* Défense en profondeur (la règle de création les refuse déjà) : seul un superuser peut fixer ces champs. */
    if (!e.hasSuperuserAuth()) {
        e.record.set("is_exempt", false);
        e.record.set("is_admin", false);
        e.record.set("subscription_status", "");
        e.record.set("subscription_cancel_at", "");
        e.record.set("stripe_customer_id", "");
        e.record.set("ai_consent_at", "");
    }

    /* subscription_end = maintenant + 7 jours (UTC, format PocketBase) */
    e.record.set("subscription_end", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace("T", " "));

    return e.next();
});

/* ─── Défense en profondeur : un utilisateur non-superuser ne peut jamais
   modifier ses propres champs de paywall ou de droits, même si la règle de collection
   venait à être mal réécrite par erreur. Seuls les hooks serveur (stripe.pb.js,
   ai-chat.pb.js : $app.save() hors contexte @request.auth) pilotent ces champs. ───── */
onRecordUpdateRequest((e) => {
    if (e.collection.id !== "_pb_users_auth_" || e.hasSuperuserAuth()) {
        return e.next();
    }

    var LOCKED_FIELDS = [
        "is_exempt",
        "subscription_status",
        "subscription_end",
        "subscription_cancel_at",
        "stripe_customer_id",
        "is_admin",
        "ai_consent_at",
    ];

    var original = e.record.original();
    LOCKED_FIELDS.forEach(function (field) {
        e.record.set(field, original.get(field));
    });

    return e.next();
});
