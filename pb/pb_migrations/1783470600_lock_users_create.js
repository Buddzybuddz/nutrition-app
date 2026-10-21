/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* La création de compte est publique (inscription) : un visiteur ne doit jamais pouvoir fixer lui-même
       un champ de paywall ou de droits (is_exempt, abonnement, is_admin, accord IA, client Stripe).
       Même liste que la règle de modification (migration 1783470300). */
    const users = app.findCollectionByNameOrId("_pb_users_auth_");
    users.createRule =
        "@request.body.is_exempt:isset = false && " +
        "@request.body.subscription_status:isset = false && " +
        "@request.body.subscription_end:isset = false && " +
        "@request.body.subscription_cancel_at:isset = false && " +
        "@request.body.stripe_customer_id:isset = false && " +
        "@request.body.is_admin:isset = false && " +
        "@request.body.ai_consent_at:isset = false";
    return app.save(users);
}, (app) => {
    const users = app.findCollectionByNameOrId("_pb_users_auth_");
    users.createRule = "";
    return app.save(users);
});
