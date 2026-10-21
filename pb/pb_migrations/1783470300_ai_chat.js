/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Accord de l'utilisateur pour l'assistant IA (envoi de ses données de suivi à un service tiers).
       Piloté uniquement par le serveur : verrouillé en écriture comme les champs de paywall. */
    const users = app.findCollectionByNameOrId("_pb_users_auth_");
    users.fields.addAt(999, new DateField({ name: "ai_consent_at" }));
    const locked =
        "@request.body.is_exempt:isset = false && " +
        "@request.body.subscription_status:isset = false && " +
        "@request.body.subscription_end:isset = false && " +
        "@request.body.subscription_cancel_at:isset = false && " +
        "@request.body.stripe_customer_id:isset = false && " +
        "@request.body.is_admin:isset = false && " +
        "@request.body.ai_consent_at:isset = false";
    users.updateRule = "id = @request.auth.id && (" + locked + ")";
    app.save(users);

    /* Historique de la conversation (lu/écrit uniquement par pb_hooks/ai-chat.pb.js) */
    const chat = new Collection({
        type: "base",
        name: "ai_chat",
        listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
        fields: [
            { type: "relation", name: "user", required: true, collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 },
            { type: "text", name: "role", required: true },
            { type: "text", name: "content", required: true, max: 6000 },
            { type: "autodate", name: "created", onCreate: true },
        ],
        indexes: ["CREATE INDEX idx_ai_chat_user_created ON ai_chat (user, created)"],
    });
    app.save(chat);

    /* Compteur de messages du jour */
    const usage = app.findCollectionByNameOrId("ai_usage");
    usage.fields.add(new NumberField({ name: "chat" }));
    app.save(usage);
}, (app) => {
    try { const u = app.findCollectionByNameOrId("ai_usage"); u.fields.removeByName("chat"); app.save(u); } catch (_) {}
    try { app.delete(app.findCollectionByNameOrId("ai_chat")); } catch (_) {}
    const users = app.findCollectionByNameOrId("_pb_users_auth_");
    try { users.fields.removeByName("ai_consent_at"); } catch (_) {}
    const locked =
        "@request.body.is_exempt:isset = false && " +
        "@request.body.subscription_status:isset = false && " +
        "@request.body.subscription_end:isset = false && " +
        "@request.body.subscription_cancel_at:isset = false && " +
        "@request.body.stripe_customer_id:isset = false && " +
        "@request.body.is_admin:isset = false";
    users.updateRule = "id = @request.auth.id && (" + locked + ")";
    app.save(users);
});
