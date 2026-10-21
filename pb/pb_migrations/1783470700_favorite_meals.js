/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Repas favoris enregistrés par l'utilisateur (composition + calories + protéines), réutilisables en un geste.
       Mêmes règles d'accès que les repas : propriétaire seulement, avec essai ou abonnement valide. */
    const meals = app.findCollectionByNameOrId("meals");
    const favorites = new Collection({
        type: "base",
        name: "favorite_meals",
        listRule: meals.listRule,
        viewRule: meals.viewRule,
        createRule: meals.createRule,
        updateRule: meals.updateRule,
        deleteRule: meals.deleteRule,
        fields: [
            { type: "relation", name: "user", required: true, collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 },
            { type: "text", name: "mealType", required: true },
            { type: "text", name: "name", required: true, max: 120 },
            { type: "text", name: "description", max: 200 },
            { type: "number", name: "calories", required: true },
            { type: "number", name: "protein" },
            { type: "autodate", name: "created", onCreate: true },
        ],
        indexes: ["CREATE INDEX idx_favorite_meals_user_type ON favorite_meals (user, mealType)"],
    });
    return app.save(favorites);
}, (app) => {
    try { app.delete(app.findCollectionByNameOrId("favorite_meals")); } catch (_) {}
});
