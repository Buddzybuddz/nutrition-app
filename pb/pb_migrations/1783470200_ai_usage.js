/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Compteur d'usage de l'estimation IA : une ligne par utilisateur et par jour
       (jour au fuseau Europe/Paris). Lu/écrit uniquement par pb_hooks (règles d'API null). */
    const usage = new Collection({
        type: "base",
        name: "ai_usage",
        listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
        fields: [
            { type: "relation", name: "user", required: true, collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 },
            { type: "text", name: "day", required: true },
            { type: "number", name: "meal" },
            { type: "number", name: "activity" },
            { type: "number", name: "cache_hits" },
            { type: "autodate", name: "created", onCreate: true },
        ],
        indexes: ["CREATE UNIQUE INDEX idx_ai_usage_user_day ON ai_usage (user, day)"],
    });
    return app.save(usage);
}, (app) => {
    try { app.delete(app.findCollectionByNameOrId("ai_usage")); } catch (_) {}
});
