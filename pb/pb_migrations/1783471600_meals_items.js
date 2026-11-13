/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    /* Détail par aliment d'un repas estimé par l'IA (libellé, quantité, kcal, protéines), pour le consulter
       après coup. Vide pour les repas saisis à la main ou avant cette évolution. */
    const meals = app.findCollectionByNameOrId("meals");
    meals.fields.add(new JSONField({ name: "items", maxSize: 20000 }));
    return app.save(meals);
}, (app) => {
    const meals = app.findCollectionByNameOrId("meals");
    try { meals.fields.removeByName("items"); } catch (_) {}
    return app.save(meals);
});
