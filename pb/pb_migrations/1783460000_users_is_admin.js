/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");

    collection.fields.addAt(999, new BoolField({
        name:     "is_admin",
        required: false,
    }));

    /* Même verrou que les champs de paywall : un utilisateur ne peut jamais
       s'auto-promouvoir admin via l'API. */
    const lockedFields =
        "@request.body.is_exempt:isset = false && " +
        "@request.body.subscription_status:isset = false && " +
        "@request.body.subscription_end:isset = false && " +
        "@request.body.subscription_cancel_at:isset = false && " +
        "@request.body.stripe_customer_id:isset = false && " +
        "@request.body.is_admin:isset = false";

    collection.updateRule = "id = @request.auth.id && (" + lockedFields + ")";

    app.save(collection);

    /* Compte propriétaire : admin par défaut (no-op si le compte n'existe pas encore) */
    try {
        const owner = app.findAuthRecordByEmail("_pb_users_auth_", "baudouinjeremy@gmail.com");
        owner.set("is_admin", true);
        app.save(owner);
    } catch (_) {}
}, (app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");
    try { collection.fields.removeByName("is_admin"); } catch(_) {}
    collection.updateRule = "id = @request.auth.id";
    return app.save(collection);
});
