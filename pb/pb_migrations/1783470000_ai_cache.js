/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Caches de l'estimation IA, lus/écrits uniquement par pb_hooks/ai.pb.js.
       Aucune règle d'API (null) : inaccessibles aux clients, superusers seulement. */

    /* Niveau 1 : même texte normalisé => même résultat, figé */
    const textCache = new Collection({
        type: "base",
        name: "ai_text_cache",
        listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
        fields: [
            { type: "text", name: "key", required: true },
            { type: "json", name: "result", required: true, maxSize: 20000 },
            { type: "autodate", name: "created", onCreate: true },
        ],
        indexes: ["CREATE UNIQUE INDEX idx_ai_text_cache_key ON ai_text_cache (key)"],
    });
    app.save(textCache);

    /* Niveau 2 : fiche par aliment (valeurs pour 100 g), partagée entre tous les utilisateurs */
    const foods = new Collection({
        type: "base",
        name: "ai_foods",
        listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
        fields: [
            { type: "text", name: "name", required: true },
            { type: "number", name: "kcal_100g", required: true },
            { type: "number", name: "protein_100g", required: true },
            { type: "autodate", name: "created", onCreate: true },
        ],
        indexes: ["CREATE UNIQUE INDEX idx_ai_foods_name ON ai_foods (name)"],
    });
    app.save(foods);
}, (app) => {
    for (const name of ["ai_foods", "ai_text_cache"]) {
        try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
    }
});
