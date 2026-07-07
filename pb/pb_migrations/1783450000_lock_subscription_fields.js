/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");

    /* Un utilisateur peut modifier son propre compte, mais ne doit jamais
       pouvoir écrire lui-même les champs qui pilotent le paywall — ce sont
       des champs custom (non "system") sans protection au niveau champ. */
    const lockedFields =
        "@request.body.is_exempt:isset = false && " +
        "@request.body.subscription_status:isset = false && " +
        "@request.body.subscription_end:isset = false && " +
        "@request.body.subscription_cancel_at:isset = false && " +
        "@request.body.stripe_customer_id:isset = false";

    collection.updateRule = "id = @request.auth.id && (" + lockedFields + ")";

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_");
    collection.updateRule = "id = @request.auth.id";
    return app.save(collection);
});
